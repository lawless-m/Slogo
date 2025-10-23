using System.Collections.Generic;

namespace Axi.Drawing.Logo;

/// <summary>
/// Base class for all AST nodes
/// </summary>
public abstract record AstNode;

/// <summary>
/// A program is a sequence of statements
/// </summary>
public record ProgramNode(List<AstNode> Statements) : AstNode;

/// <summary>
/// Basic turtle command (forward, right, etc.)
/// </summary>
public record CommandNode(string Name, List<AstNode> Arguments) : AstNode;

/// <summary>
/// Number literal
/// </summary>
public record NumberNode(double Value) : AstNode;

/// <summary>
/// Variable reference (:varname)
/// </summary>
public record VariableNode(string Name) : AstNode;

/// <summary>
/// Repeat loop: repeat N [ commands ]
/// </summary>
public record RepeatNode(AstNode Count, List<AstNode> Body) : AstNode;

/// <summary>
/// Procedure definition: to name :param1 :param2 [ commands ] end
/// </summary>
public record ProcedureDefNode(string Name, List<string> Parameters, List<AstNode> Body) : AstNode;

/// <summary>
/// Variable assignment: make "varname value
/// </summary>
public record MakeNode(string VariableName, AstNode Value) : AstNode;
