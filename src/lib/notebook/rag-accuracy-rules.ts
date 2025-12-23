/**
 * RAG Accuracy Rules Engine
 * Controls search accuracy through query processing, chunk selection,
 * similarity scoring, and answer generation rules
 */

// ============ Types ============

export type RulePriority = 1 | 2 | 3 | 4; // 1=Hard Filter, 2=Quality, 3=Similarity, 4=Feedback

export interface RuleResult {
  ruleId: string;
  ruleName: string;
  applied: boolean;
  effect: "include" | "exclude" | "boost" | "penalize" | "transform";
  weight?: number;
  reason?: string;
}

export interface ProcessedQuery {
  original: string;
  processed: string;
  expandedTerms: string[];
  removedStopwords: string[];
  queryType: QueryType;
  appliedRules: RuleResult[];
}

export type QueryType = "definition" | "comparison" | "procedure" | "factual" | "general";

export interface ChunkWithScore {
  id: string;
  content: string;
  similarity: number;
  qualityScore: number;
  documentId: string;
  documentType: string;
  tokenCount: number;
  createdAt: Date;
  metadata: Record<string, unknown>;
  // Computed scores
  adjustedScore: number;
  appliedRules: RuleResult[];
  isFiltered: boolean;
  filterReason?: string;
}

export interface RankedResult {
  chunks: ChunkWithScore[];
  totalFound: number;
  filtered: number;
  appliedRules: RuleResult[];
}

export interface AccuracyConfig {
  // Query Preprocessing
  enableSynonymExpansion: boolean;
  enableStopwordRemoval: boolean;
  enableQueryTypeClassification: boolean;
  maxQueryLength: number;
  
  // Chunk Selection
  minQualityScore: number;
  minSimilarity: number;
  minTokenCount: number;
  maxTokenCount: number;
  preferRecentDocs: boolean;
  recentDocBoost: number;
  approvedDocBoost: number;
  
  // Similarity Adjustment
  adjacentChunkBonus: number;
  duplicatePenalty: number;
  
  // Answer Generation
  maxReferenceChunks: number;
  diversityWeight: number;
  qualityPriorityWeight: number;
  
  // Hybrid Search
  keywordMatchBoost: number;
  vectorWeight: number;
  keywordWeight: number;
}

// ============ Default Configuration ============

export const DEFAULT_ACCURACY_CONFIG: AccuracyConfig = {
  // Query Preprocessing
  enableSynonymExpansion: true,
  enableStopwordRemoval: true,
  enableQueryTypeClassification: true,
  maxQueryLength: 500,
  
  // Chunk Selection
  minQualityScore: 40,
  minSimilarity: 0.3,
  minTokenCount: 20,
  maxTokenCount: 1000,
  preferRecentDocs: true,
  recentDocBoost: 0.05,
  approvedDocBoost: 0.1,
  
  // Similarity Adjustment
  adjacentChunkBonus: 0.03,
  duplicatePenalty: 0.15,
  
  // Answer Generation
  maxReferenceChunks: 5,
  diversityWeight: 0.2,
  qualityPriorityWeight: 0.3,
  
  // Hybrid Search
  keywordMatchBoost: 0.1,
  vectorWeight: 0.7,
  keywordWeight: 0.3,
};

// ============ Domain Dictionary ============

const DOMAIN_SYNONYMS: Record<string, string[]> = {
  "정보보안": ["보안", "시큐리티", "security", "정보보호"],
  "비밀번호": ["패스워드", "password", "암호"],
  "인증": ["로그인", "login", "authentication", "인가"],
  "데이터": ["정보", "자료", "data"],
  "시스템": ["플랫폼", "체계", "system"],
  "정책": ["규정", "규칙", "policy", "지침"],
  "프로세스": ["절차", "과정", "process", "워크플로우"],
  "서버": ["서비스", "server", "인프라"],
  "클라우드": ["cloud", "CSP", "AWS", "Azure", "GCP"],
};

const STOPWORDS = new Set([
  "이", "가", "은", "는", "을", "를", "의", "에", "와", "과",
  "으로", "로", "에서", "까지", "부터", "에게", "한테", "께",
  "도", "만", "뿐", "조차", "마저", "입니다", "합니다", "있습니다",
  "the", "a", "an", "is", "are", "was", "were", "be", "been",
  "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "must", "shall",
  "무엇", "어떻게", "왜", "언제", "어디서", "누가",
]);

// ============ Main Rules Engine ============

export class RAGAccuracyRules {
  private config: AccuracyConfig;

  constructor(config: Partial<AccuracyConfig> = {}) {
    this.config = { ...DEFAULT_ACCURACY_CONFIG, ...config };
  }

  // ========== Query Preprocessing Rules ==========

  /**
   * Process query with all preprocessing rules
   */
  processQuery(query: string): ProcessedQuery {
    const appliedRules: RuleResult[] = [];
    let processed = query.trim();
    let expandedTerms: string[] = [];
    let removedStopwords: string[] = [];

    // Rule 1: Length normalization
    if (processed.length > this.config.maxQueryLength) {
      processed = processed.substring(0, this.config.maxQueryLength);
      appliedRules.push({
        ruleId: "query-length",
        ruleName: "Query Length Normalization",
        applied: true,
        effect: "transform",
        reason: `Query truncated to ${this.config.maxQueryLength} chars`,
      });
    }

    // Rule 2: Stopword removal
    if (this.config.enableStopwordRemoval) {
      const words = processed.split(/\s+/);
      const filtered = words.filter(word => {
        const isStopword = STOPWORDS.has(word.toLowerCase());
        if (isStopword) removedStopwords.push(word);
        return !isStopword || word.length > 3; // Keep longer words even if stopword
      });
      processed = filtered.join(" ");
      
      if (removedStopwords.length > 0) {
        appliedRules.push({
          ruleId: "stopword-removal",
          ruleName: "Stopword Removal",
          applied: true,
          effect: "transform",
          reason: `Removed ${removedStopwords.length} stopwords`,
        });
      }
    }

    // Rule 3: Synonym expansion
    if (this.config.enableSynonymExpansion) {
      for (const [term, synonyms] of Object.entries(DOMAIN_SYNONYMS)) {
        if (processed.includes(term)) {
          expandedTerms.push(...synonyms);
        }
        for (const synonym of synonyms) {
          if (processed.includes(synonym)) {
            expandedTerms.push(term);
            break;
          }
        }
      }
      expandedTerms = [...new Set(expandedTerms)];
      
      if (expandedTerms.length > 0) {
        appliedRules.push({
          ruleId: "synonym-expansion",
          ruleName: "Domain Synonym Expansion",
          applied: true,
          effect: "boost",
          reason: `Expanded with ${expandedTerms.length} terms`,
        });
      }
    }

    // Rule 4: Query type classification
    const queryType = this.config.enableQueryTypeClassification
      ? this.classifyQueryType(query)
      : "general";

    appliedRules.push({
      ruleId: "query-type",
      ruleName: "Query Type Classification",
      applied: true,
      effect: "transform",
      reason: `Classified as: ${queryType}`,
    });

    return {
      original: query,
      processed,
      expandedTerms,
      removedStopwords,
      queryType,
      appliedRules,
    };
  }

  /**
   * Classify query type for optimized chunk selection
   */
  private classifyQueryType(query: string): QueryType {
    const lowerQuery = query.toLowerCase();
    
    // Definition patterns
    if (/무엇|정의|뜻|의미|what is|define/.test(lowerQuery)) {
      return "definition";
    }
    
    // Comparison patterns
    if (/vs|비교|차이|versus|compare|different/.test(lowerQuery)) {
      return "comparison";
    }
    
    // Procedure patterns
    if (/어떻게|방법|절차|단계|how to|steps|process/.test(lowerQuery)) {
      return "procedure";
    }
    
    // Factual patterns
    if (/언제|어디|누가|몇|when|where|who|how many|how much/.test(lowerQuery)) {
      return "factual";
    }
    
    return "general";
  }

  // ========== Chunk Selection Rules ==========

  /**
   * Apply chunk selection rules (Hard Filters - Priority 1)
   */
  applyChunkSelectionRules(
    chunks: Array<{
      id: string;
      content: string;
      similarity: number;
      qualityScore?: number;
      documentId?: string;
      documentType?: string;
      tokenCount?: number;
      createdAt?: Date;
      metadata?: Record<string, unknown>;
    }>
  ): ChunkWithScore[] {
    return chunks.map(chunk => {
      const appliedRules: RuleResult[] = [];
      let isFiltered = false;
      let filterReason: string | undefined;
      let adjustedScore = chunk.similarity;
      const qualityScore = chunk.qualityScore || 70;
      const tokenCount = chunk.tokenCount || Math.ceil(chunk.content.length / 4);

      // Hard Filter 1: Minimum similarity threshold
      if (chunk.similarity < this.config.minSimilarity) {
        isFiltered = true;
        filterReason = `Similarity ${(chunk.similarity * 100).toFixed(0)}% below threshold`;
        appliedRules.push({
          ruleId: "min-similarity",
          ruleName: "Minimum Similarity Filter",
          applied: true,
          effect: "exclude",
          reason: filterReason,
        });
      }

      // Hard Filter 2: Minimum quality score
      if (qualityScore < this.config.minQualityScore) {
        isFiltered = true;
        filterReason = `Quality score ${qualityScore} below threshold`;
        appliedRules.push({
          ruleId: "min-quality",
          ruleName: "Minimum Quality Filter",
          applied: true,
          effect: "exclude",
          reason: filterReason,
        });
      }

      // Hard Filter 3: Token count range
      if (tokenCount < this.config.minTokenCount) {
        isFiltered = true;
        filterReason = `Token count ${tokenCount} below minimum`;
        appliedRules.push({
          ruleId: "min-tokens",
          ruleName: "Minimum Token Filter",
          applied: true,
          effect: "exclude",
          reason: filterReason,
        });
      }
      
      if (tokenCount > this.config.maxTokenCount) {
        // Penalize instead of exclude for oversized chunks
        adjustedScore *= 0.9;
        appliedRules.push({
          ruleId: "max-tokens",
          ruleName: "Maximum Token Penalty",
          applied: true,
          effect: "penalize",
          weight: 0.9,
          reason: `Token count ${tokenCount} above optimal`,
        });
      }

      // Quality Score Boost (Priority 2)
      if (!isFiltered && qualityScore >= 80) {
        const boost = 1 + (qualityScore - 80) * 0.005; // Up to 10% boost
        adjustedScore *= boost;
        appliedRules.push({
          ruleId: "quality-boost",
          ruleName: "High Quality Boost",
          applied: true,
          effect: "boost",
          weight: boost,
          reason: `Quality score ${qualityScore} boosted`,
        });
      }

      // Document recency boost
      if (!isFiltered && this.config.preferRecentDocs && chunk.createdAt) {
        const ageInDays = (Date.now() - new Date(chunk.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (ageInDays < 30) {
          adjustedScore *= (1 + this.config.recentDocBoost);
          appliedRules.push({
            ruleId: "recent-doc",
            ruleName: "Recent Document Boost",
            applied: true,
            effect: "boost",
            weight: 1 + this.config.recentDocBoost,
            reason: `Document created ${Math.round(ageInDays)} days ago`,
          });
        }
      }

      // Approved document boost
      if (!isFiltered && chunk.metadata?.isApproved) {
        adjustedScore *= (1 + this.config.approvedDocBoost);
        appliedRules.push({
          ruleId: "approved-doc",
          ruleName: "Approved Document Boost",
          applied: true,
          effect: "boost",
          weight: 1 + this.config.approvedDocBoost,
          reason: "Document is approved",
        });
      }

      return {
        id: chunk.id,
        content: chunk.content,
        similarity: chunk.similarity,
        qualityScore,
        documentId: chunk.documentId || "",
        documentType: chunk.documentType || "GENERAL",
        tokenCount,
        createdAt: chunk.createdAt || new Date(),
        metadata: chunk.metadata || {},
        adjustedScore: Math.min(1, adjustedScore), // Cap at 1.0
        appliedRules,
        isFiltered,
        filterReason,
      };
    });
  }

  // ========== Similarity Adjustment Rules ==========

  /**
   * Apply similarity adjustment rules (Priority 3)
   */
  applySimilarityAdjustments(chunks: ChunkWithScore[]): ChunkWithScore[] {
    // Group by document for adjacent chunk detection
    const docGroups = new Map<string, ChunkWithScore[]>();
    for (const chunk of chunks) {
      if (!chunk.isFiltered) {
        const group = docGroups.get(chunk.documentId) || [];
        group.push(chunk);
        docGroups.set(chunk.documentId, group);
      }
    }

    // Apply adjacent chunk bonus
    for (const [docId, docChunks] of docGroups) {
      if (docChunks.length > 1) {
        // Sort by metadata position if available
        docChunks.sort((a, b) => {
          const posA = (a.metadata?.position as number) || 0;
          const posB = (b.metadata?.position as number) || 0;
          return posA - posB;
        });

        for (let i = 1; i < docChunks.length; i++) {
          const posA = (docChunks[i - 1].metadata?.position as number) || 0;
          const posB = (docChunks[i].metadata?.position as number) || 0;
          
          if (posB - posA === 1) { // Adjacent
            docChunks[i].adjustedScore *= (1 + this.config.adjacentChunkBonus);
            docChunks[i].appliedRules.push({
              ruleId: "adjacent-bonus",
              ruleName: "Adjacent Chunk Bonus",
              applied: true,
              effect: "boost",
              weight: 1 + this.config.adjacentChunkBonus,
              reason: `Adjacent to chunk at position ${posA}`,
            });
          }
        }
      }
    }

    // Apply duplicate penalty
    const seenContent = new Map<string, ChunkWithScore>();
    for (const chunk of chunks) {
      if (chunk.isFiltered) continue;
      
      // Simple content hash for duplication detection
      const contentKey = chunk.content.substring(0, 100).toLowerCase().replace(/\s+/g, " ");
      const existing = seenContent.get(contentKey);
      
      if (existing) {
        // Penalize the lower-scoring duplicate
        if (chunk.adjustedScore < existing.adjustedScore) {
          chunk.adjustedScore *= (1 - this.config.duplicatePenalty);
          chunk.appliedRules.push({
            ruleId: "duplicate-penalty",
            ruleName: "Duplicate Content Penalty",
            applied: true,
            effect: "penalize",
            weight: 1 - this.config.duplicatePenalty,
            reason: `Similar to chunk ${existing.id}`,
          });
        } else {
          existing.adjustedScore *= (1 - this.config.duplicatePenalty);
          existing.appliedRules.push({
            ruleId: "duplicate-penalty",
            ruleName: "Duplicate Content Penalty",
            applied: true,
            effect: "penalize",
            weight: 1 - this.config.duplicatePenalty,
            reason: `Similar to chunk ${chunk.id}`,
          });
          seenContent.set(contentKey, chunk);
        }
      } else {
        seenContent.set(contentKey, chunk);
      }
    }

    return chunks;
  }

  // ========== Hybrid Search Rules ==========

  /**
   * Apply hybrid search scoring
   */
  applyHybridScoring(
    chunks: ChunkWithScore[],
    query: ProcessedQuery
  ): ChunkWithScore[] {
    const queryTerms = query.processed.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const allTerms = [...queryTerms, ...query.expandedTerms.map(t => t.toLowerCase())];

    for (const chunk of chunks) {
      if (chunk.isFiltered) continue;

      const contentLower = chunk.content.toLowerCase();
      let keywordScore = 0;

      // Count keyword matches
      for (const term of allTerms) {
        if (contentLower.includes(term)) {
          keywordScore += 1;
        }
      }

      // Exact phrase match bonus
      if (contentLower.includes(query.processed.toLowerCase())) {
        keywordScore += 3;
      }

      // Normalize keyword score
      const normalizedKeywordScore = Math.min(1, keywordScore / Math.max(allTerms.length, 1));

      // Combine scores
      const vectorScore = chunk.similarity * this.config.vectorWeight;
      const keywordContribution = normalizedKeywordScore * this.config.keywordWeight;
      const hybridBoost = keywordContribution * this.config.keywordMatchBoost;

      chunk.adjustedScore = chunk.adjustedScore + hybridBoost;

      if (hybridBoost > 0.01) {
        chunk.appliedRules.push({
          ruleId: "hybrid-keyword",
          ruleName: "Keyword Match Boost",
          applied: true,
          effect: "boost",
          weight: 1 + hybridBoost,
          reason: `${keywordScore} keyword matches`,
        });
      }
    }

    return chunks;
  }

  // ========== Answer Generation Rules ==========

  /**
   * Select chunks for answer generation with diversity and quality rules
   */
  selectForAnswer(chunks: ChunkWithScore[]): RankedResult {
    const validChunks = chunks.filter(c => !c.isFiltered);
    const appliedRules: RuleResult[] = [];
    
    // Sort by adjusted score
    validChunks.sort((a, b) => b.adjustedScore - a.adjustedScore);

    // Apply diversity rule - limit chunks from same document
    const selectedChunks: ChunkWithScore[] = [];
    const docCounts = new Map<string, number>();
    const maxPerDoc = Math.max(2, Math.floor(this.config.maxReferenceChunks / 2));

    for (const chunk of validChunks) {
      if (selectedChunks.length >= this.config.maxReferenceChunks) break;

      const docCount = docCounts.get(chunk.documentId) || 0;
      if (docCount >= maxPerDoc) {
        appliedRules.push({
          ruleId: "diversity-limit",
          ruleName: "Document Diversity Limit",
          applied: true,
          effect: "exclude",
          reason: `Document ${chunk.documentId} already has ${docCount} chunks`,
        });
        continue;
      }

      selectedChunks.push(chunk);
      docCounts.set(chunk.documentId, docCount + 1);
    }

    // Apply max reference chunks rule
    if (selectedChunks.length > this.config.maxReferenceChunks) {
      appliedRules.push({
        ruleId: "max-chunks",
        ruleName: "Maximum Reference Chunks",
        applied: true,
        effect: "exclude",
        reason: `Limited to ${this.config.maxReferenceChunks} chunks`,
      });
    }

    return {
      chunks: selectedChunks,
      totalFound: chunks.length,
      filtered: chunks.length - validChunks.length,
      appliedRules,
    };
  }

  // ========== Full Pipeline ==========

  /**
   * Apply all accuracy rules in correct priority order
   */
  applyAllRules(
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
    }>
  ): { processedQuery: ProcessedQuery; result: RankedResult } {
    // Step 1: Query preprocessing
    const processedQuery = this.processQuery(query);

    // Step 2: Chunk selection rules (Priority 1 & 2)
    let chunks = this.applyChunkSelectionRules(rawChunks);

    // Step 3: Similarity adjustments (Priority 3)
    chunks = this.applySimilarityAdjustments(chunks);

    // Step 4: Hybrid search scoring
    chunks = this.applyHybridScoring(chunks, processedQuery);

    // Step 5: Select for answer generation
    const result = this.selectForAnswer(chunks);

    return { processedQuery, result };
  }

  // ========== Configuration ==========

  getConfig(): AccuracyConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<AccuracyConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// Export singleton instance
export const ragAccuracyRules = new RAGAccuracyRules();

// ============ Utility Functions ============

/**
 * Get human-readable rule summary
 */
export function getRuleSummary(rules: RuleResult[]): string {
  const applied = rules.filter(r => r.applied);
  const boosts = applied.filter(r => r.effect === "boost").length;
  const penalties = applied.filter(r => r.effect === "penalize").length;
  const filters = applied.filter(r => r.effect === "exclude").length;
  
  return `${applied.length} rules: ${boosts} boosts, ${penalties} penalties, ${filters} filters`;
}

/**
 * Get rule effect color
 */
export function getRuleColor(effect: RuleResult["effect"]): string {
  switch (effect) {
    case "boost": return "#22c55e";
    case "penalize": return "#f97316";
    case "exclude": return "#ef4444";
    case "include": return "#3b82f6";
    case "transform": return "#8b5cf6";
  }
}
