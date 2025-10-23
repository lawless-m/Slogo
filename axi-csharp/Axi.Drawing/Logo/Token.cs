namespace Axi.Drawing.Logo;

/// <summary>
/// Token types for the Logo language
/// </summary>
public enum TokenType
{
    Word,           // Commands and identifiers
    Number,         // Numeric literals
    LeftBracket,    // [
    RightBracket,   // ]
    Colon,          // : for variable references
    Quote,          // " for variable names in make
    Plus,           // +
    Minus,          // -
    Multiply,       // *
    Divide,         // /
    LeftParen,      // (
    RightParen,     // )
    LessThan,       // <
    GreaterThan,    // >
    Equal,          // =
    LessEqual,      // <=
    GreaterEqual,   // >=
    NotEqual,       // <>
    End             // End of input
}

/// <summary>
/// Represents a token in the Logo language
/// </summary>
public record Token(TokenType Type, string Value, int Position);
