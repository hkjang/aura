"use client";

import { useState, useEffect } from "react";
import { Clock, Sparkles, History, ArrowRight } from "lucide-react";

interface SuggestionPanelProps {
  onSelectSuggestion: (suggestion: string) => void;
  currentInput?: string;
  recentQuestions?: string[];
}

const contextualSuggestions = [
  { category: "분석", suggestions: ["이 데이터를 요약해줘", "트렌드를 분석해줘", "핵심 인사이트를 추출해줘"] },
  { category: "코드", suggestions: ["코드를 리뷰해줘", "버그를 찾아줘", "성능을 개선해줘"] },
  { category: "작성", suggestions: ["이메일을 작성해줘", "보고서를 작성해줘", "문서를 요약해줘"] },
  { category: "번역", suggestions: ["한국어로 번역해줘", "영어로 번역해줘", "문장을 교정해줘"] },
];

export function SuggestionPanel({ 
  onSelectSuggestion, 
  currentInput = "", 
  recentQuestions = [] 
}: SuggestionPanelProps) {
  const [showRecent, setShowRecent] = useState(false);
  const [localRecent, setLocalRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("aura-recent-questions");
      if (saved) {
        setLocalRecent(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load recent questions:", e);
    }
  }, []);

  const recentItems = recentQuestions.length > 0 ? recentQuestions : localRecent;

  if (currentInput.length > 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Quick Suggestions */}
      <div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          marginBottom: '16px' 
        }}>
          <Sparkles style={{ width: '18px', height: '18px', color: 'var(--color-primary)' }} />
          <span style={{ 
            fontSize: '15px', 
            fontWeight: 600,
            color: 'var(--text-primary)'
          }}>
            빠른 시작
          </span>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
          gap: '12px' 
        }}>
          {contextualSuggestions.map((category) => (
            <div key={category.category} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {category.category}
              </span>
              {category.suggestions.slice(0, 2).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => onSelectSuggestion(suggestion)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 14px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'var(--color-primary-light)';
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.color = 'var(--color-primary)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'var(--bg-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Questions */}
      {recentItems.length > 0 && (
        <div>
          <button
            onClick={() => setShowRecent(!showRecent)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 0',
              transition: 'color 150ms ease'
            }}
          >
            <History style={{ width: '16px', height: '16px' }} />
            <span>최근 질문</span>
            <ArrowRight style={{ 
              width: '14px', 
              height: '14px', 
              transform: showRecent ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 150ms ease'
            }} />
          </button>
          
          {showRecent && (
            <div style={{ 
              marginTop: '12px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px' 
            }}>
              {recentItems.slice(0, 5).map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectSuggestion(question)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 14px',
                    fontSize: '14px',
                    fontWeight: 400,
                    color: 'var(--text-primary)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 150ms ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'var(--bg-tertiary)';
                    e.currentTarget.style.borderColor = 'var(--border-color-strong)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'var(--bg-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <span style={{ 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}>
                    {question}
                  </span>
                  <ArrowRight style={{ 
                    width: '14px', 
                    height: '14px', 
                    color: 'var(--text-tertiary)',
                    flexShrink: 0,
                    marginLeft: '12px'
                  }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Progress indicator for streaming responses
interface ProgressIndicatorProps {
  stage: "thinking" | "generating" | "done";
  progress?: number;
  tokens?: number;
  estimatedTime?: number;
}

export function ProgressIndicator({ stage, progress = 0, tokens = 0, estimatedTime }: ProgressIndicatorProps) {
  const stages = {
    thinking: { label: "생각 중...", color: "#d97706" },
    generating: { label: "생성 중...", color: "#2563eb" },
    done: { label: "완료", color: "#059669" },
  };

  const current = stages[stage];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '16px 20px',
      background: 'var(--bg-tertiary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)'
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: stage === 'done' ? '#dcfce7' : 'var(--bg-secondary)',
        border: stage === 'done' ? '2px solid #059669' : `3px solid ${current.color}`,
        animation: stage !== 'done' ? 'spin 1s linear infinite' : 'none',
        borderTopColor: stage !== 'done' ? 'transparent' : undefined
      }}>
        {stage === 'done' && (
          <Sparkles style={{ width: '18px', height: '18px', color: '#059669' }} />
        )}
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: '6px' 
        }}>
          <span style={{ 
            fontSize: '14px', 
            fontWeight: 600,
            color: 'var(--text-primary)'
          }}>
            {current.label}
          </span>
          {stage === "generating" && progress > 0 && (
            <span style={{ 
              fontSize: '13px', 
              fontWeight: 500,
              color: 'var(--text-secondary)'
            }}>
              {progress}%
            </span>
          )}
        </div>
        
        {stage === "generating" && (
          <div style={{
            height: '6px',
            background: 'var(--border-color)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div 
              style={{ 
                height: '100%',
                background: current.color,
                width: `${progress}%`,
                transition: 'width 300ms ease',
                borderRadius: '3px'
              }}
            />
          </div>
        )}
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px', 
          marginTop: '8px',
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--text-secondary)'
        }}>
          {tokens > 0 && <span>{tokens} 토큰</span>}
          {estimatedTime && stage !== "done" && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock style={{ width: '12px', height: '12px' }} />
              ~{estimatedTime}초 남음
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
