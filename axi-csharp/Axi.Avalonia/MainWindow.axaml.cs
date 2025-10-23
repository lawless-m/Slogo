using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Interactivity;
using Avalonia.Media;
using System;
using System.Collections.Generic;
using System.Linq;
using Axi.Drawing;
using Axi.Drawing.Logo;

namespace Axi.Avalonia;

public partial class MainWindow : Window
{
    private readonly LogoRunner _logoRunner;
    private readonly Turtle _turtle;
    private Canvas? _canvas;
    private TextBox? _commandInput;
    private TextBlock? _statusText;

    public MainWindow()
    {
        InitializeComponent();
        _turtle = new Turtle();
        _logoRunner = new LogoRunner(_turtle);

        _canvas = this.FindControl<Canvas>("DrawingCanvas");
        _commandInput = this.FindControl<TextBox>("CommandInput");
        _statusText = this.FindControl<TextBlock>("StatusText");

        var runButton = this.FindControl<Button>("RunButton");
        var clearButton = this.FindControl<Button>("ClearButton");

        if (runButton != null)
            runButton.Click += RunButton_Click;

        if (clearButton != null)
            clearButton.Click += ClearButton_Click;

        if (_commandInput != null)
            _commandInput.KeyDown += CommandInput_KeyDown;

        // Center the turtle
        _turtle.SetXY(0, 0);
        UpdateCanvas();
    }

    private void CommandInput_KeyDown(object? sender, KeyEventArgs e)
    {
        if (e.Key == Key.Enter)
        {
            RunCommand();
        }
    }

    private void RunButton_Click(object? sender, RoutedEventArgs e)
    {
        RunCommand();
    }

    private void ClearButton_Click(object? sender, RoutedEventArgs e)
    {
        _turtle.Clear();
        UpdateCanvas();
        UpdateStatus("Drawing cleared");
    }

    private void RunCommand()
    {
        if (_commandInput == null) return;

        var commandText = _commandInput.Text?.Trim();
        if (string.IsNullOrEmpty(commandText))
        {
            UpdateStatus("Please enter a command");
            return;
        }

        try
        {
            _logoRunner.Run(commandText);
            UpdateCanvas();
            UpdateStatus($"Executed: {commandText}");
            _commandInput.Text = "";
        }
        catch (Exception ex)
        {
            UpdateStatus($"Error: {ex.Message}");
        }
    }

    private void UpdateCanvas()
    {
        if (_canvas == null) return;

        _canvas.Children.Clear();

        var drawing = _turtle.GetDrawing();
        var bounds = drawing.Bounds;

        var canvasWidth = _canvas.Bounds.Width;
        var canvasHeight = _canvas.Bounds.Height;

        if (canvasWidth <= 0 || canvasHeight <= 0)
        {
            canvasWidth = 800;
            canvasHeight = 600;
        }

        // Calculate scale and offset to center the drawing
        var drawingWidth = Math.Max(bounds.MaxX - bounds.MinX, 100);
        var drawingHeight = Math.Max(bounds.MaxY - bounds.MinY, 100);

        var scale = Math.Min(canvasWidth / drawingWidth, canvasHeight / drawingHeight) * 0.8;
        var offsetX = canvasWidth / 2;
        var offsetY = canvasHeight / 2;

        // Draw each path
        foreach (var path in drawing.Paths)
        {
            if (path.Count < 2) continue;

            var polyline = new Avalonia.Controls.Shapes.Polyline
            {
                Stroke = Brushes.Black,
                StrokeThickness = 2
            };

            var points = new List<Avalonia.Point>();
            foreach (var point in path)
            {
                var x = offsetX + point.X * scale;
                var y = offsetY - point.Y * scale; // Flip Y axis
                points.Add(new Avalonia.Point(x, y));
            }

            polyline.Points = points;
            _canvas.Children.Add(polyline);
        }

        // Draw turtle position and heading
        var turtleX = offsetX + _turtle.Position.X * scale;
        var turtleY = offsetY - _turtle.Position.Y * scale;

        // Turtle body (circle)
        var turtleBody = new Avalonia.Controls.Shapes.Ellipse
        {
            Width = 10,
            Height = 10,
            Fill = _turtle.IsPenDown ? Brushes.Red : Brushes.Green,
            Stroke = Brushes.Black,
            StrokeThickness = 1
        };
        Canvas.SetLeft(turtleBody, turtleX - 5);
        Canvas.SetTop(turtleBody, turtleY - 5);
        _canvas.Children.Add(turtleBody);

        // Turtle heading (line)
        var headingLength = 15;
        var radians = _turtle.Heading * Math.PI / 180.0;
        var headingEndX = turtleX + Math.Cos(radians) * headingLength;
        var headingEndY = turtleY - Math.Sin(radians) * headingLength;

        var headingLine = new Avalonia.Controls.Shapes.Line
        {
            StartPoint = new Avalonia.Point(turtleX, turtleY),
            EndPoint = new Avalonia.Point(headingEndX, headingEndY),
            Stroke = Brushes.Black,
            StrokeThickness = 2
        };
        _canvas.Children.Add(headingLine);
    }

    private void UpdateStatus(string message)
    {
        if (_statusText != null)
            _statusText.Text = message;
    }
}
