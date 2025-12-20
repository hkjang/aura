import { prisma } from "@/lib/prisma";

interface SearchResult {
  documentId: string;
  title: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

/**
 * SemanticSearch - Vector-based semantic search for knowledge base
 * Note: This is a mock implementation. Production would use Milvus/Pinecone/Chroma.
 */
export class SemanticSearch {
  /**
   * Generate mock embedding for text (simulates vector embedding)
   */
  private static generateMockEmbedding(text: string): number[] {
    // Create a simple hash-based pseudo-embedding
    const normalized = text.toLowerCase().trim();
    const embedding: number[] = [];
    
    for (let i = 0; i < 128; i++) {
      const charCode = normalized.charCodeAt(i % normalized.length) || 0;
      embedding.push((charCode + i) / 256);
    }
    
    return embedding;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private static cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Search documents using semantic similarity
   */
  static async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    const queryEmbedding = this.generateMockEmbedding(query);
    
    try {
      // Fetch all documents
      const documents = await prisma.document.findMany({
        take: 100,
        select: {
          id: true,
          title: true,
          content: true,
          metadata: true,
        },
      });

      // Calculate similarity scores
      const results: SearchResult[] = documents.map(doc => {
        const docEmbedding = this.generateMockEmbedding(doc.content);
        const score = this.cosineSimilarity(queryEmbedding, docEmbedding);
        
        // Boost score if query terms appear in content
        const queryTerms = query.toLowerCase().split(/\s+/);
        const contentLower = doc.content.toLowerCase();
        let termBoost = 0;
        
        for (const term of queryTerms) {
          if (contentLower.includes(term)) {
            termBoost += 0.1;
          }
        }

        return {
          documentId: doc.id,
          title: doc.title,
          content: doc.content.substring(0, 200) + (doc.content.length > 200 ? '...' : ''),
          score: Math.min(score + termBoost, 1.0),
          metadata: doc.metadata ? JSON.parse(JSON.stringify(doc.metadata)) : undefined,
        };
      });

      // Sort by score and return top results
      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Semantic search error:', error);
      return [];
    }
  }

  /**
   * Index a document (mock - would store embedding in vector DB)
   */
  static async indexDocument(documentId: string): Promise<boolean> {
    try {
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        select: { content: true },
      });

      if (!doc) return false;

      // Generate and "store" embedding (mock)
      const embedding = this.generateMockEmbedding(doc.content);
      
      // In production, would store in Milvus/Pinecone/Chroma
      console.log(`Indexed document ${documentId} with ${embedding.length}-dim embedding`);
      
      return true;
    } catch (error) {
      console.error('Indexing error:', error);
      return false;
    }
  }

  /**
   * Hybrid search combining keyword and semantic
   */
  static async hybridSearch(query: string, limit: number = 10): Promise<SearchResult[]> {
    // Get semantic results
    const semanticResults = await this.search(query, limit * 2);
    
    // Get keyword results from DB
    try {
      const keywordResults = await prisma.document.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { content: { contains: query } },
          ],
        },
        take: limit,
        select: {
          id: true,
          title: true,
          content: true,
        },
      });

      // Merge and deduplicate
      const allResults = new Map<string, SearchResult>();
      
      for (const result of semanticResults) {
        allResults.set(result.documentId, result);
      }
      
      for (const doc of keywordResults) {
        if (!allResults.has(doc.id)) {
          allResults.set(doc.id, {
            documentId: doc.id,
            title: doc.title,
            content: doc.content.substring(0, 200),
            score: 0.8, // Keyword match bonus
          });
        } else {
          // Boost existing semantic result
          const existing = allResults.get(doc.id)!;
          existing.score = Math.min(existing.score + 0.2, 1.0);
        }
      }

      return Array.from(allResults.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      return semanticResults.slice(0, limit);
    }
  }
}
