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

            case ForNode forNode:
                ExecuteFor(forNode);
                break;

            case DoTimesNode doTimesNode:
                ExecuteDoTimes(doTimesNode);
                break;

            case LocalNode localNode:
                ExecuteLocal(localNode);
                break;

            default:
                throw new InvalidOperationException($"Unknown node type: {node.GetType().Name}");
        }
    }

    private Value EvaluateExpression(AstNode node)
    {
        switch (node)
        {
            case NumberNode number:
                return new NumberValue(number.Value);

            case ListNode list:
                // Evaluate each element of the list
                var elements = list.Elements.Select(EvaluateExpression).ToList();
                return new ListValue(elements);

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
                return new NumberValue(0);

            default:
                throw new InvalidOperationException($"Cannot evaluate {node.GetType().Name} as expression");
        }
    }

    private Value EvaluateBinaryOp(BinaryOpNode node)
    {
        var op = node.Operator.ToLower();

        // Higher-order functions (procedure name and list)
        // Note: Need to handle these before evaluating left side, since left is a procedure name, not a value
        if (op is "map" or "filter" or "reduce" or "apply")
        {
            // Get procedure name from left side (should be a variable reference to a word)
            string procName = GetProcedureName(node.Left);
            var rightVal = EvaluateExpression(node.Right);

            return op switch
            {
                "map" => EvaluateMap(procName, rightVal),
                "filter" => EvaluateFilter(procName, rightVal),
                "reduce" => EvaluateReduce(procName, rightVal),
                "apply" => EvaluateApply(procName, rightVal),
                _ => throw new InvalidOperationException($"Unknown higher-order function: {node.Operator}")
            };
        }

        var leftVal = EvaluateExpression(node.Left);
        var rightVal = EvaluateExpression(node.Right);

        // List functions (two arguments)
        if (op is "item" or "fput" or "lput" or "list" or "sentence" or "se" or "member?" or "memberp" or "position")
        {
            return op switch
            {
                "item" => EvaluateItem(leftVal, rightVal),
                "fput" => EvaluateFPut(leftVal, rightVal),
                "lput" => EvaluateLPut(leftVal, rightVal),
                "list" => new ListValue(new List<Value> { leftVal, rightVal }),
                "sentence" or "se" => EvaluateSentence(leftVal, rightVal),
                "member?" or "memberp" => EvaluateMember(leftVal, rightVal),
                "position" => EvaluatePosition(leftVal, rightVal),
                _ => throw new InvalidOperationException($"Unknown list operation: {node.Operator}")
            };
        }

        // Arithmetic and logical operators work on numbers
        if (!leftVal.IsNumber || !rightVal.IsNumber)
        {
            throw new InvalidOperationException($"Operator {node.Operator} requires numeric operands");
        }

        var left = leftVal.AsNumber();
        var right = rightVal.AsNumber();

        var result = op switch
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
            // Power operators
            "power" => Math.Pow(left, right),
            "^" => Math.Pow(left, right),
            _ => throw new InvalidOperationException($"Unknown operator: {node.Operator}")
        };

        return new NumberValue(result);
    }

    private Value EvaluateItem(Value indexVal, Value listVal)
    {
        if (!indexVal.IsNumber)
            throw new InvalidOperationException("ITEM: index must be a number");
        if (!listVal.IsList)
            throw new InvalidOperationException("ITEM: second argument must be a list");

        var list = listVal.AsList();
        var index = (int)indexVal.AsNumber() - 1; // Convert to 0-indexed

        if (index < 0 || index >= list.Count)
            throw new InvalidOperationException($"ITEM: index {index + 1} out of bounds for list of length {list.Count}");

        return list[index];
    }

    private Value EvaluateFPut(Value itemVal, Value listVal)
    {
        if (!listVal.IsList)
            throw new InvalidOperationException("FPUT: second argument must be a list");

        var list = listVal.AsList();
        var newList = new List<Value> { itemVal };
        newList.AddRange(list);

        return new ListValue(newList);
    }

    private Value EvaluateLPut(Value itemVal, Value listVal)
    {
        if (!listVal.IsList)
            throw new InvalidOperationException("LPUT: second argument must be a list");

        var list = listVal.AsList();
        var newList = new List<Value>(list) { itemVal };

        return new ListValue(newList);
    }

    private Value EvaluateSentence(Value val1, Value val2)
    {
        var result = new List<Value>();

        // Flatten first argument
        if (val1.IsList)
            result.AddRange(val1.AsList());
        else
            result.Add(val1);

        // Flatten second argument
        if (val2.IsList)
            result.AddRange(val2.AsList());
        else
            result.Add(val2);

        return new ListValue(result);
    }

    private Value EvaluateMember(Value item, Value listVal)
    {
        if (!listVal.IsList)
            throw new InvalidOperationException("MEMBER? requires a list as second argument");

        var list = listVal.AsList();

        // Check if item is in the list (deep equality)
        foreach (var element in list)
        {
            if (ValuesEqual(element, item))
                return new NumberValue(1); // True
        }

        return new NumberValue(0); // False
    }

    private Value EvaluatePosition(Value item, Value listVal)
    {
        if (!listVal.IsList)
            throw new InvalidOperationException("POSITION requires a list as second argument");

        var list = listVal.AsList();

        // Find index of item in list (1-based)
        for (int i = 0; i < list.Count; i++)
        {
            if (ValuesEqual(list[i], item))
                return new NumberValue(i + 1); // 1-based index
        }

        return new NumberValue(0); // Not found
    }

    // Helper method to compare values for equality (handles nested lists)
    private bool ValuesEqual(Value v1, Value v2)
    {
        if (v1.IsNumber && v2.IsNumber)
            return v1.AsNumber() == v2.AsNumber();

        if (v1.IsList && v2.IsList)
        {
            var list1 = v1.AsList();
            var list2 = v2.AsList();

            if (list1.Count != list2.Count)
                return false;

            for (int i = 0; i < list1.Count; i++)
            {
                if (!ValuesEqual(list1[i], list2[i]))
                    return false;
            }

            return true;
        }

        return false;
    }

    // Helper to extract procedure name from AST node (for higher-order functions)
    private string GetProcedureName(AstNode node)
    {
        // If it's a word/variable node, get its name
        if (node is VariableNode varNode)
            return varNode.Name;

        // If it's evaluated to a word somehow, try to get the string representation
        throw new InvalidOperationException("Higher-order functions require a procedure name as first argument");
    }

    // MAP: Apply procedure to each element of list
    private Value EvaluateMap(string procName, Value listVal)
    {
        if (!listVal.IsList)
            throw new InvalidOperationException("MAP requires a list as second argument");

        if (!_context.TryGetProcedure(procName, out var procedure))
            throw new InvalidOperationException($"MAP: procedure '{procName}' not defined");

        var list = listVal.AsList();
        var result = new List<Value>();

        foreach (var item in list)
        {
            // Create local scope with item as argument
            var localScope = new Dictionary<string, Value>(StringComparer.OrdinalIgnoreCase);
            if (procedure.Parameters.Count > 0)
            {
                localScope[procedure.Parameters[0]] = item;
            }

            _context.PushScope(localScope);
            try
            {
                Value itemResult = new NumberValue(0);
                foreach (var statement in procedure.Body)
                {
                    Execute(statement);
                }
                // If procedure didn't OUTPUT, result is 0
                result.Add(itemResult);
            }
            catch (OutputException ex)
            {
                result.Add(ex.Value);
            }
            finally
            {
                _context.PopScope();
            }
        }

        return new ListValue(result);
    }

    // FILTER: Keep only elements where predicate returns true
    private Value EvaluateFilter(string procName, Value listVal)
    {
        if (!listVal.IsList)
            throw new InvalidOperationException("FILTER requires a list as second argument");

        if (!_context.TryGetProcedure(procName, out var procedure))
            throw new InvalidOperationException($"FILTER: procedure '{procName}' not defined");

        var list = listVal.AsList();
        var result = new List<Value>();

        foreach (var item in list)
        {
            // Create local scope with item as argument
            var localScope = new Dictionary<string, Value>(StringComparer.OrdinalIgnoreCase);
            if (procedure.Parameters.Count > 0)
            {
                localScope[procedure.Parameters[0]] = item;
            }

            _context.PushScope(localScope);
            bool keep = false;
            try
            {
                foreach (var statement in procedure.Body)
                {
                    Execute(statement);
                }
                // If procedure didn't OUTPUT, default is 0 (false)
            }
            catch (OutputException ex)
            {
                keep = ex.Value.IsNumber && ex.Value.AsNumber() != 0;
            }
            finally
            {
                _context.PopScope();
            }

            if (keep)
            {
                result.Add(item);
            }
        }

        return new ListValue(result);
    }

    // REDUCE: Reduce list to single value using binary operation
    private Value EvaluateReduce(string procName, Value listVal)
    {
        if (!listVal.IsList)
            throw new InvalidOperationException("REDUCE requires a list as second argument");

        var list = listVal.AsList();
        if (list.Count == 0)
            throw new InvalidOperationException("REDUCE requires a non-empty list");

        if (!_context.TryGetProcedure(procName, out var procedure))
            throw new InvalidOperationException($"REDUCE: procedure '{procName}' not defined");

        if (procedure.Parameters.Count < 2)
            throw new InvalidOperationException("REDUCE: procedure must take 2 parameters");

        Value accumulator = list[0];
        for (int i = 1; i < list.Count; i++)
        {
            // Create local scope with accumulator and current item
            var localScope = new Dictionary<string, Value>(StringComparer.OrdinalIgnoreCase);
            localScope[procedure.Parameters[0]] = accumulator;
            localScope[procedure.Parameters[1]] = list[i];

            _context.PushScope(localScope);
            try
            {
                foreach (var statement in procedure.Body)
                {
                    Execute(statement);
                }
                // If procedure didn't OUTPUT, accumulator stays the same
            }
            catch (OutputException ex)
            {
                accumulator = ex.Value;
            }
            finally
            {
                _context.PopScope();
            }
        }

        return accumulator;
    }

    // APPLY: Call procedure with list of arguments
    private Value EvaluateApply(string procName, Value argsListVal)
    {
        if (!argsListVal.IsList)
            throw new InvalidOperationException("APPLY requires a list as second argument");

        var argsList = argsListVal.AsList();

        if (!_context.TryGetProcedure(procName, out var procedure))
            throw new InvalidOperationException($"APPLY: procedure '{procName}' not defined");

        if (procedure.Parameters.Count != argsList.Count)
            throw new InvalidOperationException(
                $"APPLY: procedure '{procName}' expects {procedure.Parameters.Count} arguments but got {argsList.Count}");

        // Create local scope with arguments bound to parameters
        var localScope = new Dictionary<string, Value>(StringComparer.OrdinalIgnoreCase);
        for (int i = 0; i < procedure.Parameters.Count; i++)
        {
            localScope[procedure.Parameters[i]] = argsList[i];
        }

        _context.PushScope(localScope);
        Value result = new NumberValue(0);
        try
        {
            foreach (var statement in procedure.Body)
            {
                Execute(statement);
            }
            // If procedure didn't OUTPUT, result is 0
        }
        catch (OutputException ex)
        {
            result = ex.Value;
        }
        finally
        {
            _context.PopScope();
        }

        return result;
    }

    private Value EvaluateUnaryOp(UnaryOpNode node)
    {
        var val = EvaluateExpression(node.Operand);

        if (!val.IsNumber)
        {
            throw new InvalidOperationException($"Unary operator {node.Operator} requires numeric operand");
        }

        var value = val.AsNumber();

        var result = node.Operator switch
        {
            "-" => -value,
            "+" => value,
            "not" => value != 0 ? 0 : 1,
            _ => throw new InvalidOperationException($"Unknown unary operator: {node.Operator}")
        };

        return new NumberValue(result);
    }

    private Value EvaluateFunctionCall(FunctionCallNode node)
    {
        var argVal = EvaluateExpression(node.Argument);
        var funcName = node.FunctionName.ToLower();

        // List functions
        if (funcName is "first" or "last" or "butfirst" or "bf" or "butlast" or "bl" or "count" or "empty?" or "emptyp")
        {
            if (!argVal.IsList)
            {
                throw new InvalidOperationException($"Function {node.FunctionName} requires a list argument");
            }

            var list = argVal.AsList();

            return funcName switch
            {
                "first" => list.Count > 0 ? list[0] : throw new InvalidOperationException("FIRST: list is empty"),
                "last" => list.Count > 0 ? list[^1] : throw new InvalidOperationException("LAST: list is empty"),
                "butfirst" or "bf" => new ListValue(list.Skip(1).ToList()),
                "butlast" or "bl" => new ListValue(list.Take(list.Count - 1).ToList()),
                "count" => new NumberValue(list.Count),
                "empty?" or "emptyp" => new NumberValue(list.Count == 0 ? 1 : 0),
                _ => throw new InvalidOperationException($"Unknown list function: {node.FunctionName}")
            };
        }

        // Math functions require numeric argument
        if (!argVal.IsNumber)
        {
            throw new InvalidOperationException($"Function {node.FunctionName} requires numeric argument");
        }

        var arg = argVal.AsNumber();

        var result = funcName switch
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

        return new NumberValue(result);
    }

    private Value EvaluateQuery(QueryNode node)
    {
        var turtle = _context.Turtle;
        var queryName = node.QueryName.ToLower();

        // PENCOLOR returns a list [r g b]
        if (queryName == "pencolor")
        {
            var (r, g, b) = turtle.PenColor;
            var colorList = new List<Value>
            {
                new NumberValue(r),
                new NumberValue(g),
                new NumberValue(b)
            };
            return new ListValue(colorList);
        }

        // Other queries return numbers
        var result = queryName switch
        {
            "xcor" => turtle.X,
            "ycor" => turtle.Y,
            "heading" => turtle.Heading,
            "pendown?" or "pendownp" => turtle.PenDown ? 1 : 0,
            "pensize" => turtle.PenSize,
            "repcount" => _context.GetRepeatCount(),
            _ => throw new InvalidOperationException($"Unknown query function: {node.QueryName}")
        };

        return new NumberValue(result);
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
                    turtle.Forward(EvaluateExpression(command.Arguments[0]).AsNumber());
                break;

            case "backward":
            case "bk":
            case "back":
                if (command.Arguments.Count > 0)
                    turtle.Backward(EvaluateExpression(command.Arguments[0]).AsNumber());
                break;

            case "right":
            case "rt":
                if (command.Arguments.Count > 0)
                    turtle.Right(EvaluateExpression(command.Arguments[0]).AsNumber());
                break;

            case "left":
            case "lt":
                if (command.Arguments.Count > 0)
                    turtle.Left(EvaluateExpression(command.Arguments[0]).AsNumber());
                break;

            case "setheading":
            case "seth":
                if (command.Arguments.Count > 0)
                    turtle.SetHeading(EvaluateExpression(command.Arguments[0]).AsNumber());
                break;

            case "penup":
            case "pu":
                turtle.PenUp();
                break;

            case "pendown":
            case "pd":
                turtle.PenDown();
                break;

            case "setpensize":
            case "pensize":
                if (command.Arguments.Count > 0)
                    turtle.SetPenSize(EvaluateExpression(command.Arguments[0]).AsNumber());
                break;

            case "setpencolor":
            case "setpc":
                // SETPENCOLOR takes 1 arg (palette index 0-15)
                if (command.Arguments.Count > 0)
                {
                    var index = (int)Math.Floor(EvaluateExpression(command.Arguments[0]).AsNumber());
                    turtle.SetPenColorFromPalette(index);
                }
                break;

            case "setpenrgb":
                // SETPENRGB takes 3 args (r g b, 0-255 each)
                if (command.Arguments.Count >= 3)
                {
                    var r = EvaluateExpression(command.Arguments[0]).AsNumber();
                    var g = EvaluateExpression(command.Arguments[1]).AsNumber();
                    var b = EvaluateExpression(command.Arguments[2]).AsNumber();
                    turtle.SetPenColor(r, g, b);
                }
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
        var count = (int)EvaluateExpression(repeat.Count).AsNumber();

        for (int i = 0; i < count; i++)
        {
            // Push current iteration (1-indexed) for REPCOUNT
            _context.PushRepeatCount(i + 1);
            try
            {
                foreach (var statement in repeat.Body)
                {
                    Execute(statement);
                }
            }
            finally
            {
                _context.PopRepeatCount();
            }
        }
    }

    private void ExecuteIf(IfNode ifNode)
    {
        var condition = EvaluateExpression(ifNode.Condition).AsNumber();

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
        var condition = EvaluateExpression(ifElseNode.Condition).AsNumber();

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
        var localScope = new Dictionary<string, Value>(StringComparer.OrdinalIgnoreCase);
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

    private Value EvaluateProcedureCall(string name, Procedure procedure, List<AstNode> arguments)
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
        var localScope = new Dictionary<string, Value>(StringComparer.OrdinalIgnoreCase);
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
            return new NumberValue(0);
        }
        catch (OutputException ex)
        {
            // Procedure used OUTPUT, return the value
            return ex.Value;
        }
        catch (StopException)
        {
            // Procedure used STOP, return 0
            return new NumberValue(0);
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
            var condition = EvaluateExpression(whileNode.Condition).AsNumber();

            // In Logo, non-zero values are considered true
            if (condition == 0)
                break;

            foreach (var statement in whileNode.Body)
            {
                Execute(statement);
            }
        }
    }

    private void ExecuteFor(ForNode forNode)
    {
        var start = EvaluateExpression(forNode.Start).AsNumber();
        var end = EvaluateExpression(forNode.End).AsNumber();

        // Determine increment: if not specified, use 1 for ascending, -1 for descending
        double increment;
        if (forNode.Increment != null)
        {
            increment = EvaluateExpression(forNode.Increment).AsNumber();
            if (increment == 0)
                throw new InvalidOperationException("FOR loop increment cannot be zero");
        }
        else
        {
            increment = start <= end ? 1 : -1;
        }

        // Execute the loop
        if (increment > 0)
        {
            for (double i = start; i <= end; i += increment)
            {
                _context.SetVariable(forNode.Variable, new NumberValue(i));

                foreach (var statement in forNode.Body)
                {
                    Execute(statement);
                }
            }
        }
        else
        {
            for (double i = start; i >= end; i += increment)
            {
                _context.SetVariable(forNode.Variable, new NumberValue(i));

                foreach (var statement in forNode.Body)
                {
                    Execute(statement);
                }
            }
        }
    }

    private void ExecuteDoTimes(DoTimesNode doTimesNode)
    {
        var count = EvaluateExpression(doTimesNode.Count).AsNumber();

        // Execute the DOTIMES loop (1 to count)
        for (double i = 1; i <= Math.Floor(count); i++)
        {
            _context.SetVariable(doTimesNode.Variable, new NumberValue(i));

            foreach (var statement in doTimesNode.Body)
            {
                Execute(statement);
            }
        }
    }

    private void ExecuteLocal(LocalNode localNode)
    {
        // LOCAL can only be used inside a procedure (when there's at least one scope on the stack)
        if (!_context.IsInLocalScope)
        {
            throw new InvalidOperationException("LOCAL can only be used inside a procedure");
        }

        // Add each variable to the current local scope (initialized to 0)
        foreach (var varName in localNode.Variables)
        {
            _context.SetVariable(varName, new NumberValue(0));
        }
    }
}
