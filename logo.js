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
        this.heading = 0;
        this.penDown = true;
        this.penColor = '#000000';
        this.penSize = 2;
        this.turtleVisible = true;
        this.updateTurtleDisplay();
    }

    clear() {
        this.drawingLayer.innerHTML = '';
    }

    updateTurtleDisplay() {
        const screenX = this.centerX + this.x;
        const screenY = this.centerY - this.y;

        this.turtleElement.setAttribute('transform',
            `translate(${screenX}, ${screenY}) rotate(${this.heading})`);
        this.turtleElement.style.display = this.turtleVisible ? 'block' : 'none';

        document.getElementById('turtleX').textContent = Math.round(this.x);
        document.getElementById('turtleY').textContent = Math.round(this.y);
        document.getElementById('turtleHeading').textContent = Math.round(this.heading);
        document.getElementById('turtlePen').textContent = this.penDown ? 'Down' : 'Up';
    }

    forward(distance) {
        const startX = this.x;
        const startY = this.y;

        const radians = (this.heading - 90) * Math.PI / 180;
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
        this.heading -= angle;
        while (this.heading < 0) this.heading += 360;
        while (this.heading >= 360) this.heading -= 360;
        this.updateTurtleDisplay();
    }

    right(angle) {
        this.left(-angle);
    }

    setXY(x, y) {
        const startX = this.x;
        const startY = this.y;

        this.x = x;
        this.y = y;

        if (this.penDown) {
            this.drawLine(startX, startY, this.x, this.y);
        }

        this.updateTurtleDisplay();
    }

    setHeading(angle) {
        this.heading = angle;
        while (this.heading < 0) this.heading += 360;
        while (this.heading >= 360) this.heading -= 360;
        this.updateTurtleDisplay();
    }

    home() {
        this.setXY(0, 0);
        this.setHeading(0);
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
                        this.forward(parseFloat(tokens[++i]));
                        break;

                    case 'BACKWARD':
                    case 'BK':
                    case 'BACK':
                        this.backward(parseFloat(tokens[++i]));
                        break;

                    case 'LEFT':
                    case 'LT':
                        this.left(parseFloat(tokens[++i]));
                        break;

                    case 'RIGHT':
                    case 'RT':
                        this.right(parseFloat(tokens[++i]));
                        break;

                    case 'SETXY':
                        const x = parseFloat(tokens[++i]);
                        const y = parseFloat(tokens[++i]);
                        this.setXY(x, y);
                        break;

                    case 'SETHEADING':
                    case 'SETH':
                        this.setHeading(parseFloat(tokens[++i]));
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
                        this.setPenSize(parseFloat(tokens[++i]));
                        break;

                    case 'SETPENCOLOR':
                    case 'SETPC':
                        const r = parseFloat(tokens[++i]);
                        const g = parseFloat(tokens[++i]);
                        const b = parseFloat(tokens[++i]);
                        this.setPenColor(r, g, b);
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
                        const count = parseInt(tokens[++i]);
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
                        const procTokens = [];
                        while (i < tokens.length && tokens[i].toUpperCase() !== 'END') {
                            procTokens.push(tokens[i]);
                            i++;
                        }
                        this.procedures[procName] = procTokens;
                        break;

                    default:
                        if (this.procedures[token]) {
                            await this.execute(this.procedures[token]);
                        } else if (token !== '') {
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
        codeEditor.value = `; Draw a colorful spiral
CLEAR
HOME

REPEAT 36 [
  SETPENCOLOR 255 0 0
  FORWARD 100
  RIGHT 170

  SETPENCOLOR 0 0 255
  FORWARD 100
  RIGHT 170
]

; Draw a square
PENUP
SETXY -150 150
PENDOWN
SETPENCOLOR 0 128 0

REPEAT 4 [
  FORWARD 80
  RIGHT 90
]

; Draw a star
PENUP
SETXY 150 150
SETHEADING 0
PENDOWN
SETPENCOLOR 255 165 0
PENSIZE 3

REPEAT 5 [
  FORWARD 100
  RIGHT 144
]

; Draw concentric circles (approximated with polygons)
PENUP
SETXY 0 -150
SETHEADING 0
PENDOWN
SETPENCOLOR 128 0 128
PENSIZE 2

REPEAT 3 [
  REPEAT 36 [
    FORWARD 3
    RIGHT 10
  ]
  PENUP
  SETXY 0 -150
  FORWARD 20
  PENDOWN
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
