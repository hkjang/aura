/**
 * DSL Parser - Builds AST from tokens
 */

import { DSLLexer } from "./dsl-lexer";
import {
  Token,
  TokenType,
  ASTNode,
  RuleSetNode,
  RuleNode,
  ConditionNode,
  ActionNode,
  ValueNode,
  RuleScope,
  RuleStage,
  ConditionOperator,
  ActionType,
  ParseError,
  ParseResult,
  DSL_OPERATORS,
} from "./dsl-types";

export class DSLParser {
  private tokens: Token[] = [];
  private current: number = 0;
  private errors: ParseError[] = [];
  private warnings: ParseError[] = [];

  /**
   * Parse DSL input string
   */
  parse(input: string): ParseResult {
    this.current = 0;
    this.errors = [];
    this.warnings = [];

    // Lexical analysis
    const lexer = new DSLLexer(input);
    const { tokens, errors: lexerErrors } = lexer.tokenize();
    this.tokens = tokens;
    this.errors.push(...lexerErrors);

    if (lexerErrors.some(e => e.severity === "error")) {
      return {
        success: false,
        errors: this.errors,
        warnings: this.warnings,
      };
    }

    // Parse rule set
    try {
      const ast = this.parseRuleSet();
      return {
        success: this.errors.filter(e => e.severity === "error").length === 0,
        ast,
        errors: this.errors,
        warnings: this.warnings,
      };
    } catch (error) {
      this.addError(
        error instanceof Error ? error.message : "Unknown parse error",
        this.peek()
      );
      return {
        success: false,
        errors: this.errors,
        warnings: this.warnings,
      };
    }
  }

  // ============ Parser Core ============

  private parseRuleSet(): RuleSetNode {
    // Expect: rule_set "name" { ... }
    this.consume("KEYWORD", "Expected 'rule_set'", "rule_set");
    
    const nameToken = this.consume("STRING", "Expected rule set name");
    const name = nameToken.value;
    
    this.consume("PUNCTUATION", "Expected '{'", "{");
    
    // Parse metadata and rules
    let version = "1.0.0";
    let scope: RuleScope = "GLOBAL";
    const metadata: Record<string, unknown> = {};
    const rules: RuleNode[] = [];
    
    while (!this.check("PUNCTUATION", "}") && !this.isAtEnd()) {
      if (this.check("KEYWORD", "rule")) {
        rules.push(this.parseRule());
      } else if (this.check("IDENTIFIER", "version")) {
        this.advance();
        this.consume("PUNCTUATION", "Expected ':'", ":");
        version = this.consume("STRING", "Expected version string").value;
      } else if (this.check("KEYWORD", "scope")) {
        this.advance();
        this.consume("PUNCTUATION", "Expected ':'", ":");
        scope = this.consume("IDENTIFIER", "Expected scope").value.toUpperCase() as RuleScope;
      } else if (this.check("IDENTIFIER")) {
        // Other metadata
        const key = this.advance().value;
        this.consume("PUNCTUATION", "Expected ':'", ":");
        const value = this.parseValue();
        metadata[key] = value.value;
      } else {
        this.addError(`Unexpected token: ${this.peek().value}`, this.peek());
        this.advance();
      }
    }
    
    this.consume("PUNCTUATION", "Expected '}'", "}");
    
    return {
      type: "RuleSet",
      name,
      version,
      scope,
      rules,
      metadata,
      line: 1,
      column: 1,
    };
  }

  private parseRule(): RuleNode {
    const startToken = this.peek();
    this.consume("KEYWORD", "Expected 'rule'", "rule");
    
    const nameToken = this.consume("STRING", "Expected rule name");
    const id = this.generateId(nameToken.value);
    
    this.consume("PUNCTUATION", "Expected '{'", "{");
    
    // Default values
    let priority = 10;
    let weight: number | undefined;
    let stage: RuleStage = "RANKING";
    let enabled = true;
    let description: string | undefined;
    const conditions: ConditionNode[] = [];
    const actions: ActionNode[] = [];
    
    while (!this.check("PUNCTUATION", "}") && !this.isAtEnd()) {
      if (this.check("KEYWORD", "priority")) {
        this.advance();
        this.consume("PUNCTUATION", "Expected ':'", ":");
        priority = parseInt(this.consume("NUMBER", "Expected priority number").value, 10);
      } else if (this.check("KEYWORD", "weight")) {
        this.advance();
        this.consume("PUNCTUATION", "Expected ':'", ":");
        weight = parseFloat(this.consume("NUMBER", "Expected weight number").value);
      } else if (this.check("KEYWORD", "stage") || this.check("IDENTIFIER", "stage")) {
        this.advance();
        this.consume("PUNCTUATION", "Expected ':'", ":");
        stage = this.consume("IDENTIFIER", "Expected stage").value.toUpperCase() as RuleStage;
      } else if (this.check("KEYWORD", "enabled")) {
        this.advance();
        this.consume("PUNCTUATION", "Expected ':'", ":");
        enabled = this.consume("KEYWORD", "Expected true or false").value === "true";
      } else if (this.check("IDENTIFIER", "description")) {
        this.advance();
        this.consume("PUNCTUATION", "Expected ':'", ":");
        description = this.consume("STRING", "Expected description").value;
      } else if (this.check("KEYWORD", "when")) {
        this.parseWhenBlock(conditions);
      } else if (this.check("KEYWORD", "then")) {
        this.parseThenBlock(actions);
      } else {
        this.addError(`Unexpected token in rule: ${this.peek().value}`, this.peek());
        this.advance();
      }
    }
    
    this.consume("PUNCTUATION", "Expected '}'", "}");
    
    // Validation
    if (conditions.length === 0) {
      this.addWarning("Rule has no conditions", startToken);
    }
    if (actions.length === 0) {
      this.addError("Rule must have at least one action", startToken);
    }
    
    return {
      type: "Rule",
      id,
      name: nameToken.value,
      description,
      priority,
      enabled,
      stage,
      conditions,
      actions,
      weight,
      line: startToken.line,
      column: startToken.column,
    };
  }

  private parseWhenBlock(conditions: ConditionNode[]): void {
    this.consume("KEYWORD", "Expected 'when'", "when");
    this.consume("PUNCTUATION", "Expected '{'", "{");
    
    while (!this.check("PUNCTUATION", "}") && !this.isAtEnd()) {
      const condition = this.parseCondition();
      conditions.push(condition);
      
      // Check for logical operators
      if (this.check("KEYWORD", "and") || this.check("KEYWORD", "or")) {
        condition.logic = this.advance().value.toUpperCase() as "AND" | "OR";
      }
    }
    
    this.consume("PUNCTUATION", "Expected '}'", "}");
  }

  private parseCondition(): ConditionNode {
    const startToken = this.peek();
    
    // Parse field reference (e.g., chunk.qualityScore, query, document.status)
    let field = this.consume("IDENTIFIER", "Expected field name").value;
    
    // Handle dotted fields
    while (this.check("PUNCTUATION", ".")) {
      this.advance();
      field += "." + this.consume("IDENTIFIER", "Expected field name").value;
    }
    
    // Parse operator
    let operator: ConditionOperator = "EQUALS";
    
    if (this.check("OPERATOR")) {
      const opToken = this.advance();
      operator = DSL_OPERATORS[opToken.value] || "EQUALS";
    } else if (this.check("IDENTIFIER")) {
      const op = this.peek().value.toLowerCase();
      if (op in DSL_OPERATORS) {
        this.advance();
        operator = DSL_OPERATORS[op];
      }
    }
    
    // Parse value
    const value = this.parseValue();
    
    return {
      type: "Condition",
      field,
      operator,
      value,
      line: startToken.line,
      column: startToken.column,
    };
  }

  private parseThenBlock(actions: ActionNode[]): void {
    this.consume("KEYWORD", "Expected 'then'", "then");
    this.consume("PUNCTUATION", "Expected '{'", "{");
    
    while (!this.check("PUNCTUATION", "}") && !this.isAtEnd()) {
      const action = this.parseAction();
      actions.push(action);
    }
    
    this.consume("PUNCTUATION", "Expected '}'", "}");
  }

  private parseAction(): ActionNode {
    const startToken = this.peek();
    
    // Action name (e.g., BOOST_SCORE, FILTER_BY_QUALITY)
    const actionName = this.consume("IDENTIFIER", "Expected action name").value.toUpperCase() as ActionType;
    
    const params: Record<string, ValueNode> = {};
    
    // Parse parameters
    if (this.check("PUNCTUATION", "(")) {
      this.advance();
      
      while (!this.check("PUNCTUATION", ")") && !this.isAtEnd()) {
        const paramName = this.consume("IDENTIFIER", "Expected parameter name").value;
        this.consume("PUNCTUATION", "Expected ':'", ":");
        const paramValue = this.parseValue();
        params[paramName] = paramValue;
        
        if (this.check("PUNCTUATION", ",")) {
          this.advance();
        }
      }
      
      this.consume("PUNCTUATION", "Expected ')'", ")");
    }
    
    return {
      type: "Action",
      action: actionName,
      params,
      line: startToken.line,
      column: startToken.column,
    };
  }

  private parseValue(): ValueNode {
    const token = this.peek();
    
    // String
    if (this.check("STRING")) {
      this.advance();
      return {
        type: "Value",
        valueType: "string",
        value: token.value,
        line: token.line,
        column: token.column,
      };
    }
    
    // Number
    if (this.check("NUMBER")) {
      this.advance();
      const num = parseFloat(token.value);
      return {
        type: "Value",
        valueType: "number",
        value: num,
        line: token.line,
        column: token.column,
      };
    }
    
    // Boolean
    if (this.check("KEYWORD", "true") || this.check("KEYWORD", "false")) {
      this.advance();
      return {
        type: "Value",
        valueType: "boolean",
        value: token.value === "true",
        line: token.line,
        column: token.column,
      };
    }
    
    // Null
    if (this.check("KEYWORD", "null")) {
      this.advance();
      return {
        type: "Value",
        valueType: "string",
        value: null,
        line: token.line,
        column: token.column,
      };
    }
    
    // Array
    if (this.check("PUNCTUATION", "[")) {
      return this.parseArray();
    }
    
    // Reference (identifier)
    if (this.check("IDENTIFIER")) {
      this.advance();
      let ref = token.value;
      
      // Handle dotted references
      while (this.check("PUNCTUATION", ".")) {
        this.advance();
        ref += "." + this.consume("IDENTIFIER", "Expected identifier").value;
      }
      
      return {
        type: "Value",
        valueType: "reference",
        value: ref,
        line: token.line,
        column: token.column,
      };
    }
    
    this.addError(`Expected value, got '${token.value}'`, token);
    return {
      type: "Value",
      valueType: "string",
      value: "",
      line: token.line,
      column: token.column,
    };
  }

  private parseArray(): ValueNode {
    const startToken = this.peek();
    this.consume("PUNCTUATION", "Expected '['", "[");
    
    const values: unknown[] = [];
    
    while (!this.check("PUNCTUATION", "]") && !this.isAtEnd()) {
      const value = this.parseValue();
      values.push(value.value);
      
      if (this.check("PUNCTUATION", ",")) {
        this.advance();
      }
    }
    
    this.consume("PUNCTUATION", "Expected ']'", "]");
    
    return {
      type: "Value",
      valueType: "array",
      value: values,
      line: startToken.line,
      column: startToken.column,
    };
  }

  // ============ Helper Methods ============

  private check(type: TokenType, value?: string): boolean {
    if (this.isAtEnd()) return false;
    const token = this.peek();
    if (token.type !== type) return false;
    if (value !== undefined && token.value !== value) return false;
    return true;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private isAtEnd(): boolean {
    return this.peek().type === "EOF";
  }

  private consume(type: TokenType, message: string, value?: string): Token {
    if (this.check(type, value)) return this.advance();
    
    const token = this.peek();
    this.addError(`${message}. Got '${token.value}'`, token);
    
    // Error recovery: skip to next meaningful token
    this.synchronize();
    
    return token;
  }

  private synchronize(): void {
    // Skip to next rule or closing brace
    while (!this.isAtEnd()) {
      if (this.previous().value === "}") return;
      if (this.check("KEYWORD", "rule")) return;
      if (this.check("KEYWORD", "when")) return;
      if (this.check("KEYWORD", "then")) return;
      this.advance();
    }
  }

  private addError(message: string, token: Token): void {
    this.errors.push({
      type: "SYNTAX",
      message,
      line: token.line,
      column: token.column,
      severity: "error",
    });
  }

  private addWarning(message: string, token: Token): void {
    this.warnings.push({
      type: "SYNTAX",
      message,
      line: token.line,
      column: token.column,
      severity: "warning",
    });
  }

  private generateId(name: string): string {
    return name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  }
}
