using System;

namespace Axi.Drawing.Logo;

/// <summary>
/// Exception thrown when OUTPUT command is executed in a procedure
/// Used to immediately return a value from the procedure
/// </summary>
public class OutputException : Exception
{
    public Value Value { get; }

    public OutputException(Value value) : base("OUTPUT")
    {
        Value = value;
    }
}
