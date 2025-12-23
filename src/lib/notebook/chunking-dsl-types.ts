/**
 * Chunking DSL Types - Document-type-specific chunking rules
 * Supports automatic detection, admin override, and reproducibility
 */

// ============ Document Types ============
export type DocumentType = 
  | "POLICY"      // 정책·규정 문서
  | "TECHNICAL"   // 기술 문서
  | "REPORT"      // 보고서 문서
  | "WEB"         // 웹 문서
  | "OCR"         // OCR 스캔 문서
  | "GENERAL";    // 일반 문서 (폴백)

// ============ Detection Conditions ============
export type DetectionCondition =
  | "HAS_ARTICLE_NUMBER"
  | "HAS_SECTION_KEYWORDS"
  | "HAS_CODE_BLOCK"
  | "HAS_MARKDOWN"
  | "HAS_SUMMARY"
  | "HAS_CONCLUSION"
  | "HAS_HTML_TAGS"
  | "LOW_STRUCTURE"
  | "LINE_BREAK_NOISE";

// ============ Chunking Strategies ============
export type ChunkingStrategy =
  | "ARTICLE_BASED"           // 조항 기반
  | "HEADING_BASED"           // 제목 기반
  | "SECTION_BASED"           // 섹션 기반
  | "CODE_BLOCK_SEPARATION"   // 코드 블록 분리
  | "SEMANTIC_PARAGRAPH"      // 의미 문단
  | "DOM_BLOCK"               // DOM 블록
  | "SENTENCE_RECONSTRUCTION" // 문장 재구성
  | "SENTENCE_BASED"          // 문장 기반
  | "PARAGRAPH_BASED"         // 단락 기반
  | "TEXT_FLOW"               // 텍스트 흐름
  | "FIXED_SIZE";             // 고정 크기

// ============ Preserve Elements ============
export type PreserveElement =
  | "ARTICLE_TITLE"
  | "CLAUSE_NUMBER"
  | "CODE_BLOCK"
  | "SECTION_TITLE"
  | "FIGURE_CAPTION"
  | "HTML_HEADING"
  | "LINK_TEXT"
  | "LINE_ORDER";

// ============ Metadata Fields ============
export type MetadataField =
  | "DOCUMENT_NAME"
  | "ARTICLE_ID"
  | "POSITION"
  | "LANGUAGE"
  | "CODE_TYPE"
  | "SECTION_NAME"
  | "PAGE_NUMBER"
  | "URL"
  | "DOM_PATH"
  | "OCR_CONFIDENCE";

// ============ DSL Interfaces ============

export interface DetectConfig {
  conditions: DetectionCondition[];
}

export interface ChunkStrategyConfig {
  primary: ChunkingStrategy;
  secondary: ChunkingStrategy;
}

export interface SizeConfig {
  minTokens: number;
  maxTokens: number;
  overlapTokens: number;
}

export interface MergeConfig {
  similarityThreshold: number;
  minParagraphs: number;
}

export interface FallbackConfig {
  strategy: ChunkingStrategy;
}

export interface MetadataConfig {
  include: MetadataField[];
}

export interface ChunkingRule {
  documentType: DocumentType;
  detect: DetectConfig;
  chunkStrategy: ChunkStrategyConfig;
  size: SizeConfig;
  merge: MergeConfig;
  preserve: { elements: PreserveElement[] };
  fallback: FallbackConfig;
  metadata: MetadataConfig;
}

// ============ Admin Override ============
export interface ChunkingRuleOverride {
  notebookId?: string;
  documentType: DocumentType;
  overrides: Partial<{
    size: Partial<SizeConfig>;
    merge: Partial<MergeConfig>;
    chunkStrategy: Partial<ChunkStrategyConfig>;
  }>;
}

// ============ Default Rules ============
export const DEFAULT_CHUNKING_RULES: Record<DocumentType, ChunkingRule> = {
  POLICY: {
    documentType: "POLICY",
    detect: {
      conditions: ["HAS_ARTICLE_NUMBER", "HAS_SECTION_KEYWORDS"]
    },
    chunkStrategy: {
      primary: "ARTICLE_BASED",
      secondary: "HEADING_BASED"
    },
    size: {
      minTokens: 150,
      maxTokens: 400,
      overlapTokens: 50
    },
    merge: {
      similarityThreshold: 0.85,
      minParagraphs: 1
    },
    preserve: {
      elements: ["ARTICLE_TITLE", "CLAUSE_NUMBER"]
    },
    fallback: {
      strategy: "SEMANTIC_PARAGRAPH"
    },
    metadata: {
      include: ["DOCUMENT_NAME", "ARTICLE_ID", "POSITION"]
    }
  },

  TECHNICAL: {
    documentType: "TECHNICAL",
    detect: {
      conditions: ["HAS_CODE_BLOCK", "HAS_MARKDOWN"]
    },
    chunkStrategy: {
      primary: "SECTION_BASED",
      secondary: "CODE_BLOCK_SEPARATION"
    },
    size: {
      minTokens: 120,
      maxTokens: 350,
      overlapTokens: 40
    },
    merge: {
      similarityThreshold: 0.8,
      minParagraphs: 2
    },
    preserve: {
      elements: ["CODE_BLOCK", "SECTION_TITLE"]
    },
    fallback: {
      strategy: "SEMANTIC_PARAGRAPH"
    },
    metadata: {
      include: ["LANGUAGE", "CODE_TYPE", "POSITION"]
    }
  },

  REPORT: {
    documentType: "REPORT",
    detect: {
      conditions: ["HAS_SUMMARY", "HAS_CONCLUSION"]
    },
    chunkStrategy: {
      primary: "SECTION_BASED",
      secondary: "SEMANTIC_PARAGRAPH"
    },
    size: {
      minTokens: 200,
      maxTokens: 500,
      overlapTokens: 80
    },
    merge: {
      similarityThreshold: 0.75,
      minParagraphs: 2
    },
    preserve: {
      elements: ["SECTION_TITLE", "FIGURE_CAPTION"]
    },
    fallback: {
      strategy: "PARAGRAPH_BASED"
    },
    metadata: {
      include: ["SECTION_NAME", "PAGE_NUMBER"]
    }
  },

  WEB: {
    documentType: "WEB",
    detect: {
      conditions: ["HAS_HTML_TAGS"]
    },
    chunkStrategy: {
      primary: "DOM_BLOCK",
      secondary: "SEMANTIC_PARAGRAPH"
    },
    size: {
      minTokens: 100,
      maxTokens: 300,
      overlapTokens: 30
    },
    merge: {
      similarityThreshold: 0.7,
      minParagraphs: 2
    },
    preserve: {
      elements: ["HTML_HEADING", "LINK_TEXT"]
    },
    fallback: {
      strategy: "TEXT_FLOW"
    },
    metadata: {
      include: ["URL", "DOM_PATH"]
    }
  },

  OCR: {
    documentType: "OCR",
    detect: {
      conditions: ["LOW_STRUCTURE", "LINE_BREAK_NOISE"]
    },
    chunkStrategy: {
      primary: "SEMANTIC_PARAGRAPH",
      secondary: "SENTENCE_RECONSTRUCTION"
    },
    size: {
      minTokens: 120,
      maxTokens: 300,
      overlapTokens: 60
    },
    merge: {
      similarityThreshold: 0.9,
      minParagraphs: 3
    },
    preserve: {
      elements: ["LINE_ORDER"]
    },
    fallback: {
      strategy: "SENTENCE_BASED"
    },
    metadata: {
      include: ["OCR_CONFIDENCE", "POSITION"]
    }
  },

  GENERAL: {
    documentType: "GENERAL",
    detect: {
      conditions: []
    },
    chunkStrategy: {
      primary: "PARAGRAPH_BASED",
      secondary: "SENTENCE_BASED"
    },
    size: {
      minTokens: 100,
      maxTokens: 400,
      overlapTokens: 50
    },
    merge: {
      similarityThreshold: 0.75,
      minParagraphs: 2
    },
    preserve: {
      elements: []
    },
    fallback: {
      strategy: "FIXED_SIZE"
    },
    metadata: {
      include: ["DOCUMENT_NAME", "POSITION"]
    }
  }
};

// ============ Chunk Result ============
export interface ChunkResult {
  id: string;
  content: string;
  index: number;
  tokenCount: number;
  strategy: ChunkingStrategy;
  documentType: DocumentType;
  metadata: Record<string, unknown>;
  preservedElements: PreserveElement[];
}

// ============ DSL Execution Result ============
export interface DSLExecutionResult {
  success: boolean;
  documentType: DocumentType;
  detectedConditions: DetectionCondition[];
  usedStrategy: ChunkingStrategy;
  chunks: ChunkResult[];
  appliedRule: ChunkingRule;
  overrideApplied: boolean;
  processingTimeMs: number;
}
