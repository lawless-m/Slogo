using System;
using System.Collections.Generic;
using System.Linq;

namespace Axi.Drawing.Logo;

/// <summary>
/// Interprets and executes Logo AST nodes
/// </summary>
public class Interpreter
{
    private readonly ExecutionContext _context;

    public Interpreter(ExecutionContext context)
    {
        _context = context;
    }

    public void Execute(AstNode node)
    {
        switch (node)
        {
            case ProgramNode program:
                foreach (var statement in program.Statements)
                    Execute(statement);
                break;

            case CommandNode command:
                ExecuteCommand(command);
                break;

            case RepeatNode repeat:
                ExecuteRepeat(repeat);
                break;

            case IfNode ifNode:
                ExecuteIf(ifNode);
                break;

            case IfElseNode ifElseNode:
                ExecuteIfElse(ifElseNode);
                break;

            case ProcedureDefNode procDef:
                ExecuteProcedureDef(procDef);
                break;

            case MakeNode make:
                ExecuteMake(make);
                break;

            case OutputNode output:
                ExecuteOutput(output);
                break;

            case StopNode stop:
                ExecuteStop(stop);
                break;

            case PrintNode print:
                ExecutePrint(print);
                break;

            case WhileNode whileNode:
                ExecuteWhile(whileNode);
                break;

            default:
                throw new InvalidOperationException($"Unknown node type: {node.GetType().Name}");
        }
    }

    private double EvaluateExpression(AstNode node)
    {
        switch (node)
        {
            case NumberNode number:
                return number.Value;

            case VariableNode variable:
                return _context.GetVariable(variable.Name);

            case BinaryOpNode binaryOp:
                return EvaluateBinaryOp(binaryOp);

            case UnaryOpNode unaryOp:
                return EvaluateUnaryOp(unaryOp);

            case FunctionCallNode funcCall:
                return EvaluateFunctionCall(funcCall);

            case QueryNode query:
                return EvaluateQuery(query);

            case CommandNode command:
                // Check if it's a procedure call that might return a value
                if (_context.TryGetProcedure(command.Name, out var procedure))
                {
                    return EvaluateProcedureCall(command.Name, procedure!, command.Arguments);
                }
                // Otherwise it's a regular command, execute it and return 0
                ExecuteCommand(command);
                return 0;

            default:
                throw new InvalidOperationException($"Cannot evaluate {node.GetType().Name} as expression");
        }
    }

    private double EvaluateBinaryOp(BinaryOpNode node)
    {
        var left = EvaluateExpression(node.Left);
        var right = EvaluateExpression(node.Right);

        return node.Operator.ToLower() switch
        {
            "+" => left + right,
            "-" => left - right,
            "*" => left * right,
            "/" => right != 0 ? left / right : throw new InvalidOperationException("Division by zero"),
            "mod" => left % right,
            // Comparison operators (return 1 for true, 0 for false)
            "<" => left < right ? 1 : 0,
            ">" => left > right ? 1 : 0,
            "=" => Math.Abs(left - right) < 0.0001 ? 1 : 0,
            "<=" => left <= right ? 1 : 0,
            ">=" => left >= right ? 1 : 0,
            "<>" => Math.Abs(left - right) >= 0.0001 ? 1 : 0,
            // Logical operators
            "and" => (left != 0 && right != 0) ? 1 : 0,
            "or" => (left != 0 || right != 0) ? 1 : 0,
            // Power operator
            "power" => Math.Pow(left, right),
            _ => throw new InvalidOperationException($"Unknown operator: {node.Operator}")
        };
    }

    private double EvaluateUnaryOp(UnaryOpNode node)
    {
        var value = EvaluateExpression(node.Operand);

        return node.Operator switch
        {
            "-" => -value,
            "+" => value,
            "not" => value != 0 ? 0 : 1,
            _ => throw new InvalidOperationException($"Unknown unary operator: {node.Operator}")
        };
    }

    private double EvaluateFunctionCall(FunctionCallNode node)
    {
        var arg = EvaluateExpression(node.Argument);
        var funcName = node.FunctionName.ToLower();

        return funcName switch
        {
            "sqrt" => Math.Sqrt(arg),
            "sin" => Math.Sin(arg * Math.PI / 180.0), // Convert degrees to radians
            "cos" => Math.Cos(arg * Math.PI / 180.0),
            "tan" => Math.Tan(arg * Math.PI / 180.0),
            "abs" => Math.Abs(arg),
            "round" => Math.Round(arg),
            "floor" => Math.Floor(arg),
            "ceiling" => Math.Ceiling(arg),
            "random" => Math.Floor(new Random().NextDouble() * arg),
            _ => throw new InvalidOperationException($"Unknown function: {node.FunctionName}")
        };
    }

    private double EvaluateQuery(QueryNode node)
    {
        var turtle = _context.Turtle;
        var queryName = node.QueryName.ToLower();

        return queryName switch
        {
            "xcor" => turtle.X,
            "ycor" => turtle.Y,
            "heading" => turtle.Heading,
            "pendown?" or "pendownp" => turtle.PenDown ? 1 : 0,
            "pensize" => turtle.PenSize,
            _ => throw new InvalidOperationException($"Unknown query function: {node.QueryName}")
        };
    }

    private void ExecuteCommand(CommandNode command)
    {
        var turtle = _context.Turtle;

        // Check if it's a user-defined procedure
        if (_context.TryGetProcedure(command.Name, out var procedure))
        {
            ExecuteProcedureCall(command.Name, procedure!, command.Arguments);
            return;
        }

        // Built-in commands
        switch (command.Name.ToLower())
        {
            case "forward":
            case "fd":
                if (command.Arguments.Count > 0)
                    turtle.Forward(EvaluateExpression(command.Arguments[0]));
                break;

            case "backward":
            case "bk":
            case "back":
                if (command.Arguments.Count > 0)
                    turtle.Backward(EvaluateExpression(command.Arguments[0]));
                break;

            case "right":
            case "rt":
                if (command.Arguments.Count > 0)
                    turtle.Right(EvaluateExpression(command.Arguments[0]));
                break;

            case "left":
            case "lt":
                if (command.Arguments.Count > 0)
                    turtle.Left(EvaluateExpression(command.Arguments[0]));
                break;

            case "setheading":
            case "seth":
                if (command.Arguments.Count > 0)
                    turtle.SetHeading(EvaluateExpression(command.Arguments[0]));
                break;

            case "penup":
            case "pu":
                turtle.PenUp();
                break;

            case "pendown":
            case "pd":
                turtle.PenDown();
                break;

            case "home":
                turtle.Home();
                break;

            case "clear":
                turtle.Clear();
                break;

            case "box":
                if (command.Arguments.Count >= 2)
                {
                    var width = EvaluateExpression(command.Arguments[0]);
                    var height = EvaluateExpression(command.Arguments[1]);
                    turtle.Box(width, height);
                }
                break;

            case "square":
                if (command.Arguments.Count > 0)
                {
                    var size = EvaluateExpression(command.Arguments[0]);
                    turtle.Square(size);
                }
                break;

            case "circle":
                if (command.Arguments.Count > 0)
                {
                    var radius = EvaluateExpression(command.Arguments[0]);
                    turtle.Circle(radius);
                }
                break;

            case "setxy":
                if (command.Arguments.Count >= 2)
                {
                    var x = EvaluateExpression(command.Arguments[0]);
                    var y = EvaluateExpression(command.Arguments[1]);
                    turtle.SetXY(x, y);
                }
                break;

            case "setx":
                if (command.Arguments.Count > 0)
                {
                    var x = EvaluateExpression(command.Arguments[0]);
                    turtle.SetX(x);
                }
                break;

            case "sety":
                if (command.Arguments.Count > 0)
                {
                    var y = EvaluateExpression(command.Arguments[0]);
                    turtle.SetY(y);
                }
                break;

            default:
                throw new InvalidOperationException($"Unknown command: {command.Name}");
        }
    }

    private void ExecuteRepeat(RepeatNode repeat)
    {
        var count = (int)EvaluateExpression(repeat.Count);

        for (int i = 0; i < count; i++)
        {
            foreach (var statement in repeat.Body)
            {
                Execute(statement);
            }
        }
    }

    private void ExecuteIf(IfNode ifNode)
    {
        var condition = EvaluateExpression(ifNode.Condition);

        // In Logo, non-zero values are considered true
        if (condition != 0)
        {
            foreach (var statement in ifNode.TrueBlock)
            {
                Execute(statement);
            }
        }
    }

    private void ExecuteIfElse(IfElseNode ifElseNode)
    {
        var condition = EvaluateExpression(ifElseNode.Condition);

        // In Logo, non-zero values are considered true
        if (condition != 0)
        {
            foreach (var statement in ifElseNode.TrueBlock)
            {
                Execute(statement);
            }
        }
        else
        {
            foreach (var statement in ifElseNode.FalseBlock)
            {
                Execute(statement);
            }
        }
    }

    private void ExecuteProcedureDef(ProcedureDefNode procDef)
    {
        _context.DefineProcedure(procDef.Name, procDef.Parameters, procDef.Body);
    }

    private void ExecuteProcedureCall(string name, Procedure procedure, List<AstNode> arguments)
    {
        // Evaluate arguments
        var argValues = arguments.Select(EvaluateExpression).ToList();

        // Check parameter count
        if (argValues.Count != procedure.Parameters.Count)
        {
            throw new InvalidOperationException(
                $"Procedure '{name}' expects {procedure.Parameters.Count} arguments but got {argValues.Count}");
        }

        // Create local scope with parameter bindings
        var localScope = new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase);
        for (int i = 0; i < procedure.Parameters.Count; i++)
        {
            localScope[procedure.Parameters[i]] = argValues[i];
        }

        // Push scope and execute body
        _context.PushScope(localScope);
        try
        {
            foreach (var statement in procedure.Body)
            {
                Execute(statement);
            }
        }
        catch (OutputException)
        {
            // If procedure uses OUTPUT, rethrow it to be handled by caller
            throw;
        }
        catch (StopException)
        {
            // If procedure uses STOP, exit gracefully (don't rethrow)
        }
        finally
        {
            _context.PopScope();
        }
    }

    private double EvaluateProcedureCall(string name, Procedure procedure, List<AstNode> arguments)
    {
        // Evaluate arguments
        var argValues = arguments.Select(EvaluateExpression).ToList();

        // Check parameter count
        if (argValues.Count != procedure.Parameters.Count)
        {
            throw new InvalidOperationException(
                $"Procedure '{name}' expects {procedure.Parameters.Count} arguments but got {argValues.Count}");
        }

        // Create local scope with parameter bindings
        var localScope = new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase);
        for (int i = 0; i < procedure.Parameters.Count; i++)
        {
            localScope[procedure.Parameters[i]] = argValues[i];
        }

        // Push scope and execute body
        _context.PushScope(localScope);
        try
        {
            foreach (var statement in procedure.Body)
            {
                Execute(statement);
            }
            // If no OUTPUT was called, return 0
            return 0;
        }
        catch (OutputException ex)
        {
            // Procedure used OUTPUT, return the value
            return ex.Value;
        }
        catch (StopException)
        {
            // Procedure used STOP, return 0
            return 0;
        }
        finally
        {
            _context.PopScope();
        }
    }

    private void ExecuteMake(MakeNode make)
    {
        var value = EvaluateExpression(make.Value);
        _context.SetVariable(make.VariableName, value);
    }

    private void ExecuteOutput(OutputNode output)
    {
        var value = EvaluateExpression(output.Value);
        throw new OutputException(value);
    }

    private void ExecuteStop(StopNode stop)
    {
        throw new StopException();
    }

    private void ExecutePrint(PrintNode print)
    {
        var value = EvaluateExpression(print.Value);
        _context.Output(value);
    }

    private void ExecuteWhile(WhileNode whileNode)
    {
        while (true)
        {
            var condition = EvaluateExpression(whileNode.Condition);

            // In Logo, non-zero values are considered true
            if (condition == 0)
                break;

            foreach (var statement in whileNode.Body)
            {
                Execute(statement);
            }
        }
    }
}
