using System;
using System.Collections.Generic;

namespace Axi.Drawing.Logo;

/// <summary>
/// Represents a procedure definition
/// </summary>
public record Procedure(List<string> Parameters, List<AstNode> Body);

/// <summary>
/// Execution context maintaining variables, procedures, and turtle state
/// </summary>
public class ExecutionContext
{
    private readonly Dictionary<string, double> _variables;
    private readonly Dictionary<string, Procedure> _procedures;
    private readonly Stack<Dictionary<string, double>> _scopeStack;

    public Turtle Turtle { get; }

    public ExecutionContext(Turtle turtle)
    {
        Turtle = turtle;
        _variables = new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase);
        _procedures = new Dictionary<string, Procedure>(StringComparer.OrdinalIgnoreCase);
        _scopeStack = new Stack<Dictionary<string, double>>();
    }

    public void SetVariable(string name, double value)
    {
        // Check local scope first
        if (_scopeStack.Count > 0)
        {
            _scopeStack.Peek()[name] = value;
        }
        else
        {
            _variables[name] = value;
        }
    }

    public double GetVariable(string name)
    {
        // Check local scopes (most recent first)
        foreach (var scope in _scopeStack)
        {
            if (scope.TryGetValue(name, out var value))
                return value;
        }

        // Check global scope
        if (_variables.TryGetValue(name, out var globalValue))
            return globalValue;

        throw new InvalidOperationException($"Variable '{name}' is not defined");
    }

    public void DefineProcedure(string name, List<string> parameters, List<AstNode> body)
    {
        _procedures[name] = new Procedure(parameters, body);
    }

    public bool TryGetProcedure(string name, out Procedure? procedure)
    {
        return _procedures.TryGetValue(name, out procedure);
    }

    public void PushScope(Dictionary<string, double> localVariables)
    {
        _scopeStack.Push(localVariables);
    }

    public void PopScope()
    {
        if (_scopeStack.Count > 0)
            _scopeStack.Pop();
    }
}
