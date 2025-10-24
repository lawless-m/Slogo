namespace Axi.Drawing;

/// <summary>
/// Implements Logo-style turtle graphics for creating drawings
/// </summary>
public class Turtle
{
    private Point _position;
    private double _heading; // in degrees, 0 = right, 90 = up
    private bool _penDown;
    private double _penSize;
    private (double R, double G, double B) _penColor; // RGB values 0-255
    private readonly List<List<Point>> _paths;
    private List<Point>? _currentPath;

    public Turtle()
    {
        _position = new Point(0, 0);
        _heading = 90; // Start facing up (like Logo)
        _penDown = true;
        _penSize = 2.0;
        _penColor = (0, 0, 0); // Black
        _paths = new List<List<Point>>();
        _currentPath = new List<Point>();
        _currentPath.Add(_position);
    }

    /// <summary>
    /// Current position of the turtle
    /// </summary>
    public Point Position => _position;

    /// <summary>
    /// Current X coordinate
    /// </summary>
    public double X => _position.X;

    /// <summary>
    /// Current Y coordinate
    /// </summary>
    public double Y => _position.Y;

    /// <summary>
    /// Current heading in degrees (0 = right, 90 = up, 180 = left, 270 = down)
    /// </summary>
    public double Heading => _heading;

    /// <summary>
    /// Whether the pen is currently down
    /// </summary>
    public bool IsPenDown => _penDown;

    /// <summary>
    /// Whether the pen is currently down (alias for IsPenDown)
    /// </summary>
    public bool PenDown => _penDown;

    /// <summary>
    /// Current pen size (width)
    /// </summary>
    public double PenSize => _penSize;

    /// <summary>
    /// Current pen color as RGB tuple (R, G, B) with values 0-255
    /// </summary>
    public (double R, double G, double B) PenColor => _penColor;

    /// <summary>
    /// Lifts the pen up (stops drawing)
    /// </summary>
    public void PenUp()
    {
        if (_penDown)
        {
            _penDown = false;
            if (_currentPath != null && _currentPath.Count > 1)
            {
                _paths.Add(_currentPath);
            }
            _currentPath = null;
        }
    }

    /// <summary>
    /// Puts the pen down (starts drawing)
    /// </summary>
    public void PenDown()
    {
        if (!_penDown)
        {
            _penDown = true;
            _currentPath = new List<Point> { _position };
        }
    }

    /// <summary>
    /// Moves the turtle forward by the specified distance
    /// </summary>
    public void Forward(double distance)
    {
        var radians = _heading * Math.PI / 180.0;
        var dx = Math.Cos(radians) * distance;
        var dy = Math.Sin(radians) * distance;

        _position = new Point(_position.X + dx, _position.Y + dy);

        if (_penDown && _currentPath != null)
        {
            _currentPath.Add(_position);
        }
    }

    /// <summary>
    /// Moves the turtle backward by the specified distance
    /// </summary>
    public void Backward(double distance)
    {
        Forward(-distance);
    }

    /// <summary>
    /// Turns the turtle right by the specified angle in degrees
    /// </summary>
    public void Right(double degrees)
    {
        _heading -= degrees;
        while (_heading < 0) _heading += 360;
        while (_heading >= 360) _heading -= 360;
    }

    /// <summary>
    /// Turns the turtle left by the specified angle in degrees
    /// </summary>
    public void Left(double degrees)
    {
        _heading += degrees;
        while (_heading < 0) _heading += 360;
        while (_heading >= 360) _heading -= 360;
    }

    /// <summary>
    /// Sets the heading to a specific angle in degrees
    /// </summary>
    public void SetHeading(double degrees)
    {
        _heading = degrees;
        while (_heading < 0) _heading += 360;
        while (_heading >= 360) _heading -= 360;
    }

    /// <summary>
    /// Moves the turtle to a specific position (standard Logo command)
    /// </summary>
    public void SetXY(double x, double y)
    {
        _position = new Point(x, y);

        if (_penDown && _currentPath != null)
        {
            _currentPath.Add(_position);
        }
    }

    /// <summary>
    /// Sets the X coordinate of the turtle position
    /// </summary>
    public void SetX(double x)
    {
        SetXY(x, _position.Y);
    }

    /// <summary>
    /// Sets the Y coordinate of the turtle position
    /// </summary>
    public void SetY(double y)
    {
        SetXY(_position.X, y);
    }

    /// <summary>
    /// Returns the turtle to the origin (0, 0) with heading 90 (up)
    /// </summary>
    public void Home()
    {
        SetXY(0, 0);
        SetHeading(90);
    }

    /// <summary>
    /// Draws a circle with the specified radius
    /// </summary>
    /// <param name="radius">Radius of the circle</param>
    /// <param name="steps">Number of line segments (default 36)</param>
    public void Circle(double radius, int steps = 36)
    {
        var angleStep = 360.0 / steps;
        for (int i = 0; i < steps; i++)
        {
            Forward(2 * Math.PI * radius / steps);
            Left(angleStep);
        }
    }

    /// <summary>
    /// Draws a rectangle/box with the specified width and height
    /// </summary>
    public void Box(double width, double height)
    {
        for (int i = 0; i < 2; i++)
        {
            Forward(width);
            Right(90);
            Forward(height);
            Right(90);
        }
    }

    /// <summary>
    /// Draws a square with the specified side length
    /// </summary>
    public void Square(double size)
    {
        Box(size, size);
    }

    /// <summary>
    /// Sets the pen size (width)
    /// </summary>
    public void SetPenSize(double size)
    {
        _penSize = size;
    }

    /// <summary>
    /// Sets the pen color using RGB values (0-255)
    /// </summary>
    public void SetPenColor(double r, double g, double b)
    {
        _penColor = (r, g, b);
    }

    /// <summary>
    /// Gets the current drawing
    /// </summary>
    public Drawing GetDrawing()
    {
        var allPaths = new List<List<Point>>(_paths);

        // Add current path if it has points
        if (_currentPath != null && _currentPath.Count > 1)
        {
            allPaths.Add(_currentPath);
        }

        return new Drawing(allPaths);
    }

    /// <summary>
    /// Clears the turtle and resets it to the initial state
    /// </summary>
    public void Clear()
    {
        _position = new Point(0, 0);
        _heading = 90;
        _penDown = true;
        _paths.Clear();
        _currentPath = new List<Point> { _position };
    }
}
