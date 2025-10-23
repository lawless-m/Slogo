using System;
using System.Collections.Generic;
using System.Linq;

namespace Axi.Drawing.Logo;

/// <summary>
/// Parses Logo tokens into an Abstract Syntax Tree
/// </summary>
public class Parser
{
    private readonly List<Token> _tokens;
    private int _position;

    public Parser(List<Token> tokens)
    {
        _tokens = tokens;
        _position = 0;
    }

    private Token Current => _position < _tokens.Count ? _tokens[_position] : _tokens[^1];
    private Token Peek(int offset = 1) => _position + offset < _tokens.Count ? _tokens[_position + offset] : _tokens[^1];

    private Token Consume(TokenType? expectedType = null)
    {
        if (_position >= _tokens.Count)
            throw new InvalidOperationException("Unexpected end of input");

        var token = Current;

        if (expectedType.HasValue && token.Type != expectedType.Value)
            throw new InvalidOperationException($"Expected {expectedType.Value} but got {token.Type} at position {token.Position}");

        _position++;
        return token;
    }

    private bool Check(TokenType type) => Current.Type == type;

    private bool Match(params TokenType[] types) => types.Any(t => Check(t));

    public ProgramNode Parse()
    {
        var statements = new List<AstNode>();

        while (!Check(TokenType.End))
        {
            var stmt = ParseStatement();
            if (stmt != null)
                statements.Add(stmt);
        }

        return new ProgramNode(statements);
    }

    private AstNode? ParseStatement()
    {
        if (Check(TokenType.End) || Check(TokenType.RightBracket))
            return null;

        // Procedure definition: to name ...
        if (Check(TokenType.Word) && Current.Value.ToLower() == "to")
        {
            return ParseProcedureDef();
        }

        // Repeat loop: repeat N [ ... ]
        if (Check(TokenType.Word) && Current.Value.ToLower() == "repeat")
        {
            return ParseRepeat();
        }

        // IF conditional: if condition [ ... ]
        if (Check(TokenType.Word) && Current.Value.ToLower() == "if")
        {
            return ParseIf();
        }

        // IFELSE conditional: ifelse condition [ ... ] [ ... ]
        if (Check(TokenType.Word) && Current.Value.ToLower() == "ifelse")
        {
            return ParseIfElse();
        }

        // Variable assignment: make "varname value
        if (Check(TokenType.Word) && Current.Value.ToLower() == "make")
        {
            return ParseMake();
        }

        // Otherwise, it's a command
        return ParseCommand();
    }

    private AstNode ParseProcedureDef()
    {
        Consume(); // consume 'to'

        var nameToken = Consume(TokenType.Word);
        var name = nameToken.Value;

        var parameters = new List<string>();

        // Read parameters (e.g., :size :color)
        while (Check(TokenType.Colon))
        {
            Consume(); // consume ':'
            var paramToken = Consume(TokenType.Word);
            parameters.Add(paramToken.Value);
        }

        // Read body [ ... ] or until 'end'
        List<AstNode> body;

        if (Check(TokenType.LeftBracket))
        {
            Consume(); // consume '['
            body = ParseBlock();
            Consume(TokenType.RightBracket); // consume ']'

            // Optionally consume 'end' if present
            if (Check(TokenType.Word) && Current.Value.ToLower() == "end")
                Consume();
        }
        else
        {
            // Parse until 'end'
            body = new List<AstNode>();
            while (!Check(TokenType.End) && !(Check(TokenType.Word) && Current.Value.ToLower() == "end"))
            {
                var stmt = ParseStatement();
                if (stmt != null)
                    body.Add(stmt);
            }

            if (Check(TokenType.Word) && Current.Value.ToLower() == "end")
                Consume();
        }

        return new ProcedureDefNode(name, parameters, body);
    }

    private AstNode ParseRepeat()
    {
        Consume(); // consume 'repeat'

        var count = ParseExpression();

        Consume(TokenType.LeftBracket);
        var body = ParseBlock();
        Consume(TokenType.RightBracket);

        return new RepeatNode(count, body);
    }

    private AstNode ParseIf()
    {
        Consume(); // consume 'if'

        var condition = ParseExpression();

        Consume(TokenType.LeftBracket);
        var trueBlock = ParseBlock();
        Consume(TokenType.RightBracket);

        return new IfNode(condition, trueBlock);
    }

    private AstNode ParseIfElse()
    {
        Consume(); // consume 'ifelse'

        var condition = ParseExpression();

        Consume(TokenType.LeftBracket);
        var trueBlock = ParseBlock();
        Consume(TokenType.RightBracket);

        Consume(TokenType.LeftBracket);
        var falseBlock = ParseBlock();
        Consume(TokenType.RightBracket);

        return new IfElseNode(condition, trueBlock, falseBlock);
    }

    private AstNode ParseMake()
    {
        Consume(); // consume 'make'

        Consume(TokenType.Quote); // consume '"'
        var varNameToken = Consume(TokenType.Word);
        var varName = varNameToken.Value;

        var value = ParseExpression();

        return new MakeNode(varName, value);
    }

    private List<AstNode> ParseBlock()
    {
        var statements = new List<AstNode>();

        while (!Check(TokenType.RightBracket) && !Check(TokenType.End))
        {
            var stmt = ParseStatement();
            if (stmt != null)
                statements.Add(stmt);
        }

        return statements;
    }

    private AstNode ParseCommand()
    {
        var commandToken = Consume(TokenType.Word);
        var commandName = commandToken.Value.ToLower();

        var arguments = new List<AstNode>();

        // Determine how many arguments this command needs
        var argCount = GetCommandArgumentCount(commandName);

        for (int i = 0; i < argCount; i++)
        {
            if (Check(TokenType.End) || Check(TokenType.RightBracket))
                break;

            // Don't consume another command name
            if (Check(TokenType.Word) && IsCommandOrKeyword(Current.Value))
                break;

            arguments.Add(ParseExpression());
        }

        return new CommandNode(commandName, arguments);
    }

    private AstNode ParseExpression()
    {
        return ParseOr();
    }

    // Logical OR (lowest precedence)
    private AstNode ParseOr()
    {
        var left = ParseAnd();

        while (Check(TokenType.Word) && Current.Value.Equals("or", StringComparison.OrdinalIgnoreCase))
        {
            Consume();
            var right = ParseAnd();
            left = new BinaryOpNode("or", left, right);
        }

        return left;
    }

    // Logical AND
    private AstNode ParseAnd()
    {
        var left = ParseNot();

        while (Check(TokenType.Word) && Current.Value.Equals("and", StringComparison.OrdinalIgnoreCase))
        {
            Consume();
            var right = ParseNot();
            left = new BinaryOpNode("and", left, right);
        }

        return left;
    }

    // Logical NOT
    private AstNode ParseNot()
    {
        if (Check(TokenType.Word) && Current.Value.Equals("not", StringComparison.OrdinalIgnoreCase))
        {
            Consume();
            var operand = ParseNot();
            return new UnaryOpNode("not", operand);
        }

        return ParseComparison();
    }

    // Comparison operators
    private AstNode ParseComparison()
    {
        var left = ParseAddSub();

        if (Check(TokenType.LessThan) || Check(TokenType.GreaterThan) || Check(TokenType.Equal) ||
            Check(TokenType.LessEqual) || Check(TokenType.GreaterEqual) || Check(TokenType.NotEqual))
        {
            var op = Consume();
            var right = ParseAddSub();
            return new BinaryOpNode(op.Value, left, right);
        }

        return left;
    }

    // Addition and subtraction
    private AstNode ParseAddSub()
    {
        var left = ParseMulDiv();

        while (Check(TokenType.Plus) || Check(TokenType.Minus))
        {
            var op = Consume();
            var right = ParseMulDiv();
            left = new BinaryOpNode(op.Value, left, right);
        }

        return left;
    }

    // Multiplication, division, and modulo (higher precedence)
    private AstNode ParseMulDiv()
    {
        var left = ParseUnary();

        while (Check(TokenType.Multiply) || Check(TokenType.Divide) ||
               (Check(TokenType.Word) && Current.Value.Equals("mod", StringComparison.OrdinalIgnoreCase)))
        {
            var op = Consume();
            var right = ParseUnary();
            left = new BinaryOpNode(op.Value, left, right);
        }

        return left;
    }

    // Unary operators (highest precedence)
    private AstNode ParseUnary()
    {
        if (Check(TokenType.Plus))
        {
            Consume(); // Skip unary +
            return ParseUnary();
        }

        if (Check(TokenType.Minus))
        {
            Consume();
            var operand = ParseUnary();
            return new UnaryOpNode("-", operand);
        }

        return ParsePrimary();
    }

    // Primary expressions: numbers, variables, functions, parentheses
    private AstNode ParsePrimary()
    {
        // Parentheses
        if (Check(TokenType.LeftParen))
        {
            Consume(); // (
            var expr = ParseExpression();
            Consume(TokenType.RightParen); // )
            return expr;
        }

        // Variable reference
        if (Check(TokenType.Colon))
        {
            Consume(); // consume ':'
            var varToken = Consume(TokenType.Word);
            return new VariableNode(varToken.Value);
        }

        // Number literal
        if (Check(TokenType.Number))
        {
            var numToken = Consume();
            return new NumberNode(double.Parse(numToken.Value));
        }

        // Math functions or commands
        if (Check(TokenType.Word))
        {
            var word = Current.Value.ToLower();

            // Check if it's a math function
            if (word is "sqrt" or "sin" or "cos" or "tan" or "abs" or
                "round" or "floor" or "ceiling" or "random")
            {
                Consume(); // function name
                var arg = ParsePrimary(); // Parse argument
                return new FunctionCallNode(word, arg);
            }

            // Check if it's a query function (no arguments)
            if (word is "xcor" or "ycor" or "heading" or "pendown?" or "pendownp")
            {
                Consume(); // query function name
                return new QueryNode(word);
            }

            // Otherwise could be a procedure call
            return ParseCommand();
        }

        throw new InvalidOperationException($"Expected expression at position {Current.Position}");
    }

    private static int GetCommandArgumentCount(string command)
    {
        return command switch
        {
            "forward" or "fd" => 1,
            "backward" or "bk" or "back" => 1,
            "right" or "rt" => 1,
            "left" or "lt" => 1,
            "setheading" or "seth" => 1,
            "setx" => 1,
            "sety" => 1,
            "setxy" => 2,
            "box" => 2,
            "square" => 1,
            "circle" => 1,
            "penup" or "pu" => 0,
            "pendown" or "pd" => 0,
            "home" => 0,
            "clear" => 0,
            _ => 0 // Unknown commands might be procedure calls
        };
    }

    private static bool IsCommandOrKeyword(string word)
    {
        var lower = word.ToLower();
        return lower is "to" or "end" or "repeat" or "make" or
               "forward" or "fd" or "backward" or "bk" or "back" or
               "right" or "rt" or "left" or "lt" or
               "penup" or "pu" or "pendown" or "pd" or
               "setheading" or "seth" or "setxy" or "setx" or "sety" or
               "home" or "clear" or "box" or "square" or "circle";
    }
}
