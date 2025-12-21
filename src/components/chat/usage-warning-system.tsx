"use client";

import { useState, useMemo, useCallback } from "react";
import { 
  AlertTriangle, 
  Shield, 
  Ban, 
  Info,
  X,
  ChevronDown,
  Check
} from "lucide-react";

interface UsageWarning {
  id: string;
  type: "info" | "warning" | "danger" | "block";
  title: string;
  message: string;
  suggestion?: string;
  canDismiss: boolean;
  canOverride?: boolean;
}

interface UsageWarningSystemProps {
  prompt: string;
  selectedModel?: string;
  onWarningChange?: (warnings: UsageWarning[]) => void;
  onBlock?: (warning: UsageWarning) => void;
}

// 부적합 사용 감지 규칙
const DETECTION_RULES = [
  {
    id: "sensitive-data",
    type: "danger" as const,
    pattern: /(주민등록번호|신용카드|비밀번호|api[_\s]?key|secret[_\s]?key)/i,
    title: "민감 정보 감지",
    message: "입력에 민감한 정보가 포함되어 있을 수 있습니다.",
    suggestion: "민감 정보를 마스킹하거나 제거해 주세요.",
    canDismiss: true,
    canOverride: true
  },
  {
    id: "excessive-length",
    type: "warning" as const,
    minLength: 10000,
    title: "과도한 입력 길이",
    message: "입력이 너무 깁니다. 처리 시간과 비용이 증가할 수 있습니다.",
    suggestion: "입력을 분할하거나 핵심 내용만 포함해 주세요.",
    canDismiss: true
  },
  {
    id: "inappropriate-content",
    type: "block" as const,
    pattern: /(악성코드|해킹|불법|유해물)/i,
    title: "부적절한 요청",
    message: "이 요청은 서비스 정책에 위배될 수 있습니다.",
    canDismiss: false,
    canOverride: false
  },
  {
    id: "code-injection",
    type: "warning" as const,
    pattern: /(eval\s*\(|exec\s*\(|__import__|subprocess)/i,
    title: "코드 인젝션 위험",
    message: "잠재적으로 위험한 코드 패턴이 감지되었습니다.",
    suggestion: "실행하기 전에 생성된 코드를 반드시 검토하세요.",
    canDismiss: true
  },
  {
    id: "model-mismatch",
    type: "info" as const,
    modelPattern: /gpt-3\.5|gemma/i,
    promptPattern: /(복잡한|심층|고급|전문가)/i,
    title: "모델 불일치",
    message: "복잡한 작업에는 더 고급 모델이 적합할 수 있습니다.",
    suggestion: "GPT-4 또는 Claude Opus 사용을 고려해 보세요.",
    canDismiss: true
  }
];

// 경고 감지
function detectWarnings(prompt: string, model?: string): UsageWarning[] {
  const warnings: UsageWarning[] = [];
  
  DETECTION_RULES.forEach(rule => {
    let triggered = false;
    
    if ('pattern' in rule && rule.pattern) {
      triggered = rule.pattern.test(prompt);
    }
    
    if ('minLength' in rule && rule.minLength) {
      triggered = prompt.length >= rule.minLength;
    }
    
    if ('modelPattern' in rule && rule.modelPattern && rule.promptPattern) {
      if (model && rule.modelPattern.test(model) && rule.promptPattern.test(prompt)) {
        triggered = true;
      }
    }
    
    if (triggered) {
      warnings.push({
        id: rule.id,
        type: rule.type,
        title: rule.title,
        message: rule.message,
        suggestion: 'suggestion' in rule ? rule.suggestion : undefined,
        canDismiss: rule.canDismiss,
        canOverride: 'canOverride' in rule ? rule.canOverride : undefined
      });
    }
  });
  
  return warnings;
}

export function UsageWarningSystem({
  prompt,
  selectedModel,
  onWarningChange,
  onBlock
}: UsageWarningSystemProps) {
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());
  const [expandedWarnings, setExpandedWarnings] = useState<Set<string>>(new Set());
  
  // 경고 감지
  const allWarnings = useMemo(() => {
    const warnings = detectWarnings(prompt, selectedModel);
    onWarningChange?.(warnings);
    return warnings;
  }, [prompt, selectedModel, onWarningChange]);
  
  // 표시할 경고 (dismiss된 것 제외)
  const activeWarnings = useMemo(() => {
    return allWarnings.filter(w => !dismissedWarnings.has(w.id));
  }, [allWarnings, dismissedWarnings]);
  
  // 블로킹 경고
  const blockingWarnings = activeWarnings.filter(w => w.type === "block");
  
  // 경고 있으면 블록 처리
  useMemo(() => {
    if (blockingWarnings.length > 0) {
      onBlock?.(blockingWarnings[0]);
    }
  }, [blockingWarnings, onBlock]);
  
  const dismissWarning = useCallback((id: string) => {
    setDismissedWarnings(prev => new Set(prev).add(id));
  }, []);
  
  const toggleExpand = useCallback((id: string) => {
    setExpandedWarnings(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);
  
  if (activeWarnings.length === 0) return null;
  
  const getIcon = (type: UsageWarning["type"]) => {
    switch (type) {
      case "block": return Ban;
      case "danger": return Shield;
      case "warning": return AlertTriangle;
      default: return Info;
    }
  };
  
  const getColor = (type: UsageWarning["type"]) => {
    switch (type) {
      case "block": return "#dc2626";
      case "danger": return "#ef4444";
      case "warning": return "#f59e0b";
      default: return "#3b82f6";
    }
  };
  
  return (
    <div className="warning-system">
      {activeWarnings.map(warning => {
        const Icon = getIcon(warning.type);
        const color = getColor(warning.type);
        const isExpanded = expandedWarnings.has(warning.id);
        
        return (
          <div
            key={warning.id}
            className={`warning-card ${warning.type}`}
            style={{ borderColor: color }}
          >
            <div className="warning-header" onClick={() => toggleExpand(warning.id)}>
              <Icon size={18} style={{ color }} />
              <div className="warning-content">
                <span className="warning-title">{warning.title}</span>
                <span className="warning-message">{warning.message}</span>
              </div>
              
              <div className="warning-actions">
                {warning.canDismiss && (
                  <button 
                    className="dismiss-btn"
                    onClick={e => { e.stopPropagation(); dismissWarning(warning.id); }}
                    title="무시"
                  >
                    <X size={14} />
                  </button>
                )}
                {warning.suggestion && (
                  <ChevronDown className={isExpanded ? "expanded" : ""} size={14} />
                )}
              </div>
            </div>
            
            {isExpanded && warning.suggestion && (
              <div className="warning-suggestion">
                <Info size={14} />
                <span>{warning.suggestion}</span>
              </div>
            )}
            
            {warning.type === "block" && (
              <div className="block-notice">
                <Ban size={14} />
                <span>이 요청은 진행할 수 없습니다.</span>
              </div>
            )}
          </div>
        );
      })}
      
      <style jsx>{`
        .warning-system {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .warning-card {
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid;
          border-radius: 10px;
          overflow: hidden;
        }
        
        .warning-card.block {
          background: rgba(220, 38, 38, 0.1);
        }
        
        .warning-card.danger {
          background: rgba(239, 68, 68, 0.05);
        }
        
        .warning-card.warning {
          background: rgba(245, 158, 11, 0.05);
        }
        
        .warning-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          cursor: pointer;
        }
        
        .warning-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .warning-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary, #e0e0e0);
        }
        
        .warning-message {
          font-size: 12px;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .warning-actions {
          display: flex;
          gap: 4px;
        }
        
        .dismiss-btn {
          padding: 4px;
          background: transparent;
          border: none;
          color: var(--text-muted, #6e6e7e);
          cursor: pointer;
          border-radius: 4px;
        }
        
        .dismiss-btn:hover {
          background: var(--bg-tertiary, #252536);
          color: var(--text-primary, #e0e0e0);
        }
        
        .warning-actions :global(.expanded) {
          transform: rotate(180deg);
        }
        
        .warning-suggestion {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 12px;
          background: var(--bg-tertiary, #252536);
          font-size: 12px;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .warning-suggestion :global(svg) {
          flex-shrink: 0;
          margin-top: 2px;
          color: var(--primary, #7c3aed);
        }
        
        .block-notice {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          background: #dc2626;
          color: white;
          font-size: 12px;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}

export default UsageWarningSystem;
