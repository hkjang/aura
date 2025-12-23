/**
 * DSL Validator - Semantic validation of AST
 */

import {
  RuleSetNode,
  RuleNode,
  ConditionNode,
  ActionNode,
  ValueNode,
  RuleScope,
  RuleStage,
  ActionType,
  ParseError,
  ValidationResult,
} from "./dsl-types";

// ============ Valid Values ============

const VALID_SCOPES: RuleScope[] = ["GLOBAL", "NOTEBOOK", "DOCUMENT_TYPE", "USER_GROUP"];

const VALID_STAGES: RuleStage[] = [
  "QUERY_PREPROCESSING",
  "CHUNK_SELECTION",
  "VECTOR_SEARCH",
  "RANKING",
  "ANSWER_GENERATION",
];

const VALID_ACTIONS: ActionType[] = [
  "EXPAND_SYNONYMS",
  "REMOVE_STOPWORDS",
  "NORMALIZE_QUERY",
  "DECOMPOSE_QUERY",
  "FILTER_BY_QUALITY",
  "FILTER_BY_SIMILARITY",
  "FILTER_BY_LENGTH",
  "FILTER_BY_DATE",
  "FILTER_BY_TYPE",
  "BOOST_SCORE",
  "PENALIZE_SCORE",
  "SET_WEIGHT",
  "APPLY_TIME_DECAY",
  "LIMIT_CHUNKS",
  "REQUIRE_DIVERSITY",
  "SET_CONFIDENCE_THRESHOLD",
  "ADD_DISCLAIMER",
  "SKIP_RULE",
  "STOP_PROCESSING",
  "LOG",
  "SET_VARIABLE",
];

const VALID_FIELDS = new Set([
  "query",
  "query.length",
  "query.intent",
  "chunk",
  "chunk.qualityScore",
  "chunk.similarity",
  "chunk.tokenCount",
  "chunk.age",
  "chunk.content",
  "document",
  "document.status",
  "document.type",
  "document.createdAt",
  "document.title",
  "user",
  "user.role",
  "user.department",
  "result",
  "result.chunkCount",
  "result.confidence",
  "uniqueDocuments",
]);

const ACTION_PARAMS: Record<string, { required: string[]; optional: string[] }> = {
  EXPAND_SYNONYMS: { required: ["terms"], optional: [] },
  REMOVE_STOPWORDS: { required: [], optional: ["language"] },
  NORMALIZE_QUERY: { required: [], optional: ["mode"] },
  DECOMPOSE_QUERY: { required: [], optional: [] },
  FILTER_BY_QUALITY: { required: ["threshold"], optional: [] },
  FILTER_BY_SIMILARITY: { required: ["threshold"], optional: [] },
  FILTER_BY_LENGTH: { required: [], optional: ["min", "max"] },
  FILTER_BY_DATE: { required: [], optional: ["maxAge", "minAge"] },
  FILTER_BY_TYPE: { required: ["types"], optional: [] },
  BOOST_SCORE: { required: ["factor"], optional: [] },
  PENALIZE_SCORE: { required: ["factor"], optional: [] },
  SET_WEIGHT: { required: ["value"], optional: [] },
  APPLY_TIME_DECAY: { required: [], optional: ["halfLife"] },
  LIMIT_CHUNKS: { required: ["max"], optional: [] },
  REQUIRE_DIVERSITY: { required: ["minDocuments"], optional: [] },
  SET_CONFIDENCE_THRESHOLD: { required: ["threshold"], optional: [] },
  ADD_DISCLAIMER: { required: ["message"], optional: [] },
  SKIP_RULE: { required: [], optional: [] },
  STOP_PROCESSING: { required: [], optional: [] },
  LOG: { required: ["message"], optional: ["level"] },
  SET_VARIABLE: { required: ["name", "value"], optional: [] },
};

// ============ Validator Class ============

export class DSLValidator {
  private errors: ParseError[] = [];
  private warnings: ParseError[] = [];
  private ruleIds = new Set<string>();

  /**
   * Validate AST
   */
  validate(ast: RuleSetNode): ValidationResult {
    this.errors = [];
    this.warnings = [];
    this.ruleIds.clear();

    // Validate rule set
    this.validateRuleSet(ast);

    // Validate each rule
    for (const rule of ast.rules) {
      this.validateRule(rule);
    }

    // Check for conflicting rules
    this.checkConflicts(ast.rules);

    // Calculate coverage
    const stages = new Set<RuleStage>();
    const scopes = new Set<RuleScope>([ast.scope]);
    for (const rule of ast.rules) {
      stages.add(rule.stage);
    }

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      ruleCount: ast.rules.length,
      coverage: {
        stages: [...stages],
        scopes: [...scopes],
      },
    };
  }

  private validateRuleSet(ast: RuleSetNode): void {
    // Check name
    if (!ast.name || ast.name.trim().length === 0) {
      this.addError("Rule set must have a name", 1, 1);
    }

    // Check version format
    if (!/^\d+\.\d+\.\d+$/.test(ast.version)) {
      this.addWarning(`Version '${ast.version}' doesn't follow semver format`, 1, 1);
    }

    // Check scope
    if (!VALID_SCOPES.includes(ast.scope)) {
      this.addError(`Invalid scope: '${ast.scope}'. Valid: ${VALID_SCOPES.join(", ")}`, 1, 1);
    }

    // Check for empty rule set
    if (ast.rules.length === 0) {
      this.addWarning("Rule set has no rules", 1, 1);
    }
  }

  private validateRule(rule: RuleNode): void {
    // Check for duplicate IDs
    if (this.ruleIds.has(rule.id)) {
      this.addError(`Duplicate rule ID: '${rule.id}'`, rule.line, rule.column);
    }
    this.ruleIds.add(rule.id);

    // Check stage
    if (!VALID_STAGES.includes(rule.stage)) {
      this.addError(
        `Invalid stage: '${rule.stage}'. Valid: ${VALID_STAGES.join(", ")}`,
        rule.line,
        rule.column
      );
    }

    // Check priority range
    if (rule.priority < 1 || rule.priority > 100) {
      this.addWarning(
        `Priority ${rule.priority} outside recommended range (1-100)`,
        rule.line,
        rule.column
      );
    }

    // Check weight range
    if (rule.weight !== undefined && (rule.weight < 0 || rule.weight > 1)) {
      this.addError(
        `Weight ${rule.weight} must be between 0 and 1`,
        rule.line,
        rule.column
      );
    }

    // Validate conditions
    for (const condition of rule.conditions) {
      this.validateCondition(condition, rule.stage);
    }

    // Validate actions
    for (const action of rule.actions) {
      this.validateAction(action, rule.stage);
    }

    // Check action compatibility with stage
    this.checkStageActionCompatibility(rule);
  }

  private validateCondition(condition: ConditionNode, stage: RuleStage): void {
    // Check field validity
    const baseField = condition.field.split(".")[0];
    if (!VALID_FIELDS.has(condition.field) && !VALID_FIELDS.has(baseField)) {
      this.addWarning(
        `Unknown field: '${condition.field}'`,
        condition.line,
        condition.column
      );
    }

    // Check stage-field compatibility
    if (stage === "QUERY_PREPROCESSING" && condition.field.startsWith("chunk")) {
      this.addWarning(
        `Field '${condition.field}' may not be available at stage ${stage}`,
        condition.line,
        condition.column
      );
    }

    // Validate value types
    this.validateConditionValue(condition);
  }

  private validateConditionValue(condition: ConditionNode): void {
    const { operator, value, field } = condition;

    // Numeric comparisons need numbers
    if (["GREATER_THAN", "LESS_THAN", "GREATER_EQUALS", "LESS_EQUALS"].includes(operator)) {
      if (value.valueType !== "number" && value.valueType !== "reference") {
        this.addError(
          `Operator ${operator} requires numeric value`,
          condition.line,
          condition.column
        );
      }
    }

    // IN/NOT_IN need arrays
    if (["IN", "NOT_IN"].includes(operator)) {
      if (value.valueType !== "array") {
        this.addError(
          `Operator ${operator} requires array value`,
          condition.line,
          condition.column
        );
      }
    }

    // String operations need strings
    if (["CONTAINS", "STARTS_WITH", "ENDS_WITH", "MATCHES"].includes(operator)) {
      if (value.valueType !== "string") {
        this.addWarning(
          `Operator ${operator} typically uses string values`,
          condition.line,
          condition.column
        );
      }
    }
  }

  private validateAction(action: ActionNode, stage: RuleStage): void {
    // Check action validity
    if (!VALID_ACTIONS.includes(action.action)) {
      this.addError(
        `Unknown action: '${action.action}'`,
        action.line,
        action.column
      );
      return;
    }

    // Check required parameters
    const paramDef = ACTION_PARAMS[action.action];
    if (paramDef) {
      for (const required of paramDef.required) {
        if (!(required in action.params)) {
          this.addError(
            `Action ${action.action} requires parameter '${required}'`,
            action.line,
            action.column
          );
        }
      }

      // Check for unknown parameters
      const allParams = new Set([...paramDef.required, ...paramDef.optional]);
      for (const param of Object.keys(action.params)) {
        if (!allParams.has(param)) {
          this.addWarning(
            `Unknown parameter '${param}' for action ${action.action}`,
            action.line,
            action.column
          );
        }
      }
    }

    // Validate parameter values
    this.validateActionParams(action);
  }

  private validateActionParams(action: ActionNode): void {
    const { params } = action;

    // Factor validation
    if (params.factor) {
      const factor = params.factor.value as number;
      if (typeof factor === "number" && (factor < 0.1 || factor > 10)) {
        this.addWarning(
          `Factor ${factor} is outside typical range (0.1-10)`,
          action.line,
          action.column
        );
      }
    }

    // Threshold validation
    if (params.threshold) {
      const threshold = params.threshold.value as number;
      if (typeof threshold === "number" && (threshold < 0 || threshold > 100)) {
        this.addError(
          `Threshold ${threshold} must be between 0 and 100`,
          action.line,
          action.column
        );
      }
    }

    // Max validation
    if (params.max) {
      const max = params.max.value as number;
      if (typeof max === "number" && max < 1) {
        this.addError(
          `Max must be at least 1`,
          action.line,
          action.column
        );
      }
    }
  }

  private checkStageActionCompatibility(rule: RuleNode): void {
    const stageActions: Record<RuleStage, ActionType[]> = {
      QUERY_PREPROCESSING: ["EXPAND_SYNONYMS", "REMOVE_STOPWORDS", "NORMALIZE_QUERY", "DECOMPOSE_QUERY", "LOG", "SET_VARIABLE"],
      CHUNK_SELECTION: ["FILTER_BY_QUALITY", "FILTER_BY_SIMILARITY", "FILTER_BY_LENGTH", "FILTER_BY_DATE", "FILTER_BY_TYPE", "LOG", "SET_VARIABLE", "SKIP_RULE"],
      VECTOR_SEARCH: ["SET_WEIGHT", "BOOST_SCORE", "LOG", "SET_VARIABLE"],
      RANKING: ["BOOST_SCORE", "PENALIZE_SCORE", "SET_WEIGHT", "APPLY_TIME_DECAY", "LOG", "SET_VARIABLE", "SKIP_RULE"],
      ANSWER_GENERATION: ["LIMIT_CHUNKS", "REQUIRE_DIVERSITY", "SET_CONFIDENCE_THRESHOLD", "ADD_DISCLAIMER", "LOG", "SET_VARIABLE", "STOP_PROCESSING"],
    };

    const validActions = stageActions[rule.stage] || [];
    for (const action of rule.actions) {
      if (!validActions.includes(action.action) && 
          !["LOG", "SET_VARIABLE", "SKIP_RULE", "STOP_PROCESSING"].includes(action.action)) {
        this.addWarning(
          `Action ${action.action} may not be appropriate for stage ${rule.stage}`,
          action.line,
          action.column
        );
      }
    }
  }

  private checkConflicts(rules: RuleNode[]): void {
    // Check for rules with same priority and stage
    const priorityMap = new Map<string, RuleNode[]>();
    
    for (const rule of rules) {
      const key = `${rule.stage}-${rule.priority}`;
      const existing = priorityMap.get(key) || [];
      existing.push(rule);
      priorityMap.set(key, existing);
    }

    for (const [key, conflicting] of priorityMap) {
      if (conflicting.length > 1) {
        const names = conflicting.map(r => r.name).join(", ");
        this.addWarning(
          `Rules with same priority and stage may conflict: ${names}`,
          conflicting[0].line,
          conflicting[0].column
        );
      }
    }
  }

  private addError(message: string, line: number, column: number): void {
    this.errors.push({
      type: "SEMANTIC",
      message,
      line,
      column,
      severity: "error",
    });
  }

  private addWarning(message: string, line: number, column: number): void {
    this.warnings.push({
      type: "SEMANTIC",
      message,
      line,
      column,
      severity: "warning",
    });
  }
}
