using System;
using System.Collections.Generic;
using System.Text;

namespace Axi.Drawing.Logo;

/// <summary>
/// Tokenizes Logo language input
/// </summary>
public class Tokenizer
{
    private readonly string _input;
    private int _position;

    public Tokenizer(string input)
    {
        _input = input ?? string.Empty;
        _position = 0;
    }

    public List<Token> Tokenize()
    {
        var tokens = new List<Token>();

        while (_position < _input.Length)
        {
            SkipWhitespace();
            SkipComment();
            SkipWhitespace();  // Skip whitespace after comment too
            if (_position >= _input.Length)
                break;

            var token = ReadToken();
            if (token != null)
                tokens.Add(token);
        }

        tokens.Add(new Token(TokenType.End, "", _position));
        return tokens;
    }

    private void SkipWhitespace()
    {
        while (_position < _input.Length && char.IsWhiteSpace(_input[_position]))
            _position++;
    }

    private void SkipComment()
    {
        // If we hit a semicolon, skip to end of line
        if (_position < _input.Length && _input[_position] == ';')
        {
            while (_position < _input.Length && _input[_position] != '\n')
                _position++;
        }
    }

    private Token? ReadToken()
    {
        if (_position >= _input.Length)
            return null;

        var ch = _input[_position];
        var startPos = _position;

        switch (ch)
        {
            case '[':
                _position++;
                return new Token(TokenType.LeftBracket, "[", startPos);

            case ']':
                _position++;
                return new Token(TokenType.RightBracket, "]", startPos);

            case '(':
                _position++;
                return new Token(TokenType.LeftParen, "(", startPos);

            case ')':
                _position++;
                return new Token(TokenType.RightParen, ")", startPos);

            case ':':
                _position++;
                return new Token(TokenType.Colon, ":", startPos);

            case '"':
                _position++;
                return new Token(TokenType.Quote, "\"", startPos);

            case '+':
                // Check if it's start of a number like +123
                if (_position + 1 < _input.Length && char.IsDigit(_input[_position + 1]))
                    return ReadNumber();
                _position++;
                return new Token(TokenType.Plus, "+", startPos);

            case '-':
                // Check if it's start of a number like -123
                if (_position + 1 < _input.Length && char.IsDigit(_input[_position + 1]))
                    return ReadNumber();
                _position++;
                return new Token(TokenType.Minus, "-", startPos);

            case '*':
                _position++;
                return new Token(TokenType.Multiply, "*", startPos);

            case '/':
                _position++;
                return new Token(TokenType.Divide, "/", startPos);

            case '<':
                _position++;
                // Check for <= or <>
                if (_position < _input.Length)
                {
                    if (_input[_position] == '=')
                    {
                        _position++;
                        return new Token(TokenType.LessEqual, "<=", startPos);
                    }
                    else if (_input[_position] == '>')
                    {
                        _position++;
                        return new Token(TokenType.NotEqual, "<>", startPos);
                    }
                }
                return new Token(TokenType.LessThan, "<", startPos);

            case '>':
                _position++;
                // Check for >=
                if (_position < _input.Length && _input[_position] == '=')
                {
                    _position++;
                    return new Token(TokenType.GreaterEqual, ">=", startPos);
                }
                return new Token(TokenType.GreaterThan, ">", startPos);

            case '=':
                _position++;
                return new Token(TokenType.Equal, "=", startPos);

            default:
                if (char.IsDigit(ch) || ch == '.')
                    return ReadNumber();
                else if (char.IsLetter(ch) || ch == '_')
                    return ReadWord();
                else
                {
                    // Skip unknown characters
                    _position++;
                    return ReadToken();
                }
        }
    }

    private Token ReadNumber()
    {
        var startPos = _position;
        var sb = new StringBuilder();

        // Handle sign
        if (_input[_position] == '-' || _input[_position] == '+')
        {
            sb.Append(_input[_position]);
            _position++;
        }

        // Read digits before decimal
        while (_position < _input.Length && char.IsDigit(_input[_position]))
        {
            sb.Append(_input[_position]);
            _position++;
        }

        // Read decimal part
        if (_position < _input.Length && _input[_position] == '.')
        {
            sb.Append(_input[_position]);
            _position++;

            while (_position < _input.Length && char.IsDigit(_input[_position]))
            {
                sb.Append(_input[_position]);
                _position++;
            }
        }

        return new Token(TokenType.Number, sb.ToString(), startPos);
    }

    private Token ReadWord()
    {
        var startPos = _position;
        var sb = new StringBuilder();

        while (_position < _input.Length &&
               (char.IsLetterOrDigit(_input[_position]) || _input[_position] == '_'))
        {
            sb.Append(_input[_position]);
            _position++;
        }

        return new Token(TokenType.Word, sb.ToString(), startPos);
    }
}
