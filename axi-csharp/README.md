# Axi C# - Turtle Graphics Library for .NET

A C# port of the [axi Python library](https://github.com/fogleman/axi) for creating drawings using Logo-style turtle graphics. This version includes an Avalonia desktop application for interactive drawing.

## Projects

### Axi.Drawing
Core library implementing turtle graphics and drawing primitives.

**Features:**
- Logo-style turtle graphics (forward, backward, left, right)
- Pen control (pen up, pen down)
- Built-in shapes (box, square, circle)
- **Control structures: loops (repeat) and procedures (to/end)**
- **Variables and parameters**
- Path-based drawing representation
- SVG export
- Transformations (translate, scale, rotate)

### Axi.Avalonia
Desktop application with an interactive Logo command interface.

**Features:**
- Real-time turtle graphics visualization
- Full Logo language interpreter with loops and procedures
- Command-line style input
- Visual turtle indicator showing position and heading
- Color-coded pen state (red = down, green = up)

## Getting Started

### Prerequisites
- .NET 8.0 SDK or later

### Building

```bash
cd axi-csharp
dotnet restore
dotnet build
```

### Running the Avalonia App

```bash
cd Axi.Avalonia
dotnet run
```

## Logo Commands

The application supports the following Logo-style commands:

### Movement
- `forward [distance]` or `fd [distance]` - Move forward
- `backward [distance]` or `bk [distance]` - Move backward

### Turning
- `right [angle]` or `rt [angle]` - Turn right in degrees
- `left [angle]` or `lt [angle]` - Turn left in degrees
- `setheading [angle]` or `seth [angle]` - Set absolute heading in degrees

### Positioning
- `setxy [x] [y]` - Move to absolute position (x, y)
- `setx [x]` - Set X coordinate
- `sety [y]` - Set Y coordinate

### Pen Control
- `penup` or `pu` - Lift pen (stop drawing)
- `pendown` or `pd` - Lower pen (start drawing)

### Shapes
- `box [width] [height]` - Draw a rectangle
- `square [size]` - Draw a square
- `circle [radius]` - Draw a circle

### Other
- `home` - Return to origin (0, 0) facing up
- `clear` - Clear the drawing

### Control Structures

#### Loops
- `repeat [count] [ commands ]` - Repeat commands N times

Example - Draw a square:
```logo
repeat 4 [ forward 100 right 90 ]
```

#### Variables
- `make "varname [value]` - Set a variable
- `:varname` - Use a variable value

Example:
```logo
make "size 100
forward :size
right 90
forward :size
```

#### Procedures (Subroutines)
- `to name :param1 :param2 [ commands ] end` - Define a procedure
- `name arg1 arg2` - Call a procedure

Example - Define and use a square procedure:
```logo
to square :size [
  repeat 4 [ forward :size right 90 ]
]
end

square 50
square 100
```

Example - Procedure with multiple parameters:
```logo
to rectangle :width :height [
  repeat 2 [ forward :width right 90 forward :height right 90 ]
]
end

rectangle 100 50
```

### Complete Examples

Draw a square using repeat:
```logo
repeat 4 [ forward 100 right 90 ]
```

Draw a spiral:
```logo
to spiral :size :increment [
  repeat 20 [
    forward :size
    right 90
    make "size :size + :increment
  ]
]
end

spiral 10 5
```

Draw a star:
```logo
to star :size [
  repeat 5 [ forward :size right 144 ]
]
end

star 100
```

See [LogoExamples.md](LogoExamples.md) for more comprehensive examples.

## Programming API

You can use the library programmatically in two ways:

### 1. Direct Turtle API

```csharp
using Axi.Drawing;

var turtle = new Turtle();

// Draw a box
turtle.Forward(100);
turtle.Right(90);
turtle.Forward(50);
turtle.Right(90);
turtle.Forward(100);
turtle.Right(90);
turtle.Forward(50);

// Or use the built-in method
turtle.Box(100, 50);

// Get the drawing
var drawing = turtle.GetDrawing();

// Export to SVG
var svg = drawing.ToSvg(800, 600);
File.WriteAllText("output.svg", svg);
```

### 2. Logo Language Interpreter

```csharp
using Axi.Drawing;
using Axi.Drawing.Logo;

var turtle = new Turtle();
var runner = new LogoRunner(turtle);

// Execute Logo programs
runner.Run(@"
  to square :size [
    repeat 4 [ forward :size right 90 ]
  ]
  end

  square 50
  penup
  forward 120
  pendown
  square 80
");

var drawing = turtle.GetDrawing();
var svg = drawing.ToSvg(800, 600);
File.WriteAllText("output.svg", svg);
```

## Architecture

### Core Components

#### Point
Immutable struct representing a 2D point with double precision.

#### Drawing
Container for paths (collections of points). Supports transformations and SVG export.

#### Turtle
Implements Logo-style turtle graphics:
- Maintains position, heading, and pen state
- Generates paths as the turtle moves
- Provides high-level drawing primitives

### Logo Interpreter Components

#### Tokenizer
Breaks Logo source code into tokens (words, numbers, brackets, special symbols).

#### Parser
Builds an Abstract Syntax Tree (AST) from tokens, supporting:
- Commands with arguments
- Repeat loops with blocks
- Procedure definitions with parameters
- Variable declarations and references

#### Interpreter
Executes the AST with:
- **ExecutionContext** - Manages variables, procedures, and scope
- Command execution (forward, right, etc.)
- Loop execution (repeat)
- Procedure definition and calling with parameters
- Variable storage and retrieval

#### LogoRunner
High-level interface that combines tokenizer, parser, and interpreter for easy program execution.

## Differences from Python Version

This C# port focuses on the core turtle graphics functionality:
- ✅ Turtle graphics API
- ✅ Drawing and path management
- ✅ Basic transformations
- ✅ SVG export
- ✅ Interactive GUI (Avalonia)
- ✅ Full Logo language interpreter
- ✅ Control structures (loops, procedures)
- ✅ Variables and parameters
- ❌ Device control (AxiDraw hardware)
- ❌ Motion planning
- ❌ Advanced path optimization

## Future Enhancements

Potential additions:
- More Logo commands (if/else conditionals, while loops, arithmetic operators)
- Function return values
- Saved drawing files (.logo format)
- Undo/redo
- Export to other formats (PNG, PDF)
- Color support
- Fill operations
- More advanced shapes
- Debugger and step-through execution
- Syntax highlighting in the command input

## License

This project is based on the original [axi library by Michael Fogleman](https://github.com/fogleman/axi).
