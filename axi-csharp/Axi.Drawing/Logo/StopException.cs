using System;

namespace Axi.Drawing.Logo;

/// <summary>
/// Exception thrown when STOP command is executed in a procedure
/// Used to immediately exit from the procedure without returning a value
/// </summary>
public class StopException : Exception
{
    public StopException() : base("STOP")
    {
    }
}
