using System;

namespace Axi.Drawing.Logo;

/// <summary>
/// Exception thrown when OUTPUT command is executed in a procedure
/// Used to immediately return a value from the procedure
/// </summary>
public class OutputException : Exception
{
    public double Value { get; }

    public OutputException(double value) : base("OUTPUT")
    {
        Value = value;
    }
}
