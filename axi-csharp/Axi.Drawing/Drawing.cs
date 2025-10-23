namespace Axi.Drawing;

/// <summary>
/// Represents a drawing as a collection of paths.
/// Each path is a list of points that should be drawn with the pen down.
/// </summary>
public class Drawing
{
    private readonly List<List<Point>> _paths;

    public Drawing()
    {
        _paths = new List<List<Point>>();
    }

    public Drawing(IEnumerable<List<Point>> paths)
    {
        _paths = new List<List<Point>>(paths);
    }

    /// <summary>
    /// Gets all paths in the drawing
    /// </summary>
    public IReadOnlyList<List<Point>> Paths => _paths.AsReadOnly();

    /// <summary>
    /// Adds a path to the drawing
    /// </summary>
    public void AddPath(List<Point> path)
    {
        if (path.Count > 0)
        {
            _paths.Add(new List<Point>(path));
        }
    }

    /// <summary>
    /// Gets the bounding box of the drawing as (minX, minY, maxX, maxY)
    /// </summary>
    public (double MinX, double MinY, double MaxX, double MaxY) Bounds
    {
        get
        {
            if (_paths.Count == 0 || _paths.All(p => p.Count == 0))
            {
                return (0, 0, 0, 0);
            }

            var allPoints = _paths.SelectMany(p => p);
            return (
                allPoints.Min(p => p.X),
                allPoints.Min(p => p.Y),
                allPoints.Max(p => p.X),
                allPoints.Max(p => p.Y)
            );
        }
    }

    /// <summary>
    /// Total drawing length (pen down distance)
    /// </summary>
    public double Length
    {
        get
        {
            double total = 0;
            foreach (var path in _paths)
            {
                for (int i = 1; i < path.Count; i++)
                {
                    total += path[i - 1].Distance(path[i]);
                }
            }
            return total;
        }
    }

    /// <summary>
    /// Transforms the drawing by translating all points
    /// </summary>
    public Drawing Translate(double dx, double dy)
    {
        var newPaths = _paths.Select(path =>
            path.Select(p => new Point(p.X + dx, p.Y + dy)).ToList()
        ).ToList();
        return new Drawing(newPaths);
    }

    /// <summary>
    /// Scales the drawing by the given factor around the origin
    /// </summary>
    public Drawing Scale(double factor)
    {
        var newPaths = _paths.Select(path =>
            path.Select(p => new Point(p.X * factor, p.Y * factor)).ToList()
        ).ToList();
        return new Drawing(newPaths);
    }

    /// <summary>
    /// Rotates the drawing by the given angle (in degrees) around the origin
    /// </summary>
    public Drawing Rotate(double degrees)
    {
        var radians = degrees * Math.PI / 180.0;
        var cos = Math.Cos(radians);
        var sin = Math.Sin(radians);

        var newPaths = _paths.Select(path =>
            path.Select(p => new Point(
                p.X * cos - p.Y * sin,
                p.X * sin + p.Y * cos
            )).ToList()
        ).ToList();
        return new Drawing(newPaths);
    }

    /// <summary>
    /// Exports the drawing as SVG
    /// </summary>
    public string ToSvg(double width = 800, double height = 600)
    {
        var bounds = Bounds;
        var drawingWidth = bounds.MaxX - bounds.MinX;
        var drawingHeight = bounds.MaxY - bounds.MinY;

        if (drawingWidth == 0 || drawingHeight == 0)
        {
            return $"<svg width=\"{width}\" height=\"{height}\" xmlns=\"http://www.w3.org/2000/svg\"></svg>";
        }

        var scale = Math.Min(width / drawingWidth, height / drawingHeight) * 0.9;
        var offsetX = (width - drawingWidth * scale) / 2 - bounds.MinX * scale;
        var offsetY = (height - drawingHeight * scale) / 2 - bounds.MinY * scale;

        var svg = new System.Text.StringBuilder();
        svg.AppendLine($"<svg width=\"{width}\" height=\"{height}\" xmlns=\"http://www.w3.org/2000/svg\">");
        svg.AppendLine($"  <g transform=\"translate({offsetX},{offsetY}) scale({scale})\">");

        foreach (var path in _paths)
        {
            if (path.Count < 2) continue;

            svg.Append("    <polyline points=\"");
            foreach (var point in path)
            {
                svg.Append($"{point.X:F2},{point.Y:F2} ");
            }
            svg.AppendLine("\" fill=\"none\" stroke=\"black\" stroke-width=\"0.5\" />");
        }

        svg.AppendLine("  </g>");
        svg.AppendLine("</svg>");

        return svg.ToString();
    }
}
