/**
 * RAG Rules DSL Parser
 * Domain-Specific Language for declarative RAG rule management
 * 
 * Design Principles:
 * - Declarative: Describe WHAT to do, not HOW
 * - Hierarchical: rule_set → rule → when/then
 * - Immutable: Rules cannot change during execution
 * - Explicit: All defaults clearly defined
 * - Safe: Only allowed syntax executes
 */

// ============ Token Types ============

export type TokenType =
  | "KEYWORD"
  | "IDENTIFIER"
  | "NUMBER"
  | "STRING"
  | "OPERATOR"
  | "PUNCTUATION"
  | "COMMENT"
  | "WHITESPACE"
  | "EOF"
  | "UNKNOWN";

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
  raw: string;
}

// ============ AST Node Types ============

export type ASTNodeType =
  | "RuleSet"
  | "Rule"
  | "Condition"
  | "Action"
  | "Value"
  | "Expression"
  | "Identifier"
  | "Literal"
  | "BinaryOp"
  | "UnaryOp"
  | "FunctionCall"
  | "Array"
  | "Object";

export interface ASTNode {
  type: ASTNodeType;
  line: number;
  column: number;
}

export interface RuleSetNode extends ASTNode {
  type: "RuleSet";
  name: string;
  version: string;
  scope: RuleScope;
  rules: RuleNode[];
  metadata: Record<string, unknown>;
}

export interface RuleNode extends ASTNode {
  type: "Rule";
  id: string;
  name: string;
  description?: string;
  priority: number;
  enabled: boolean;
  stage: RuleStage;
  conditions: ConditionNode[];
  actions: ActionNode[];
  weight?: number;
}

export interface ConditionNode extends ASTNode {
  type: "Condition";
  field: string;
  operator: ConditionOperator;
  value: ValueNode;
  logic?: "AND" | "OR";
  nested?: ConditionNode[];
}

export interface ActionNode extends ASTNode {
  type: "Action";
  action: ActionType;
  target?: string;
  params: Record<string, ValueNode>;
}

export interface ValueNode extends ASTNode {
  type: "Value";
  valueType: "string" | "number" | "boolean" | "array" | "reference" | "expression";
  value: unknown;
}

export interface ExpressionNode extends ASTNode {
  type: "Expression";
  operator: string;
  left: ASTNode;
  right?: ASTNode;
}

// ============ Enums & Types ============

export type RuleScope = "GLOBAL" | "NOTEBOOK" | "DOCUMENT_TYPE" | "USER_GROUP";

export type RuleStage = 
  | "QUERY_PREPROCESSING"
  | "CHUNK_SELECTION"
  | "VECTOR_SEARCH"
  | "RANKING"
  | "ANSWER_GENERATION";

export type ConditionOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "GREATER_THAN"
  | "LESS_THAN"
  | "GREATER_EQUALS"
  | "LESS_EQUALS"
  | "CONTAINS"
  | "NOT_CONTAINS"
  | "STARTS_WITH"
  | "ENDS_WITH"
  | "MATCHES"
  | "IN"
  | "NOT_IN"
  | "EXISTS"
  | "NOT_EXISTS";

export type ActionType =
  // Query Preprocessing
  | "EXPAND_SYNONYMS"
  | "REMOVE_STOPWORDS"
  | "NORMALIZE_QUERY"
  | "DECOMPOSE_QUERY"
  // Chunk Selection
  | "FILTER_BY_QUALITY"
  | "FILTER_BY_SIMILARITY"
  | "FILTER_BY_LENGTH"
  | "FILTER_BY_DATE"
  | "FILTER_BY_TYPE"
  // Ranking
  | "BOOST_SCORE"
  | "PENALIZE_SCORE"
  | "SET_WEIGHT"
  | "APPLY_TIME_DECAY"
  // Answer Generation
  | "LIMIT_CHUNKS"
  | "REQUIRE_DIVERSITY"
  | "SET_CONFIDENCE_THRESHOLD"
  | "ADD_DISCLAIMER"
  // Control Flow
  | "SKIP_RULE"
  | "STOP_PROCESSING"
  | "LOG"
  | "SET_VARIABLE";

// ============ Keywords ============

export const DSL_KEYWORDS = [
  "rule_set",
  "rule",
  "when",
  "then",
  "and",
  "or",
  "not",
  "priority",
  "weight",
  "scope",
  "stage",
  "enabled",
  "true",
  "false",
  "null",
] as const;

export const DSL_OPERATORS: Record<string, ConditionOperator> = {
  "==": "EQUALS",
  "!=": "NOT_EQUALS",
  ">": "GREATER_THAN",
  "<": "LESS_THAN",
  ">=": "GREATER_EQUALS",
  "<=": "LESS_EQUALS",
  "contains": "CONTAINS",
  "!contains": "NOT_CONTAINS",
  "startsWith": "STARTS_WITH",
  "endsWith": "ENDS_WITH",
  "matches": "MATCHES",
  "in": "IN",
  "!in": "NOT_IN",
  "exists": "EXISTS",
  "!exists": "NOT_EXISTS",
};

// ============ Parse Errors ============

export interface ParseError {
  type: "LEXER" | "SYNTAX" | "SEMANTIC" | "RUNTIME";
  message: string;
  line: number;
  column: number;
  severity: "error" | "warning" | "info";
  suggestion?: string;
}

export interface ParseResult {
  success: boolean;
  ast?: RuleSetNode;
  errors: ParseError[];
  warnings: ParseError[];
}

// ============ Validation Result ============

export interface ValidationResult {
  valid: boolean;
  errors: ParseError[];
  warnings: ParseError[];
  ruleCount: number;
  coverage: {
    stages: RuleStage[];
    scopes: RuleScope[];
  };
}

// ============ Execution Context ============

export interface ExecutionContext {
  query: string;
  processedQuery?: string;
  chunks: Array<{
    id: string;
    content: string;
    similarity: number;
    qualityScore: number;
    documentType: string;
    createdAt: Date;
    metadata: Record<string, unknown>;
  }>;
  variables: Record<string, unknown>;
  stage: RuleStage;
  userId?: string;
  notebookId?: string;
  logs: string[];
}

export interface ExecutionResult {
  context: ExecutionContext;
  appliedRules: string[];
  skippedRules: string[];
  errors: ParseError[];
  executionTimeMs: number;
}

// ============ DSL Example ============

export const DSL_EXAMPLE = `
# RAG 검색 규칙 정의
rule_set "security_docs" {
  version: "1.0.0"
  scope: NOTEBOOK
  
  # 최소 품질 필터
  rule "quality_filter" {
    priority: 1
    stage: CHUNK_SELECTION
    
    when {
      chunk.qualityScore < 50
    }
    then {
      FILTER_BY_QUALITY(threshold: 50)
    }
  }
  
  # 최신 문서 우선
  rule "recent_boost" {
    priority: 2
    stage: RANKING
    
    when {
      chunk.age < 30  # days
    }
    then {
      BOOST_SCORE(factor: 1.1)
    }
  }
  
  # 승인 문서 우선
  rule "approved_priority" {
    priority: 3
    stage: RANKING
    weight: 0.1
    
    when {
      document.status == "approved"
    }
    then {
      BOOST_SCORE(factor: 1.15)
    }
  }
  
  # 정보보안 동의어 확장
  rule "security_synonyms" {
    priority: 1
    stage: QUERY_PREPROCESSING
    
    when {
      query contains "보안"
    }
    then {
      EXPAND_SYNONYMS(terms: ["정보보안", "시큐리티", "security"])
    }
  }
  
  # 답변 다양성 보장
  rule "diversity_check" {
    priority: 5
    stage: ANSWER_GENERATION
    
    when {
      uniqueDocuments < 2
    }
    then {
      REQUIRE_DIVERSITY(minDocuments: 2)
      ADD_DISCLAIMER(message: "출처가 제한적일 수 있습니다")
    }
  }
}
`;
