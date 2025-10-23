using System;
using System.Collections.Generic;

namespace Axi.Drawing.Logo;

/// <summary>
/// High-level interface for running Logo programs
/// </summary>
public class LogoRunner
{
    private readonly Turtle _turtle;
    private readonly ExecutionContext _context;
    private readonly Interpreter _interpreter;

    public LogoRunner(Turtle turtle)
    {
        _turtle = turtle;
        _context = new ExecutionContext(turtle);
        _interpreter = new Interpreter(_context);
    }

    public Turtle Turtle => _turtle;

    /// <summary>
    /// Executes a Logo program
    /// </summary>
    public void Run(string program)
    {
        try
        {
            // Tokenize
            var tokenizer = new Tokenizer(program);
            var tokens = tokenizer.Tokenize();

            // Parse
            var parser = new Parser(tokens);
            var ast = parser.Parse();

            // Execute
            _interpreter.Execute(ast);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Error executing Logo program: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Clears all procedures and variables
    /// </summary>
    public void Reset()
    {
        _turtle.Clear();
        // Create a new context to clear procedures and variables
        var newContext = new ExecutionContext(_turtle);
        typeof(LogoRunner)
            .GetField("_context", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?
            .SetValue(this, newContext);
    }
}
