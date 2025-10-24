using System;
using System.Collections.Generic;
using System.Linq;

namespace Axi.Drawing.Logo;

/// <summary>
/// Represents a Logo value (either a number or a list)
/// </summary>
public abstract record Value
{
    public abstract bool IsNumber { get; }
    public abstract bool IsList { get; }

    public abstract double AsNumber();
    public abstract List<Value> AsList();

    public static implicit operator Value(double d) => new NumberValue(d);
    public static implicit operator Value(int i) => new NumberValue(i);
}

/// <summary>
/// A numeric value
/// </summary>
public record NumberValue(double Value) : Value
{
    public override bool IsNumber => true;
    public override bool IsList => false;

    public override double AsNumber() => Value;
    public override List<Value> AsList() => throw new InvalidOperationException("Cannot convert number to list");

    public override string ToString() => Value.ToString();
}

/// <summary>
/// A list value
/// </summary>
public record ListValue(List<Value> Items) : Value
{
    public override bool IsNumber => false;
    public override bool IsList => true;

    public override double AsNumber() => throw new InvalidOperationException("Cannot convert list to number");
    public override List<Value> AsList() => Items;

    public override string ToString()
    {
        return "[" + string.Join(" ", Items.Select(v => v.ToString())) + "]";
    }
}
