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
/// List literal [1 2 3]
/// </summary>
public record ListNode(List<AstNode> Elements) : AstNode;

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

/// <summary>
/// Binary operation: left op right (e.g., 5 + 3, :x * 2)
/// </summary>
public record BinaryOpNode(string Operator, AstNode Left, AstNode Right) : AstNode;

/// <summary>
/// Unary operation: op value (e.g., -5, +3)
/// </summary>
public record UnaryOpNode(string Operator, AstNode Operand) : AstNode;

/// <summary>
/// Function call: funcname(arg) (e.g., SQRT 100, SIN :angle)
/// </summary>
public record FunctionCallNode(string FunctionName, AstNode Argument) : AstNode;

/// <summary>
/// IF conditional: if condition [ commands ]
/// </summary>
public record IfNode(AstNode Condition, List<AstNode> TrueBlock) : AstNode;

/// <summary>
/// IFELSE conditional: ifelse condition [ trueCommands ] [ falseCommands ]
/// </summary>
public record IfElseNode(AstNode Condition, List<AstNode> TrueBlock, List<AstNode> FalseBlock) : AstNode;

/// <summary>
/// Query function: returns turtle state (e.g., XCOR, YCOR, HEADING, PENDOWN?)
/// </summary>
public record QueryNode(string QueryName) : AstNode;

/// <summary>
/// OUTPUT statement: returns a value from a procedure
/// </summary>
public record OutputNode(AstNode Value) : AstNode;

/// <summary>
/// STOP statement: exits from a procedure without returning a value
/// </summary>
public record StopNode() : AstNode;

/// <summary>
/// PRINT statement: prints a value to output
/// </summary>
public record PrintNode(AstNode Value) : AstNode;

/// <summary>
/// WHILE loop: while condition [ commands ]
/// </summary>
public record WhileNode(AstNode Condition, List<AstNode> Body) : AstNode;

/// <summary>
/// FOR loop: for [variable start end increment] [ commands ]
/// </summary>
public record ForNode(string Variable, AstNode Start, AstNode End, AstNode? Increment, List<AstNode> Body) : AstNode;

/// <summary>
/// DOTIMES loop: dotimes [variable count] [ commands ]
/// Simpler than FOR - always counts from 1 to count by 1
/// </summary>
public record DoTimesNode(string Variable, AstNode Count, List<AstNode> Body) : AstNode;

/// <summary>
/// LOCAL variable declaration: local "var or local [var1 var2 ...]
/// </summary>
public record LocalNode(List<string> Variables) : AstNode;
