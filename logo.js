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

    evaluateExpression(token) {
        // Handle variable references (:varname)
        if (token.startsWith(':')) {
            const varName = token.substring(1).toUpperCase();
            if (this.variables.hasOwnProperty(varName)) {
                return this.variables[varName];
            }
            throw new Error(`Undefined variable: ${varName}`);
        }

        // Handle numbers
        const value = parseFloat(token);
        if (isNaN(value)) {
            throw new Error(`Expected number or variable, got: ${token}`);
        }
        return value;
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
                        this.forward(this.evaluateExpression(tokens[++i]));
                        break;

                    case 'BACKWARD':
                    case 'BK':
                    case 'BACK':
                        this.backward(this.evaluateExpression(tokens[++i]));
                        break;

                    case 'LEFT':
                    case 'LT':
                        this.left(this.evaluateExpression(tokens[++i]));
                        break;

                    case 'RIGHT':
                    case 'RT':
                        this.right(this.evaluateExpression(tokens[++i]));
                        break;

                    case 'SETXY':
                        const gx = this.evaluateExpression(tokens[++i]);
                        const gy = this.evaluateExpression(tokens[++i]);
                        this.goTo(gx, gy);
                        break;

                    case 'SETX':
                        this.setX(this.evaluateExpression(tokens[++i]));
                        break;

                    case 'SETY':
                        this.setY(this.evaluateExpression(tokens[++i]));
                        break;

                    case 'SETHEADING':
                    case 'SETH':
                        this.setHeading(this.evaluateExpression(tokens[++i]));
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
                        this.setPenSize(this.evaluateExpression(tokens[++i]));
                        break;

                    case 'SETPENCOLOR':
                    case 'SETPC':
                        const r = this.evaluateExpression(tokens[++i]);
                        const g = this.evaluateExpression(tokens[++i]);
                        const b = this.evaluateExpression(tokens[++i]);
                        this.setPenColor(r, g, b);
                        break;

                    case 'CIRCLE':
                        const radius = this.evaluateExpression(tokens[++i]);
                        this.circle(radius);
                        break;

                    case 'BOX':
                        const width = this.evaluateExpression(tokens[++i]);
                        const height = this.evaluateExpression(tokens[++i]);
                        this.box(width, height);
                        break;

                    case 'SQUARE':
                        const size = this.evaluateExpression(tokens[++i]);
                        this.square(size);
                        break;

                    case 'MAKE':
                        // MAKE "varname value
                        const varToken = tokens[++i];
                        const varName = varToken.startsWith('"') ? varToken.substring(1).toUpperCase() : varToken.toUpperCase();
                        const value = this.evaluateExpression(tokens[++i]);
                        this.variables[varName] = value;
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
                        const count = Math.floor(this.evaluateExpression(tokens[++i]));
                        i++;
                        if (tokens[i] !== '[') {
                            throw new Error('REPEAT requires a block in brackets');
                        }
                        const { block, nextIndex } = this.parseBlock(tokens, i + 1);
                        for (let j = 0; j < count; j++) {
                            await this.execute(block);
                            await this.sleep(10);
                        }
                        i = nextIndex - 1;
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
                                for (let p = 0; p < proc.params.length; p++) {
                                    i++;
                                    if (i >= tokens.length) {
                                        throw new Error(`Procedure ${token} expects ${proc.params.length} arguments`);
                                    }
                                    args.push(this.evaluateExpression(tokens[i]));
                                }

                                // Save current variable scope
                                const savedVars = { ...this.variables };

                                // Set parameters as variables
                                for (let p = 0; p < proc.params.length; p++) {
                                    this.variables[proc.params[p]] = args[p];
                                }

                                // Execute procedure body
                                await this.execute(proc.body);

                                // Restore variable scope
                                this.variables = savedVars;
                            } else {
                                // Old-style procedure without parameters (backward compatibility)
                                const body = proc.body || proc;
                                await this.execute(body);
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
        codeEditor.value = `; Demo of new features matching C# implementation

CLEAR
HOME

; 1. Variables with MAKE
MAKE "size 80
MAKE "radius 40

; 2. Procedure with parameters
TO HEXAGON :length
  REPEAT 6 [
    FORWARD :length
    RIGHT 60
  ]
END

TO STAR :length
  REPEAT 5 [
    FORWARD :length
    RIGHT 144
  ]
END

; 3. Built-in shapes - SQUARE
PENUP
SETXY -200 150
PENDOWN
SETPENCOLOR 255 0 0
SQUARE :size

; 4. Built-in shapes - BOX
PENUP
SETXY -200 -50
PENDOWN
SETPENCOLOR 0 128 0
BOX 100 60

; 5. Built-in shapes - CIRCLE
PENUP
SETXY 0 150
PENDOWN
SETPENCOLOR 0 0 255
CIRCLE :radius

; 6. Use procedure with variable
PENUP
SETXY 100 150
PENDOWN
SETPENCOLOR 255 165 0
HEXAGON 50

; 7. Star using procedure and variable
PENUP
SETXY 100 -50
PENDOWN
SETPENCOLOR 128 0 128
PENSIZE 2
MAKE "starsize 70
STAR :starsize

; 8. Flower pattern with circles
PENUP
SETXY 0 -100
PENDOWN
SETPENCOLOR 255 100 200
PENSIZE 1
REPEAT 12 [
  CIRCLE 30
  RIGHT 30
]`;
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
