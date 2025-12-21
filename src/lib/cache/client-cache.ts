"use client";

/**
 * 클라이언트 캐시 레이어
 * API 응답을 캐싱하여 성능을 개선합니다.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
  hits: number;
}

interface CacheOptions {
  maxSize?: number; // 최대 엔트리 수
  defaultTTL?: number; // 기본 TTL (ms)
  storageKey?: string;
  persistToStorage?: boolean;
}

const DEFAULT_OPTIONS: Required<CacheOptions> = {
  maxSize: 100,
  defaultTTL: 5 * 60 * 1000, // 5분
  storageKey: "aura-client-cache",
  persistToStorage: true
};

class ClientCache<T = unknown> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private options: Required<CacheOptions>;
  
  constructor(options?: CacheOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.loadFromStorage();
  }
  
  /**
   * 캐시에서 데이터 가져오기
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // 만료 확인
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }
    
    // 히트 카운트 증가
    entry.hits++;
    return entry.data;
  }
  
  /**
   * 캐시에 데이터 저장
   */
  set(key: string, data: T, ttl?: number): void {
    // 크기 제한 확인
    if (this.cache.size >= this.options.maxSize) {
      this.evictLRU();
    }
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + (ttl ?? this.options.defaultTTL),
      hits: 0
    };
    
    this.cache.set(key, entry);
    this.saveToStorage();
  }
  
  /**
   * 캐시에서 삭제
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    this.saveToStorage();
    return result;
  }
  
  /**
   * 특정 패턴의 키 삭제
   */
  deletePattern(pattern: RegExp): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    this.saveToStorage();
    return count;
  }
  
  /**
   * 전체 캐시 클리어
   */
  clear(): void {
    this.cache.clear();
    this.saveToStorage();
  }
  
  /**
   * 캐시 통계
   */
  getStats() {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();
    
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      totalHits: entries.reduce((sum, [, e]) => sum + e.hits, 0),
      expiredCount: entries.filter(([, e]) => now > e.expiry).length,
      oldestEntry: entries.length > 0 
        ? Math.min(...entries.map(([, e]) => e.timestamp))
        : null
    };
  }
  
  /**
   * LRU 방식으로 오래된 항목 제거
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      // 히트 수와 시간 둘 다 고려
      const score = entry.timestamp - entry.hits * 1000;
      if (score < oldestTime) {
        oldestTime = score;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
  
  /**
   * 만료된 항목 정리
   */
  cleanup(): number {
    const now = Date.now();
    let count = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        count++;
      }
    }
    
    if (count > 0) {
      this.saveToStorage();
    }
    
    return count;
  }
  
  /**
   * 스토리지에서 로드
   */
  private loadFromStorage(): void {
    if (!this.options.persistToStorage || typeof window === "undefined") {
      return;
    }
    
    try {
      const stored = localStorage.getItem(this.options.storageKey);
      if (stored) {
        const entries: [string, CacheEntry<T>][] = JSON.parse(stored);
        this.cache = new Map(entries);
        this.cleanup(); // 만료된 항목 정리
      }
    } catch {
      // 파싱 실패 시 무시
    }
  }
  
  /**
   * 스토리지에 저장
   */
  private saveToStorage(): void {
    if (!this.options.persistToStorage || typeof window === "undefined") {
      return;
    }
    
    try {
      const entries = Array.from(this.cache.entries());
      localStorage.setItem(this.options.storageKey, JSON.stringify(entries));
    } catch {
      // 저장 실패 시 무시 (quota 초과 등)
    }
  }
}

// 싱글톤 인스턴스
let cacheInstance: ClientCache | null = null;

export function getCache<T = unknown>(): ClientCache<T> {
  if (!cacheInstance) {
    cacheInstance = new ClientCache<T>();
  }
  return cacheInstance as ClientCache<T>;
}

// React Hook
import { useState, useCallback, useEffect } from "react";

interface UseCacheOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  ttl?: number;
  revalidateOnMount?: boolean;
}

export function useCache<T>({ key, fetcher, ttl, revalidateOnMount = true }: UseCacheOptions<T>) {
  const cache = getCache<T>();
  const [data, setData] = useState<T | null>(() => cache.get(key));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetcher();
      cache.set(key, result, ttl);
      setData(result);
      return result;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, ttl, cache]);
  
  useEffect(() => {
    const cached = cache.get(key);
    if (cached) {
      setData(cached);
    }
    
    if (revalidateOnMount && !cached) {
      refetch();
    }
  }, [key, revalidateOnMount, refetch, cache]);
  
  const invalidate = useCallback(() => {
    cache.delete(key);
    setData(null);
  }, [key, cache]);
  
  return {
    data,
    isLoading,
    error,
    refetch,
    invalidate,
    isCached: cache.get(key) !== null
  };
}

// 캐시된 fetch 함수
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit & { cacheTTL?: number }
): Promise<T> {
  const cache = getCache<T>();
  const cacheKey = `fetch:${url}:${JSON.stringify(options?.body || {})}`;
  
  // 캐시 확인
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // 새로 fetch
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const data = await response.json();
  cache.set(cacheKey, data, options?.cacheTTL);
  
  return data;
}

export { ClientCache };
export default getCache;
