namespace Axi.Drawing;

/// <summary>
/// Represents a 2D point with double precision coordinates
/// </summary>
public readonly struct Point
{
    public double X { get; }
    public double Y { get; }

    public Point(double x, double y)
    {
        X = x;
        Y = y;
    }

    public static Point operator +(Point a, Point b) => new(a.X + b.X, a.Y + b.Y);
    public static Point operator -(Point a, Point b) => new(a.X - b.X, a.Y - b.Y);
    public static Point operator *(Point p, double scalar) => new(p.X * scalar, p.Y * scalar);
    public static Point operator /(Point p, double scalar) => new(p.X / scalar, p.Y / scalar);

    public double Distance(Point other)
    {
        var dx = X - other.X;
        var dy = Y - other.Y;
        return Math.Sqrt(dx * dx + dy * dy);
    }

    public override string ToString() => $"({X:F2}, {Y:F2})";
}
