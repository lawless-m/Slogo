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

            case ':':
                _position++;
                return new Token(TokenType.Colon, ":", startPos);

            case '"':
                _position++;
                return new Token(TokenType.Quote, "\"", startPos);

            case '-':
            case '+':
                if (_position + 1 < _input.Length && char.IsDigit(_input[_position + 1]))
                    return ReadNumber();
                return ReadWord();

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
