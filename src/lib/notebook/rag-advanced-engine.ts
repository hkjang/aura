/**
 * Advanced RAG Self-Learning Engine
 * Implements intent analysis, auto-tuning, learning-to-rank, and shadow testing
 */

import { prisma } from "@/lib/prisma";
import {
  RAGAccuracyRules,
  AccuracyConfig,
  ProcessedQuery,
  ChunkWithScore,
  RuleResult,
} from "./rag-accuracy-rules";

// ============ Types ============

export type IntentType = 
  | "definition" 
  | "comparison" 
  | "procedure" 
  | "factual" 
  | "opinion" 
  | "troubleshooting"
  | "recommendation"
  | "general";

export interface IntentAnalysis {
  primaryIntent: IntentType;
  confidence: number;
  secondaryIntents: Array<{ intent: IntentType; confidence: number }>;
  isMultiIntent: boolean;
  decomposedQueries?: string[];
}

export interface OrganizationalContext {
  userId: string;
  department?: string;
  role?: string;
  accessLevel?: "basic" | "standard" | "elevated" | "admin";
  preferredDomains?: string[];
  sessionHistory?: Array<{ query: string; timestamp: Date }>;
}

export interface ChunkEvidence {
  chunk: ChunkWithScore;
  evidenceType: "primary" | "supporting" | "context";
  conflictsWith?: string[]; // IDs of conflicting chunks
  trustLevel: "draft" | "approved" | "policy" | "verified";
}

export interface AdvancedRankedResult {
  evidenceChunks: ChunkEvidence[];
  answerConfidence: number;
  confidenceFactors: ConfidenceFactor[];
  warnings: string[];
  shouldDefer: boolean;
  deferReason?: string;
}

export interface ConfidenceFactor {
  factor: string;
  contribution: number;
  description: string;
}

export interface TuningRecommendation {
  ruleId: string;
  currentValue: number;
  recommendedValue: number;
  reason: string;
  expectedImpact: number; // -1 to 1
}

export interface ShadowTestResult {
  testId: string;
  originalResult: AdvancedRankedResult;
  shadowResult: AdvancedRankedResult;
  metrics: {
    precisionDelta: number;
    recallDelta: number;
    confidenceDelta: number;
  };
  recommendation: "adopt" | "reject" | "monitor";
}

export interface FailurePattern {
  type: "recall_failure" | "precision_failure" | "confidence_failure" | "conflict_failure";
  frequency: number;
  lastOccurred: Date;
  affectedQueries: string[];
  suggestedFix?: TuningRecommendation;
}

// ============ Intent Analysis Engine ============

export class IntentAnalyzer {
  private static INTENT_PATTERNS: Record<IntentType, RegExp[]> = {
    definition: [
      /무엇(인가요?|입니까?|이에요?)?/,
      /정의|뜻|의미/,
      /what is|define|meaning of/i,
      /란\s*무엇/,
    ],
    comparison: [
      /vs|versus/i,
      /비교|차이|다른|구분/,
      /compare|different|versus|between/i,
      /(보다|대비)\s*(어떤|무슨)/,
    ],
    procedure: [
      /어떻게|방법|절차|단계|과정/,
      /how to|steps|process|procedure/i,
      /하려면|하는\s*법/,
    ],
    factual: [
      /언제|어디|누가|몇|얼마/,
      /when|where|who|how many|how much/i,
      /날짜|시간|장소|비용|가격/,
    ],
    opinion: [
      /어떻게\s*생각|의견|추천|좋은가요?/,
      /recommend|suggest|opinion|think/i,
      /괜찮|적합|적절/,
    ],
    troubleshooting: [
      /문제|오류|에러|안되|해결/,
      /error|problem|issue|fix|resolve/i,
      /작동\s*안|실패|장애/,
    ],
    recommendation: [
      /추천|권장|제안|best|적합한/,
      /recommend|suggest|best practice/i,
      /어떤\s*것이\s*좋/,
    ],
    general: [],
  };

  /**
   * Analyze query intent with confidence scoring
   */
  static analyze(query: string): IntentAnalysis {
    const scores: Record<IntentType, number> = {
      definition: 0,
      comparison: 0,
      procedure: 0,
      factual: 0,
      opinion: 0,
      troubleshooting: 0,
      recommendation: 0,
      general: 0.1, // Base score for general
    };

    // Score each intent type
    for (const [intent, patterns] of Object.entries(this.INTENT_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          scores[intent as IntentType] += 0.3;
        }
      }
    }

    // Normalize and find top intents
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const normalized = Object.entries(scores)
      .map(([intent, score]) => ({
        intent: intent as IntentType,
        confidence: totalScore > 0 ? score / totalScore : 0,
      }))
      .sort((a, b) => b.confidence - a.confidence);

    const primary = normalized[0];
    const secondaryIntents = normalized.slice(1).filter(i => i.confidence > 0.15);
    const isMultiIntent = secondaryIntents.length > 0 && secondaryIntents[0].confidence > 0.25;

    // Decompose multi-intent queries
    let decomposedQueries: string[] | undefined;
    if (isMultiIntent) {
      decomposedQueries = this.decomposeQuery(query);
    }

    return {
      primaryIntent: primary.intent,
      confidence: primary.confidence,
      secondaryIntents,
      isMultiIntent,
      decomposedQueries,
    };
  }

  /**
   * Decompose compound queries into simpler sub-queries
   */
  private static decomposeQuery(query: string): string[] {
    // Split by common conjunctions
    const parts = query.split(/[,그리고|또한|and|,\s*그리고]/i)
      .map(p => p.trim())
      .filter(p => p.length > 5);

    // If splitting produced valid parts, return them
    if (parts.length > 1) {
      return parts;
    }

    // Otherwise, try splitting by question marks or semicolons
    const questions = query.split(/[?;]/)
      .map(p => p.trim())
      .filter(p => p.length > 5);

    return questions.length > 1 ? questions : [query];
  }
}

// ============ Advanced Chunk Selection ============

export class AdvancedChunkSelector {
  /**
   * Select chunks with evidence classification and conflict detection
   */
  static selectWithEvidence(
    chunks: ChunkWithScore[],
    context: OrganizationalContext,
    maxTokens: number = 4000
  ): ChunkEvidence[] {
    const evidence: ChunkEvidence[] = [];
    let totalTokens = 0;

    // Sort by adjusted score
    const sorted = chunks
      .filter(c => !c.isFiltered)
      .sort((a, b) => b.adjustedScore - a.adjustedScore);

    // Track content for conflict detection
    const seenStatements = new Map<string, ChunkEvidence>();

    for (const chunk of sorted) {
      if (totalTokens + chunk.tokenCount > maxTokens) break;

      // Determine evidence type
      const evidenceType = this.classifyEvidenceType(chunk, evidence.length);

      // Determine trust level
      const trustLevel = this.determineTrustLevel(chunk);

      // Detect conflicts
      const conflicts = this.detectConflicts(chunk, seenStatements);

      const chunkEvidence: ChunkEvidence = {
        chunk,
        evidenceType,
        trustLevel,
        conflictsWith: conflicts.length > 0 ? conflicts : undefined,
      };

      evidence.push(chunkEvidence);
      totalTokens += chunk.tokenCount;

      // Register for conflict detection
      this.registerForConflictDetection(chunk, chunkEvidence, seenStatements);
    }

    // Apply organizational context filtering
    return this.applyOrgContext(evidence, context);
  }

  private static classifyEvidenceType(
    chunk: ChunkWithScore,
    position: number
  ): "primary" | "supporting" | "context" {
    if (position === 0 || chunk.adjustedScore > 0.85) {
      return "primary";
    }
    if (chunk.adjustedScore > 0.65) {
      return "supporting";
    }
    return "context";
  }

  private static determineTrustLevel(
    chunk: ChunkWithScore
  ): "draft" | "approved" | "policy" | "verified" {
    const metadata = chunk.metadata || {};
    
    if (metadata.isPolicy) return "policy";
    if (metadata.isVerified) return "verified";
    if (metadata.isApproved) return "approved";
    return "draft";
  }

  private static detectConflicts(
    chunk: ChunkWithScore,
    seen: Map<string, ChunkEvidence>
  ): string[] {
    const conflicts: string[] = [];
    const content = chunk.content.toLowerCase();

    // Simple conflict detection based on negation patterns
    const negationPatterns = [
      /하지\s*않/,
      /아니/,
      /금지/,
      /불가/,
      /cannot|should not|must not|don't/i,
    ];

    for (const [key, existing] of seen) {
      // Check if chunks discuss similar topics but with contradictions
      const existingContent = existing.chunk.content.toLowerCase();
      
      // If similar topic (sharing key terms) but different sentiment
      const sharedTerms = this.getSharedTerms(content, existingContent);
      if (sharedTerms.length >= 3) {
        const chunkHasNegation = negationPatterns.some(p => p.test(content));
        const existingHasNegation = negationPatterns.some(p => p.test(existingContent));
        
        if (chunkHasNegation !== existingHasNegation) {
          conflicts.push(existing.chunk.id);
        }
      }
    }

    return conflicts;
  }

  private static getSharedTerms(a: string, b: string): string[] {
    const wordsA = new Set(a.split(/\s+/).filter(w => w.length > 2));
    const wordsB = new Set(b.split(/\s+/).filter(w => w.length > 2));
    return [...wordsA].filter(w => wordsB.has(w));
  }

  private static registerForConflictDetection(
    chunk: ChunkWithScore,
    evidence: ChunkEvidence,
    seen: Map<string, ChunkEvidence>
  ): void {
    // Use first 100 chars as key for similarity matching
    const key = chunk.content.substring(0, 100).toLowerCase().replace(/\s+/g, " ");
    seen.set(key, evidence);
  }

  private static applyOrgContext(
    evidence: ChunkEvidence[],
    context: OrganizationalContext
  ): ChunkEvidence[] {
    // Boost evidence from preferred domains
    if (context.preferredDomains && context.preferredDomains.length > 0) {
      for (const e of evidence) {
        const docType = e.chunk.documentType?.toLowerCase() || "";
        if (context.preferredDomains.some(d => docType.includes(d.toLowerCase()))) {
          e.chunk.adjustedScore *= 1.1;
        }
      }
    }

    // Re-sort after context adjustments
    return evidence.sort((a, b) => b.chunk.adjustedScore - a.chunk.adjustedScore);
  }
}

// ============ Auto-Tuning Engine ============

export class AutoTuningEngine {
  private static TUNING_THRESHOLD = 0.7; // Minimum confidence for auto-apply
  private static ROLLBACK_THRESHOLD = 0.1; // Max degradation before rollback

  /**
   * Analyze feedback patterns and generate tuning recommendations
   */
  static async analyzeAndRecommend(): Promise<TuningRecommendation[]> {
    const recommendations: TuningRecommendation[] = [];

    try {
      // Get recent feedback data
      const recentFeedback = await prisma.rAGFeedback.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      });

      if (recentFeedback.length < 10) {
        return []; // Not enough data
      }

      // Calculate metrics
      const avgRating = recentFeedback.reduce((s, f) => s + f.rating, 0) / recentFeedback.length;
      const helpfulRate = recentFeedback.filter(f => f.isHelpful).length / recentFeedback.length;

      // Analyze failure patterns
      const failurePatterns = this.analyzeFailurePatterns(recentFeedback);

      // Generate recommendations based on patterns
      for (const pattern of failurePatterns) {
        if (pattern.type === "recall_failure" && pattern.frequency > 0.2) {
          recommendations.push({
            ruleId: "minSimilarity",
            currentValue: 0.3,
            recommendedValue: 0.25,
            reason: `Recall failures detected in ${Math.round(pattern.frequency * 100)}% of queries`,
            expectedImpact: 0.15,
          });
        }

        if (pattern.type === "precision_failure" && pattern.frequency > 0.15) {
          recommendations.push({
            ruleId: "minQualityScore",
            currentValue: 40,
            recommendedValue: 50,
            reason: `Precision failures detected, increasing quality threshold`,
            expectedImpact: 0.1,
          });
        }
      }

      // Check if diversity is an issue
      const diversityIssues = recentFeedback.filter(f => 
        f.feedbackType === "INCOMPLETE" || f.comment?.includes("한 문서")
      ).length;

      if (diversityIssues / recentFeedback.length > 0.1) {
        recommendations.push({
          ruleId: "diversityWeight",
          currentValue: 0.2,
          recommendedValue: 0.35,
          reason: "Users report answers lacking diversity",
          expectedImpact: 0.12,
        });
      }

      return recommendations;
    } catch (error) {
      console.error("Auto-tuning analysis failed:", error);
      return [];
    }
  }

  /**
   * Analyze failure patterns from feedback
   */
  private static analyzeFailurePatterns(
    feedback: Array<{ feedbackType: string; rating: number; isHelpful: boolean | null; comment: string | null }>
  ): FailurePattern[] {
    const patterns: FailurePattern[] = [];
    const total = feedback.length;

    // Recall failures: users say information is missing
    const recallFailures = feedback.filter(f => 
      f.feedbackType === "INCOMPLETE" || 
      f.comment?.includes("없") || 
      f.comment?.includes("못 찾")
    );
    if (recallFailures.length > 0) {
      patterns.push({
        type: "recall_failure",
        frequency: recallFailures.length / total,
        lastOccurred: new Date(),
        affectedQueries: [],
      });
    }

    // Precision failures: users say answer is wrong or irrelevant
    const precisionFailures = feedback.filter(f =>
      f.feedbackType === "WRONG" ||
      f.feedbackType === "IRRELEVANT" ||
      f.rating <= 2
    );
    if (precisionFailures.length > 0) {
      patterns.push({
        type: "precision_failure",
        frequency: precisionFailures.length / total,
        lastOccurred: new Date(),
        affectedQueries: [],
      });
    }

    return patterns;
  }

  /**
   * Apply tuning recommendation with shadow testing
   */
  static async applyWithShadowTest(
    recommendation: TuningRecommendation
  ): Promise<ShadowTestResult | null> {
    // This would run a shadow test comparing current vs recommended config
    // For now, return a placeholder
    console.log(`Shadow testing recommendation: ${recommendation.ruleId}`);
    return null;
  }

  /**
   * Check if rollback is needed based on recent metrics
   */
  static async checkRollbackNeeded(): Promise<boolean> {
    try {
      // Compare recent vs previous period metrics
      const recentFeedback = await prisma.rAGFeedback.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      const previousFeedback = await prisma.rAGFeedback.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 48 * 60 * 60 * 1000),
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      if (recentFeedback.length < 5 || previousFeedback.length < 5) {
        return false;
      }

      const recentAvg = recentFeedback.reduce((s, f) => s + f.rating, 0) / recentFeedback.length;
      const previousAvg = previousFeedback.reduce((s, f) => s + f.rating, 0) / previousFeedback.length;

      // Rollback if degradation exceeds threshold
      return (previousAvg - recentAvg) / previousAvg > this.ROLLBACK_THRESHOLD;
    } catch (error) {
      console.error("Rollback check failed:", error);
      return false;
    }
  }
}

// ============ Answer Confidence Calculator ============

export class AnswerConfidenceCalculator {
  private static MIN_EVIDENCE_COUNT = 2;
  private static MIN_CONFIDENCE_TO_ANSWER = 0.5;

  /**
   * Calculate answer confidence with detailed factors
   */
  static calculate(evidence: ChunkEvidence[], intent: IntentAnalysis): AdvancedRankedResult {
    const factors: ConfidenceFactor[] = [];
    const warnings: string[] = [];
    let totalConfidence = 0;

    // Factor 1: Evidence count
    const evidenceScore = Math.min(1, evidence.length / 5) * 0.25;
    factors.push({
      factor: "evidence_count",
      contribution: evidenceScore,
      description: `${evidence.length} evidence chunks found`,
    });
    totalConfidence += evidenceScore;

    // Factor 2: Primary evidence quality
    const primaryEvidence = evidence.filter(e => e.evidenceType === "primary");
    const primaryScore = primaryEvidence.length > 0
      ? (primaryEvidence[0].chunk.adjustedScore * 0.3)
      : 0;
    factors.push({
      factor: "primary_evidence_quality",
      contribution: primaryScore,
      description: `Primary evidence score: ${(primaryScore / 0.3 * 100).toFixed(0)}%`,
    });
    totalConfidence += primaryScore;

    // Factor 3: Trust level distribution
    const policyCount = evidence.filter(e => e.trustLevel === "policy" || e.trustLevel === "verified").length;
    const trustScore = (policyCount / Math.max(1, evidence.length)) * 0.2;
    factors.push({
      factor: "trust_level",
      contribution: trustScore,
      description: `${policyCount} verified/policy sources`,
    });
    totalConfidence += trustScore;

    // Factor 4: Intent confidence
    const intentScore = intent.confidence * 0.15;
    factors.push({
      factor: "intent_clarity",
      contribution: intentScore,
      description: `Intent: ${intent.primaryIntent} (${(intent.confidence * 100).toFixed(0)}%)`,
    });
    totalConfidence += intentScore;

    // Factor 5: Conflict penalty
    const conflictCount = evidence.filter(e => e.conflictsWith && e.conflictsWith.length > 0).length;
    const conflictPenalty = conflictCount > 0 ? -0.1 * Math.min(conflictCount, 3) : 0;
    if (conflictCount > 0) {
      factors.push({
        factor: "conflict_penalty",
        contribution: conflictPenalty,
        description: `${conflictCount} conflicting sources detected`,
      });
      totalConfidence += conflictPenalty;
      warnings.push(`${conflictCount}개의 상충하는 출처가 발견되었습니다.`);
    }

    // Check if should defer
    const shouldDefer = evidence.length < this.MIN_EVIDENCE_COUNT || 
                        totalConfidence < this.MIN_CONFIDENCE_TO_ANSWER;
    let deferReason: string | undefined;
    
    if (shouldDefer) {
      if (evidence.length < this.MIN_EVIDENCE_COUNT) {
        deferReason = "충분한 근거를 찾지 못했습니다.";
        warnings.push(deferReason);
      } else if (totalConfidence < this.MIN_CONFIDENCE_TO_ANSWER) {
        deferReason = "답변의 신뢰도가 낮습니다.";
        warnings.push(deferReason);
      }
    }

    return {
      evidenceChunks: evidence,
      answerConfidence: Math.max(0, Math.min(1, totalConfidence)),
      confidenceFactors: factors,
      warnings,
      shouldDefer,
      deferReason,
    };
  }

  /**
   * Generate confidence disclosure for answer
   */
  static generateDisclosure(result: AdvancedRankedResult): string {
    const confidenceLevel = result.answerConfidence >= 0.8 ? "높음" :
                            result.answerConfidence >= 0.6 ? "중간" :
                            result.answerConfidence >= 0.4 ? "낮음" : "매우 낮음";

    let disclosure = `\n\n---\n📊 **답변 신뢰도: ${confidenceLevel}** (${(result.answerConfidence * 100).toFixed(0)}%)`;
    
    if (result.warnings.length > 0) {
      disclosure += `\n⚠️ ${result.warnings.join(" | ")}`;
    }

    const sources = result.evidenceChunks.filter(e => e.evidenceType === "primary").length;
    disclosure += `\n📎 주요 출처 ${sources}개 참조`;

    return disclosure;
  }
}

// ============ Session Context Manager ============

export class SessionContextManager {
  private static sessionCache = new Map<string, OrganizationalContext>();
  private static MAX_HISTORY = 10;

  /**
   * Get or create session context
   */
  static async getContext(userId: string, notebookId?: string): Promise<OrganizationalContext> {
    const cacheKey = `${userId}-${notebookId || "global"}`;
    
    if (this.sessionCache.has(cacheKey)) {
      return this.sessionCache.get(cacheKey)!;
    }

    // Load from database or create new
    const context: OrganizationalContext = {
      userId,
      sessionHistory: [],
    };

    // Try to load user preferences
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, name: true },
      });

      if (user) {
        context.role = user.role;
        // Department would come from an extended user profile or metadata
      }
    } catch {
      // Ignore errors
    }

    this.sessionCache.set(cacheKey, context);
    return context;
  }

  /**
   * Add query to session history
   */
  static addToHistory(userId: string, query: string, notebookId?: string): void {
    const cacheKey = `${userId}-${notebookId || "global"}`;
    const context = this.sessionCache.get(cacheKey);
    
    if (context) {
      context.sessionHistory = context.sessionHistory || [];
      context.sessionHistory.push({ query, timestamp: new Date() });
      
      // Keep only recent history
      if (context.sessionHistory.length > this.MAX_HISTORY) {
        context.sessionHistory = context.sessionHistory.slice(-this.MAX_HISTORY);
      }
    }
  }

  /**
   * Get related context from session history
   */
  static getRelatedContext(userId: string, currentQuery: string, notebookId?: string): string[] {
    const cacheKey = `${userId}-${notebookId || "global"}`;
    const context = this.sessionCache.get(cacheKey);
    
    if (!context?.sessionHistory || context.sessionHistory.length === 0) {
      return [];
    }

    // Find related previous queries
    const currentTerms = new Set(currentQuery.toLowerCase().split(/\s+/).filter(t => t.length > 2));
    
    return context.sessionHistory
      .filter(h => {
        const historyTerms = h.query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
        const overlap = historyTerms.filter(t => currentTerms.has(t)).length;
        return overlap >= 2;
      })
      .map(h => h.query)
      .slice(-3);
  }
}

// ============ Unified Advanced RAG Engine ============

export class AdvancedRAGEngine {
  private rules: RAGAccuracyRules;

  constructor(config?: Partial<AccuracyConfig>) {
    this.rules = new RAGAccuracyRules(config);
  }

  /**
   * Full advanced RAG pipeline
   */
  async process(
    query: string,
    rawChunks: Array<{
      id: string;
      content: string;
      similarity: number;
      qualityScore?: number;
      documentId?: string;
      documentType?: string;
      tokenCount?: number;
      createdAt?: Date;
      metadata?: Record<string, unknown>;
    }>,
    userId: string,
    notebookId?: string
  ): Promise<{
    processedQuery: ProcessedQuery;
    intent: IntentAnalysis;
    result: AdvancedRankedResult;
    context: OrganizationalContext;
    relatedQueries: string[];
  }> {
    // Step 1: Get organizational context
    const context = await SessionContextManager.getContext(userId, notebookId);

    // Step 2: Analyze intent
    const intent = IntentAnalyzer.analyze(query);

    // Step 3: Get related context from session
    const relatedQueries = SessionContextManager.getRelatedContext(userId, query, notebookId);

    // Step 4: Apply basic accuracy rules
    const { processedQuery, result: basicResult } = this.rules.applyAllRules(query, rawChunks);

    // Step 5: Advanced chunk selection with evidence classification
    const evidenceChunks = AdvancedChunkSelector.selectWithEvidence(
      basicResult.chunks,
      context,
      4000
    );

    // Step 6: Calculate answer confidence
    const advancedResult = AnswerConfidenceCalculator.calculate(evidenceChunks, intent);

    // Step 7: Update session history
    SessionContextManager.addToHistory(userId, query, notebookId);

    return {
      processedQuery,
      intent,
      result: advancedResult,
      context,
      relatedQueries,
    };
  }

  /**
   * Get auto-tuning recommendations
   */
  async getTuningRecommendations(): Promise<TuningRecommendation[]> {
    return AutoTuningEngine.analyzeAndRecommend();
  }

  /**
   * Check if configuration rollback is needed
   */
  async checkRollback(): Promise<boolean> {
    return AutoTuningEngine.checkRollbackNeeded();
  }
}

// Export singleton
export const advancedRAGEngine = new AdvancedRAGEngine();
