# Slogo - Multi-Platform Logo Turtle Graphics

A collection of Logo turtle graphics implementations for different platforms, sharing compatible syntax. Perfect for learning Logo, prototyping drawings, and controlling pen plotters.

## Implementations

This repository contains two implementations:

### 🌐 Web (JavaScript + SVG)
- **Location**: Root directory (`index.html`, `logo.js`, `style.css`)
- **Platform**: Any modern web browser
- **Setup**: Just open `index.html` - no installation required!
- **Best for**: Quick prototyping, learning Logo, testing programs

### 🖥️ Desktop (C# + Avalonia)
- **Location**: `axi-csharp/`
- **Platform**: Windows, macOS, Linux (cross-platform GUI)
- **Setup**: Requires .NET 6+
- **Best for**: Desktop application, plotter integration, advanced features

Both implementations share **compatible Logo syntax**, allowing seamless workflow: prototype in browser → run on desktop.

## Quick Start - Web Version

The easiest way to get started:

1. Open `index.html` in your browser
2. Write Logo commands in the editor
3. Click "Run" to see the turtle draw

No installation required!

## Features

- **Arithmetic expressions** - Full math support: `FORWARD 50 + 30`, `RIGHT 360 / :sides`
- **Math functions** - SQRT, SIN, COS, RANDOM, ABS, ROUND, and more
- **Variables** - `MAKE "size 100` and `:size` syntax
- **Procedures with parameters** - `TO STAR :length`
- **Built-in shapes** - CIRCLE, BOX, SQUARE commands
- **Standard Logo commands** - FORWARD, BACKWARD, LEFT, RIGHT, etc.
- **Real-time visualization** - See the turtle move as it draws
- **SVG rendering** - Crisp, scalable graphics

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
| `SETX n` | | Set X position | `SETX 100` |
| `SETY n` | | Set Y position | `SETY 50` |
| `SETHEADING n` | `SETH n` | Set heading (0=right, 90=up) | `SETHEADING 90` |
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

### Shape Commands

| Command | Description | Example |
|---------|-------------|---------|
| `CIRCLE radius` | Draw a circle with given radius | `CIRCLE 50` |
| `BOX width height` | Draw a rectangle/box | `BOX 100 60` |
| `SQUARE size` | Draw a square | `SQUARE 80` |

### Variable Commands

| Command | Description | Example |
|---------|-------------|---------|
| `MAKE "var value` | Create or set a variable | `MAKE "size 100` |
| `:var` | Reference a variable value | `FORWARD :size` |

### Control Flow Commands

| Command | Description | Example |
|---------|-------------|---------|
| `REPEAT n [commands]` | Repeat commands n times | `REPEAT 4 [FORWARD 100 RIGHT 90]` |
| `TO name :param1 :param2 ... [commands] END` | Define a procedure with parameters | `TO SQUARE :size REPEAT 4 [FD :size RT 90] END` |

### Arithmetic & Math Operations

All numeric arguments support full arithmetic expressions:

| Operator/Function | Description | Example |
|-------------------|-------------|---------|
| `+` | Addition | `FORWARD 50 + 30` |
| `-` | Subtraction | `FORWARD 100 - :x` |
| `*` | Multiplication | `FORWARD :size * 2` |
| `/` | Division | `FORWARD 360 / :sides` |
| `MOD` | Modulo (remainder) | `FORWARD 100 MOD 7` |
| `( )` | Parentheses for grouping | `FORWARD (50 + 30) * 2` |

### Math Functions

| Function | Description | Example |
|----------|-------------|---------|
| `SQRT n` | Square root | `FORWARD SQRT 100` |
| `SIN n` | Sine (degrees) | `SETX 100 * SIN :angle` |
| `COS n` | Cosine (degrees) | `SETY 100 * COS :angle` |
| `TAN n` | Tangent (degrees) | `FORWARD TAN 45` |
| `ABS n` | Absolute value | `FORWARD ABS -50` |
| `ROUND n` | Round to nearest integer | `FORWARD ROUND 3.7` |
| `FLOOR n` | Round down | `FORWARD FLOOR 3.7` |
| `CEILING n` | Round up | `FORWARD CEILING 3.2` |
| `RANDOM n` | Random integer from 0 to n-1 | `FORWARD RANDOM 100` |

**Examples:**
```logo
; Arithmetic in commands
FORWARD 50 + 30           ; 80 pixels
MAKE "x 10
FORWARD :x * 5            ; 50 pixels
RIGHT 360 / 5             ; 72 degrees (for pentagon)

; Growing spiral
MAKE "len 5
REPEAT 20 [
  FORWARD :len
  RIGHT 90
  MAKE "len :len + 3      ; Increment!
]

; Trigonometry for circle
MAKE "angle 0
REPEAT 36 [
  SETXY 100 * COS :angle 100 * SIN :angle
  MAKE "angle :angle + 10
]
```

## Example Programs

### Draw a Star

```logo
REPEAT 5 [
  FORWARD 100
  RIGHT 144
]
```

### Using Variables

```logo
MAKE "size 100
MAKE "angle 144

REPEAT 5 [
  FORWARD :size
  RIGHT :angle
]
```

### Procedure with Parameters

```logo
TO STAR :length
  REPEAT 5 [
    FORWARD :length
    RIGHT 144
  ]
END

; Now use it
STAR 100
PENUP
SETXY 150 0
PENDOWN
STAR 50
```

### Built-in Shapes

```logo
; Draw a circle
CIRCLE 50

; Draw a square
PENUP
SETXY 100 0
PENDOWN
SQUARE 80

; Draw a rectangle
PENUP
SETXY -100 0
PENDOWN
BOX 120 60
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

Heading is measured in degrees (matching the C# implementation):

- **0°** - Right (East) - Standard mathematical orientation
- **90°** - Up (North)
- **180°** - Left (West)
- **270°** - Down (South)

This coordinate system matches standard mathematical conventions and the C# axi implementation.

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
- `evaluateExpression(token)` - Evaluates numbers and variable references
- `forward(distance)` - Moves turtle forward
- `circle(radius)` - Draws a circle
- `box(width, height)` - Draws a rectangle
- `square(size)` - Draws a square
- `drawLine(x1, y1, x2, y2)` - Renders lines using SVG

### New Features (matching C# implementation)

- **Variables**: Use `MAKE "varname value` to create variables and `:varname` to reference them
- **Procedure Parameters**: Define procedures with parameters like `TO SQUARE :size`
- **Built-in Shapes**: CIRCLE, BOX, and SQUARE commands for common shapes
- **Enhanced Movement**: SETXY, SETX, SETY commands for precise positioning
- **Standard Heading**: 0° = right, 90° = up (mathematical convention)

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

## Compatibility with C# Implementation

This JavaScript implementation is designed to be compatible with the C# Avalonia Logo interpreter from the [axi](https://github.com/lawless-m/axi) project. Key features that match:

- ✅ Same command set (FORWARD, BACKWARD, LEFT, RIGHT, etc.)
- ✅ Same heading system (0° = right, 90° = up)
- ✅ Variable support with MAKE and :varname syntax
- ✅ Procedure definitions with parameters (TO name :param1 :param2 ... END)
- ✅ Built-in shape commands (CIRCLE, BOX, SQUARE)
- ✅ SETXY, SETX, SETY commands
- ✅ Turtle graphics with SVG rendering

## Future Enhancements

Potential features for future versions:

- [ ] Conditional statements (IF/IFELSE)
- [ ] Mathematical expressions (arithmetic operations)
- [ ] Boolean operators
- [ ] Fill operations
- [ ] Animation speed control
- [ ] Export drawings as SVG/PNG
- [ ] Code syntax highlighting
- [ ] Error line highlighting
- [ ] Undo/Redo functionality
- [ ] Save/Load programs
- [ ] More shape primitives

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
