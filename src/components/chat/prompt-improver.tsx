"use client";

import { useState, useMemo } from "react";
import { 
  Wand2, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb,
  ChevronDown,
  Copy,
  Sparkles
} from "lucide-react";

interface PromptAnalysis {
  score: number; // 0-100
  issues: Array<{
    type: "clarity" | "specificity" | "context" | "structure";
    message: string;
    suggestion: string;
  }>;
  improvements: string[];
  improvedPrompt: string;
}

interface PromptImproverProps {
  currentPrompt: string;
  onApplyImprovement: (improvedPrompt: string) => void;
  isEnabled?: boolean;
}

// 프롬프트 품질 분석 (실제로는 AI API 호출로 대체 가능)
function analyzePrompt(prompt: string): PromptAnalysis {
  const issues: PromptAnalysis["issues"] = [];
  const improvements: string[] = [];
  let score = 100;
  
  // 길이 체크
  if (prompt.length < 20) {
    score -= 20;
    issues.push({
      type: "specificity",
      message: "프롬프트가 너무 짧습니다",
      suggestion: "더 구체적인 요청 사항을 추가하세요"
    });
  }
  
  // 명확성 체크
  const vagueWords = ["어떻게", "무언가", "그냥", "대충", "간단히"];
  vagueWords.forEach(word => {
    if (prompt.includes(word)) {
      score -= 5;
      issues.push({
        type: "clarity",
        message: `모호한 표현 "${word}"이 포함되어 있습니다`,
        suggestion: "더 구체적인 표현으로 대체하세요"
      });
    }
  });
  
  // 컨텍스트 체크
  if (!prompt.includes("예를 들어") && !prompt.includes("예시") && prompt.length > 50) {
    improvements.push("예시를 추가하면 더 정확한 응답을 받을 수 있습니다");
  }
  
  // 역할 지정 체크
  if (!prompt.includes("역할") && !prompt.includes("~처럼") && !prompt.includes("전문가")) {
    improvements.push("AI에게 역할을 부여하면 응답 품질이 향상됩니다 (예: '프로그래머로서')");
  }
  
  // 출력 형식 지정 체크
  if (!prompt.includes("형식") && !prompt.includes("목록") && !prompt.includes("표") && !prompt.includes("JSON")) {
    improvements.push("원하는 출력 형식을 명시하면 더 적합한 응답을 받을 수 있습니다");
  }
  
  // 구조 체크
  if (prompt.length > 100 && !prompt.includes("\n") && !prompt.includes(".")) {
    score -= 10;
    issues.push({
      type: "structure",
      message: "긴 프롬프트가 하나의 문장으로 되어 있습니다",
      suggestion: "여러 문장이나 단락으로 나누어 가독성을 높이세요"
    });
  }
  
  // 개선된 프롬프트 생성
  let improvedPrompt = prompt;
  
  if (!prompt.match(/[.!?]$/)) {
    improvedPrompt += ".";
  }
  
  if (improvements.some(i => i.includes("역할"))) {
    improvedPrompt = "전문가로서 다음 요청에 답변해주세요.\n\n" + improvedPrompt;
  }
  
  if (improvements.some(i => i.includes("출력 형식"))) {
    improvedPrompt += " 결과를 명확하고 구조화된 형식으로 제공해주세요.";
  }
  
  if (improvements.some(i => i.includes("예시"))) {
    improvedPrompt += " 가능하다면 예시를 포함해주세요.";
  }
  
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    issues,
    improvements,
    improvedPrompt
  };
}

export function PromptImprover({
  currentPrompt,
  onApplyImprovement,
  isEnabled = true
}: PromptImproverProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const analysis = useMemo(() => {
    if (!currentPrompt || currentPrompt.length < 5) return null;
    return analyzePrompt(currentPrompt);
  }, [currentPrompt]);
  
  if (!isEnabled || !analysis) return null;
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };
  
  const getScoreLabel = (score: number) => {
    if (score >= 80) return "좋음";
    if (score >= 60) return "개선 가능";
    return "개선 필요";
  };
  
  return (
    <div className="prompt-improver">
      <button
        className="improver-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Wand2 className="toggle-icon" />
        <div className="score-badge" style={{ background: getScoreColor(analysis.score) }}>
          {analysis.score}점
        </div>
        <span className="toggle-label">프롬프트 품질: {getScoreLabel(analysis.score)}</span>
        <ChevronDown className={`chevron ${isOpen ? "open" : ""}`} />
      </button>
      
      {isOpen && (
        <div className="improver-panel">
          {/* 이슈 섹션 */}
          {analysis.issues.length > 0 && (
            <div className="section">
              <h4>
                <AlertTriangle className="section-icon warning" />
                발견된 문제
              </h4>
              <ul className="issue-list">
                {analysis.issues.map((issue, idx) => (
                  <li key={idx} className="issue-item">
                    <span className="issue-message">{issue.message}</span>
                    <span className="issue-suggestion">{issue.suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* 개선 제안 섹션 */}
          {analysis.improvements.length > 0 && (
            <div className="section">
              <h4>
                <Lightbulb className="section-icon tip" />
                개선 제안
              </h4>
              <ul className="improvement-list">
                {analysis.improvements.map((improvement, idx) => (
                  <li key={idx}>{improvement}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* 개선된 프롬프트 */}
          {analysis.improvedPrompt !== currentPrompt && (
            <div className="section">
              <h4>
                <Sparkles className="section-icon sparkle" />
                개선된 프롬프트
              </h4>
              <div className="improved-prompt">
                <p>{analysis.improvedPrompt}</p>
                <div className="prompt-actions">
                  <button
                    className="action-btn copy"
                    onClick={() => navigator.clipboard.writeText(analysis.improvedPrompt)}
                  >
                    <Copy size={14} />
                    복사
                  </button>
                  <button
                    className="action-btn apply"
                    onClick={() => {
                      onApplyImprovement(analysis.improvedPrompt);
                      setIsOpen(false);
                    }}
                  >
                    <CheckCircle size={14} />
                    적용
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      <style jsx>{`
        .prompt-improver {
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 12px;
          overflow: hidden;
        }
        
        .improver-toggle {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 12px 16px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        
        .improver-toggle:hover {
          background: var(--bg-hover, #2e2e44);
        }
        
        .toggle-icon {
          width: 18px;
          height: 18px;
          color: var(--primary, #7c3aed);
        }
        
        .score-badge {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          color: white;
        }
        
        .toggle-label {
          flex: 1;
          text-align: left;
          font-size: 13px;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .chevron {
          width: 16px;
          height: 16px;
          color: var(--text-muted, #6e6e7e);
          transition: transform 0.2s ease;
        }
        
        .chevron.open {
          transform: rotate(180deg);
        }
        
        .improver-panel {
          border-top: 1px solid var(--border-color, #3e3e5a);
          padding: 16px;
        }
        
        .section {
          margin-bottom: 16px;
        }
        
        .section:last-child {
          margin-bottom: 0;
        }
        
        .section h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 10px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary, #e0e0e0);
        }
        
        .section-icon {
          width: 16px;
          height: 16px;
        }
        
        .section-icon.warning {
          color: #f59e0b;
        }
        
        .section-icon.tip {
          color: #fbbf24;
        }
        
        .section-icon.sparkle {
          color: var(--primary, #7c3aed);
        }
        
        .issue-list, .improvement-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        
        .issue-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 10px;
          background: rgba(245, 158, 11, 0.1);
          border-radius: 8px;
          margin-bottom: 8px;
        }
        
        .issue-message {
          font-size: 13px;
          color: var(--text-primary, #e0e0e0);
        }
        
        .issue-suggestion {
          font-size: 12px;
          color: #f59e0b;
        }
        
        .improvement-list li {
          padding: 8px 0;
          font-size: 13px;
          color: var(--text-secondary, #a0a0b0);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .improvement-list li:last-child {
          border-bottom: none;
        }
        
        .improved-prompt {
          padding: 12px;
          background: var(--bg-tertiary, #252536);
          border-radius: 8px;
        }
        
        .improved-prompt p {
          margin: 0 0 12px;
          font-size: 13px;
          color: var(--text-primary, #e0e0e0);
          line-height: 1.5;
        }
        
        .prompt-actions {
          display: flex;
          gap: 8px;
        }
        
        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .action-btn.copy {
          background: transparent;
          border: 1px solid var(--border-color, #3e3e5a);
          color: var(--text-secondary, #a0a0b0);
        }
        
        .action-btn.copy:hover {
          border-color: var(--primary, #7c3aed);
          color: var(--primary, #7c3aed);
        }
        
        .action-btn.apply {
          background: var(--primary, #7c3aed);
          border: none;
          color: white;
        }
        
        .action-btn.apply:hover {
          background: var(--primary-dark, #6d28d9);
        }
      `}</style>
    </div>
  );
}

export default PromptImprover;
