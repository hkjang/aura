/**
 * Chunking Service - Semantic text chunking for knowledge sources
 */

import { ChunkingDSLEngine, chunkingDSLEngine } from "./chunking-dsl-engine";
import { DocumentType, DSLExecutionResult } from "./chunking-dsl-types";

export interface ChunkResult {
  content: string;
  chunkIndex: number;
  startOffset: number;
  endOffset: number;
  // Element-based metadata for PDF highlighting
  elementIds?: string[];  // Upstage element IDs this chunk came from
  page?: number;          // PDF page number
  coordinates?: {         // Bounding box (normalized 0-1)
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Upstage element structure for element-based chunking
export interface UpstageElement {
  id: string;
  category?: string;
  text: string;
  page: number;
  coordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ChunkingOptions {
  maxChunkSize?: number;      // Maximum characters per chunk (default: 1000)
  minChunkSize?: number;      // Minimum characters per chunk (default: 100)
  overlap?: number;           // Overlap between chunks (default: 100)
  preserveParagraphs?: boolean; // Try to keep paragraphs intact (default: true)
}

const DEFAULT_OPTIONS: Required<ChunkingOptions> = {
  maxChunkSize: 1000,
  minChunkSize: 100,
  overlap: 100,
  preserveParagraphs: true,
};

export class ChunkingService {
  /**
   * Split text into semantic chunks
   */
  static chunk(text: string, options: ChunkingOptions = {}): ChunkResult[] {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const chunks: ChunkResult[] = [];
    
    // Normalize text
    const normalizedText = this.normalizeText(text);
    
    if (normalizedText.length <= opts.maxChunkSize) {
      // Text is small enough, return as single chunk
      return [{
        content: normalizedText,
        chunkIndex: 0,
        startOffset: 0,
        endOffset: normalizedText.length,
      }];
    }

    if (opts.preserveParagraphs) {
      return this.chunkByParagraphs(normalizedText, opts);
    } else {
      return this.chunkBySentences(normalizedText, opts);
    }
  }

  /**
   * Normalize text content
   */
  private static normalizeText(text: string): string {
    return text
      // Normalize line endings
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      // Remove excessive whitespace
      .replace(/[ \t]+/g, " ")
      // Remove excessive newlines (more than 2)
      .replace(/\n{3,}/g, "\n\n")
      // Trim
      .trim();
  }

  /**
   * Chunk by paragraphs (semantic chunking)
   */
  private static chunkByParagraphs(
    text: string,
    opts: Required<ChunkingOptions>
  ): ChunkResult[] {
    const chunks: ChunkResult[] = [];
    const paragraphs = text.split(/\n\n+/);
    
    let currentChunk = "";
    let currentStartOffset = 0;
    let runningOffset = 0;

    for (const para of paragraphs) {
      const paraWithSeparator = para + "\n\n";
      
      if (currentChunk.length + paraWithSeparator.length > opts.maxChunkSize) {
        // Current chunk would be too large
        if (currentChunk.length >= opts.minChunkSize) {
          // Save current chunk
          chunks.push({
            content: currentChunk.trim(),
            chunkIndex: chunks.length,
            startOffset: currentStartOffset,
            endOffset: currentStartOffset + currentChunk.length,
          });
          
          // Handle overlap
          if (opts.overlap > 0 && currentChunk.length > opts.overlap) {
            const overlapText = currentChunk.slice(-opts.overlap);
            currentChunk = overlapText + paraWithSeparator;
            currentStartOffset = runningOffset - opts.overlap;
          } else {
            currentChunk = paraWithSeparator;
            currentStartOffset = runningOffset;
          }
        } else {
          // Current chunk too small, force merge
          currentChunk += paraWithSeparator;
        }
      } else {
        currentChunk += paraWithSeparator;
      }
      
      runningOffset += paraWithSeparator.length;
    }

    // Don't forget the last chunk
    if (currentChunk.trim().length >= opts.minChunkSize) {
      chunks.push({
        content: currentChunk.trim(),
        chunkIndex: chunks.length,
        startOffset: currentStartOffset,
        endOffset: text.length,
      });
    } else if (chunks.length > 0 && currentChunk.trim().length > 0) {
      // Merge with previous chunk if too small
      const lastChunk = chunks[chunks.length - 1];
      lastChunk.content += "\n\n" + currentChunk.trim();
      lastChunk.endOffset = text.length;
    } else if (currentChunk.trim().length > 0) {
      // Only chunk, even if small
      chunks.push({
        content: currentChunk.trim(),
        chunkIndex: 0,
        startOffset: currentStartOffset,
        endOffset: text.length,
      });
    }

    return chunks;
  }

  /**
   * Chunk by sentences (fallback for unstructured text)
   */
  private static chunkBySentences(
    text: string,
    opts: Required<ChunkingOptions>
  ): ChunkResult[] {
    const chunks: ChunkResult[] = [];
    // Split by sentence-ending punctuation
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    
    let currentChunk = "";
    let currentStartOffset = 0;
    let runningOffset = 0;

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > opts.maxChunkSize) {
        if (currentChunk.length >= opts.minChunkSize) {
          chunks.push({
            content: currentChunk.trim(),
            chunkIndex: chunks.length,
            startOffset: currentStartOffset,
            endOffset: currentStartOffset + currentChunk.length,
          });
          
          // Overlap handling
          if (opts.overlap > 0 && currentChunk.length > opts.overlap) {
            const overlapText = currentChunk.slice(-opts.overlap);
            currentChunk = overlapText + " " + sentence;
            currentStartOffset = runningOffset - opts.overlap;
          } else {
            currentChunk = sentence;
            currentStartOffset = runningOffset;
          }
        } else {
          currentChunk += " " + sentence;
        }
      } else {
        currentChunk += (currentChunk ? " " : "") + sentence;
      }
      
      runningOffset += sentence.length;
    }

    // Last chunk
    if (currentChunk.trim().length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        chunkIndex: chunks.length,
        startOffset: currentStartOffset,
        endOffset: text.length,
      });
    }

    return chunks;
  }

  /**
   * Extract keywords from text (simple TF-based extraction)
   */
  static extractKeywords(text: string, maxKeywords: number = 10): string[] {
    // Tokenize
    const words = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter(w => w.length > 2);

    // Count frequencies
    const freq: Record<string, number> = {};
    for (const word of words) {
      freq[word] = (freq[word] || 0) + 1;
    }

    // Filter stopwords (basic English + Korean)
    const stopwords = new Set([
      "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
      "have", "has", "had", "do", "does", "did", "will", "would", "could",
      "should", "may", "might", "must", "shall", "can", "need", "dare",
      "to", "of", "in", "for", "on", "with", "at", "by", "from", "as",
      "into", "through", "during", "before", "after", "above", "below",
      "between", "under", "again", "further", "then", "once", "here",
      "there", "when", "where", "why", "how", "all", "each", "few",
      "more", "most", "other", "some", "such", "no", "nor", "not",
      "only", "own", "same", "so", "than", "too", "very", "just",
      "and", "but", "if", "or", "because", "until", "while", "this",
      "that", "these", "those", "it", "its", "itself",
      // Korean stopwords
      "이", "그", "저", "것", "수", "등", "및", "더", "또", "또한",
      "그리고", "하지만", "그러나", "따라서", "때문", "위해", "통해",
      "대한", "있다", "없다", "하다", "되다", "않다", "같다"
    ]);

    const filtered = Object.entries(freq)
      .filter(([word]) => !stopwords.has(word))
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([word]) => word);

    return filtered;
  }

  /**
   * Detect document structure (headings, tables, etc.)
   */
  static detectStructure(text: string): {
    hasHeadings: boolean;
    hasTables: boolean;
    hasLists: boolean;
    estimatedType: "structured" | "unstructured" | "markdown";
  } {
    const hasHeadings = /^#+\s|^[A-Z][^.]+:?\s*$/m.test(text);
    const hasTables = /\|.+\|/.test(text) || /\t.*\t/.test(text);
    const hasLists = /^[-*•]\s|^\d+[.)]\s/m.test(text);
    const hasMarkdown = /^#+\s|^\*\*|^__|\[.+\]\(.+\)/m.test(text);

    let estimatedType: "structured" | "unstructured" | "markdown" = "unstructured";
    if (hasMarkdown) estimatedType = "markdown";
    else if (hasHeadings || hasTables || hasLists) estimatedType = "structured";

    return { hasHeadings, hasTables, hasLists, estimatedType };
  }

  /**
   * Chunk text using DSL engine with automatic document type detection
   * This provides intelligent chunking based on document type, content analysis,
   * and admin-defined override rules.
   */
  static async chunkWithDSL(
    text: string,
    options: {
      fileName?: string;
      mimeType?: string;
      notebookId?: string;
      forceDocumentType?: DocumentType;
    } = {}
  ): Promise<DSLExecutionResult> {
    return chunkingDSLEngine.execute(text, options);
  }

  /**
   * Get DSL engine instance for advanced usage (e.g., adding overrides)
   */
  static getDSLEngine(): ChunkingDSLEngine {
    return chunkingDSLEngine;
  }

  /**
   * Chunk by Upstage elements - preserves element boundaries for accurate PDF highlighting
   * Groups small elements together until reaching maxChunkSize
   */
  static chunkByElements(
    elements: UpstageElement[],
    options: ChunkingOptions = {}
  ): ChunkResult[] {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const chunks: ChunkResult[] = [];
    
    if (!elements || elements.length === 0) {
      return [];
    }
    
    let currentChunk: {
      content: string;
      elementIds: string[];
      page: number;
      coords: { x: number; y: number; width: number; height: number } | null;
    } = {
      content: "",
      elementIds: [],
      page: elements[0].page || 1,
      coords: null,
    };
    
    let chunkIndex = 0;
    let offset = 0;
    
    for (const element of elements) {
      const elementText = element.text?.trim() || "";
      if (!elementText) continue;
      
      // Check if adding this element would exceed maxChunkSize
      const wouldExceed = currentChunk.content.length + elementText.length + 1 > opts.maxChunkSize;
      const pageChanged = element.page !== currentChunk.page;
      
      // Start new chunk if size exceeded or page changed
      if ((wouldExceed && currentChunk.content.length >= opts.minChunkSize) || 
          (pageChanged && currentChunk.content.length > 0)) {
        // Save current chunk
        chunks.push({
          content: currentChunk.content.trim(),
          chunkIndex: chunkIndex++,
          startOffset: offset,
          endOffset: offset + currentChunk.content.length,
          elementIds: currentChunk.elementIds,
          page: currentChunk.page,
          coordinates: currentChunk.coords || undefined,
        });
        offset += currentChunk.content.length;
        
        // Start new chunk
        currentChunk = {
          content: "",
          elementIds: [],
          page: element.page || 1,
          coords: null,
        };
      }
      
      // Add element to current chunk
      if (currentChunk.content.length > 0) {
        currentChunk.content += "\n";
      }
      currentChunk.content += elementText;
      currentChunk.elementIds.push(element.id);
      
      // Merge coordinates (expand bounding box to cover all elements in chunk)
      if (element.coordinates) {
        if (!currentChunk.coords) {
          currentChunk.coords = { ...element.coordinates };
        } else {
          // Expand to cover both coordinates
          const minX = Math.min(currentChunk.coords.x, element.coordinates.x);
          const minY = Math.min(currentChunk.coords.y, element.coordinates.y);
          const maxX = Math.max(
            currentChunk.coords.x + currentChunk.coords.width,
            element.coordinates.x + element.coordinates.width
          );
          const maxY = Math.max(
            currentChunk.coords.y + currentChunk.coords.height,
            element.coordinates.y + element.coordinates.height
          );
          currentChunk.coords = {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
          };
        }
      }
    }
    
    // Don't forget the last chunk
    if (currentChunk.content.length > 0) {
      chunks.push({
        content: currentChunk.content.trim(),
        chunkIndex: chunkIndex++,
        startOffset: offset,
        endOffset: offset + currentChunk.content.length,
        elementIds: currentChunk.elementIds,
        page: currentChunk.page,
        coordinates: currentChunk.coords || undefined,
      });
    }
    
    console.log(`[ChunkingService] Created ${chunks.length} element-based chunks from ${elements.length} elements`);
    return chunks;
  }
}
