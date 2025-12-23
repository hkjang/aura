/**
 * DSL Lexer - Tokenizes DSL input string
 */

import {
  Token,
  TokenType,
  DSL_KEYWORDS,
  ParseError,
} from "./dsl-types";

export class DSLLexer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];
  private errors: ParseError[] = [];

  constructor(input: string) {
    this.input = input;
  }

  /**
   * Tokenize the entire input
   */
  tokenize(): { tokens: Token[]; errors: ParseError[] } {
    this.tokens = [];
    this.errors = [];
    this.position = 0;
    this.line = 1;
    this.column = 1;

    while (!this.isAtEnd()) {
      try {
        const token = this.scanToken();
        if (token && token.type !== "WHITESPACE" && token.type !== "COMMENT") {
          this.tokens.push(token);
        }
      } catch (error) {
        this.errors.push({
          type: "LEXER",
          message: error instanceof Error ? error.message : "Unknown lexer error",
          line: this.line,
          column: this.column,
          severity: "error",
        });
        this.advance(); // Skip problematic character
      }
    }

    // Add EOF token
    this.tokens.push({
      type: "EOF",
      value: "",
      line: this.line,
      column: this.column,
      raw: "",
    });

    return { tokens: this.tokens, errors: this.errors };
  }

  private scanToken(): Token | null {
    const startLine = this.line;
    const startColumn = this.column;
    const char = this.peek();

    // Whitespace
    if (this.isWhitespace(char)) {
      return this.consumeWhitespace(startLine, startColumn);
    }

    // Comments
    if (char === "#") {
      return this.consumeComment(startLine, startColumn);
    }

    // String literals
    if (char === '"' || char === "'") {
      return this.consumeString(char, startLine, startColumn);
    }

    // Numbers
    if (this.isDigit(char) || (char === "-" && this.isDigit(this.peekNext()))) {
      return this.consumeNumber(startLine, startColumn);
    }

    // Identifiers and keywords
    if (this.isAlpha(char) || char === "_") {
      return this.consumeIdentifier(startLine, startColumn);
    }

    // Operators
    if (this.isOperatorStart(char)) {
      return this.consumeOperator(startLine, startColumn);
    }

    // Punctuation
    if (this.isPunctuation(char)) {
      return this.consumePunctuation(startLine, startColumn);
    }

    // Unknown character
    this.errors.push({
      type: "LEXER",
      message: `Unexpected character: '${char}'`,
      line: startLine,
      column: startColumn,
      severity: "error",
    });
    this.advance();
    return null;
  }

  private consumeWhitespace(line: number, column: number): Token {
    const start = this.position;
    while (!this.isAtEnd() && this.isWhitespace(this.peek())) {
      if (this.peek() === "\n") {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
      this.position++;
    }
    return {
      type: "WHITESPACE",
      value: this.input.substring(start, this.position),
      line,
      column,
      raw: this.input.substring(start, this.position),
    };
  }

  private consumeComment(line: number, column: number): Token {
    const start = this.position;
    this.advance(); // Skip #
    
    while (!this.isAtEnd() && this.peek() !== "\n") {
      this.advance();
    }
    
    return {
      type: "COMMENT",
      value: this.input.substring(start + 1, this.position).trim(),
      line,
      column,
      raw: this.input.substring(start, this.position),
    };
  }

  private consumeString(quote: string, line: number, column: number): Token {
    const start = this.position;
    this.advance(); // Skip opening quote
    
    let value = "";
    while (!this.isAtEnd() && this.peek() !== quote) {
      if (this.peek() === "\\") {
        this.advance();
        const escaped = this.peek();
        switch (escaped) {
          case "n": value += "\n"; break;
          case "t": value += "\t"; break;
          case "\\": value += "\\"; break;
          case '"': value += '"'; break;
          case "'": value += "'"; break;
          default: value += escaped;
        }
      } else {
        value += this.peek();
      }
      this.advance();
    }
    
    if (this.isAtEnd()) {
      this.errors.push({
        type: "LEXER",
        message: "Unterminated string",
        line,
        column,
        severity: "error",
      });
    } else {
      this.advance(); // Skip closing quote
    }
    
    return {
      type: "STRING",
      value,
      line,
      column,
      raw: this.input.substring(start, this.position),
    };
  }

  private consumeNumber(line: number, column: number): Token {
    const start = this.position;
    
    if (this.peek() === "-") {
      this.advance();
    }
    
    while (!this.isAtEnd() && this.isDigit(this.peek())) {
      this.advance();
    }
    
    // Decimal part
    if (this.peek() === "." && this.isDigit(this.peekNext())) {
      this.advance(); // Skip .
      while (!this.isAtEnd() && this.isDigit(this.peek())) {
        this.advance();
      }
    }
    
    const raw = this.input.substring(start, this.position);
    return {
      type: "NUMBER",
      value: raw,
      line,
      column,
      raw,
    };
  }

  private consumeIdentifier(line: number, column: number): Token {
    const start = this.position;
    
    while (!this.isAtEnd() && (this.isAlphaNumeric(this.peek()) || this.peek() === "_")) {
      this.advance();
    }
    
    const value = this.input.substring(start, this.position);
    const isKeyword = (DSL_KEYWORDS as readonly string[]).includes(value.toLowerCase());
    
    return {
      type: isKeyword ? "KEYWORD" : "IDENTIFIER",
      value: value.toLowerCase(),
      line,
      column,
      raw: value,
    };
  }

  private consumeOperator(line: number, column: number): Token {
    const start = this.position;
    const char = this.peek();
    
    // Two-character operators
    if (this.position + 1 < this.input.length) {
      const twoChar = char + this.peekNext();
      if (["==", "!=", ">=", "<=", "&&", "||"].includes(twoChar)) {
        this.advance();
        this.advance();
        return {
          type: "OPERATOR",
          value: twoChar,
          line,
          column,
          raw: twoChar,
        };
      }
    }
    
    // Single-character operators
    this.advance();
    return {
      type: "OPERATOR",
      value: char,
      line,
      column,
      raw: char,
    };
  }

  private consumePunctuation(line: number, column: number): Token {
    const char = this.peek();
    this.advance();
    return {
      type: "PUNCTUATION",
      value: char,
      line,
      column,
      raw: char,
    };
  }

  // Helper methods
  private isAtEnd(): boolean {
    return this.position >= this.input.length;
  }

  private peek(): string {
    if (this.isAtEnd()) return "\0";
    return this.input[this.position];
  }

  private peekNext(): string {
    if (this.position + 1 >= this.input.length) return "\0";
    return this.input[this.position + 1];
  }

  private advance(): string {
    const char = this.peek();
    this.position++;
    this.column++;
    return char;
  }

  private isWhitespace(char: string): boolean {
    return char === " " || char === "\t" || char === "\n" || char === "\r";
  }

  private isDigit(char: string): boolean {
    return char >= "0" && char <= "9";
  }

  private isAlpha(char: string): boolean {
    return (char >= "a" && char <= "z") ||
           (char >= "A" && char <= "Z") ||
           char === "_" ||
           // Korean characters
           (char >= "\uAC00" && char <= "\uD7AF") ||
           (char >= "\u1100" && char <= "\u11FF");
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  private isOperatorStart(char: string): boolean {
    return "=!<>+-*/&|".includes(char);
  }

  private isPunctuation(char: string): boolean {
    return "{}[]():,.;".includes(char);
  }
}
