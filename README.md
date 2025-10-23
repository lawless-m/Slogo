# Logo Interpreter

A JavaScript implementation of Logo turtle graphics using SVG rendering. This interpreter brings the classic educational programming language to the web with a modern, interactive interface.

## Features

- **SVG-based rendering** - Crisp, scalable graphics rendered using SVG
- **Real-time turtle visualization** - See the turtle move as it draws
- **Interactive editor** - Write and execute Logo programs in your browser
- **Standard Logo commands** - Supports classic Logo syntax and commands
- **Procedures** - Define and reuse custom procedures
- **Color control** - Set pen colors and background colors
- **Responsive design** - Works on desktop and mobile devices

## Getting Started

### Running the Interpreter

Simply open `index.html` in a modern web browser. No build process or dependencies required!

```bash
# Clone the repository
git clone <repository-url>
cd Slogo

# Open in browser
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux
```

### Quick Example

Try this simple program to draw a square:

```logo
REPEAT 4 [
  FORWARD 100
  RIGHT 90
]
```

## Command Reference

### Movement Commands

| Command | Aliases | Description | Example |
|---------|---------|-------------|---------|
| `FORWARD n` | `FD n` | Move forward n pixels | `FORWARD 100` |
| `BACKWARD n` | `BK n`, `BACK n` | Move backward n pixels | `BACKWARD 50` |
| `LEFT n` | `LT n` | Turn left n degrees | `LEFT 90` |
| `RIGHT n` | `RT n` | Turn right n degrees | `RIGHT 45` |
| `SETXY x y` | | Move to position (x, y) | `SETXY 100 50` |
| `SETHEADING n` | `SETH n` | Set heading to n degrees | `SETHEADING 0` |
| `HOME` | | Return to center (0, 0) facing up | `HOME` |

### Pen Control Commands

| Command | Aliases | Description | Example |
|---------|---------|-------------|---------|
| `PENUP` | `PU` | Lift pen (stop drawing) | `PENUP` |
| `PENDOWN` | `PD` | Lower pen (start drawing) | `PENDOWN` |
| `PENSIZE n` | `SETPENSIZE n` | Set pen width to n pixels | `PENSIZE 5` |
| `SETPENCOLOR r g b` | `SETPC r g b` | Set pen color (RGB 0-255) | `SETPENCOLOR 255 0 0` |

### Display Commands

| Command | Aliases | Description | Example |
|---------|---------|-------------|---------|
| `CLEAR` | `CLEARSCREEN`, `CS` | Clear all drawings | `CLEAR` |
| `HIDETURTLE` | `HT` | Hide the turtle | `HIDETURTLE` |
| `SHOWTURTLE` | `ST` | Show the turtle | `SHOWTURTLE` |

### Control Flow Commands

| Command | Description | Example |
|---------|-------------|---------|
| `REPEAT n [commands]` | Repeat commands n times | `REPEAT 4 [FORWARD 100 RIGHT 90]` |
| `TO name ... END` | Define a procedure | `TO SQUARE REPEAT 4 [FD 100 RT 90] END` |

## Example Programs

### Draw a Star

```logo
REPEAT 5 [
  FORWARD 100
  RIGHT 144
]
```

### Draw a Spiral

```logo
REPEAT 36 [
  FORWARD 100
  RIGHT 170
]
```

### Draw a House

```logo
; Draw the house base
REPEAT 4 [
  FORWARD 100
  RIGHT 90
]

; Move to roof position
PENUP
FORWARD 100
PENDOWN

; Draw the roof
RIGHT 30
FORWARD 100
RIGHT 120
FORWARD 100

; Draw the door
PENUP
SETXY -30 0
SETHEADING 0
PENDOWN

REPEAT 2 [
  FORWARD 30
  RIGHT 90
  FORWARD 50
  RIGHT 90
]
```

### Define and Use a Procedure

```logo
; Define a square procedure
TO SQUARE
  REPEAT 4 [
    FORWARD 100
    RIGHT 90
  ]
END

; Use the procedure
SQUARE

; Move and draw another
PENUP
SETXY 150 0
PENDOWN
SQUARE
```

### Colorful Pattern

```logo
REPEAT 12 [
  SETPENCOLOR 255 0 0
  FORWARD 50
  RIGHT 30

  SETPENCOLOR 0 0 255
  FORWARD 50
  RIGHT 30

  SETPENCOLOR 0 255 0
  FORWARD 50
  RIGHT 30
]
```

### Flower Pattern

```logo
REPEAT 36 [
  REPEAT 4 [
    FORWARD 60
    RIGHT 90
  ]
  RIGHT 10
]
```

## Coordinate System

The Logo interpreter uses a standard Cartesian coordinate system:

- **Origin (0, 0)** - Center of the canvas
- **Positive X** - Right direction
- **Negative X** - Left direction
- **Positive Y** - Up direction
- **Negative Y** - Down direction

## Heading System

Heading is measured in degrees:

- **0°** - Up (North)
- **90°** - Right (East)
- **180°** - Down (South)
- **270°** - Left (West)

## Architecture

### Components

1. **LogoInterpreter Class** (`logo.js`) - Core interpreter logic
   - Tokenization and parsing
   - Command execution
   - SVG rendering
   - State management

2. **HTML Interface** (`index.html`) - User interface
   - Code editor
   - Canvas display
   - Control buttons
   - Command reference

3. **Styling** (`style.css`) - Visual design
   - Responsive layout
   - Modern UI components
   - Color scheme

### Key Methods

- `tokenize(code)` - Converts Logo code into tokens
- `parseBlock(tokens, index)` - Parses block structures like `[...]`
- `execute(tokens)` - Executes Logo commands
- `forward(distance)` - Moves turtle forward
- `drawLine(x1, y1, x2, y2)` - Renders lines using SVG

## Browser Compatibility

This interpreter works in all modern browsers that support:
- ES6 JavaScript features
- SVG rendering
- CSS Grid and Flexbox

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

Potential features for future versions:

- [ ] Variable support
- [ ] Conditional statements (IF/IFELSE)
- [ ] Mathematical expressions
- [ ] Procedure parameters
- [ ] Fill operations
- [ ] Animation speed control
- [ ] Export drawings as SVG/PNG
- [ ] Code syntax highlighting
- [ ] Error line highlighting
- [ ] Undo/Redo functionality
- [ ] Save/Load programs

## Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the original Logo language created by Seymour Papert and team at MIT
- Built as a JavaScript alternative to C# Avalonia implementations

## Resources

- [Logo Programming Language - Wikipedia](https://en.wikipedia.org/wiki/Logo_(programming_language))
- [Logo Foundation](http://el.media.mit.edu/logo-foundation/)
- [UCBLogo Manual](https://people.eecs.berkeley.edu/~bh/usermanual)

---

Made with SVG and JavaScript
