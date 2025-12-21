"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";

interface ETAIndicatorProps {
  isLoading: boolean;
  modelId?: string;
  inputLength?: number;
  estimatedTokens?: number;
  startTime?: number;
}

// 모델별 예상 토큰 처리 속도 (tokens/second)
const MODEL_SPEEDS: Record<string, number> = {
  "gpt-4": 30,
  "gpt-4-turbo": 50,
  "gpt-3.5-turbo": 80,
  "claude-3-opus": 40,
  "claude-3-sonnet": 60,
  "gemini-pro": 55,
  "llama-3": 45,
  "ollama": 25,
  "default": 40
};

function estimateOutputTokens(inputLength: number): number {
  const inputTokens = Math.ceil(inputLength / 4);
  return Math.max(100, inputTokens * 2.5);
}

function calculateETA(modelId: string, outputTokens: number): number {
  const modelKey = Object.keys(MODEL_SPEEDS).find(k => 
    modelId.toLowerCase().includes(k.toLowerCase())
  ) || "default";
  
  const speed = MODEL_SPEEDS[modelKey];
  return Math.ceil(outputTokens / speed);
}

export function ETAIndicator({
  isLoading,
  modelId = "default",
  inputLength = 0,
  estimatedTokens,
  startTime
}: ETAIndicatorProps) {
  const [elapsed, setElapsed] = useState(0);
  const actualStartTime = useMemo(() => startTime || Date.now(), [startTime, isLoading]);
  
  useEffect(() => {
    if (!isLoading) {
      setElapsed(0);
      return;
    }
    
    const interval = setInterval(() => {
      setElapsed(Date.now() - actualStartTime);
    }, 100);
    
    return () => clearInterval(interval);
  }, [isLoading, actualStartTime]);
  
  const { eta, tokens } = useMemo(() => {
    const tokens = estimatedTokens || estimateOutputTokens(inputLength);
    const eta = calculateETA(modelId, tokens);
    return { eta, tokens };
  }, [modelId, inputLength, estimatedTokens]);
  
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}초`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
  };
  
  if (!isLoading) return null;
  
  const remainingTime = Math.max(0, eta - Math.floor(elapsed / 1000));
  const elapsedSeconds = Math.floor(elapsed / 1000);
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 0',
      fontSize: '12px',
      color: 'var(--text-muted, #6e6e7e)'
    }}>
      <Loader2 
        style={{ 
          width: '14px', 
          height: '14px',
          animation: 'spin 1s linear infinite'
        }} 
      />
      <span>응답 생성 중</span>
      <span style={{ color: 'var(--text-secondary, #a0a0b0)' }}>
        {elapsedSeconds}초
      </span>
      <span>·</span>
      <span style={{ color: 'var(--color-primary, #7c3aed)' }}>
        ~{tokens} 토큰
      </span>
      <span>·</span>
      <span style={{ color: 'var(--text-secondary, #a0a0b0)' }}>
        {remainingTime > 0 ? `${formatTime(remainingTime)} 남음` : "거의 완료"}
      </span>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default ETAIndicator;
