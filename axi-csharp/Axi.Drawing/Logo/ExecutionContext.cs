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
    private readonly Dictionary<string, Value> _variables;
    private readonly Dictionary<string, Procedure> _procedures;
    private readonly Stack<Dictionary<string, Value>> _scopeStack;
    private readonly Stack<int> _repeatCountStack; // Stack to track REPCOUNT in nested REPEAT loops

    public Turtle Turtle { get; }

    /// <summary>
    /// Action called when PRINT command outputs a value
    /// </summary>
    public Action<Value>? OnOutput { get; set; }

    public ExecutionContext(Turtle turtle)
    {
        Turtle = turtle;
        _variables = new Dictionary<string, Value>(StringComparer.OrdinalIgnoreCase);
        _procedures = new Dictionary<string, Procedure>(StringComparer.OrdinalIgnoreCase);
        _scopeStack = new Stack<Dictionary<string, Value>>();
        _repeatCountStack = new Stack<int>();
    }

    /// <summary>
    /// Check if we're currently in a local scope (inside a procedure)
    /// </summary>
    public bool IsInLocalScope => _scopeStack.Count > 0;

    public void SetVariable(string name, Value value)
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

    public Value GetVariable(string name)
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

    public void PushScope(Dictionary<string, Value> localVariables)
    {
        _scopeStack.Push(localVariables);
    }

    public void PopScope()
    {
        if (_scopeStack.Count > 0)
            _scopeStack.Pop();
    }

    public void Output(Value value)
    {
        OnOutput?.Invoke(value);
    }

    /// <summary>
    /// Push a repeat count onto the stack (for REPCOUNT query)
    /// </summary>
    public void PushRepeatCount(int count)
    {
        _repeatCountStack.Push(count);
    }

    /// <summary>
    /// Pop the current repeat count from the stack
    /// </summary>
    public void PopRepeatCount()
    {
        if (_repeatCountStack.Count > 0)
            _repeatCountStack.Pop();
    }

    /// <summary>
    /// Get the current repeat count (for REPCOUNT query)
    /// </summary>
    public int GetRepeatCount()
    {
        if (_repeatCountStack.Count == 0)
            throw new InvalidOperationException("REPCOUNT can only be used inside a REPEAT loop");

        return _repeatCountStack.Peek();
    }

    /// <summary>
    /// Check if we're currently inside a REPEAT loop
    /// </summary>
    public bool IsInRepeatLoop => _repeatCountStack.Count > 0;
}
