/**
 * DSL Executor - Runtime rule application
 */

import {
  RuleSetNode,
  RuleNode,
  ConditionNode,
  ActionNode,
  ValueNode,
  RuleStage,
  ConditionOperator,
  ActionType,
  ExecutionContext,
  ExecutionResult,
  ParseError,
} from "./dsl-types";

// ============ Executor Class ============

export class DSLExecutor {
  private ruleSet: RuleSetNode;
  private variables: Map<string, unknown> = new Map();

  constructor(ruleSet: RuleSetNode) {
    this.ruleSet = ruleSet;
  }

  /**
   * Execute rules for a specific stage
   */
  execute(context: ExecutionContext): ExecutionResult {
    const startTime = Date.now();
    const appliedRules: string[] = [];
    const skippedRules: string[] = [];
    const errors: ParseError[] = [];

    // Get rules for current stage, sorted by priority
    const stageRules = this.ruleSet.rules
      .filter(r => r.stage === context.stage && r.enabled)
      .sort((a, b) => a.priority - b.priority);

    // Reset variables for this execution
    this.variables.clear();

    let stopProcessing = false;

    for (const rule of stageRules) {
      if (stopProcessing) {
        skippedRules.push(rule.id);
        continue;
      }

      try {
        // Evaluate conditions
        const conditionsMet = this.evaluateConditions(rule.conditions, context);

        if (conditionsMet) {
          // Execute actions
          const result = this.executeActions(rule.actions, context, rule);
          
          if (result.stopProcessing) {
            stopProcessing = true;
          }
          
          if (!result.skipped) {
            appliedRules.push(rule.id);
            context.logs.push(`[${rule.stage}] Applied rule: ${rule.name}`);
          } else {
            skippedRules.push(rule.id);
          }
        } else {
          skippedRules.push(rule.id);
        }
      } catch (error) {
        errors.push({
          type: "RUNTIME",
          message: `Rule '${rule.name}' failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          line: rule.line,
          column: rule.column,
          severity: "error",
        });
        skippedRules.push(rule.id);
      }
    }

    return {
      context,
      appliedRules,
      skippedRules,
      errors,
      executionTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Execute all stages in sequence
   */
  executeAll(baseContext: Omit<ExecutionContext, "stage" | "logs">): {
    results: Map<RuleStage, ExecutionResult>;
    finalContext: ExecutionContext;
  } {
    const stages: RuleStage[] = [
      "QUERY_PREPROCESSING",
      "CHUNK_SELECTION",
      "VECTOR_SEARCH",
      "RANKING",
      "ANSWER_GENERATION",
    ];

    const results = new Map<RuleStage, ExecutionResult>();
    let context: ExecutionContext = {
      ...baseContext,
      stage: "QUERY_PREPROCESSING",
      logs: [],
    };

    for (const stage of stages) {
      context.stage = stage;
      const result = this.execute(context);
      results.set(stage, result);
      context = result.context;
    }

    return { results, finalContext: context };
  }

  // ============ Condition Evaluation ============

  private evaluateConditions(conditions: ConditionNode[], context: ExecutionContext): boolean {
    if (conditions.length === 0) return true;

    let result = this.evaluateCondition(conditions[0], context);

    for (let i = 1; i < conditions.length; i++) {
      const logic = conditions[i - 1].logic || "AND";
      const condResult = this.evaluateCondition(conditions[i], context);

      if (logic === "AND") {
        result = result && condResult;
      } else {
        result = result || condResult;
      }
    }

    return result;
  }

  private evaluateCondition(condition: ConditionNode, context: ExecutionContext): boolean {
    const fieldValue = this.resolveFieldValue(condition.field, context);
    const compareValue = this.resolveValue(condition.value, context);

    return this.compare(fieldValue, condition.operator, compareValue);
  }

  private resolveFieldValue(field: string, context: ExecutionContext): unknown {
    const parts = field.split(".");
    
    switch (parts[0]) {
      case "query":
        if (parts.length === 1) return context.processedQuery || context.query;
        if (parts[1] === "length") return (context.processedQuery || context.query).length;
        break;
      
      case "chunk":
        // This would be evaluated per-chunk during chunk selection
        // For now, return a placeholder
        if (context.chunks.length > 0) {
          const chunk = context.chunks[0];
          if (parts[1] === "qualityScore") return chunk.qualityScore;
          if (parts[1] === "similarity") return chunk.similarity;
          if (parts[1] === "tokenCount") return chunk.metadata?.tokenCount || 0;
          if (parts[1] === "age") {
            const ageMs = Date.now() - new Date(chunk.createdAt).getTime();
            return Math.floor(ageMs / (1000 * 60 * 60 * 24)); // Days
          }
          if (parts[1] === "content") return chunk.content;
        }
        break;
      
      case "document":
        if (context.chunks.length > 0) {
          const meta = context.chunks[0].metadata;
          if (parts[1] === "status") return meta?.status || "unknown";
          if (parts[1] === "type") return context.chunks[0].documentType;
        }
        break;
      
      case "uniqueDocuments":
        const docIds = new Set(context.chunks.map(c => c.metadata?.documentId));
        return docIds.size;
      
      case "result":
        if (parts[1] === "chunkCount") return context.chunks.length;
        break;
    }

    // Check variables
    if (this.variables.has(field)) {
      return this.variables.get(field);
    }

    // Check context variables
    if (context.variables && field in context.variables) {
      return context.variables[field];
    }

    return undefined;
  }

  private resolveValue(value: ValueNode, context: ExecutionContext): unknown {
    if (value.valueType === "reference") {
      return this.resolveFieldValue(value.value as string, context);
    }
    return value.value;
  }

  private compare(left: unknown, operator: ConditionOperator, right: unknown): boolean {
    switch (operator) {
      case "EQUALS":
        return left === right;
      
      case "NOT_EQUALS":
        return left !== right;
      
      case "GREATER_THAN":
        return (left as number) > (right as number);
      
      case "LESS_THAN":
        return (left as number) < (right as number);
      
      case "GREATER_EQUALS":
        return (left as number) >= (right as number);
      
      case "LESS_EQUALS":
        return (left as number) <= (right as number);
      
      case "CONTAINS":
        if (typeof left === "string") {
          return left.includes(right as string);
        }
        if (Array.isArray(left)) {
          return left.includes(right);
        }
        return false;
      
      case "NOT_CONTAINS":
        return !this.compare(left, "CONTAINS", right);
      
      case "STARTS_WITH":
        return typeof left === "string" && left.startsWith(right as string);
      
      case "ENDS_WITH":
        return typeof left === "string" && left.endsWith(right as string);
      
      case "MATCHES":
        if (typeof left === "string" && typeof right === "string") {
          try {
            return new RegExp(right).test(left);
          } catch {
            return false;
          }
        }
        return false;
      
      case "IN":
        return Array.isArray(right) && right.includes(left);
      
      case "NOT_IN":
        return Array.isArray(right) && !right.includes(left);
      
      case "EXISTS":
        return left !== undefined && left !== null;
      
      case "NOT_EXISTS":
        return left === undefined || left === null;
      
      default:
        return false;
    }
  }

  // ============ Action Execution ============

  private executeActions(
    actions: ActionNode[],
    context: ExecutionContext,
    rule: RuleNode
  ): { skipped: boolean; stopProcessing: boolean } {
    let skipped = false;
    let stopProcessing = false;

    for (const action of actions) {
      const result = this.executeAction(action, context, rule);
      if (result.skip) skipped = true;
      if (result.stop) stopProcessing = true;
    }

    return { skipped, stopProcessing };
  }

  private executeAction(
    action: ActionNode,
    context: ExecutionContext,
    rule: RuleNode
  ): { skip: boolean; stop: boolean } {
    const params = this.resolveParams(action.params, context);

    switch (action.action) {
      // Query Preprocessing
      case "EXPAND_SYNONYMS":
        return this.actionExpandSynonyms(context, params);
      
      case "REMOVE_STOPWORDS":
        return this.actionRemoveStopwords(context, params);
      
      case "NORMALIZE_QUERY":
        return this.actionNormalizeQuery(context, params);
      
      // Chunk Selection
      case "FILTER_BY_QUALITY":
        return this.actionFilterByQuality(context, params);
      
      case "FILTER_BY_SIMILARITY":
        return this.actionFilterBySimilarity(context, params);
      
      case "FILTER_BY_LENGTH":
        return this.actionFilterByLength(context, params);
      
      case "FILTER_BY_DATE":
        return this.actionFilterByDate(context, params);
      
      case "FILTER_BY_TYPE":
        return this.actionFilterByType(context, params);
      
      // Ranking
      case "BOOST_SCORE":
        return this.actionBoostScore(context, params, rule);
      
      case "PENALIZE_SCORE":
        return this.actionPenalizeScore(context, params, rule);
      
      case "APPLY_TIME_DECAY":
        return this.actionApplyTimeDecay(context, params);
      
      // Answer Generation
      case "LIMIT_CHUNKS":
        return this.actionLimitChunks(context, params);
      
      case "REQUIRE_DIVERSITY":
        return this.actionRequireDiversity(context, params);
      
      case "ADD_DISCLAIMER":
        return this.actionAddDisclaimer(context, params);
      
      // Control Flow
      case "SKIP_RULE":
        return { skip: true, stop: false };
      
      case "STOP_PROCESSING":
        return { skip: false, stop: true };
      
      case "LOG":
        context.logs.push(`[LOG] ${params.message}`);
        return { skip: false, stop: false };
      
      case "SET_VARIABLE":
        this.variables.set(params.name as string, params.value);
        return { skip: false, stop: false };
      
      default:
        context.logs.push(`[WARN] Unknown action: ${action.action}`);
        return { skip: false, stop: false };
    }
  }

  private resolveParams(
    params: Record<string, ValueNode>,
    context: ExecutionContext
  ): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(params)) {
      resolved[key] = this.resolveValue(value, context);
    }
    return resolved;
  }

  // ============ Action Implementations ============

  private actionExpandSynonyms(
    context: ExecutionContext,
    params: Record<string, unknown>
  ): { skip: boolean; stop: boolean } {
    const terms = params.terms as string[];
    if (terms && terms.length > 0) {
      const query = context.processedQuery || context.query;
      // Add synonyms to context for later use in search
      context.variables = context.variables || {};
      context.variables.expandedTerms = [
        ...((context.variables.expandedTerms as string[]) || []),
        ...terms,
      ];
      context.logs.push(`Expanded query with: ${terms.join(", ")}`);
    }
    return { skip: false, stop: false };
  }

  private actionRemoveStopwords(
    context: ExecutionContext,
    params: Record<string, unknown>
  ): { skip: boolean; stop: boolean } {
    const stopwords = new Set(["이", "가", "은", "는", "을", "를", "의", "에", "와", "과"]);
    const query = context.processedQuery || context.query;
    const words = query.split(/\s+/);
    const filtered = words.filter(w => !stopwords.has(w));
    context.processedQuery = filtered.join(" ");
    context.logs.push(`Removed stopwords, query length: ${filtered.length}`);
    return { skip: false, stop: false };
  }

  private actionNormalizeQuery(
    context: ExecutionContext,
    params: Record<string, unknown>
  ): { skip: boolean; stop: boolean } {
    let query = context.processedQuery || context.query;
    query = query.trim().toLowerCase();
    query = query.replace(/\s+/g, " ");
    context.processedQuery = query;
    return { skip: false, stop: false };
  }

  private actionFilterByQuality(
    context: ExecutionContext,
    params: Record<string, unknown>
  ): { skip: boolean; stop: boolean } {
    const threshold = params.threshold as number;
    const before = context.chunks.length;
    context.chunks = context.chunks.filter(c => c.qualityScore >= threshold);
    context.logs.push(`Quality filter (>= ${threshold}): ${before} → ${context.chunks.length}`);
    return { skip: false, stop: false };
  }

  private actionFilterBySimilarity(
    context: ExecutionContext,
    params: Record<string, unknown>
  ): { skip: boolean; stop: boolean } {
    const threshold = params.threshold as number;
    const before = context.chunks.length;
    context.chunks = context.chunks.filter(c => c.similarity >= threshold);
    context.logs.push(`Similarity filter (>= ${threshold}): ${before} → ${context.chunks.length}`);
    return { skip: false, stop: false };
  }

  private actionFilterByLength(
    context: ExecutionContext,
    params: Record<string, unknown>
  ): { skip: boolean; stop: boolean } {
    const min = (params.min as number) || 0;
    const max = (params.max as number) || Infinity;
    const before = context.chunks.length;
    context.chunks = context.chunks.filter(c => {
      const len = (c.metadata?.tokenCount as number) || c.content.length / 4;
      return len >= min && len <= max;
    });
    context.logs.push(`Length filter (${min}-${max}): ${before} → ${context.chunks.length}`);
    return { skip: false, stop: false };
  }

  private actionFilterByDate(
    context: ExecutionContext,
    params: Record<string, unknown>
  ): { skip: boolean; stop: boolean } {
    const maxAge = params.maxAge as number; // Days
    if (maxAge) {
      const cutoff = Date.now() - maxAge * 24 * 60 * 60 * 1000;
      const before = context.chunks.length;
      context.chunks = context.chunks.filter(c => new Date(c.createdAt).getTime() >= cutoff);
      context.logs.push(`Date filter (< ${maxAge} days): ${before} → ${context.chunks.length}`);
    }
    return { skip: false, stop: false };
  }

  private actionFilterByType(
    context: ExecutionContext,
    params: Record<string, unknown>
  ): { skip: boolean; stop: boolean } {
    const types = params.types as string[];
    if (types && types.length > 0) {
      const typeSet = new Set(types.map(t => t.toLowerCase()));
      const before = context.chunks.length;
      context.chunks = context.chunks.filter(c => typeSet.has(c.documentType.toLowerCase()));
      context.logs.push(`Type filter (${types.join(", ")}): ${before} → ${context.chunks.length}`);
    }
    return { skip: false, stop: false };
  }

  private actionBoostScore(
    context: ExecutionContext,
    params: Record<string, unknown>,
    rule: RuleNode
  ): { skip: boolean; stop: boolean } {
    const factor = params.factor as number;
    // Apply boost - this would modify chunk similarity scores
    for (const chunk of context.chunks) {
      if (this.evaluateConditionsForChunk(rule.conditions, context, chunk)) {
        chunk.similarity = Math.min(1, chunk.similarity * factor);
      }
    }
    context.logs.push(`Applied score boost: ${factor}x`);
    return { skip: false, stop: false };
  }

  private actionPenalizeScore(
    context: ExecutionContext,
    params: Record<string, unknown>,
    rule: RuleNode
  ): { skip: boolean; stop: boolean } {
    const factor = params.factor as number;
    for (const chunk of context.chunks) {
      if (this.evaluateConditionsForChunk(rule.conditions, context, chunk)) {
        chunk.similarity = chunk.similarity / factor;
      }
    }
    context.logs.push(`Applied score penalty: 1/${factor}`);
    return { skip: false, stop: false };
  }

  private actionApplyTimeDecay(
    context: ExecutionContext,
    params: Record<string, unknown>
  ): { skip: boolean; stop: boolean } {
    const halfLife = (params.halfLife as number) || 30; // Days
    for (const chunk of context.chunks) {
      const ageMs = Date.now() - new Date(chunk.createdAt).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      const decay = Math.pow(0.5, ageDays / halfLife);
      chunk.similarity *= decay;
    }
    context.logs.push(`Applied time decay (half-life: ${halfLife} days)`);
    return { skip: false, stop: false };
  }

  private actionLimitChunks(
    context: ExecutionContext,
    params: Record<string, unknown>
  ): { skip: boolean; stop: boolean } {
    const max = params.max as number;
    const before = context.chunks.length;
    context.chunks = context.chunks.slice(0, max);
    context.logs.push(`Limited chunks: ${before} → ${context.chunks.length}`);
    return { skip: false, stop: false };
  }

  private actionRequireDiversity(
    context: ExecutionContext,
    params: Record<string, unknown>
  ): { skip: boolean; stop: boolean } {
    const minDocuments = params.minDocuments as number;
    const docIds = new Set(context.chunks.map(c => c.metadata?.documentId));
    if (docIds.size < minDocuments) {
      context.variables = context.variables || {};
      context.variables.lowDiversity = true;
      context.logs.push(`Diversity warning: only ${docIds.size} unique documents`);
    }
    return { skip: false, stop: false };
  }

  private actionAddDisclaimer(
    context: ExecutionContext,
    params: Record<string, unknown>
  ): { skip: boolean; stop: boolean } {
    const message = params.message as string;
    context.variables = context.variables || {};
    context.variables.disclaimers = [
      ...((context.variables.disclaimers as string[]) || []),
      message,
    ];
    return { skip: false, stop: false };
  }

  private evaluateConditionsForChunk(
    conditions: ConditionNode[],
    context: ExecutionContext,
    chunk: ExecutionContext["chunks"][0]
  ): boolean {
    // Create temporary context with single chunk for evaluation
    const tempContext: ExecutionContext = {
      ...context,
      chunks: [chunk],
    };
    return this.evaluateConditions(conditions, tempContext);
  }
}

// ============ Singleton DSL Manager ============

export class DSLManager {
  private static ruleSets: Map<string, RuleSetNode> = new Map();
  private static executors: Map<string, DSLExecutor> = new Map();

  static register(name: string, ruleSet: RuleSetNode): void {
    this.ruleSets.set(name, ruleSet);
    this.executors.set(name, new DSLExecutor(ruleSet));
  }

  static getExecutor(name: string): DSLExecutor | undefined {
    return this.executors.get(name);
  }

  static getRuleSet(name: string): RuleSetNode | undefined {
    return this.ruleSets.get(name);
  }

  static list(): string[] {
    return [...this.ruleSets.keys()];
  }

  static remove(name: string): boolean {
    this.executors.delete(name);
    return this.ruleSets.delete(name);
  }
}
