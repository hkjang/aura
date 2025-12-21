"use client";

import { useState, useCallback, useRef } from "react";
import { 
  AlertTriangle, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  Clock,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FallbackConfig {
  maxRetries?: number;
  retryDelay?: number; // ms
  fallbackModels?: string[];
  showRetryUI?: boolean;
}

interface FallbackState {
  status: "idle" | "loading" | "success" | "error" | "retrying" | "fallback";
  errorMessage?: string;
  retriesLeft?: number;
  currentModel?: string;
  fallbackModel?: string;
}

interface FallbackHandlerProps {
  state: FallbackState;
  onRetry: () => void;
  onUseFallback: (modelId: string) => void;
  onCancel: () => void;
  config?: FallbackConfig;
}

const DEFAULT_CONFIG: Required<FallbackConfig> = {
  maxRetries: 3,
  retryDelay: 2000,
  fallbackModels: ["gpt-3.5-turbo", "gemma3:1b"],
  showRetryUI: true
};

// 폴백 상태 UI 컴포넌트
export function FallbackHandler({
  state,
  onRetry,
  onUseFallback,
  onCancel,
  config = {}
}: FallbackHandlerProps) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  if (state.status === "idle" || state.status === "success") {
    return null;
  }
  
  return (
    <div className={`fallback-handler ${state.status}`}>
      {state.status === "loading" && (
        <div className="status-content">
          <RefreshCw className="status-icon spinning" />
          <span>처리 중...</span>
        </div>
      )}
      
      {state.status === "retrying" && (
        <div className="status-content">
          <RefreshCw className="status-icon spinning" />
          <div className="retry-info">
            <span>재시도 중... ({mergedConfig.maxRetries - (state.retriesLeft || 0)}/{mergedConfig.maxRetries})</span>
            <span className="model-info">모델: {state.currentModel}</span>
          </div>
        </div>
      )}
      
      {state.status === "error" && (
        <div className="error-content">
          <div className="error-header">
            <AlertTriangle className="status-icon error" />
            <div className="error-details">
              <span className="error-title">요청 실패</span>
              <span className="error-message">{state.errorMessage}</span>
            </div>
          </div>
          
          <div className="error-actions">
            {mergedConfig.showRetryUI && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw size={14} />
                재시도
              </Button>
            )}
            
            {mergedConfig.fallbackModels.length > 0 && (
              <div className="fallback-options">
                <span className="fallback-label">대체 모델:</span>
                {mergedConfig.fallbackModels.map(model => (
                  <button
                    key={model}
                    className="fallback-btn"
                    onClick={() => onUseFallback(model)}
                  >
                    {model}
                  </button>
                ))}
              </div>
            )}
            
            <button className="cancel-btn" onClick={onCancel}>
              취소
            </button>
          </div>
        </div>
      )}
      
      {state.status === "fallback" && (
        <div className="fallback-notice">
          <WifiOff className="status-icon warning" />
          <div className="fallback-info">
            <span>대체 모델로 전환됨</span>
            <span className="model-switch">
              {state.currentModel} → {state.fallbackModel}
            </span>
          </div>
          <CheckCircle className="check-icon" />
        </div>
      )}
      
      <style jsx>{`
        .fallback-handler {
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 12px;
        }
        
        .fallback-handler.loading,
        .fallback-handler.retrying {
          background: rgba(124, 58, 237, 0.1);
          border: 1px solid var(--primary, #7c3aed);
        }
        
        .fallback-handler.error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid #ef4444;
        }
        
        .fallback-handler.fallback {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid #f59e0b;
        }
        
        .status-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .status-icon {
          width: 18px;
          height: 18px;
        }
        
        .status-icon.spinning {
          color: var(--primary, #7c3aed);
          animation: spin 1s linear infinite;
        }
        
        .status-icon.error {
          color: #ef4444;
        }
        
        .status-icon.warning {
          color: #f59e0b;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .retry-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 13px;
          color: var(--primary, #7c3aed);
        }
        
        .model-info {
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .error-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .error-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        
        .error-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .error-title {
          font-size: 14px;
          font-weight: 500;
          color: #ef4444;
        }
        
        .error-message {
          font-size: 12px;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .error-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .fallback-options {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }
        
        .fallback-label {
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .fallback-btn {
          padding: 4px 10px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 14px;
          font-size: 11px;
          color: var(--text-secondary, #a0a0b0);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .fallback-btn:hover {
          border-color: var(--primary, #7c3aed);
          color: var(--primary, #7c3aed);
        }
        
        .cancel-btn {
          padding: 6px 12px;
          background: transparent;
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 6px;
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
          cursor: pointer;
        }
        
        .fallback-notice {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .fallback-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 13px;
          color: #f59e0b;
        }
        
        .model-switch {
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .check-icon {
          width: 18px;
          height: 18px;
          color: #10b981;
        }
      `}</style>
    </div>
  );
}

// 폴백 로직 훅
export function useFallback<T>(config?: FallbackConfig) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const [state, setState] = useState<FallbackState>({ status: "idle" });
  const retriesRef = useRef(0);
  
  const execute = useCallback(async (
    fn: () => Promise<T>,
    currentModel: string
  ): Promise<T | null> => {
    setState({ status: "loading", currentModel });
    retriesRef.current = 0;
    
    const attemptRequest = async (): Promise<T | null> => {
      try {
        const result = await fn();
        setState({ status: "success" });
        return result;
      } catch (error) {
        retriesRef.current++;
        
        if (retriesRef.current < mergedConfig.maxRetries) {
          setState({
            status: "retrying",
            currentModel,
            retriesLeft: mergedConfig.maxRetries - retriesRef.current
          });
          
          await new Promise(resolve => setTimeout(resolve, mergedConfig.retryDelay));
          return attemptRequest();
        }
        
        setState({
          status: "error",
          errorMessage: (error as Error).message,
          currentModel
        });
        
        return null;
      }
    };
    
    return attemptRequest();
  }, [mergedConfig]);
  
  const executeWithFallback = useCallback(async (
    fn: (modelId: string) => Promise<T>,
    primaryModel: string
  ): Promise<T | null> => {
    const result = await execute(() => fn(primaryModel), primaryModel);
    
    if (result !== null) {
      return result;
    }
    
    // 폴백 모델 시도
    for (const fallbackModel of mergedConfig.fallbackModels) {
      if (fallbackModel === primaryModel) continue;
      
      setState({
        status: "fallback",
        currentModel: primaryModel,
        fallbackModel
      });
      
      try {
        const fallbackResult = await fn(fallbackModel);
        return fallbackResult;
      } catch {
        continue;
      }
    }
    
    setState({
      status: "error",
      errorMessage: "모든 모델 시도 실패",
      currentModel: primaryModel
    });
    
    return null;
  }, [execute, mergedConfig.fallbackModels]);
  
  const reset = useCallback(() => {
    setState({ status: "idle" });
    retriesRef.current = 0;
  }, []);
  
  return {
    state,
    execute,
    executeWithFallback,
    reset,
    setState
  };
}

export default FallbackHandler;
