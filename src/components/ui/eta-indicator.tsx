"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock, Zap, TrendingUp } from "lucide-react";

interface ETAIndicatorProps {
  isLoading: boolean;
  modelId?: string;
  inputLength?: number;
  estimatedTokens?: number;
  startTime?: number; // timestamp
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

// 입력 길이를 기반으로 예상 토큰 수 계산 (대략적)
function estimateOutputTokens(inputLength: number): number {
  // 평균적으로 출력은 입력의 2-3배 정도라고 가정
  const inputTokens = Math.ceil(inputLength / 4);
  return Math.max(100, inputTokens * 2.5);
}

// ETA 계산
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
  
  // 경과 시간 업데이트
  useEffect(() => {
    if (!isLoading || !startTime) {
      setElapsed(0);
      return;
    }
    
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 100);
    
    return () => clearInterval(interval);
  }, [isLoading, startTime]);
  
  // 예상 시간 계산
  const { eta, tokens } = useMemo(() => {
    const tokens = estimatedTokens || estimateOutputTokens(inputLength);
    const eta = calculateETA(modelId, tokens);
    return { eta, tokens };
  }, [modelId, inputLength, estimatedTokens]);
  
  // 진행률 계산
  const progress = useMemo(() => {
    if (!startTime || eta === 0) return 0;
    const elapsedSeconds = elapsed / 1000;
    return Math.min((elapsedSeconds / eta) * 100, 99);
  }, [elapsed, eta, startTime]);
  
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}초`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
  };
  
  const formatElapsed = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}초`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
  };
  
  if (!isLoading) return null;
  
  const remainingTime = Math.max(0, eta - Math.floor(elapsed / 1000));
  
  return (
    <div className="eta-indicator">
      <div className="eta-progress-bar">
        <div className="eta-progress" style={{ width: `${progress}%` }} />
        <div className="eta-glow" style={{ left: `${progress}%` }} />
      </div>
      
      <div className="eta-info">
        <div className="eta-left">
          <Clock className="eta-icon" />
          <span className="eta-elapsed">{formatElapsed(elapsed)} 경과</span>
        </div>
        
        <div className="eta-middle">
          <TrendingUp className="eta-icon" />
          <span className="eta-tokens">~{tokens} 토큰 예상</span>
        </div>
        
        <div className="eta-right">
          <Zap className="eta-icon" />
          <span className="eta-remaining">
            {remainingTime > 0 ? `${formatTime(remainingTime)} 남음` : "완료 중..."}
          </span>
        </div>
      </div>
      
      <style jsx>{`
        .eta-indicator {
          padding: 12px 16px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 12px;
        }
        
        .eta-progress-bar {
          position: relative;
          height: 4px;
          background: var(--bg-tertiary, #252536);
          border-radius: 2px;
          overflow: visible;
          margin-bottom: 12px;
        }
        
        .eta-progress {
          height: 100%;
          background: linear-gradient(90deg, var(--primary, #7c3aed), #a78bfa);
          border-radius: 2px;
          transition: width 0.2s ease;
        }
        
        .eta-glow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          background: var(--primary, #7c3aed);
          border-radius: 50%;
          filter: blur(8px);
          opacity: 0.6;
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
        
        .eta-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .eta-left, .eta-middle, .eta-right {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .eta-icon {
          width: 14px;
          height: 14px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .eta-left span {
          font-size: 12px;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .eta-middle span {
          font-size: 12px;
          color: var(--primary, #7c3aed);
        }
        
        .eta-right span {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-primary, #e0e0e0);
        }
      `}</style>
    </div>
  );
}

export default ETAIndicator;
