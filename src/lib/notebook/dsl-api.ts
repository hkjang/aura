/**
 * DSL Unified API - Single entry point for DSL operations
 */

import { DSLParser } from "./dsl-parser";
import { DSLValidator } from "./dsl-validator";
import { DSLExecutor, DSLManager } from "./dsl-executor";
import {
  RuleSetNode,
  ParseResult,
  ValidationResult,
  ExecutionContext,
  ExecutionResult,
  RuleStage,
  ParseError,
} from "./dsl-types";

// Re-export types
export * from "./dsl-types";
export { DSLLexer } from "./dsl-lexer";
export { DSLParser } from "./dsl-parser";
export { DSLValidator } from "./dsl-validator";
export { DSLExecutor, DSLManager } from "./dsl-executor";

// ============ Unified API ============

export interface DSLCompileResult {
  success: boolean;
  ast?: RuleSetNode;
  validation?: ValidationResult;
  errors: ParseError[];
  warnings: ParseError[];
}

/**
 * Compile DSL string to validated AST
 */
export function compileDSL(input: string): DSLCompileResult {
  const parser = new DSLParser();
  const validator = new DSLValidator();

  // Parse
  const parseResult = parser.parse(input);
  if (!parseResult.success || !parseResult.ast) {
    return {
      success: false,
      errors: parseResult.errors,
      warnings: parseResult.warnings,
    };
  }

  // Validate
  const validationResult = validator.validate(parseResult.ast);
  
  return {
    success: validationResult.valid,
    ast: parseResult.ast,
    validation: validationResult,
    errors: [...parseResult.errors, ...validationResult.errors],
    warnings: [...parseResult.warnings, ...validationResult.warnings],
  };
}

/**
 * Parse and register a DSL rule set
 */
export function registerRuleSet(name: string, dsl: string): DSLCompileResult {
  const result = compileDSL(dsl);
  
  if (result.success && result.ast) {
    DSLManager.register(name, result.ast);
  }
  
  return result;
}

/**
 * Execute rules for a query
 */
export function executeRules(
  ruleSetName: string,
  context: Omit<ExecutionContext, "logs" | "variables">
): ExecutionResult | null {
  const executor = DSLManager.getExecutor(ruleSetName);
  if (!executor) {
    return null;
  }
  
  return executor.execute({
    ...context,
    logs: [],
    variables: {},
  });
}

/**
 * Execute all stages for a query
 */
export function executeAllStages(
  ruleSetName: string,
  query: string,
  chunks: ExecutionContext["chunks"]
): {
  results: Map<RuleStage, ExecutionResult>;
  finalContext: ExecutionContext;
} | null {
  const executor = DSLManager.getExecutor(ruleSetName);
  if (!executor) {
    return null;
  }
  
  return executor.executeAll({ query, chunks });
}

// ============ AST Utilities ============

/**
 * Get human-readable AST summary
 */
export function getASTSummary(ast: RuleSetNode): string {
  const lines: string[] = [];
  
  lines.push(`Rule Set: ${ast.name} v${ast.version}`);
  lines.push(`Scope: ${ast.scope}`);
  lines.push(`Rules: ${ast.rules.length}`);
  lines.push("");
  
  const stageGroups = new Map<RuleStage, typeof ast.rules>();
  for (const rule of ast.rules) {
    const group = stageGroups.get(rule.stage) || [];
    group.push(rule);
    stageGroups.set(rule.stage, group);
  }
  
  for (const [stage, rules] of stageGroups) {
    lines.push(`[${stage}]`);
    for (const rule of rules.sort((a, b) => a.priority - b.priority)) {
      lines.push(`  P${rule.priority}: ${rule.name}`);
      lines.push(`    Conditions: ${rule.conditions.length}`);
      lines.push(`    Actions: ${rule.actions.map(a => a.action).join(", ")}`);
    }
    lines.push("");
  }
  
  return lines.join("\n");
}

/**
 * Convert AST to JSON for storage/transmission
 */
export function astToJSON(ast: RuleSetNode): string {
  return JSON.stringify(ast, null, 2);
}

/**
 * Load AST from JSON
 */
export function jsonToAST(json: string): RuleSetNode | null {
  try {
    return JSON.parse(json) as RuleSetNode;
  } catch {
    return null;
  }
}

// ============ Diff Utilities ============

export interface RuleDiff {
  type: "added" | "removed" | "modified";
  ruleId: string;
  ruleName: string;
  changes?: string[];
}

/**
 * Compare two ASTs and return differences
 */
export function diffASTs(oldAST: RuleSetNode, newAST: RuleSetNode): RuleDiff[] {
  const diffs: RuleDiff[] = [];
  
  const oldRules = new Map(oldAST.rules.map(r => [r.id, r]));
  const newRules = new Map(newAST.rules.map(r => [r.id, r]));
  
  // Find removed rules
  for (const [id, rule] of oldRules) {
    if (!newRules.has(id)) {
      diffs.push({ type: "removed", ruleId: id, ruleName: rule.name });
    }
  }
  
  // Find added and modified rules
  for (const [id, newRule] of newRules) {
    const oldRule = oldRules.get(id);
    
    if (!oldRule) {
      diffs.push({ type: "added", ruleId: id, ruleName: newRule.name });
    } else {
      // Check for modifications
      const changes: string[] = [];
      
      if (oldRule.priority !== newRule.priority) {
        changes.push(`priority: ${oldRule.priority} → ${newRule.priority}`);
      }
      if (oldRule.enabled !== newRule.enabled) {
        changes.push(`enabled: ${oldRule.enabled} → ${newRule.enabled}`);
      }
      if (oldRule.conditions.length !== newRule.conditions.length) {
        changes.push(`conditions: ${oldRule.conditions.length} → ${newRule.conditions.length}`);
      }
      if (oldRule.actions.length !== newRule.actions.length) {
        changes.push(`actions: ${oldRule.actions.length} → ${newRule.actions.length}`);
      }
      
      if (changes.length > 0) {
        diffs.push({ type: "modified", ruleId: id, ruleName: newRule.name, changes });
      }
    }
  }
  
  return diffs;
}

// ============ Linter ============

export interface LintResult {
  score: number;
  issues: Array<{
    severity: "error" | "warning" | "info";
    message: string;
    suggestion?: string;
  }>;
}

/**
 * Lint DSL for quality issues
 */
export function lintDSL(ast: RuleSetNode): LintResult {
  const issues: LintResult["issues"] = [];
  let score = 100;
  
  // Check for empty descriptions
  for (const rule of ast.rules) {
    if (!rule.description) {
      issues.push({
        severity: "info",
        message: `Rule '${rule.name}' has no description`,
        suggestion: "Add a description to explain the rule's purpose",
      });
      score -= 2;
    }
  }
  
  // Check for very high/low priorities
  const priorities = ast.rules.map(r => r.priority);
  if (Math.max(...priorities) > 50) {
    issues.push({
      severity: "warning",
      message: "Some rules have very high priority values",
      suggestion: "Consider using priority values between 1-50 for better maintainability",
    });
    score -= 5;
  }
  
  // Check for stage coverage
  const stages = new Set(ast.rules.map(r => r.stage));
  if (stages.size < 2) {
    issues.push({
      severity: "info",
      message: "Rules only cover one processing stage",
      suggestion: "Consider adding rules for other stages for comprehensive control",
    });
    score -= 5;
  }
  
  // Check for disabled rules
  const disabledCount = ast.rules.filter(r => !r.enabled).length;
  if (disabledCount > 0) {
    issues.push({
      severity: "info",
      message: `${disabledCount} rule(s) are disabled`,
      suggestion: "Remove disabled rules or re-enable them",
    });
    score -= disabledCount;
  }
  
  return { score: Math.max(0, score), issues };
}

// ============ Default Rule Sets ============

export const DEFAULT_RULE_SETS = {
  basic: `
# 기본 RAG 규칙
rule_set "basic" {
  version: "1.0.0"
  scope: GLOBAL
  
  rule "quality_filter" {
    priority: 1
    stage: CHUNK_SELECTION
    description: "최소 품질 점수 필터"
    
    when {
      chunk.qualityScore < 40
    }
    then {
      FILTER_BY_QUALITY(threshold: 40)
    }
  }
  
  rule "similarity_filter" {
    priority: 2
    stage: CHUNK_SELECTION
    description: "최소 유사도 필터"
    
    when {
      chunk.similarity < 0.3
    }
    then {
      FILTER_BY_SIMILARITY(threshold: 0.3)
    }
  }
  
  rule "limit_results" {
    priority: 10
    stage: ANSWER_GENERATION
    description: "결과 수 제한"
    
    when {
      result.chunkCount > 5
    }
    then {
      LIMIT_CHUNKS(max: 5)
    }
  }
}
`,

  strict: `
# 엄격한 RAG 규칙
rule_set "strict" {
  version: "1.0.0"
  scope: GLOBAL
  
  rule "high_quality_only" {
    priority: 1
    stage: CHUNK_SELECTION
    description: "고품질 청크만 사용"
    
    when {
      chunk.qualityScore < 60
    }
    then {
      FILTER_BY_QUALITY(threshold: 60)
    }
  }
  
  rule "high_similarity" {
    priority: 2
    stage: CHUNK_SELECTION
    description: "높은 유사도만"
    
    when {
      chunk.similarity < 0.5
    }
    then {
      FILTER_BY_SIMILARITY(threshold: 0.5)
    }
  }
  
  rule "recent_only" {
    priority: 3
    stage: CHUNK_SELECTION
    description: "최근 90일 문서만"
    
    when {
      chunk.age > 90
    }
    then {
      FILTER_BY_DATE(maxAge: 90)
    }
  }
  
  rule "diversity_required" {
    priority: 5
    stage: ANSWER_GENERATION
    description: "다양성 필수"
    
    when {
      uniqueDocuments < 2
    }
    then {
      REQUIRE_DIVERSITY(minDocuments: 2)
      ADD_DISCLAIMER(message: "출처가 제한적입니다")
    }
  }
}
`,
};
