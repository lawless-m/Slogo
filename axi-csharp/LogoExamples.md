# Logo Language Examples

This document demonstrates the control structures and features of the Axi Logo language.

## Basic Commands

### Drawing a square
```logo
repeat 4 [ forward 100 right 90 ]
```

### Drawing a triangle
```logo
repeat 3 [ forward 100 right 120 ]
```

## Variables

### Using variables for sizes
```logo
make "size 100
forward :size
right 90
forward :size
```

### Complex example with variables
```logo
make "size 80
make "angle 90
repeat 4 [ forward :size right :angle ]
```

## Procedures (Subroutines)

### Define a square procedure
```logo
to square :size [
  repeat 4 [ forward :size right 90 ]
]
end
```

Then call it:
```logo
square 50
square 100
```

### Multiple parameters
```logo
to rectangle :width :height [
  repeat 2 [ forward :width right 90 forward :height right 90 ]
]
end
```

Call it:
```logo
rectangle 100 50
```

### Nested procedures
```logo
to square :size [
  repeat 4 [ forward :size right 90 ]
]
end

to grid :size :spacing [
  repeat 3 [
    penup
    setxy 0 :spacing
    pendown
    square :size
    make "spacing :spacing + :size + 10
  ]
]
end
```

## Complex Patterns

### Spiral square
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

### Flower pattern
```logo
to petal :size [
  repeat 2 [
    circle :size
    right 60
  ]
]
end

to flower :size [
  repeat 6 [
    petal :size
    right 60
  ]
]
end

flower 30
```

### Star
```logo
to star :size [
  repeat 5 [
    forward :size
    right 144
  ]
]
end

star 100
```

### Nested squares
```logo
to nested_squares :size :count [
  repeat :count [
    square :size
    make "size :size - 10
    penup
    forward 5
    right 90
    forward 5
    left 90
    pendown
  ]
]
end

nested_squares 200 10
```

### Polygon drawer
```logo
to polygon :sides :size [
  make "angle 360 / :sides
  repeat :sides [
    forward :size
    right :angle
  ]
]
end

polygon 6 50  ; hexagon
penup
forward 120
pendown
polygon 8 40  ; octagon
```

## Advanced Examples

### Spiral with increasing angle
```logo
to angle_spiral :size :count [
  make "angle 90
  repeat :count [
    forward :size
    right :angle
    make "angle :angle + 5
  ]
]
end

angle_spiral 50 20
```

### Recursive-style pattern (using loops)
```logo
to branching :size :levels [
  make "i 0
  repeat :levels [
    forward :size
    right 30
    forward :size / 2
    backward :size / 2
    left 60
    forward :size / 2
    backward :size / 2
    right 30
    make "size :size * 0.8
    make "i :i + 1
  ]
]
end

branching 100 5
```

### House with procedure
```logo
to house :size [
  ; Draw base
  square :size

  ; Move to roof position
  penup
  forward :size
  pendown

  ; Draw roof
  right 30
  forward :size * 0.6
  right 120
  forward :size * 0.6
  right 120
  forward :size * 0.6

  ; Reset position
  penup
  left 30
  backward :size
  pendown
]
end

house 100
```

## Tips

1. **Always close brackets**: Every `[` needs a matching `]`
2. **Variable names**: Use `"varname` when setting with `make`, `:varname` when using
3. **Procedure parameters**: Always start with `:` (e.g., `:size`, `:count`)
4. **End procedures**: Always close procedure definitions with `end`
5. **Whitespace**: Spaces are important - separate commands and arguments with spaces
6. **Comments**: Not yet implemented, but plan your code carefully!

## Debugging Tips

If you get an error:
- Check that all brackets are balanced
- Make sure variable names are spelled consistently
- Verify procedure parameter counts match the definition
- Check that numbers are valid (no typos)
