// Special exception for OUTPUT command to return values from procedures
class OutputException extends Error {
    constructor(value) {
        super('OUTPUT');
        this.value = value;
        this.name = 'OutputException';
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
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.heading = 90; // Start facing up like C# version (0=right, 90=up)
        this.penDown = true;
        this.penColor = '#000000';
        this.penSize = 2;
        this.turtleVisible = true;
        this.variables = {}; // Variable storage
        this.updateTurtleDisplay();
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
        const { tokens: exprTokens, nextIndex } = this.collectExpressionTokens(tokens, index);
        if (exprTokens.length === 0) {
            throw new Error('Expected expression');
        }
        const result = this.parseExpression(exprTokens, 0);
        return { value: result.value, nextIndex };
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

        // Query functions (no arguments)
        if (['XCOR', 'YCOR', 'HEADING', 'PENDOWN?', 'PENDOWNP'].includes(func)) {
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
            }
            return { value: result, nextIndex: index + 1 };
        }

        // Variable reference (:varname)
        if (token.startsWith(':')) {
            const varName = token.substring(1).toUpperCase();
            if (this.variables.hasOwnProperty(varName)) {
                return { value: this.variables[varName], nextIndex: index + 1 };
            }
            throw new Error(`Undefined variable: ${varName}`);
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
                this.variables[varName] = value;
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
        this.output.textContent += message + '\n';
    }

    tokenize(code) {
        let tokens = [];
        let current = '';
        let inBracket = false;

        for (let i = 0; i < code.length; i++) {
            const char = code[i];

            if (char === '[') {
                if (current.trim()) {
                    tokens.push(current.trim());
                    current = '';
                }
                tokens.push('[');
                inBracket = true;
            } else if (char === ']') {
                if (current.trim()) {
                    tokens.push(current.trim());
                    current = '';
                }
                tokens.push(']');
                inBracket = false;
            } else if (char === '<' || char === '>' || char === '=') {
                // Handle comparison operators
                if (current.trim()) {
                    tokens.push(current.trim());
                    current = '';
                }
                // Check for two-character operators: <=, >=, <>
                if (i + 1 < code.length) {
                    const nextChar = code[i + 1];
                    if ((char === '<' && (nextChar === '=' || nextChar === '>')) ||
                        (char === '>' && nextChar === '=')) {
                        tokens.push(char + nextChar);
                        i++; // Skip next character
                        continue;
                    }
                }
                tokens.push(char);
            } else if (/\s/.test(char) && !inBracket) {
                if (current.trim()) {
                    tokens.push(current.trim());
                    current = '';
                }
            } else if (char === '\n') {
                if (current.trim()) {
                    tokens.push(current.trim());
                    current = '';
                }
            } else {
                current += char;
            }
        }

        if (current.trim()) {
            tokens.push(current.trim());
        }

        return tokens;
    }

    parseBlock(tokens, index) {
        const block = [];
        let depth = 0;
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

        throw new Error('Unmatched bracket');
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
                            this.variables[varName] = value;
                            i = nextIndex - 1;
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

                                // Save current variable scope
                                const savedVars = { ...this.variables };

                                // Set parameters as variables
                                for (let p = 0; p < proc.params.length; p++) {
                                    this.variables[proc.params[p]] = args[p];
                                }

                                // Execute procedure body and catch OUTPUT
                                try {
                                    await this.execute(proc.body);
                                } catch (error) {
                                    if (error instanceof OutputException) {
                                        // Restore variable scope before returning
                                        this.variables = savedVars;
                                        // Store return value for expression evaluation
                                        this.lastReturnValue = error.value;
                                        // Don't throw further, just return normally
                                    } else {
                                        throw error;
                                    }
                                }

                                // Restore variable scope
                                this.variables = savedVars;

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
                this.log(`Error at token ${i}: ${error.message}`);
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

        try {
            const tokens = this.tokenize(code);
            await this.execute(tokens);
            this.log('Program completed successfully!');
        } catch (error) {
            this.log(`Error: ${error.message}`);
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
HOME
PENUP
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
HOME
PENUP
SETPENCOLOR 0 128 255
REPEAT 8 [
  SETXY RANDOM 200 - 100 RANDOM 200 - 100
  PENDOWN
  CIRCLE 10 + RANDOM 20   ; Random radius
  PENUP
]

; 4. Trigonometry - Parametric curve
HOME
PENUP
SETXY -100 0
PENDOWN
SETPENCOLOR 128 0 255
PENSIZE 2
MAKE "angle 0
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

HOME
PENUP
SETXY 100 -100
PENDOWN
SETPENCOLOR 255 128 0
POLYGON 7 40

; 6. Nested expressions
HOME
PENUP
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
