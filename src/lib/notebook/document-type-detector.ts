/**
 * Document Type Detector - Automatic document type detection based on content analysis
 * Supports detection conditions as defined in the chunking DSL
 */

import {
  DocumentType,
  DetectionCondition,
  DEFAULT_CHUNKING_RULES,
  ChunkingRule,
} from "./chunking-dsl-types";

export interface DetectionResult {
  documentType: DocumentType;
  matchedConditions: DetectionCondition[];
  confidence: number;
  detectionDetails: Record<string, unknown>;
}

export class DocumentTypeDetector {
  /**
   * Detect document type based on content and metadata
   */
  static detect(
    content: string,
    fileName?: string,
    mimeType?: string
  ): DetectionResult {
    const detectionDetails: Record<string, unknown> = {};
    const matchedConditions: DetectionCondition[] = [];

    // Check all detection conditions
    const conditionChecks: Record<DetectionCondition, boolean> = {
      HAS_ARTICLE_NUMBER: this.hasArticleNumber(content),
      HAS_SECTION_KEYWORDS: this.hasSectionKeywords(content),
      HAS_CODE_BLOCK: this.hasCodeBlock(content),
      HAS_MARKDOWN: this.hasMarkdown(content, fileName),
      HAS_SUMMARY: this.hasSummary(content),
      HAS_CONCLUSION: this.hasConclusion(content),
      HAS_HTML_TAGS: this.hasHtmlTags(content),
      LOW_STRUCTURE: this.hasLowStructure(content),
      LINE_BREAK_NOISE: this.hasLineBreakNoise(content),
    };

    // Collect matched conditions
    for (const [condition, matched] of Object.entries(conditionChecks)) {
      if (matched) {
        matchedConditions.push(condition as DetectionCondition);
      }
      detectionDetails[condition] = matched;
    }

    // Calculate scores for each document type
    const scores = this.calculateTypeScores(matchedConditions);
    detectionDetails.scores = scores;

    // Find best matching type
    let bestType: DocumentType = "GENERAL";
    let bestScore = 0;

    for (const [type, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestType = type as DocumentType;
      }
    }

    // Additional heuristics based on file type
    if (fileName) {
      const ext = fileName.split(".").pop()?.toLowerCase();
      if (ext === "md" || ext === "markdown") {
        if (scores.TECHNICAL < 0.5) {
          bestType = "TECHNICAL";
          bestScore = Math.max(bestScore, 0.6);
        }
      }
      if (ext === "html" || ext === "htm") {
        bestType = "WEB";
        bestScore = Math.max(bestScore, 0.8);
      }
    }

    // MIME type checks
    if (mimeType) {
      if (mimeType.includes("html")) {
        bestType = "WEB";
        bestScore = Math.max(bestScore, 0.8);
      }
      if (mimeType.includes("image") || mimeType.includes("ocr")) {
        bestType = "OCR";
        bestScore = Math.max(bestScore, 0.7);
      }
    }

    return {
      documentType: bestType,
      matchedConditions,
      confidence: bestScore,
      detectionDetails,
    };
  }

  /**
   * Get the chunking rule for a detected document type
   */
  static getRule(documentType: DocumentType): ChunkingRule {
    return DEFAULT_CHUNKING_RULES[documentType] || DEFAULT_CHUNKING_RULES.GENERAL;
  }

  /**
   * Calculate match scores for each document type based on matched conditions
   */
  private static calculateTypeScores(
    matchedConditions: DetectionCondition[]
  ): Record<DocumentType, number> {
    const scores: Record<DocumentType, number> = {
      POLICY: 0,
      TECHNICAL: 0,
      REPORT: 0,
      WEB: 0,
      OCR: 0,
      GENERAL: 0.3, // Base score for general
    };

    for (const [type, rule] of Object.entries(DEFAULT_CHUNKING_RULES)) {
      const requiredConditions = rule.detect.conditions;
      if (requiredConditions.length === 0) continue;

      const matchCount = requiredConditions.filter((c) =>
        matchedConditions.includes(c)
      ).length;
      
      scores[type as DocumentType] = matchCount / requiredConditions.length;
    }

    return scores;
  }

  // ============ Detection Condition Implementations ============

  /**
   * HAS_ARTICLE_NUMBER: Check for article/clause numbering patterns
   * e.g., "제1조", "Article 1", "1.1.1", "제2장"
   */
  private static hasArticleNumber(content: string): boolean {
    const patterns = [
      /제\d+조/g,                      // 제1조, 제2조
      /제\d+장/g,                      // 제1장, 제2장
      /제\d+항/g,                      // 제1항, 제2항
      /Article\s+\d+/gi,              // Article 1
      /Section\s+\d+/gi,              // Section 1
      /^\d+\.\d+(\.\d+)?/gm,          // 1.1.1 numbering
      /^[IVX]+\.\s/gm,                // Roman numerals
    ];

    const totalMatches = patterns.reduce((count, pattern) => {
      return count + (content.match(pattern)?.length || 0);
    }, 0);

    return totalMatches >= 3;
  }

  /**
   * HAS_SECTION_KEYWORDS: Check for policy/regulation section keywords
   */
  private static hasSectionKeywords(content: string): boolean {
    const keywords = [
      "목적", "정의", "적용범위", "의무", "책임", "벌칙", "부칙",
      "규정", "조항", "지침", "정책", "규약", "약관",
      "purpose", "definition", "scope", "obligation", "penalty",
    ];

    const lowerContent = content.toLowerCase();
    const matchCount = keywords.filter((k) => lowerContent.includes(k)).length;
    return matchCount >= 2;
  }

  /**
   * HAS_CODE_BLOCK: Check for code blocks or inline code
   */
  private static hasCodeBlock(content: string): boolean {
    const patterns = [
      /```[\s\S]*?```/g,              // Markdown code blocks
      /`[^`]+`/g,                     // Inline code
      /\bfunction\s+\w+\s*\(/g,       // JavaScript functions
      /\bdef\s+\w+\s*\(/g,            // Python functions
      /\bclass\s+\w+/g,               // Class definitions
      /\bimport\s+[\w{}]+\s+from/g,   // ES6 imports
      /\b(const|let|var)\s+\w+\s*=/g, // Variable declarations
    ];

    const totalMatches = patterns.reduce((count, pattern) => {
      return count + (content.match(pattern)?.length || 0);
    }, 0);

    return totalMatches >= 2;
  }

  /**
   * HAS_MARKDOWN: Check for markdown formatting
   */
  private static hasMarkdown(content: string, fileName?: string): boolean {
    if (fileName?.endsWith(".md")) return true;

    const patterns = [
      /^#{1,6}\s+/gm,                 // Headers
      /\*\*[^*]+\*\*/g,               // Bold
      /\*[^*]+\*/g,                   // Italic
      /\[[^\]]+\]\([^)]+\)/g,         // Links
      /^\s*[-*+]\s+/gm,               // Lists
      /^\s*\d+\.\s+/gm,               // Ordered lists
      /^>\s+/gm,                      // Blockquotes
    ];

    const totalMatches = patterns.reduce((count, pattern) => {
      return count + (content.match(pattern)?.length || 0);
    }, 0);

    return totalMatches >= 5;
  }

  /**
   * HAS_SUMMARY: Check for summary section
   */
  private static hasSummary(content: string): boolean {
    const keywords = [
      "요약", "개요", "executive summary", "summary", "abstract",
      "overview", "introduction", "서론", "tl;dr",
    ];

    const lowerContent = content.toLowerCase();
    return keywords.some((k) => lowerContent.includes(k));
  }

  /**
   * HAS_CONCLUSION: Check for conclusion section
   */
  private static hasConclusion(content: string): boolean {
    const keywords = [
      "결론", "결과", "conclusion", "결론 및 제언", "recommendations",
      "summary and conclusion", "마무리", "맺음말", "향후 과제",
    ];

    const lowerContent = content.toLowerCase();
    return keywords.some((k) => lowerContent.includes(k));
  }

  /**
   * HAS_HTML_TAGS: Check for HTML tags
   */
  private static hasHtmlTags(content: string): boolean {
    const pattern = /<[a-z][\w-]*(\s+[\w-]+(=["'][^"']*["'])?)*\s*\/?>/gi;
    const matches = content.match(pattern);
    return (matches?.length || 0) >= 3;
  }

  /**
   * LOW_STRUCTURE: Check for low text structure (OCR indicator)
   */
  private static hasLowStructure(content: string): boolean {
    const lines = content.split("\n").filter((l) => l.trim().length > 0);
    if (lines.length < 5) return false;

    // Check for irregular line lengths
    const lineLengths = lines.map((l) => l.length);
    const avgLength = lineLengths.reduce((a, b) => a + b, 0) / lineLengths.length;
    const variance = lineLengths.reduce((sum, l) => sum + Math.pow(l - avgLength, 2), 0) / lineLengths.length;
    const stdDev = Math.sqrt(variance);

    // High variance in line lengths indicates OCR
    return stdDev > avgLength * 0.5;
  }

  /**
   * LINE_BREAK_NOISE: Check for noisy line breaks (OCR indicator)
   */
  private static hasLineBreakNoise(content: string): boolean {
    // Check for lines that break mid-word or have excessive short lines
    const lines = content.split("\n");
    let noiseCount = 0;

    for (let i = 0; i < lines.length - 1; i++) {
      const currentLine = lines[i].trim();
      const nextLine = lines[i + 1].trim();

      // Line ends without punctuation and next line starts lowercase
      if (
        currentLine.length > 0 &&
        !/[.!?:;,]$/.test(currentLine) &&
        nextLine.length > 0 &&
        /^[a-z가-힣]/.test(nextLine)
      ) {
        noiseCount++;
      }
    }

    return noiseCount > lines.length * 0.2;
  }
}
