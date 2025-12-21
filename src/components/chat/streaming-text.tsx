"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { 
  Loader2, 
  Square, 
  Zap,
  CheckCircle2
} from "lucide-react";

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
  speed?: "slow" | "normal" | "fast";
  showCursor?: boolean;
  onComplete?: () => void;
}

// 스트리밍 속도 설정
const SPEED_CONFIG = {
  slow: { charDelay: 30, wordChunk: 1 },
  normal: { charDelay: 15, wordChunk: 3 },
  fast: { charDelay: 5, wordChunk: 5 }
};

export function StreamingText({
  content,
  isStreaming,
  speed = "normal",
  showCursor = true,
  onComplete
}: StreamingTextProps) {
  const [displayedContent, setDisplayedContent] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | null>(null);
  const indexRef = useRef(0);
  
  useEffect(() => {
    if (!isStreaming) {
      // 스트리밍이 끝나면 전체 콘텐츠 표시
      setDisplayedContent(content);
      setIsAnimating(false);
      indexRef.current = content.length;
      return;
    }
    
    // 스트리밍 시작
    setIsAnimating(true);
    const config = SPEED_CONFIG[speed];
    
    const animate = () => {
      if (indexRef.current >= content.length) {
        setIsAnimating(false);
        onComplete?.();
        return;
      }
      
      // 단어 단위로 청크 처리
      const nextIndex = Math.min(indexRef.current + config.wordChunk, content.length);
      indexRef.current = nextIndex;
      setDisplayedContent(content.slice(0, nextIndex));
      
      animationRef.current = window.setTimeout(animate, config.charDelay);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [content, isStreaming, speed, onComplete]);
  
  // 콘텐츠가 리셋될 때
  useEffect(() => {
    if (content.length === 0) {
      setDisplayedContent("");
      indexRef.current = 0;
    }
  }, [content]);
  
  return (
    <span className="streaming-text">
      {displayedContent}
      {isAnimating && showCursor && (
        <span className="streaming-cursor"></span>
      )}
      
      <style jsx>{`
        .streaming-text {
          white-space: pre-wrap;
        }
        
        .streaming-cursor {
          display: inline-block;
          width: 2px;
          height: 1em;
          background: var(--primary, #7c3aed);
          margin-left: 2px;
          vertical-align: text-bottom;
          animation: blink 0.8s infinite;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </span>
  );
}

// 스트리밍 상태 표시 컴포넌트
interface StreamingStatusProps {
  isStreaming: boolean;
  tokensGenerated?: number;
  onStop?: () => void;
}

export function StreamingStatus({
  isStreaming,
  tokensGenerated = 0,
  onStop
}: StreamingStatusProps) {
  if (!isStreaming) return null;
  
  return (
    <div className="streaming-status">
      <div className="status-indicator">
        <Loader2 className="spinner" />
        <span>생성 중...</span>
        {tokensGenerated > 0 && (
          <span className="token-count">{tokensGenerated} 토큰</span>
        )}
      </div>
      
      {onStop && (
        <button className="stop-btn" onClick={onStop}>
          <Square size={12} />
          중지
        </button>
      )}
      
      <style jsx>{`
        .streaming-status {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: rgba(124, 58, 237, 0.1);
          border: 1px solid var(--primary, #7c3aed);
          border-radius: 10px;
          margin-bottom: 12px;
        }
        
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--primary, #7c3aed);
        }
        
        .status-indicator :global(.spinner) {
          width: 16px;
          height: 16px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .token-count {
          padding: 2px 8px;
          background: var(--bg-secondary, #1e1e2e);
          border-radius: 10px;
          font-size: 11px;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .stop-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid #ef4444;
          border-radius: 6px;
          color: #ef4444;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .stop-btn:hover {
          background: rgba(239, 68, 68, 0.2);
        }
      `}</style>
    </div>
  );
}

// 스트리밍 훅
interface UseStreamingOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

export function useStreaming(options?: UseStreamingOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [content, setContent] = useState("");
  const [tokensGenerated, setTokensGenerated] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const startStreaming = useCallback(async (
    url: string,
    body: Record<string, unknown>
  ) => {
    abortControllerRef.current = new AbortController();
    setIsStreaming(true);
    setContent("");
    setTokensGenerated(0);
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          setContent(fullContent);
          setTokensGenerated(Math.ceil(fullContent.length / 4));
          options?.onChunk?.(chunk);
        }
      }
      
      options?.onComplete?.(fullContent);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        options?.onError?.(error as Error);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [options]);
  
  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);
  
  const reset = useCallback(() => {
    setContent("");
    setTokensGenerated(0);
    setIsStreaming(false);
  }, []);
  
  return {
    isStreaming,
    content,
    tokensGenerated,
    startStreaming,
    stopStreaming,
    reset
  };
}

export default StreamingText;
