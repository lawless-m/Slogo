// Special exception for OUTPUT command to return values from procedures
class OutputException extends Error {
    constructor(value) {
        super('OUTPUT');
        this.value = value;
        this.name = 'OutputException';
    }
}

// Special exception for STOP command to exit from procedures
class StopException extends Error {
    constructor() {
        super('STOP');
        this.name = 'StopException';
    }
}

class LogoInterpreter {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.drawingLayer = document.getElementById('drawingLayer');
        this.turtleElement = document.getElementById('turtle');
        this.output = document.getElementById('output');

        this.centerX = 300;
        this.centerY = 300;

        this.reset();
        this.procedures = {};
        this.sourceCode = ''; // Store original source for error reporting
        this.tokens = []; // Store tokens for error reporting
        this.tokenMeta = []; // Store metadata (line, column) for each token
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.heading = 90; // Start facing up like C# version (0=right, 90=up)
        this.penDown = true;
        this.penColor = '#000000';
        this.penColorRGB = [0, 0, 0]; // Store RGB values for PENCOLOR query
        this.penSize = 2;
        this.turtleVisible = true;
        this.variables = {}; // Global variable storage
        this.scopeStack = []; // Stack of local scopes for procedures
        this.updateTurtleDisplay();
    }

    // Push a new local scope for procedure calls
    pushScope(localVars = {}) {
        this.scopeStack.push(localVars);
    }

    // Pop the current local scope
    popScope() {
        if (this.scopeStack.length > 0) {
            this.scopeStack.pop();
        }
    }

    // Set a variable in current scope (local if in procedure, global otherwise)
    setVariable(name, value) {
        if (this.scopeStack.length > 0) {
            // We're in a local scope - set in the most recent scope
            this.scopeStack[this.scopeStack.length - 1][name] = value;
        } else {
            // Global scope
            this.variables[name] = value;
        }
    }

    // Get a variable value, checking local scopes first, then global
    getVariable(name) {
        // Check local scopes (most recent first)
        for (let i = this.scopeStack.length - 1; i >= 0; i--) {
            if (name in this.scopeStack[i]) {
                return this.scopeStack[i][name];
            }
        }

        // Check global scope
        if (name in this.variables) {
            return this.variables[name];
        }

        throw new Error(`Variable '${name}' is not defined`);
    }

    clear() {
        this.drawingLayer.innerHTML = '';
    }

    updateTurtleDisplay() {
        const screenX = this.centerX + this.x;
        const screenY = this.centerY - this.y;

        // Turtle heading: 0=right, 90=up, convert to SVG rotation (subtract 90 to make turtle point in right direction)
        const rotation = this.heading - 90;

        this.turtleElement.setAttribute('transform',
            `translate(${screenX}, ${screenY}) rotate(${rotation})`);
        this.turtleElement.style.display = this.turtleVisible ? 'block' : 'none';

        document.getElementById('turtleX').textContent = Math.round(this.x);
        document.getElementById('turtleY').textContent = Math.round(this.y);
        document.getElementById('turtleHeading').textContent = Math.round(this.heading);
        document.getElementById('turtlePen').textContent = this.penDown ? 'Down' : 'Up';
    }

    forward(distance) {
        const startX = this.x;
        const startY = this.y;

        // Heading: 0=right, 90=up, 180=left, 270=down
        const radians = this.heading * Math.PI / 180;
        this.x += distance * Math.cos(radians);
        this.y += distance * Math.sin(radians);

        if (this.penDown) {
            this.drawLine(startX, startY, this.x, this.y);
        }

        this.updateTurtleDisplay();
    }

    backward(distance) {
        this.forward(-distance);
    }

    left(angle) {
        this.heading += angle; // Counter-clockwise rotation
        while (this.heading < 0) this.heading += 360;
        while (this.heading >= 360) this.heading -= 360;
        this.updateTurtleDisplay();
    }

    right(angle) {
        this.heading -= angle; // Clockwise rotation
        while (this.heading < 0) this.heading += 360;
        while (this.heading >= 360) this.heading -= 360;
        this.updateTurtleDisplay();
    }

    setHeading(angle) {
        this.heading = angle;
        while (this.heading < 0) this.heading += 360;
        while (this.heading >= 360) this.heading -= 360;
        this.updateTurtleDisplay();
    }

    // Collect tokens for an expression (stops at keywords or brackets)
    collectExpressionTokens(tokens, startIndex) {
        const expressionTokens = [];
        let i = startIndex;

        const keywords = ['FORWARD', 'FD', 'BACKWARD', 'BK', 'BACK', 'LEFT', 'LT', 'RIGHT', 'RT',
                         'SETXY', 'SETX', 'SETY', 'SETHEADING', 'SETH', 'HOME', 'PENUP', 'PU',
                         'PENDOWN', 'PD', 'PENSIZE', 'SETPENSIZE', 'SETPENCOLOR', 'SETPC',
                         'CIRCLE', 'BOX', 'SQUARE', 'MAKE', 'CLEAR', 'CLEARSCREEN', 'CS',
                         'HIDETURTLE', 'HT', 'SHOWTURTLE', 'ST', 'REPEAT', 'TO', 'END'];

        while (i < tokens.length) {
            const token = tokens[i];

            // Stop at brackets
            if (token === '[' || token === ']') {
                break;
            }

            // Stop at Logo keywords (but not math functions)
            if (keywords.includes(token.toUpperCase())) {
                break;
            }

            expressionTokens.push(token);
            i++;

            // Stop after we have at least one token and the next would be a keyword
            if (i < tokens.length && keywords.includes(tokens[i].toUpperCase())) {
                break;
            }
        }

        return { tokens: expressionTokens, nextIndex: i };
    }

    // Helper: collect and evaluate expression, return value and next index
    getNextValue(tokens, index) {
        const { tokens: exprTokens, nextIndex: collectedEndIndex } = this.collectExpressionTokens(tokens, index);
        if (exprTokens.length === 0) {
            const prevToken = index > 0 ? tokens[index - 1] : 'start';
            const nextToken = index < tokens.length ? tokens[index] : 'end of program';
            throw new Error(`Expected expression after "${prevToken}", got "${nextToken}"`);
        }
        const result = this.parseExpression(exprTokens, 0);
        // Convert parseExpression's nextIndex (relative to exprTokens) back to original tokens
        const actualNextIndex = index + result.nextIndex;
        return { value: result.value, nextIndex: actualNextIndex };
    }

    evaluateExpression(tokens, startIndex = 0) {
        // If tokens is a string (single token), convert to array and return just value
        if (typeof tokens === 'string') {
            const result = this.parseExpression([tokens], 0);
            return result.value;
        }

        // For array input, return the full result object
        return this.parseExpression(tokens, startIndex);
    }

    // Parse expression with operator precedence
    parseExpression(tokens, index) {
        return this.parseOr(tokens, index);
    }

    // Logical OR (lowest precedence)
    parseOr(tokens, index) {
        let { value, nextIndex } = this.parseAnd(tokens, index);

        while (nextIndex < tokens.length) {
            const op = tokens[nextIndex];
            if (op && op.toUpperCase() === 'OR') {
                const right = this.parseAnd(tokens, nextIndex + 1);
                value = (value || right.value) ? 1 : 0;
                nextIndex = right.nextIndex;
            } else {
                break;
            }
        }

        return { value, nextIndex };
    }

    // Logical AND
    parseAnd(tokens, index) {
        let { value, nextIndex } = this.parseNot(tokens, index);

        while (nextIndex < tokens.length) {
            const op = tokens[nextIndex];
            if (op && op.toUpperCase() === 'AND') {
                const right = this.parseNot(tokens, nextIndex + 1);
                value = (value && right.value) ? 1 : 0;
                nextIndex = right.nextIndex;
            } else {
                break;
            }
        }

        return { value, nextIndex };
    }

    // Logical NOT
    parseNot(tokens, index) {
        if (index >= tokens.length) {
            throw new Error('Unexpected end of expression');
        }

        const token = tokens[index];
        if (token && token.toUpperCase() === 'NOT') {
            const { value, nextIndex } = this.parseNot(tokens, index + 1);
            return { value: value ? 0 : 1, nextIndex };
        }

        return this.parseComparison(tokens, index);
    }

    // Comparison operators (<, >, =, <=, >=, <>)
    parseComparison(tokens, index) {
        let { value, nextIndex } = this.parseAddSub(tokens, index);

        while (nextIndex < tokens.length) {
            const op = tokens[nextIndex];
            if (op === '<' || op === '>' || op === '=' || op === '<=' || op === '>=' || op === '<>') {
                const right = this.parseAddSub(tokens, nextIndex + 1);
                switch (op) {
                    case '<':
                        value = value < right.value ? 1 : 0;
                        break;
                    case '>':
                        value = value > right.value ? 1 : 0;
                        break;
                    case '=':
                        value = Math.abs(value - right.value) < 0.0001 ? 1 : 0;
                        break;
                    case '<=':
                        value = value <= right.value ? 1 : 0;
                        break;
                    case '>=':
                        value = value >= right.value ? 1 : 0;
                        break;
                    case '<>':
                        value = Math.abs(value - right.value) >= 0.0001 ? 1 : 0;
                        break;
                }
                nextIndex = right.nextIndex;
            } else {
                break;
            }
        }

        return { value, nextIndex };
    }

    // Addition and subtraction
    parseAddSub(tokens, index) {
        let { value, nextIndex } = this.parseMulDiv(tokens, index);

        while (nextIndex < tokens.length) {
            const op = tokens[nextIndex];
            if (op === '+') {
                const right = this.parseMulDiv(tokens, nextIndex + 1);
                value = value + right.value;
                nextIndex = right.nextIndex;
            } else if (op === '-') {
                const right = this.parseMulDiv(tokens, nextIndex + 1);
                value = value - right.value;
                nextIndex = right.nextIndex;
            } else {
                break;
            }
        }

        return { value, nextIndex };
    }

    // Multiplication, division, and modulo (medium precedence)
    parseMulDiv(tokens, index) {
        let { value, nextIndex } = this.parseUnary(tokens, index);

        while (nextIndex < tokens.length) {
            const op = tokens[nextIndex];
            if (op === '*') {
                const right = this.parseUnary(tokens, nextIndex + 1);
                value = value * right.value;
                nextIndex = right.nextIndex;
            } else if (op === '/') {
                const right = this.parseUnary(tokens, nextIndex + 1);
                if (right.value === 0) throw new Error('Division by zero');
                value = value / right.value;
                nextIndex = right.nextIndex;
            } else if (op.toUpperCase() === 'MOD') {
                const right = this.parseUnary(tokens, nextIndex + 1);
                value = value % right.value;
                nextIndex = right.nextIndex;
            } else {
                break;
            }
        }

        return { value, nextIndex };
    }

    // Unary operators and primary values (highest precedence)
    parseUnary(tokens, index) {
        if (index >= tokens.length) {
            throw new Error('Unexpected end of expression');
        }

        const token = tokens[index];

        // Unary minus
        if (token === '-') {
            const { value, nextIndex } = this.parseUnary(tokens, index + 1);
            return { value: -value, nextIndex };
        }

        // Unary plus
        if (token === '+') {
            return this.parseUnary(tokens, index + 1);
        }

        return this.parsePrimary(tokens, index);
    }

    // Primary values: numbers, variables, functions, parentheses
    parsePrimary(tokens, index) {
        if (index >= tokens.length) {
            throw new Error('Unexpected end of expression');
        }

        const token = tokens[index];

        // Parentheses
        if (token === '(') {
            const { value, nextIndex } = this.parseExpression(tokens, index + 1);
            if (nextIndex >= tokens.length || tokens[nextIndex] !== ')') {
                throw new Error('Missing closing parenthesis');
            }
            return { value, nextIndex: nextIndex + 1 };
        }

        // List literals [1 2 3]
        if (token === '[') {
            const list = [];
            let i = index + 1;
            let depth = 1;

            while (i < tokens.length && depth > 0) {
                if (tokens[i] === '[') {
                    depth++;
                } else if (tokens[i] === ']') {
                    depth--;
                    if (depth === 0) break;
                }

                // Parse each element as an expression
                if (depth === 1 && tokens[i] !== ']') {
                    const { value, nextIndex } = this.parsePrimary(tokens, i);
                    list.push(value);
                    i = nextIndex;
                } else {
                    i++;
                }
            }

            if (depth !== 0) {
                throw new Error('Missing closing bracket in list');
            }

            return { value: list, nextIndex: i + 1 };
        }

        // Math functions
        const func = token.toUpperCase();
        if (['SQRT', 'SIN', 'COS', 'TAN', 'ABS', 'ROUND', 'FLOOR', 'CEILING', 'RANDOM'].includes(func)) {
            const { value: arg, nextIndex } = this.parsePrimary(tokens, index + 1);
            let result;

            switch (func) {
                case 'SQRT':
                    result = Math.sqrt(arg);
                    break;
                case 'SIN':
                    result = Math.sin(arg * Math.PI / 180); // Convert to radians
                    break;
                case 'COS':
                    result = Math.cos(arg * Math.PI / 180);
                    break;
                case 'TAN':
                    result = Math.tan(arg * Math.PI / 180);
                    break;
                case 'ABS':
                    result = Math.abs(arg);
                    break;
                case 'ROUND':
                    result = Math.round(arg);
                    break;
                case 'FLOOR':
                    result = Math.floor(arg);
                    break;
                case 'CEILING':
                    result = Math.ceil(arg);
                    break;
                case 'RANDOM':
                    // RANDOM n returns random integer from 0 to n-1
                    result = Math.floor(Math.random() * arg);
                    break;
            }

            return { value: result, nextIndex };
        }

        // POWER function (two arguments)
        if (func === 'POWER' || func === 'POW') {
            const { value: base, nextIndex: afterBase } = this.parsePrimary(tokens, index + 1);
            const { value: exponent, nextIndex } = this.parsePrimary(tokens, afterBase);
            const result = Math.pow(base, exponent);
            return { value: result, nextIndex };
        }

        // Query functions (no arguments)
        if (['XCOR', 'YCOR', 'HEADING', 'PENDOWN?', 'PENDOWNP', 'PENSIZE', 'PENCOLOR'].includes(func)) {
            let result;
            switch (func) {
                case 'XCOR':
                    result = this.x;
                    break;
                case 'YCOR':
                    result = this.y;
                    break;
                case 'HEADING':
                    result = this.heading;
                    break;
                case 'PENDOWN?':
                case 'PENDOWNP':
                    result = this.penDown ? 1 : 0;
                    break;
                case 'PENSIZE':
                    result = this.penSize;
                    break;
                case 'PENCOLOR':
                    result = this.penColorRGB.slice(); // Return a copy of the RGB array
                    break;
            }
            return { value: result, nextIndex: index + 1 };
        }

        // List functions - single argument functions
        if (['FIRST', 'LAST', 'BUTFIRST', 'BF', 'BUTLAST', 'BL', 'COUNT', 'EMPTY?', 'EMPTYP'].includes(func)) {
            const { value: list, nextIndex } = this.parsePrimary(tokens, index + 1);
            if (!Array.isArray(list)) {
                throw new Error(`${func} requires a list argument`);
            }

            let result;
            switch (func) {
                case 'FIRST':
                    if (list.length === 0) throw new Error('FIRST: list is empty');
                    result = list[0];
                    break;
                case 'LAST':
                    if (list.length === 0) throw new Error('LAST: list is empty');
                    result = list[list.length - 1];
                    break;
                case 'BUTFIRST':
                case 'BF':
                    result = list.slice(1);
                    break;
                case 'BUTLAST':
                case 'BL':
                    result = list.slice(0, -1);
                    break;
                case 'COUNT':
                    result = list.length;
                    break;
                case 'EMPTY?':
                case 'EMPTYP':
                    result = list.length === 0 ? 1 : 0;
                    break;
            }
            return { value: result, nextIndex };
        }

        // ITEM function (two arguments: index, list) - 1-indexed
        if (func === 'ITEM') {
            const { value: n, nextIndex: afterN } = this.parsePrimary(tokens, index + 1);
            const { value: list, nextIndex } = this.parsePrimary(tokens, afterN);
            if (!Array.isArray(list)) {
                throw new Error('ITEM requires a list as second argument');
            }
            const idx = Math.floor(n) - 1; // Convert to 0-indexed
            if (idx < 0 || idx >= list.length) {
                throw new Error(`ITEM: index ${n} out of bounds for list of length ${list.length}`);
            }
            return { value: list[idx], nextIndex };
        }

        // FPUT function (two arguments: item, list) - add to front
        if (func === 'FPUT') {
            const { value: item, nextIndex: afterItem } = this.parsePrimary(tokens, index + 1);
            const { value: list, nextIndex } = this.parsePrimary(tokens, afterItem);
            if (!Array.isArray(list)) {
                throw new Error('FPUT requires a list as second argument');
            }
            const result = [item, ...list];
            return { value: result, nextIndex };
        }

        // LPUT function (two arguments: item, list) - add to end
        if (func === 'LPUT') {
            const { value: item, nextIndex: afterItem } = this.parsePrimary(tokens, index + 1);
            const { value: list, nextIndex } = this.parsePrimary(tokens, afterItem);
            if (!Array.isArray(list)) {
                throw new Error('LPUT requires a list as second argument');
            }
            const result = [...list, item];
            return { value: result, nextIndex };
        }

        // LIST function (variable arguments) - create list from items
        if (func === 'LIST') {
            const items = [];
            let i = index + 1;

            // Collect arguments until we hit a keyword or bracket
            while (i < tokens.length) {
                const nextToken = tokens[i];
                if (nextToken === '[' || nextToken === ']') break;

                // Check if it's a command keyword
                const upper = nextToken.toUpperCase();
                const keywords = ['FORWARD', 'FD', 'BACKWARD', 'BK', 'LEFT', 'LT', 'RIGHT', 'RT',
                                'MAKE', 'IF', 'REPEAT', 'WHILE', 'PRINT', 'PR', 'OUTPUT', 'STOP'];
                if (keywords.includes(upper)) break;

                const { value, nextIndex } = this.parsePrimary(tokens, i);
                items.push(value);
                i = nextIndex;

                // LIST typically takes 2 arguments by default, but can take more
                if (items.length >= 2) break;
            }

            return { value: items, nextIndex: i };
        }

        // SENTENCE/SE function (variable arguments) - flatten and concatenate
        if (func === 'SENTENCE' || func === 'SE') {
            const result = [];
            let i = index + 1;

            // Collect arguments until we hit a keyword or bracket
            while (i < tokens.length) {
                const nextToken = tokens[i];
                if (nextToken === '[' || nextToken === ']') break;

                // Check if it's a command keyword
                const upper = nextToken.toUpperCase();
                const keywords = ['FORWARD', 'FD', 'BACKWARD', 'BK', 'LEFT', 'LT', 'RIGHT', 'RT',
                                'MAKE', 'IF', 'REPEAT', 'WHILE', 'PRINT', 'PR', 'OUTPUT', 'STOP'];
                if (keywords.includes(upper)) break;

                const { value, nextIndex } = this.parsePrimary(tokens, i);

                // Flatten: if value is a list, add all elements; otherwise add the value
                if (Array.isArray(value)) {
                    result.push(...value);
                } else {
                    result.push(value);
                }

                i = nextIndex;

                // SENTENCE typically takes 2 arguments
                if (i - (index + 1) >= 2) break;
            }

            return { value: result, nextIndex: i };
        }

        // MEMBER? / MEMBERP function (two arguments: item, list) - check membership
        if (func === 'MEMBER?' || func === 'MEMBERP') {
            const { value: item, nextIndex: afterItem } = this.parsePrimary(tokens, index + 1);
            const { value: list, nextIndex } = this.parsePrimary(tokens, afterItem);
            if (!Array.isArray(list)) {
                throw new Error('MEMBER? requires a list as second argument');
            }
            // Check if item is in the list (deep equality for nested lists)
            const found = list.some(element => {
                if (Array.isArray(element) && Array.isArray(item)) {
                    return JSON.stringify(element) === JSON.stringify(item);
                }
                return element === item;
            });
            return { value: found ? 1 : 0, nextIndex };
        }

        // POSITION function (two arguments: item, list) - find index (1-based, or 0 if not found)
        if (func === 'POSITION') {
            const { value: item, nextIndex: afterItem } = this.parsePrimary(tokens, index + 1);
            const { value: list, nextIndex } = this.parsePrimary(tokens, afterItem);
            if (!Array.isArray(list)) {
                throw new Error('POSITION requires a list as second argument');
            }
            // Find index of item in list (1-based)
            for (let i = 0; i < list.length; i++) {
                const element = list[i];
                if (Array.isArray(element) && Array.isArray(item)) {
                    if (JSON.stringify(element) === JSON.stringify(item)) {
                        return { value: i + 1, nextIndex };
                    }
                } else if (element === item) {
                    return { value: i + 1, nextIndex };
                }
            }
            return { value: 0, nextIndex }; // Not found
        }

        // MAP function (two arguments: procedure name, list) - apply procedure to each element
        if (func === 'MAP') {
            const procNameToken = tokens[index + 1];
            const procName = procNameToken.startsWith('"')
                ? procNameToken.substring(1).toUpperCase()
                : procNameToken.toUpperCase();

            const { value: list, nextIndex } = this.parsePrimary(tokens, index + 2);
            if (!Array.isArray(list)) {
                throw new Error('MAP requires a list as second argument');
            }

            const proc = this.procedures[procName];
            if (!proc) {
                throw new Error(`MAP: procedure '${procName}' not defined`);
            }

            const result = [];
            for (const item of list) {
                // Push scope with item as argument
                const localScope = {};
                if (proc.params && proc.params.length > 0) {
                    localScope[proc.params[0]] = item;
                }
                this.pushScope(localScope);

                let itemResult = 0;
                try {
                    // Execute procedure synchronously
                    this.executeProcedureSync(proc.body);
                } catch (error) {
                    if (error instanceof OutputException) {
                        itemResult = error.value;
                    } else {
                        this.popScope();
                        throw error;
                    }
                }

                this.popScope();
                result.push(itemResult);
            }

            return { value: result, nextIndex };
        }

        // FILTER function (two arguments: predicate procedure name, list) - filter by predicate
        if (func === 'FILTER') {
            const procNameToken = tokens[index + 1];
            const procName = procNameToken.startsWith('"')
                ? procNameToken.substring(1).toUpperCase()
                : procNameToken.toUpperCase();

            const { value: list, nextIndex } = this.parsePrimary(tokens, index + 2);
            if (!Array.isArray(list)) {
                throw new Error('FILTER requires a list as second argument');
            }

            const proc = this.procedures[procName];
            if (!proc) {
                throw new Error(`FILTER: procedure '${procName}' not defined`);
            }

            const result = [];
            for (const item of list) {
                // Push scope with item as argument
                const localScope = {};
                if (proc.params && proc.params.length > 0) {
                    localScope[proc.params[0]] = item;
                }
                this.pushScope(localScope);

                let keep = false;
                try {
                    // Execute procedure synchronously
                    this.executeProcedureSync(proc.body);
                } catch (error) {
                    if (error instanceof OutputException) {
                        keep = error.value !== 0;
                    } else {
                        this.popScope();
                        throw error;
                    }
                }

                this.popScope();
                if (keep) {
                    result.push(item);
                }
            }

            return { value: result, nextIndex };
        }

        // REDUCE function (two arguments: binary procedure name, list) - reduce to single value
        if (func === 'REDUCE') {
            const procNameToken = tokens[index + 1];
            const procName = procNameToken.startsWith('"')
                ? procNameToken.substring(1).toUpperCase()
                : procNameToken.toUpperCase();

            const { value: list, nextIndex } = this.parsePrimary(tokens, index + 2);
            if (!Array.isArray(list)) {
                throw new Error('REDUCE requires a list as second argument');
            }
            if (list.length === 0) {
                throw new Error('REDUCE requires a non-empty list');
            }

            const proc = this.procedures[procName];
            if (!proc) {
                throw new Error(`REDUCE: procedure '${procName}' not defined`);
            }
            if (!proc.params || proc.params.length < 2) {
                throw new Error('REDUCE: procedure must take 2 parameters');
            }

            let accumulator = list[0];
            for (let i = 1; i < list.length; i++) {
                // Push scope with accumulator and current item as arguments
                const localScope = {};
                localScope[proc.params[0]] = accumulator;
                localScope[proc.params[1]] = list[i];
                this.pushScope(localScope);

                try {
                    // Execute procedure synchronously
                    this.executeProcedureSync(proc.body);
                } catch (error) {
                    if (error instanceof OutputException) {
                        accumulator = error.value;
                    } else {
                        this.popScope();
                        throw error;
                    }
                }

                this.popScope();
            }

            return { value: accumulator, nextIndex };
        }

        // APPLY function (two arguments: procedure name, list of arguments) - call procedure with args
        if (func === 'APPLY') {
            const procNameToken = tokens[index + 1];
            const procName = procNameToken.startsWith('"')
                ? procNameToken.substring(1).toUpperCase()
                : procNameToken.toUpperCase();

            const { value: argsList, nextIndex } = this.parsePrimary(tokens, index + 2);
            if (!Array.isArray(argsList)) {
                throw new Error('APPLY requires a list as second argument');
            }

            const proc = this.procedures[procName];
            if (!proc) {
                throw new Error(`APPLY: procedure '${procName}' not defined`);
            }
            if (proc.params && argsList.length !== proc.params.length) {
                throw new Error(`APPLY: procedure '${procName}' expects ${proc.params.length} arguments but got ${argsList.length}`);
            }

            // Push scope with arguments bound to parameters
            const localScope = {};
            if (proc.params) {
                for (let i = 0; i < proc.params.length; i++) {
                    localScope[proc.params[i]] = argsList[i];
                }
            }
            this.pushScope(localScope);

            let result = 0;
            try {
                // Execute procedure synchronously
                this.executeProcedureSync(proc.body);
            } catch (error) {
                if (error instanceof OutputException) {
                    result = error.value;
                } else {
                    this.popScope();
                    throw error;
                }
            }

            this.popScope();
            return { value: result, nextIndex };
        }

        // Variable reference (:varname)
        if (token.startsWith(':')) {
            const varName = token.substring(1).toUpperCase();
            try {
                const value = this.getVariable(varName);
                return { value, nextIndex: index + 1 };
            } catch (e) {
                throw new Error(`Undefined variable: ${varName}`);
            }
        }

        // Check if it's a procedure call
        const upperToken = token.toUpperCase();
        if (this.procedures[upperToken]) {
            const proc = this.procedures[upperToken];

            // Evaluate arguments
            const args = [];
            let argIndex = index + 1;
            for (let p = 0; p < (proc.params ? proc.params.length : 0); p++) {
                if (argIndex >= tokens.length) {
                    throw new Error(`Procedure ${upperToken} expects ${proc.params.length} arguments`);
                }
                const { value, nextIndex } = this.parsePrimary(tokens, argIndex);
                args.push(value);
                argIndex = nextIndex;
            }

            // Execute procedure
            const savedVars = { ...this.variables };

            // Set parameters
            if (proc.params) {
                for (let p = 0; p < proc.params.length; p++) {
                    this.variables[proc.params[p]] = args[p];
                }
            }

            // Execute and catch OUTPUT
            let returnValue = 0;
            try {
                // We need to execute synchronously here since we're in expression evaluation
                // This is a limitation - we'll use a helper
                this.executeProcedureSync(proc.body || proc);
            } catch (error) {
                if (error instanceof OutputException) {
                    returnValue = error.value;
                } else if (error instanceof StopException) {
                    returnValue = 0;  // STOP returns 0 when used in expressions
                } else {
                    this.variables = savedVars;
                    throw error;
                }
            }

            this.variables = savedVars;
            return { value: returnValue, nextIndex: argIndex };
        }

        // Number literal
        const value = parseFloat(token);
        if (isNaN(value)) {
            throw new Error(`Expected number or variable, got: ${token}`);
        }
        return { value, nextIndex: index + 1 };
    }

    // Synchronous version of execute for use in expression evaluation
    // This handles OUTPUT statements in procedures called from expressions
    executeProcedureSync(tokens) {
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i].toUpperCase();

            if (token === 'OUTPUT') {
                const { value } = this.getNextValue(tokens, i + 1);
                throw new OutputException(value);
            }

            // Handle MAKE for variable assignment within procedures
            if (token === 'MAKE') {
                const varToken = tokens[++i];
                const varName = varToken.startsWith('"') ? varToken.substring(1).toUpperCase() : varToken.toUpperCase();
                const { value } = this.getNextValue(tokens, i + 1);
                this.setVariable(varName, value);
                i++; // Skip the value token(s)
            }

            // Other commands are ignored in expression context
            // This allows procedures to be used in expressions for their OUTPUT value
        }
    }

    home() {
        this.goTo(0, 0);
        this.setHeading(90); // Face up
    }

    goTo(x, y) {
        const startX = this.x;
        const startY = this.y;

        this.x = x;
        this.y = y;

        if (this.penDown) {
            this.drawLine(startX, startY, this.x, this.y);
        }

        this.updateTurtleDisplay();
    }

    setX(x) {
        this.goTo(x, this.y);
    }

    setY(y) {
        this.goTo(this.x, y);
    }

    circle(radius, steps = 36) {
        const angleStep = 360.0 / steps;
        const circumference = 2 * Math.PI * radius;
        const stepDistance = circumference / steps;

        for (let i = 0; i < steps; i++) {
            this.forward(stepDistance);
            this.left(angleStep);
        }
    }

    box(width, height) {
        for (let i = 0; i < 2; i++) {
            this.forward(width);
            this.right(90);
            this.forward(height);
            this.right(90);
        }
    }

    square(size) {
        this.box(size, size);
    }

    penUp() {
        this.penDown = false;
        this.updateTurtleDisplay();
    }

    penDownCmd() {
        this.penDown = true;
        this.updateTurtleDisplay();
    }

    setPenSize(size) {
        this.penSize = size;
    }

    setPenColor(r, g, b) {
        this.penColor = `rgb(${r}, ${g}, ${b})`;
        this.penColorRGB = [r, g, b]; // Store for PENCOLOR query
    }

    hideTurtle() {
        this.turtleVisible = false;
        this.updateTurtleDisplay();
    }

    showTurtle() {
        this.turtleVisible = true;
        this.updateTurtleDisplay();
    }

    drawLine(x1, y1, x2, y2) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', this.centerX + x1);
        line.setAttribute('y1', this.centerY - y1);
        line.setAttribute('x2', this.centerX + x2);
        line.setAttribute('y2', this.centerY - y2);
        line.setAttribute('stroke', this.penColor);
        line.setAttribute('stroke-width', this.penSize);
        line.setAttribute('stroke-linecap', 'round');
        this.drawingLayer.appendChild(line);
    }

    log(message) {
        // Format lists with brackets
        const formatted = this.formatValue(message);
        this.output.textContent += formatted + '\n';
    }

    formatValue(value) {
        if (Array.isArray(value)) {
            return '[' + value.map(v => this.formatValue(v)).join(' ') + ']';
        }
        return value;
    }

    // Format error message with context
    formatError(error, tokenIndex) {
        let msg = `Error: ${error.message}\n`;

        if (tokenIndex !== undefined && this.tokens && this.tokens.length > 0 && this.tokenMeta && this.tokenMeta.length > 0) {
            // Show the problematic token with line number
            const token = this.tokens[tokenIndex] || '';
            const meta = this.tokenMeta[tokenIndex] || { line: '?', column: '?' };
            msg += `At line ${meta.line}, column ${meta.column}: "${token}"\n`;

            // Show context (5 tokens before and after)
            const start = Math.max(0, tokenIndex - 5);
            const end = Math.min(this.tokens.length, tokenIndex + 6);
            const contextTokens = this.tokens.slice(start, end);

            // Build context string with pointer to error
            const contextStr = contextTokens.map((t, i) => {
                const actualIndex = start + i;
                if (actualIndex === tokenIndex) {
                    return `>>> ${t} <<<`;
                }
                return t;
            }).join(' ');

            msg += `Context: ${contextStr}`;
        }

        return msg;
    }

    tokenize(code) {
        let tokens = [];
        let tokenMeta = []; // Store metadata (line, column) for each token
        let current = '';
        let inBracket = false;
        let line = 1;
        let column = 1;
        let tokenStartLine = 1;
        let tokenStartColumn = 1;

        for (let i = 0; i < code.length; i++) {
            const char = code[i];

            // Track line and column
            if (char === '\n') {
                line++;
                column = 1;
            } else {
                column++;
            }

            // Handle semicolon comments - skip to end of line
            if (char === ';') {
                // Save any current token before the comment
                if (current.trim()) {
                    tokens.push(current.trim());
                    tokenMeta.push({ line: tokenStartLine, column: tokenStartColumn });
                    current = '';
                }
                // Skip everything until newline
                while (i < code.length && code[i] !== '\n') {
                    i++;
                    column++;
                }
                continue;
            }

            // Start tracking token position when we begin a new token
            if (current === '' && char !== ' ' && char !== '\t' && char !== '\n' && char !== '\r') {
                tokenStartLine = line;
                tokenStartColumn = column;
            }

            if (char === '[') {
                if (current.trim()) {
                    tokens.push(current.trim());
                    tokenMeta.push({ line: tokenStartLine, column: tokenStartColumn });
                    current = '';
                }
                tokenStartLine = line;
                tokenStartColumn = column;
                tokens.push('[');
                tokenMeta.push({ line: tokenStartLine, column: tokenStartColumn });
                inBracket = true;
            } else if (char === ']') {
                if (current.trim()) {
                    tokens.push(current.trim());
                    tokenMeta.push({ line: tokenStartLine, column: tokenStartColumn });
                    current = '';
                }
                tokenStartLine = line;
                tokenStartColumn = column;
                tokens.push(']');
                tokenMeta.push({ line: tokenStartLine, column: tokenStartColumn });
                inBracket = false;
            } else if (char === '(' || char === ')') {
                // Handle parentheses for expressions
                if (current.trim()) {
                    tokens.push(current.trim());
                    tokenMeta.push({ line: tokenStartLine, column: tokenStartColumn });
                    current = '';
                }
                tokenStartLine = line;
                tokenStartColumn = column;
                tokens.push(char);
                tokenMeta.push({ line: tokenStartLine, column: tokenStartColumn });
            } else if (char === '<' || char === '>' || char === '=') {
                // Handle comparison operators
                if (current.trim()) {
                    tokens.push(current.trim());
                    tokenMeta.push({ line: tokenStartLine, column: tokenStartColumn });
                    current = '';
                }
                tokenStartLine = line;
                tokenStartColumn = column;
                // Check for two-character operators: <=, >=, <>
                if (i + 1 < code.length) {
                    const nextChar = code[i + 1];
                    if ((char === '<' && (nextChar === '=' || nextChar === '>')) ||
                        (char === '>' && nextChar === '=')) {
                        tokens.push(char + nextChar);
                        tokenMeta.push({ line: tokenStartLine, column: tokenStartColumn });
                        i++; // Skip next character
                        column++; // Update column for skipped character
                        continue;
                    }
                }
                tokens.push(char);
                tokenMeta.push({ line: tokenStartLine, column: tokenStartColumn });
            } else if (/\s/.test(char)) {
                // Always split tokens on whitespace, even inside brackets
                if (current.trim()) {
                    tokens.push(current.trim());
                    tokenMeta.push({ line: tokenStartLine, column: tokenStartColumn });
                    current = '';
                }
            } else {
                current += char;
            }
        }

        if (current.trim()) {
            tokens.push(current.trim());
            tokenMeta.push({ line: tokenStartLine, column: tokenStartColumn });
        }

        // Store metadata for error reporting
        this.tokenMeta = tokenMeta;
        return tokens;
    }

    parseBlock(tokens, index) {
        const block = [];
        let depth = 1;  // Start at 1 since we've already consumed the opening '['
        let i = index;

        while (i < tokens.length) {
            const token = tokens[i];
            if (token === '[') {
                depth++;
                if (depth > 1) {
                    block.push(token);
                }
            } else if (token === ']') {
                depth--;
                if (depth === 0) {
                    return { block, nextIndex: i + 1 };
                }
                block.push(token);
            } else {
                block.push(token);
            }
            i++;
        }

        // Better error message for unmatched brackets
        const contextStart = Math.max(0, index - 3);
        const contextEnd = Math.min(tokens.length, i + 3);
        const context = tokens.slice(contextStart, contextEnd).join(' ');
        throw new Error(`Unmatched bracket - missing closing ']'. Context: ${context}`);
    }

    async execute(tokens, startIndex = 0, endIndex = null) {
        const end = endIndex || tokens.length;
        let i = startIndex;

        while (i < end) {
            const token = tokens[i].toUpperCase();

            try {
                switch (token) {
                    case 'FORWARD':
                    case 'FD':
                        {
                            const { value, nextIndex } = this.getNextValue(tokens, i + 1);
                            this.forward(value);
                            i = nextIndex - 1;
                        }
                        break;

                    case 'BACKWARD':
                    case 'BK':
                    case 'BACK':
                        {
                            const { value, nextIndex } = this.getNextValue(tokens, i + 1);
                            this.backward(value);
                            i = nextIndex - 1;
                        }
                        break;

                    case 'LEFT':
                    case 'LT':
                        {
                            const { value, nextIndex } = this.getNextValue(tokens, i + 1);
                            this.left(value);
                            i = nextIndex - 1;
                        }
                        break;

                    case 'RIGHT':
                    case 'RT':
                        {
                            const { value, nextIndex } = this.getNextValue(tokens, i + 1);
                            this.right(value);
                            i = nextIndex - 1;
                        }
                        break;

                    case 'SETXY':
                        {
                            const x = this.getNextValue(tokens, i + 1);
                            const y = this.getNextValue(tokens, x.nextIndex);
                            this.goTo(x.value, y.value);
                            i = y.nextIndex - 1;
                        }
                        break;

                    case 'SETX':
                        {
                            const { value, nextIndex } = this.getNextValue(tokens, i + 1);
                            this.setX(value);
                            i = nextIndex - 1;
                        }
                        break;

                    case 'SETY':
                        {
                            const { value, nextIndex } = this.getNextValue(tokens, i + 1);
                            this.setY(value);
                            i = nextIndex - 1;
                        }
                        break;

                    case 'SETHEADING':
                    case 'SETH':
                        {
                            const { value, nextIndex } = this.getNextValue(tokens, i + 1);
                            this.setHeading(value);
                            i = nextIndex - 1;
                        }
                        break;

                    case 'HOME':
                        this.home();
                        break;

                    case 'PENUP':
                    case 'PU':
                        this.penUp();
                        break;

                    case 'PENDOWN':
                    case 'PD':
                        this.penDownCmd();
                        break;

                    case 'PENSIZE':
                    case 'SETPENSIZE':
                        {
                            const { value, nextIndex } = this.getNextValue(tokens, i + 1);
                            this.setPenSize(value);
                            i = nextIndex - 1;
                        }
                        break;

                    case 'SETPENCOLOR':
                    case 'SETPC':
                        {
                            const r = this.getNextValue(tokens, i + 1);
                            const g = this.getNextValue(tokens, r.nextIndex);
                            const b = this.getNextValue(tokens, g.nextIndex);
                            this.setPenColor(r.value, g.value, b.value);
                            i = b.nextIndex - 1;
                        }
                        break;

                    case 'CIRCLE':
                        {
                            const { value, nextIndex } = this.getNextValue(tokens, i + 1);
                            this.circle(value);
                            i = nextIndex - 1;
                        }
                        break;

                    case 'BOX':
                        {
                            const width = this.getNextValue(tokens, i + 1);
                            const height = this.getNextValue(tokens, width.nextIndex);
                            this.box(width.value, height.value);
                            i = height.nextIndex - 1;
                        }
                        break;

                    case 'SQUARE':
                        {
                            const { value, nextIndex } = this.getNextValue(tokens, i + 1);
                            this.square(value);
                            i = nextIndex - 1;
                        }
                        break;

                    case 'MAKE':
                        {
                            // MAKE "varname value
                            const varToken = tokens[++i];
                            const varName = varToken.startsWith('"') ? varToken.substring(1).toUpperCase() : varToken.toUpperCase();
                            const { value, nextIndex } = this.getNextValue(tokens, i + 1);
                            this.setVariable(varName, value);
                            i = nextIndex - 1;
                        }
                        break;

                    case 'LOCAL':
                        {
                            // LOCAL "varname or LOCAL [var1 var2 ...]
                            if (this.scopeStack.length === 0) {
                                throw new Error('LOCAL can only be used inside a procedure');
                            }

                            const nextToken = tokens[++i];

                            if (nextToken === '[') {
                                // LOCAL [var1 var2 ...]
                                const { block: varList, nextIndex } = this.parseBlock(tokens, i + 1);
                                for (const varToken of varList) {
                                    const varName = varToken.startsWith('"')
                                        ? varToken.substring(1).toUpperCase()
                                        : varToken.toUpperCase();
                                    // Initialize local variable to 0 (or could be undefined)
                                    this.scopeStack[this.scopeStack.length - 1][varName] = 0;
                                }
                                i = nextIndex - 1;
                            } else {
                                // LOCAL "varname
                                const varName = nextToken.startsWith('"')
                                    ? nextToken.substring(1).toUpperCase()
                                    : nextToken.toUpperCase();
                                // Initialize local variable to 0 (or could be undefined)
                                this.scopeStack[this.scopeStack.length - 1][varName] = 0;
                            }
                        }
                        break;

                    case 'CLEAR':
                    case 'CLEARSCREEN':
                    case 'CS':
                        this.clear();
                        break;

                    case 'HIDETURTLE':
                    case 'HT':
                        this.hideTurtle();
                        break;

                    case 'SHOWTURTLE':
                    case 'ST':
                        this.showTurtle();
                        break;

                    case 'REPEAT':
                        {
                            const { value: count, nextIndex: afterExpr } = this.getNextValue(tokens, i + 1);
                            if (tokens[afterExpr] !== '[') {
                                throw new Error('REPEAT requires a block in brackets');
                            }
                            const { block, nextIndex } = this.parseBlock(tokens, afterExpr + 1);
                            for (let j = 0; j < Math.floor(count); j++) {
                                await this.execute(block);
                                await this.sleep(10);
                            }
                            i = nextIndex - 1;
                        }
                        break;

                    case 'WHILE':
                        {
                            // Store the condition expression tokens
                            let condIndex = i + 1;
                            const condTokens = [];

                            // Collect tokens until we hit '['
                            while (condIndex < tokens.length && tokens[condIndex] !== '[') {
                                condTokens.push(tokens[condIndex]);
                                condIndex++;
                            }

                            if (tokens[condIndex] !== '[') {
                                throw new Error('WHILE requires a block in brackets');
                            }

                            const { block, nextIndex } = this.parseBlock(tokens, condIndex + 1);

                            // Evaluate condition and loop
                            while (true) {
                                const { value: condition } = this.getNextValue(condTokens, 0);
                                if (!condition) break;
                                await this.execute(block);
                                await this.sleep(10);
                            }

                            i = nextIndex - 1;
                        }
                        break;

                    case 'FOR':
                        {
                            // FOR [variable start end increment] [commands]
                            // OR FOR [variable start end] [commands] (increment defaults to 1)
                            if (tokens[i + 1] !== '[') {
                                throw new Error('FOR requires control list in brackets: FOR [var start end increment] [commands]');
                            }

                            // Parse the control list [variable start end increment]
                            const { block: controlList, nextIndex: afterControl } = this.parseBlock(tokens, i + 2);

                            if (controlList.length < 3 || controlList.length > 4) {
                                throw new Error('FOR control list must be [variable start end] or [variable start end increment]');
                            }

                            const varName = controlList[0].replace(':', '').replace('"', '');
                            console.log('FOR DEBUG: controlList =', controlList);
                            console.log('FOR DEBUG: varName =', varName);
                            console.log('FOR DEBUG: about to evaluate controlList[1] =', controlList[1]);
                            const start = this.evaluateExpression(controlList[1]);
                            console.log('FOR DEBUG: start =', start);
                            const end = this.evaluateExpression(controlList[2]);
                            console.log('FOR DEBUG: end =', end);
                            const increment = controlList.length === 4
                                ? this.evaluateExpression(controlList[3])
                                : (start <= end ? 1 : -1);
                            console.log('FOR DEBUG: increment =', increment);

                            if (tokens[afterControl] !== '[') {
                                throw new Error('FOR requires a command block in brackets');
                            }

                            const { block: commandBlock, nextIndex: afterCommands } = this.parseBlock(tokens, afterControl + 1);

                            // Execute the FOR loop
                            console.log('FOR DEBUG: About to start loop, varName =', varName, 'start =', start, 'end =', end, 'increment =', increment);
                            console.log('FOR DEBUG: commandBlock =', commandBlock);
                            if (increment > 0) {
                                for (let loopVar = start; loopVar <= end; loopVar += increment) {
                                    console.log('FOR DEBUG: Setting variable', varName, '=', loopVar);
                                    this.setVariable(varName, loopVar);
                                    console.log('FOR DEBUG: Variable set, about to execute commandBlock');
                                    await this.execute(commandBlock);
                                    await this.sleep(10);
                                }
                            } else if (increment < 0) {
                                for (let loopVar = start; loopVar >= end; loopVar += increment) {
                                    this.setVariable(varName, loopVar);
                                    await this.execute(commandBlock);
                                    await this.sleep(10);
                                }
                            } else {
                                throw new Error('FOR loop increment cannot be zero');
                            }

                            i = afterCommands - 1;
                        }
                        break;

                    case 'IF':
                        {
                            const { value: condition, nextIndex: afterExpr } = this.getNextValue(tokens, i + 1);
                            if (tokens[afterExpr] !== '[') {
                                throw new Error('IF requires a block in brackets');
                            }
                            const { block, nextIndex } = this.parseBlock(tokens, afterExpr + 1);
                            if (condition) {
                                await this.execute(block);
                            }
                            i = nextIndex - 1;
                        }
                        break;

                    case 'IFELSE':
                        {
                            const { value: condition, nextIndex: afterExpr } = this.getNextValue(tokens, i + 1);
                            if (tokens[afterExpr] !== '[') {
                                throw new Error('IFELSE requires two blocks in brackets');
                            }
                            const { block: trueBlock, nextIndex: afterTrue } = this.parseBlock(tokens, afterExpr + 1);
                            if (tokens[afterTrue] !== '[') {
                                throw new Error('IFELSE requires two blocks in brackets');
                            }
                            const { block: falseBlock, nextIndex: afterFalse } = this.parseBlock(tokens, afterTrue + 1);
                            if (condition) {
                                await this.execute(trueBlock);
                            } else {
                                await this.execute(falseBlock);
                            }
                            i = afterFalse - 1;
                        }
                        break;

                    case 'OUTPUT':
                        {
                            const { value, nextIndex } = this.getNextValue(tokens, i + 1);
                            throw new OutputException(value);
                        }
                        break;

                    case 'STOP':
                        throw new StopException();
                        break;

                    case 'PRINT':
                    case 'PR':
                        {
                            const { value, nextIndex } = this.getNextValue(tokens, i + 1);
                            this.log(value);
                            i = nextIndex - 1;
                        }
                        break;

                    case 'TO':
                        const procName = tokens[++i].toUpperCase();
                        i++;

                        // Collect parameters (starting with :)
                        const params = [];
                        while (i < tokens.length && tokens[i].startsWith(':')) {
                            params.push(tokens[i].substring(1).toUpperCase());
                            i++;
                        }

                        // Collect body tokens until END
                        const procTokens = [];
                        while (i < tokens.length && tokens[i].toUpperCase() !== 'END') {
                            procTokens.push(tokens[i]);
                            i++;
                        }

                        this.procedures[procName] = { params, body: procTokens };
                        break;

                    default:
                        if (this.procedures[token]) {
                            const proc = this.procedures[token];

                            // Handle procedures with parameters
                            if (proc.params && proc.params.length > 0) {
                                // Collect arguments
                                const args = [];
                                let argIndex = i + 1;
                                for (let p = 0; p < proc.params.length; p++) {
                                    if (argIndex >= tokens.length) {
                                        throw new Error(`Procedure ${token} expects ${proc.params.length} arguments`);
                                    }
                                    const { value, nextIndex } = this.getNextValue(tokens, argIndex);
                                    args.push(value);
                                    argIndex = nextIndex;
                                }

                                // Create local scope with parameter bindings
                                const localScope = {};
                                for (let p = 0; p < proc.params.length; p++) {
                                    localScope[proc.params[p]] = args[p];
                                }

                                // Push scope and execute procedure body
                                this.pushScope(localScope);
                                try {
                                    await this.execute(proc.body);
                                } catch (error) {
                                    if (error instanceof OutputException) {
                                        // Store return value for expression evaluation
                                        this.lastReturnValue = error.value;
                                        // Don't throw further, just return normally
                                    } else if (error instanceof StopException) {
                                        // STOP just exits the procedure
                                        // Don't throw further, just return normally
                                    } else {
                                        throw error;
                                    }
                                } finally {
                                    // Always pop scope, even on errors
                                    this.popScope();
                                }

                                // Update index
                                i = argIndex - 1;
                            } else {
                                // Old-style procedure without parameters (backward compatibility)
                                const body = proc.body || proc;
                                try {
                                    await this.execute(body);
                                } catch (error) {
                                    if (error instanceof OutputException) {
                                        // Store return value for expression evaluation
                                        this.lastReturnValue = error.value;
                                        // Don't throw further, just return normally
                                    } else if (error instanceof StopException) {
                                        // STOP just exits the procedure
                                        // Don't throw further, just return normally
                                    } else {
                                        throw error;
                                    }
                                }
                            }
                        } else if (token !== '' && !token.startsWith(';')) {
                            this.log(`Unknown command: ${token}`);
                        }
                }
            } catch (error) {
                // Format and log the error with context
                const errorMsg = this.formatError(error, i);
                this.log(errorMsg);
                error.logged = true; // Mark as logged to avoid duplicate messages
                throw error;
            }

            i++;
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async run(code) {
        this.output.textContent = '';
        this.sourceCode = code; // Store for error reporting

        try {
            this.tokens = this.tokenize(code); // Store for error reporting
            await this.execute(this.tokens);
            this.log('Program completed successfully!');
        } catch (error) {
            // Don't log the error here - it's already logged in execute()
            // Just let it bubble up
            if (!error.logged) {
                this.log(`Error: ${error.message}`);
            }
        }
    }
}

let interpreter;

document.addEventListener('DOMContentLoaded', () => {
    interpreter = new LogoInterpreter();

    const runButton = document.getElementById('runButton');
    const clearButton = document.getElementById('clearButton');
    const resetButton = document.getElementById('resetButton');
    const exampleButton = document.getElementById('exampleButton');
    const codeEditor = document.getElementById('codeEditor');
    const penColorInput = document.getElementById('penColor');
    const bgColorInput = document.getElementById('bgColor');
    const speedInput = document.getElementById('speed');
    const speedValue = document.getElementById('speedValue');

    runButton.addEventListener('click', () => {
        const code = codeEditor.value;
        interpreter.run(code);
    });

    clearButton.addEventListener('click', () => {
        interpreter.clear();
    });

    resetButton.addEventListener('click', () => {
        interpreter.reset();
    });

    exampleButton.addEventListener('click', () => {
        codeEditor.value = `; Logo with Arithmetic Expressions!

CLEAR
HOME

; 1. Basic arithmetic
MAKE "size 50
FORWARD :size + 30        ; Addition
RIGHT 90
FORWARD :size * 2         ; Multiplication
RIGHT 90
FORWARD :size + :size / 2 ; Mixed operations
RIGHT 90
FORWARD 100 - :size       ; Subtraction

; 2. Growing spiral with math
PENUP
HOME
SETXY -150 100
PENDOWN
SETPENCOLOR 255 0 128
MAKE "len 5
REPEAT 20 [
  FORWARD :len
  RIGHT 90
  MAKE "len :len + 3      ; Increment variable!
]

; 3. Math functions - Random circles
PENUP
HOME
SETPENCOLOR 0 128 255
REPEAT 8 [
  SETXY RANDOM 200 - 100 RANDOM 200 - 100
  PENDOWN
  CIRCLE 10 + RANDOM 20   ; Random radius
  PENUP
]

; 4. Trigonometry - Parametric curve
PENUP
HOME
SETXY 100 0
PENDOWN
SETPENCOLOR 128 0 255
PENSIZE 2
MAKE "angle 10
REPEAT 36 [
  SETXY 100 * COS :angle 100 * SIN :angle
  MAKE "angle :angle + 10
]

; 5. Procedure with arithmetic
TO POLYGON :sides :size
  REPEAT :sides [
    FORWARD :size
    RIGHT 360 / :sides    ; Calculate angle!
  ]
END

PENUP
HOME
SETXY 100 -100
PENDOWN
SETPENCOLOR 255 128 0
POLYGON 7 40

; 6. Nested expressions
PENUP
HOME
SETXY -100 -100
PENDOWN
SETPENCOLOR 0 255 0
MAKE "base 30
SQUARE :base + SQRT 100   ; sqrt(100) = 10, so 40x40 square
`;
    });

    penColorInput.addEventListener('change', (e) => {
        const color = e.target.value;
        const r = parseInt(color.substr(1, 2), 16);
        const g = parseInt(color.substr(3, 2), 16);
        const b = parseInt(color.substr(5, 2), 16);
        interpreter.setPenColor(r, g, b);
    });

    bgColorInput.addEventListener('change', (e) => {
        document.getElementById('canvas').style.backgroundColor = e.target.value;
    });

    speedInput.addEventListener('input', (e) => {
        speedValue.textContent = e.target.value;
    });

    codeEditor.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = codeEditor.selectionStart;
            const end = codeEditor.selectionEnd;
            codeEditor.value = codeEditor.value.substring(0, start) + '  ' + codeEditor.value.substring(end);
            codeEditor.selectionStart = codeEditor.selectionEnd = start + 2;
        }
    });
});
