"use client";

/**
 * 컨텍스트 체인 관리
 * 대화의 맥락을 자동으로 유지하고 관리합니다.
 */

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
}

interface ContextChainOptions {
  maxContextLength?: number; // 최대 토큰 수
  maxMessages?: number; // 최대 메시지 수
  summarizeThreshold?: number; // 요약 시작 임계값
  preserveSystemPrompt?: boolean;
}

interface ContextSummary {
  keyPoints: string[];
  topics: string[];
  lastUpdated: Date;
}

// 기본 설정
const DEFAULT_OPTIONS: Required<ContextChainOptions> = {
  maxContextLength: 4000,
  maxMessages: 20,
  summarizeThreshold: 15,
  preserveSystemPrompt: true
};

// 토큰 수 추정 (간단한 근사)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// 메시지 배열의 총 토큰 수
function getTotalTokens(messages: Message[]): number {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
}

/**
 * 컨텍스트 체인 클래스
 */
export class ContextChain {
  private messages: Message[] = [];
  private summary: ContextSummary | null = null;
  private options: Required<ContextChainOptions>;
  
  constructor(options?: ContextChainOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }
  
  /**
   * 메시지 추가
   */
  addMessage(message: Message): void {
    this.messages.push({
      ...message,
      timestamp: message.timestamp || new Date()
    });
    
    // 임계값 도달 시 자동 압축
    if (this.messages.length > this.options.summarizeThreshold) {
      this.compressContext();
    }
  }
  
  /**
   * 현재 컨텍스트 가져오기
   */
  getContext(): Message[] {
    const context: Message[] = [];
    
    // 시스템 메시지 유지
    if (this.options.preserveSystemPrompt) {
      const systemMsg = this.messages.find(m => m.role === "system");
      if (systemMsg) {
        context.push(systemMsg);
      }
    }
    
    // 요약이 있으면 먼저 추가
    if (this.summary) {
      const summaryContent = [
        "[이전 대화 요약]",
        ...this.summary.keyPoints.map(p => `• ${p}`),
        "",
        `주요 주제: ${this.summary.topics.join(", ")}`
      ].join("\n");
      
      context.push({
        role: "system",
        content: summaryContent
      });
    }
    
    // 최근 메시지 추가 (토큰 제한 내에서)
    const recentMessages = this.messages
      .filter(m => m.role !== "system")
      .slice(-this.options.maxMessages);
    
    let tokenCount = getTotalTokens(context);
    const selectedMessages: Message[] = [];
    
    for (let i = recentMessages.length - 1; i >= 0; i--) {
      const msgTokens = estimateTokens(recentMessages[i].content);
      if (tokenCount + msgTokens > this.options.maxContextLength) break;
      selectedMessages.unshift(recentMessages[i]);
      tokenCount += msgTokens;
    }
    
    return [...context, ...selectedMessages];
  }
  
  /**
   * 컨텍스트 압축 (요약 생성)
   */
  private compressContext(): void {
    const messagesToSummarize = this.messages
      .filter(m => m.role !== "system")
      .slice(0, -5); // 최근 5개는 유지
    
    if (messagesToSummarize.length < 5) return;
    
    // 핵심 포인트 추출 (간단한 휴리스틱)
    const keyPoints: string[] = [];
    const topics = new Set<string>();
    
    messagesToSummarize.forEach(msg => {
      // 긴 응답에서 첫 문장 추출
      if (msg.role === "assistant" && msg.content.length > 100) {
        const firstSentence = msg.content.split(/[.!?]/)[0];
        if (firstSentence && firstSentence.length > 20) {
          keyPoints.push(firstSentence.slice(0, 100));
        }
      }
      
      // 주제 추출 (간단한 키워드 기반)
      const keywords = ["코드", "분석", "설명", "비교", "구현", "설정"];
      keywords.forEach(kw => {
        if (msg.content.includes(kw)) {
          topics.add(kw);
        }
      });
    });
    
    this.summary = {
      keyPoints: keyPoints.slice(0, 5),
      topics: Array.from(topics).slice(0, 5),
      lastUpdated: new Date()
    };
    
    // 압축된 메시지 제거
    this.messages = [
      ...this.messages.filter(m => m.role === "system"),
      ...this.messages.filter(m => m.role !== "system").slice(-5)
    ];
  }
  
  /**
   * 컨텍스트 초기화
   */
  clear(): void {
    const systemMsg = this.messages.find(m => m.role === "system");
    this.messages = systemMsg ? [systemMsg] : [];
    this.summary = null;
  }
  
  /**
   * 현재 상태 정보
   */
  getStats() {
    return {
      messageCount: this.messages.length,
      totalTokens: getTotalTokens(this.messages),
      hasSummary: !!this.summary,
      summaryKeyPoints: this.summary?.keyPoints.length || 0
    };
  }
  
  /**
   * 메시지 목록 반환
   */
  getAllMessages(): Message[] {
    return [...this.messages];
  }
  
  /**
   * 직렬화
   */
  serialize(): string {
    return JSON.stringify({
      messages: this.messages,
      summary: this.summary,
      options: this.options
    });
  }
  
  /**
   * 역직렬화
   */
  static deserialize(data: string): ContextChain {
    const parsed = JSON.parse(data);
    const chain = new ContextChain(parsed.options);
    chain.messages = parsed.messages.map((m: Message) => ({
      ...m,
      timestamp: m.timestamp ? new Date(m.timestamp) : undefined
    }));
    chain.summary = parsed.summary ? {
      ...parsed.summary,
      lastUpdated: new Date(parsed.summary.lastUpdated)
    } : null;
    return chain;
  }
}

// Hook for React
import { useState, useCallback, useRef, useEffect } from "react";

export function useContextChain(options?: ContextChainOptions) {
  const chainRef = useRef(new ContextChain(options));
  const [stats, setStats] = useState(chainRef.current.getStats());
  
  const addMessage = useCallback((message: Message) => {
    chainRef.current.addMessage(message);
    setStats(chainRef.current.getStats());
  }, []);
  
  const getContext = useCallback(() => {
    return chainRef.current.getContext();
  }, []);
  
  const clear = useCallback(() => {
    chainRef.current.clear();
    setStats(chainRef.current.getStats());
  }, []);
  
  // 로컬 스토리지 동기화
  useEffect(() => {
    const saved = localStorage.getItem("context-chain");
    if (saved) {
      try {
        chainRef.current = ContextChain.deserialize(saved);
        setStats(chainRef.current.getStats());
      } catch {
        // ignore
      }
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem("context-chain", chainRef.current.serialize());
  }, [stats]);
  
  return {
    addMessage,
    getContext,
    clear,
    stats,
    getAllMessages: () => chainRef.current.getAllMessages()
  };
}

export default ContextChain;
