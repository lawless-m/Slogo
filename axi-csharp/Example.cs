using Axi.Drawing;
using System;
using System.IO;

namespace Axi.Examples;

/// <summary>
/// Example programs demonstrating the Axi.Drawing library
/// </summary>
public class Examples
{
    /// <summary>
    /// Draw a simple box
    /// </summary>
    public static void DrawBox()
    {
        var turtle = new Turtle();
        turtle.Box(100, 50);

        var drawing = turtle.GetDrawing();
        var svg = drawing.ToSvg();
        File.WriteAllText("box.svg", svg);

        Console.WriteLine("Created box.svg");
    }

    /// <summary>
    /// Draw a square spiral
    /// </summary>
    public static void DrawSpiral()
    {
        var turtle = new Turtle();

        for (int i = 0; i < 36; i++)
        {
            turtle.Forward(i * 5);
            turtle.Right(90);
        }

        var drawing = turtle.GetDrawing();
        var svg = drawing.ToSvg();
        File.WriteAllText("spiral.svg", svg);

        Console.WriteLine("Created spiral.svg");
    }

    /// <summary>
    /// Draw a flower pattern
    /// </summary>
    public static void DrawFlower()
    {
        var turtle = new Turtle();

        for (int i = 0; i < 12; i++)
        {
            turtle.Circle(50, 36);
            turtle.Right(30);
        }

        var drawing = turtle.GetDrawing();
        var svg = drawing.ToSvg();
        File.WriteAllText("flower.svg", svg);

        Console.WriteLine("Created flower.svg");
    }

    /// <summary>
    /// Draw a star
    /// </summary>
    public static void DrawStar()
    {
        var turtle = new Turtle();

        for (int i = 0; i < 5; i++)
        {
            turtle.Forward(100);
            turtle.Right(144);
        }

        var drawing = turtle.GetDrawing();
        var svg = drawing.ToSvg();
        File.WriteAllText("star.svg", svg);

        Console.WriteLine("Created star.svg");
    }

    /// <summary>
    /// Draw a house
    /// </summary>
    public static void DrawHouse()
    {
        var turtle = new Turtle();

        // Base
        turtle.Box(100, 100);

        // Roof
        turtle.PenUp();
        turtle.Forward(100);
        turtle.Right(90);
        turtle.Forward(100);
        turtle.Left(90);
        turtle.PenDown();

        turtle.Forward(50);
        turtle.Left(120);
        turtle.Forward(58);
        turtle.Left(120);
        turtle.Forward(58);

        var drawing = turtle.GetDrawing();
        var svg = drawing.ToSvg();
        File.WriteAllText("house.svg", svg);

        Console.WriteLine("Created house.svg");
    }

    public static void Main(string[] args)
    {
        Console.WriteLine("Axi.Drawing Examples");
        Console.WriteLine("====================\n");

        DrawBox();
        DrawSpiral();
        DrawFlower();
        DrawStar();
        DrawHouse();

        Console.WriteLine("\nAll examples completed!");
    }
}
