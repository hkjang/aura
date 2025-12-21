"use client";

import { useState, useEffect, useMemo } from "react";
import { AlertTriangle, Shield, Info, XCircle } from "lucide-react";

type ViolationType = "forbidden" | "sensitive" | "warning" | "info";

interface PolicyViolation {
  id: string;
  type: ViolationType;
  message: string;
  matchedText: string;
  startIndex: number;
  endIndex: number;
}

interface PolicyRule {
  id: string;
  type: ViolationType;
  pattern: RegExp;
  message: string;
}

interface PolicyValidatorProps {
  inputValue: string;
  isEnabled?: boolean;
  onViolationChange?: (violations: PolicyViolation[]) => void;
}

// 기본 정책 규칙 (확장 가능)
const DEFAULT_POLICY_RULES: PolicyRule[] = [
  // 민감 정보 패턴
  {
    id: "credit-card",
    type: "forbidden",
    pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    message: "신용카드 번호가 감지되었습니다. 민감 정보를 입력하지 마세요."
  },
  {
    id: "ssn",
    type: "forbidden",
    pattern: /\b\d{6}[-\s]?\d{7}\b/g,
    message: "주민등록번호 형식이 감지되었습니다."
  },
  {
    id: "phone",
    type: "warning",
    pattern: /\b01[0-9][-\s]?\d{3,4}[-\s]?\d{4}\b/g,
    message: "전화번호가 포함되어 있습니다. 필요한 경우에만 포함하세요."
  },
  {
    id: "email-personal",
    type: "info",
    pattern: /\b[A-Za-z0-9._%+-]+@(gmail|yahoo|hotmail|naver|daum)\.[a-z]{2,}\b/gi,
    message: "개인 이메일 주소가 포함되어 있습니다."
  },
  // API 키 / 비밀번호 패턴
  {
    id: "api-key",
    type: "forbidden",
    pattern: /\b(sk-|pk-|api[_-]?key[:\s]*)[a-zA-Z0-9]{20,}\b/gi,
    message: "API 키가 감지되었습니다. 보안 정보를 포함하지 마세요."
  },
  {
    id: "password",
    type: "sensitive",
    pattern: /\b(password|비밀번호|pw)[:\s]*[^\s]{4,}/gi,
    message: "비밀번호 정보가 포함된 것 같습니다."
  },
  // IP 주소
  {
    id: "ip-address",
    type: "warning",
    pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    message: "IP 주소가 포함되어 있습니다."
  }
];

const getViolationIcon = (type: ViolationType) => {
  switch (type) {
    case "forbidden":
      return <XCircle className="violation-icon forbidden" />;
    case "sensitive":
      return <Shield className="violation-icon sensitive" />;
    case "warning":
      return <AlertTriangle className="violation-icon warning" />;
    case "info":
      return <Info className="violation-icon info" />;
  }
};

const getViolationLabel = (type: ViolationType) => {
  switch (type) {
    case "forbidden":
      return "차단됨";
    case "sensitive":
      return "민감정보";
    case "warning":
      return "주의";
    case "info":
      return "참고";
  }
};

export function PolicyValidator({
  inputValue,
  isEnabled = true,
  onViolationChange
}: PolicyValidatorProps) {
  const [violations, setViolations] = useState<PolicyViolation[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 입력값에서 정책 위반 검사
  const detectedViolations = useMemo(() => {
    if (!isEnabled || !inputValue) return [];
    
    const found: PolicyViolation[] = [];
    
    DEFAULT_POLICY_RULES.forEach(rule => {
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
      let match;
      
      while ((match = regex.exec(inputValue)) !== null) {
        found.push({
          id: `${rule.id}-${match.index}`,
          type: rule.type,
          message: rule.message,
          matchedText: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length
        });
      }
    });
    
    return found;
  }, [inputValue, isEnabled]);
  
  useEffect(() => {
    setViolations(detectedViolations);
    onViolationChange?.(detectedViolations);
  }, [detectedViolations, onViolationChange]);
  
  const hasForbidden = violations.some(v => v.type === "forbidden");
  const hasSensitive = violations.some(v => v.type === "sensitive");
  const hasWarning = violations.some(v => v.type === "warning");
  
  if (!isEnabled || violations.length === 0) return null;
  
  const priorityViolation = violations.find(v => v.type === "forbidden") 
    || violations.find(v => v.type === "sensitive")
    || violations[0];
  
  return (
    <div className={`policy-validator ${hasForbidden ? "has-forbidden" : hasSensitive ? "has-sensitive" : hasWarning ? "has-warning" : ""}`}>
      <div 
        className="validator-summary"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {getViolationIcon(priorityViolation.type)}
        <span className="summary-message">{priorityViolation.message}</span>
        {violations.length > 1 && (
          <span className="violation-count">+{violations.length - 1}개 더</span>
        )}
      </div>
      
      {isExpanded && violations.length > 1 && (
        <div className="violations-detail">
          {violations.map(violation => (
            <div key={violation.id} className={`violation-item ${violation.type}`}>
              {getViolationIcon(violation.type)}
              <div className="violation-content">
                <span className="violation-label">{getViolationLabel(violation.type)}</span>
                <span className="violation-message">{violation.message}</span>
                <code className="matched-text">{violation.matchedText}</code>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <style jsx>{`
        .policy-validator {
          position: absolute;
          bottom: 100%;
          left: 0;
          right: 0;
          margin-bottom: 8px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 12px;
          overflow: hidden;
          z-index: 99;
        }
        
        .policy-validator.has-forbidden {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }
        
        .policy-validator.has-sensitive {
          border-color: #f59e0b;
          background: rgba(245, 158, 11, 0.1);
        }
        
        .policy-validator.has-warning {
          border-color: #eab308;
          background: rgba(234, 179, 8, 0.1);
        }
        
        .validator-summary {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          cursor: pointer;
        }
        
        .validator-summary :global(.violation-icon) {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }
        
        .validator-summary :global(.violation-icon.forbidden) {
          color: #ef4444;
        }
        
        .validator-summary :global(.violation-icon.sensitive) {
          color: #f59e0b;
        }
        
        .validator-summary :global(.violation-icon.warning) {
          color: #eab308;
        }
        
        .validator-summary :global(.violation-icon.info) {
          color: #3b82f6;
        }
        
        .summary-message {
          flex: 1;
          font-size: 13px;
          color: var(--text-primary, #e0e0e0);
        }
        
        .violation-count {
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
          background: var(--bg-tertiary, #252536);
          padding: 2px 8px;
          border-radius: 10px;
        }
        
        .violations-detail {
          border-top: 1px solid var(--border-color, #3e3e5a);
          padding: 8px;
        }
        
        .violation-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 8px;
          border-radius: 8px;
          margin-bottom: 4px;
        }
        
        .violation-item:last-child {
          margin-bottom: 0;
        }
        
        .violation-item :global(.violation-icon) {
          width: 16px;
          height: 16px;
          margin-top: 2px;
        }
        
        .violation-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .violation-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-muted, #6e6e7e);
        }
        
        .violation-message {
          font-size: 13px;
          color: var(--text-primary, #e0e0e0);
        }
        
        .matched-text {
          font-size: 12px;
          font-family: monospace;
          background: var(--bg-tertiary, #252536);
          padding: 4px 8px;
          border-radius: 4px;
          color: var(--text-secondary, #a0a0b0);
          word-break: break-all;
        }
      `}</style>
    </div>
  );
}

export default PolicyValidator;
