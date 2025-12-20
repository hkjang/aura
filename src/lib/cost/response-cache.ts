import { prisma } from "@/lib/prisma";
import crypto from "crypto";

interface CacheEntry {
  response: string;
  model: string;
  createdAt: Date;
  hitCount: number;
}

/**
 * ResponseCache - Cache AI responses to reduce costs and latency
 */
export class ResponseCache {
  private static TTL_MS = 1000 * 60 * 60; // 1 hour default TTL
  
  /**
   * Generate a cache key from query + model
   */
  static generateKey(query: string, model: string): string {
    const normalized = query.trim().toLowerCase();
    return crypto
      .createHash("sha256")
      .update(`${model}:${normalized}`)
      .digest("hex")
      .substring(0, 32);
  }

  /**
   * Check if a cached response exists and is valid
   */
  static async get(query: string, model: string): Promise<string | null> {
    const key = this.generateKey(query, model);
    
    try {
      // Check in-memory cache first (using a simple Map for MVP)
      const cached = inMemoryCache.get(key);
      
      if (cached && Date.now() - cached.createdAt.getTime() < this.TTL_MS) {
        // Update hit count
        cached.hitCount++;
        return cached.response;
      }
      
      return null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  /**
   * Store a response in the cache
   */
  static async set(query: string, model: string, response: string): Promise<void> {
    const key = this.generateKey(query, model);
    
    try {
      inMemoryCache.set(key, {
        response,
        model,
        createdAt: new Date(),
        hitCount: 0,
      });
      
      // Limit cache size
      if (inMemoryCache.size > 1000) {
        // Remove oldest entries
        const entries = Array.from(inMemoryCache.entries());
        entries.sort((a, b) => a[1].createdAt.getTime() - b[1].createdAt.getTime());
        for (let i = 0; i < 100; i++) {
          inMemoryCache.delete(entries[i][0]);
        }
      }
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  /**
   * Get cache statistics
   */
  static getStats(): { size: number; hits: number; entries: { key: string; hitCount: number }[] } {
    const entries = Array.from(inMemoryCache.entries()).map(([key, value]) => ({
      key,
      hitCount: value.hitCount,
    }));
    
    const totalHits = entries.reduce((acc, e) => acc + e.hitCount, 0);
    
    return {
      size: inMemoryCache.size,
      hits: totalHits,
      entries: entries.slice(0, 10), // Top 10
    };
  }

  /**
   * Clear the cache
   */
  static clear(): void {
    inMemoryCache.clear();
  }
}

// Simple in-memory cache for MVP
const inMemoryCache = new Map<string, CacheEntry>();
