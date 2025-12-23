/**
 * Chunking DSL Engine - Execute chunking rules based on document type
 * Implements multiple chunking strategies with fallback support
 */

import {
  ChunkingRule,
  ChunkingStrategy,
  ChunkResult,
  DSLExecutionResult,
  DocumentType,
  PreserveElement,
  MetadataField,
  ChunkingRuleOverride,
  DEFAULT_CHUNKING_RULES,
} from "./chunking-dsl-types";
import { DocumentTypeDetector, DetectionResult } from "./document-type-detector";
import { v4 as uuidv4 } from "uuid";

export class ChunkingDSLEngine {
  private overrides: ChunkingRuleOverride[] = [];

  /**
   * Execute chunking DSL on content
   */
  async execute(
    content: string,
    options: {
      fileName?: string;
      mimeType?: string;
      notebookId?: string;
      forceDocumentType?: DocumentType;
    } = {}
  ): Promise<DSLExecutionResult> {
    const startTime = Date.now();

    // Step 1: Detect document type
    let detection: DetectionResult;
    if (options.forceDocumentType) {
      detection = {
        documentType: options.forceDocumentType,
        matchedConditions: [],
        confidence: 1.0,
        detectionDetails: { forced: true },
      };
    } else {
      detection = DocumentTypeDetector.detect(
        content,
        options.fileName,
        options.mimeType
      );
    }

    // Step 2: Get rule for document type
    let rule = this.getRule(detection.documentType);
    let overrideApplied = false;

    // Step 3: Apply overrides if any
    if (options.notebookId || detection.documentType) {
      const appliedOverride = this.findOverride(
        options.notebookId,
        detection.documentType
      );
      if (appliedOverride) {
        rule = this.applyOverride(rule, appliedOverride);
        overrideApplied = true;
      }
    }

    // Step 4: Execute primary strategy
    let chunks: ChunkResult[] = [];
    let usedStrategy = rule.chunkStrategy.primary;

    try {
      chunks = await this.executeStrategy(
        content,
        rule.chunkStrategy.primary,
        rule
      );
    } catch (error) {
      console.warn(`Primary strategy ${rule.chunkStrategy.primary} failed:`, error);
    }

    // Step 5: If primary fails or produces poor results, try secondary
    if (chunks.length === 0 || this.isChunkingPoor(chunks, rule)) {
      try {
        chunks = await this.executeStrategy(
          content,
          rule.chunkStrategy.secondary,
          rule
        );
        usedStrategy = rule.chunkStrategy.secondary;
      } catch (error) {
        console.warn(`Secondary strategy ${rule.chunkStrategy.secondary} failed:`, error);
      }
    }

    // Step 6: If still failing, use fallback
    if (chunks.length === 0) {
      chunks = await this.executeStrategy(
        content,
        rule.fallback.strategy,
        rule
      );
      usedStrategy = rule.fallback.strategy;
    }

    // Step 7: Enrich chunks with metadata
    chunks = this.enrichChunksWithMetadata(
      chunks,
      detection.documentType,
      usedStrategy,
      rule.metadata.include,
      options.fileName
    );

    return {
      success: chunks.length > 0,
      documentType: detection.documentType,
      detectedConditions: detection.matchedConditions,
      usedStrategy,
      chunks,
      appliedRule: rule,
      overrideApplied,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Add an override rule
   */
  addOverride(override: ChunkingRuleOverride): void {
    this.overrides.push(override);
  }

  /**
   * Clear all overrides
   */
  clearOverrides(): void {
    this.overrides = [];
  }

  // ============ Private Methods ============

  private getRule(documentType: DocumentType): ChunkingRule {
    return DEFAULT_CHUNKING_RULES[documentType] || DEFAULT_CHUNKING_RULES.GENERAL;
  }

  private findOverride(
    notebookId?: string,
    documentType?: DocumentType
  ): ChunkingRuleOverride | undefined {
    // First try to find notebook-specific override
    if (notebookId) {
      const notebookOverride = this.overrides.find(
        (o) => o.notebookId === notebookId
      );
      if (notebookOverride) return notebookOverride;
    }

    // Then try document type override
    if (documentType) {
      return this.overrides.find(
        (o) => o.documentType === documentType && !o.notebookId
      );
    }

    return undefined;
  }

  private applyOverride(
    rule: ChunkingRule,
    override: ChunkingRuleOverride
  ): ChunkingRule {
    return {
      ...rule,
      size: {
        ...rule.size,
        ...(override.overrides.size || {}),
      },
      merge: {
        ...rule.merge,
        ...(override.overrides.merge || {}),
      },
      chunkStrategy: {
        ...rule.chunkStrategy,
        ...(override.overrides.chunkStrategy || {}),
      },
    };
  }

  private isChunkingPoor(chunks: ChunkResult[], rule: ChunkingRule): boolean {
    // Check if most chunks are too small or too large
    const badChunks = chunks.filter(
      (c) =>
        c.tokenCount < rule.size.minTokens * 0.5 ||
        c.tokenCount > rule.size.maxTokens * 1.5
    );
    return badChunks.length > chunks.length * 0.3;
  }

  private async executeStrategy(
    content: string,
    strategy: ChunkingStrategy,
    rule: ChunkingRule
  ): Promise<ChunkResult[]> {
    switch (strategy) {
      case "ARTICLE_BASED":
        return this.chunkByArticle(content, rule);
      case "HEADING_BASED":
        return this.chunkByHeading(content, rule);
      case "SECTION_BASED":
        return this.chunkBySection(content, rule);
      case "CODE_BLOCK_SEPARATION":
        return this.chunkWithCodeSeparation(content, rule);
      case "SEMANTIC_PARAGRAPH":
        return this.chunkBySemanticParagraph(content, rule);
      case "DOM_BLOCK":
        return this.chunkByDOMBlock(content, rule);
      case "SENTENCE_RECONSTRUCTION":
        return this.chunkBySentenceReconstruction(content, rule);
      case "SENTENCE_BASED":
        return this.chunkBySentence(content, rule);
      case "PARAGRAPH_BASED":
        return this.chunkByParagraph(content, rule);
      case "TEXT_FLOW":
        return this.chunkByTextFlow(content, rule);
      case "FIXED_SIZE":
      default:
        return this.chunkByFixedSize(content, rule);
    }
  }

  // ============ Chunking Strategies ============

  /**
   * ARTICLE_BASED: Split by article/clause numbers (정책 문서)
   */
  private chunkByArticle(content: string, rule: ChunkingRule): ChunkResult[] {
    const articlePattern = /(?:^|\n)(제\d+조|제\d+장|Article\s+\d+|Section\s+\d+)[^\n]*/gi;
    return this.splitByPattern(content, articlePattern, rule, "ARTICLE_BASED");
  }

  /**
   * HEADING_BASED: Split by markdown/text headings
   */
  private chunkByHeading(content: string, rule: ChunkingRule): ChunkResult[] {
    const headingPattern = /(?:^|\n)(#{1,6}\s+[^\n]+|^[A-Z가-힣][^\n]*$)/gm;
    return this.splitByPattern(content, headingPattern, rule, "HEADING_BASED");
  }

  /**
   * SECTION_BASED: Split by major sections
   */
  private chunkBySection(content: string, rule: ChunkingRule): ChunkResult[] {
    // Look for section markers: numbered sections, headings, or double line breaks
    const sectionPattern = /(?:\n\n+|\n(?=\d+\.\s)|(?=^#{1,3}\s))/gm;
    const sections = content.split(sectionPattern).filter((s) => s.trim());
    return this.buildChunks(sections, rule, "SECTION_BASED");
  }

  /**
   * CODE_BLOCK_SEPARATION: Separate code blocks from text
   */
  private chunkWithCodeSeparation(content: string, rule: ChunkingRule): ChunkResult[] {
    const chunks: ChunkResult[] = [];
    
    // Split by code blocks
    const codeBlockPattern = /(```[\s\S]*?```)/g;
    const parts = content.split(codeBlockPattern);
    
    for (const part of parts) {
      if (part.startsWith("```")) {
        // Code block - keep as single chunk
        chunks.push(this.createChunk(part, chunks.length, rule, "CODE_BLOCK_SEPARATION", ["CODE_BLOCK"]));
      } else {
        // Text - chunk normally
        const textChunks = this.chunkByParagraph(part, rule);
        chunks.push(...textChunks);
      }
    }
    
    return chunks;
  }

  /**
   * SEMANTIC_PARAGRAPH: Split by semantic paragraphs
   */
  private chunkBySemanticParagraph(content: string, rule: ChunkingRule): ChunkResult[] {
    // Split by paragraph breaks while trying to keep semantic units together
    const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim());
    return this.buildChunksWithMerging(paragraphs, rule, "SEMANTIC_PARAGRAPH");
  }

  /**
   * DOM_BLOCK: Split by DOM-like blocks (for HTML)
   */
  private chunkByDOMBlock(content: string, rule: ChunkingRule): ChunkResult[] {
    // Split by block-level HTML elements
    const blockPattern = /<(div|section|article|p|h[1-6]|ul|ol|table|pre)[^>]*>[\s\S]*?<\/\1>/gi;
    const blocks = content.match(blockPattern) || [];
    
    if (blocks.length === 0) {
      // Fallback to text-based splitting
      return this.chunkByParagraph(content, rule);
    }
    
    return this.buildChunks(blocks, rule, "DOM_BLOCK");
  }

  /**
   * SENTENCE_RECONSTRUCTION: Reconstruct sentences from noisy text (OCR)
   */
  private chunkBySentenceReconstruction(content: string, rule: ChunkingRule): ChunkResult[] {
    // Clean up line breaks and reconstruct sentences
    const cleaned = content
      .replace(/([^\n.!?])\n([a-z가-힣])/g, "$1 $2") // Join broken lines
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    
    return this.chunkBySentence(cleaned, rule);
  }

  /**
   * SENTENCE_BASED: Split by sentences
   */
  private chunkBySentence(content: string, rule: ChunkingRule): ChunkResult[] {
    const sentences = content.split(/(?<=[.!?])\s+/).filter((s) => s.trim());
    return this.buildChunksWithMerging(sentences, rule, "SENTENCE_BASED");
  }

  /**
   * PARAGRAPH_BASED: Split by paragraphs
   */
  private chunkByParagraph(content: string, rule: ChunkingRule): ChunkResult[] {
    const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim());
    return this.buildChunks(paragraphs, rule, "PARAGRAPH_BASED");
  }

  /**
   * TEXT_FLOW: Split by natural text flow (for continuous text)
   */
  private chunkByTextFlow(content: string, rule: ChunkingRule): ChunkResult[] {
    // Split by line breaks but merge small segments
    const lines = content.split(/\n/).filter((l) => l.trim());
    return this.buildChunksWithMerging(lines, rule, "TEXT_FLOW");
  }

  /**
   * FIXED_SIZE: Split by fixed token count
   */
  private chunkByFixedSize(content: string, rule: ChunkingRule): ChunkResult[] {
    const chunks: ChunkResult[] = [];
    const words = content.split(/\s+/);
    const targetTokens = rule.size.maxTokens;
    const overlap = rule.size.overlapTokens;
    
    let start = 0;
    while (start < words.length) {
      const end = Math.min(start + targetTokens, words.length);
      const chunkContent = words.slice(start, end).join(" ");
      chunks.push(this.createChunk(chunkContent, chunks.length, rule, "FIXED_SIZE"));
      start = end - overlap;
      if (start >= words.length - overlap) break;
    }
    
    return chunks;
  }

  // ============ Helper Methods ============

  private splitByPattern(
    content: string,
    pattern: RegExp,
    rule: ChunkingRule,
    strategy: ChunkingStrategy
  ): ChunkResult[] {
    const matches = [...content.matchAll(pattern)];
    if (matches.length === 0) {
      return this.chunkByParagraph(content, rule);
    }

    const chunks: ChunkResult[] = [];
    let lastIndex = 0;

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const nextMatch = matches[i + 1];
      const endIndex = nextMatch ? nextMatch.index! : content.length;
      
      const chunkContent = content.slice(match.index!, endIndex).trim();
      if (chunkContent) {
        chunks.push(this.createChunk(chunkContent, chunks.length, rule, strategy));
      }
      lastIndex = endIndex;
    }

    return chunks;
  }

  private buildChunks(
    segments: string[],
    rule: ChunkingRule,
    strategy: ChunkingStrategy
  ): ChunkResult[] {
    return segments
      .filter((s) => s.trim())
      .map((content, index) => this.createChunk(content, index, rule, strategy));
  }

  private buildChunksWithMerging(
    segments: string[],
    rule: ChunkingRule,
    strategy: ChunkingStrategy
  ): ChunkResult[] {
    const chunks: ChunkResult[] = [];
    let currentChunk = "";
    let currentTokens = 0;

    for (const segment of segments) {
      const segmentTokens = this.estimateTokens(segment);

      if (currentTokens + segmentTokens <= rule.size.maxTokens) {
        currentChunk += (currentChunk ? "\n\n" : "") + segment;
        currentTokens += segmentTokens;
      } else {
        if (currentChunk) {
          chunks.push(this.createChunk(currentChunk, chunks.length, rule, strategy));
        }
        currentChunk = segment;
        currentTokens = segmentTokens;
      }
    }

    if (currentChunk) {
      chunks.push(this.createChunk(currentChunk, chunks.length, rule, strategy));
    }

    return chunks;
  }

  private createChunk(
    content: string,
    index: number,
    rule: ChunkingRule,
    strategy: ChunkingStrategy,
    preservedElements: PreserveElement[] = []
  ): ChunkResult {
    return {
      id: uuidv4(),
      content: content.trim(),
      index,
      tokenCount: this.estimateTokens(content),
      strategy,
      documentType: rule.documentType,
      metadata: {},
      preservedElements,
    };
  }

  private enrichChunksWithMetadata(
    chunks: ChunkResult[],
    documentType: DocumentType,
    strategy: ChunkingStrategy,
    metadataFields: MetadataField[],
    fileName?: string
  ): ChunkResult[] {
    return chunks.map((chunk, index) => ({
      ...chunk,
      documentType,
      strategy,
      metadata: {
        ...chunk.metadata,
        ...(metadataFields.includes("DOCUMENT_NAME") && fileName
          ? { documentName: fileName }
          : {}),
        ...(metadataFields.includes("POSITION")
          ? { position: index, totalChunks: chunks.length }
          : {}),
      },
    }));
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for English, ~2 for Korean
    const koreanChars = (text.match(/[가-힣]/g) || []).length;
    const otherChars = text.length - koreanChars;
    return Math.ceil(koreanChars / 2 + otherChars / 4);
  }
}

// Export singleton instance
export const chunkingDSLEngine = new ChunkingDSLEngine();
