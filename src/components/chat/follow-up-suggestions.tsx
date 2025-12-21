"use client";

import { useMemo } from "react";
import { 
  MessageSquare, 
  ArrowRight, 
  Sparkles, 
  HelpCircle,
  Lightbulb
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

interface FollowUpSuggestion {
  id: string;
  text: string;
  type: "deeper" | "related" | "clarify" | "example";
  context?: string;
}

interface FollowUpSuggestionsProps {
  messages: Message[];
  onSelectSuggestion: (suggestion: string) => void;
}

const SUGGESTION_TYPES = {
  deeper: { label: "심층 분석", icon: Lightbulb, color: "#8b5cf6" },
  related: { label: "관련 질문", icon: ArrowRight, color: "#3b82f6" },
  clarify: { label: "명확화", icon: HelpCircle, color: "#f59e0b" },
  example: { label: "예시 요청", icon: Sparkles, color: "#10b981" }
};

// 마지막 응답을 분석하여 후속 질문 생성
function generateFollowUpSuggestions(messages: Message[]): FollowUpSuggestion[] {
  if (messages.length < 2) return [];
  
  const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant");
  const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
  
  if (!lastAssistantMsg || !lastUserMsg) return [];
  
  const content = lastAssistantMsg.content.toLowerCase();
  const userContent = lastUserMsg.content.toLowerCase();
  const suggestions: FollowUpSuggestion[] = [];
  
  // 코드 관련
  if (content.includes("```") || content.includes("코드") || content.includes("function")) {
    suggestions.push({
      id: "code-1",
      text: "이 코드의 시간 복잡도는 어떻게 되나요?",
      type: "deeper"
    });
    suggestions.push({
      id: "code-2",
      text: "에러 처리를 추가한 버전을 보여주세요",
      type: "related"
    });
    suggestions.push({
      id: "code-3",
      text: "실제 사용 예시를 보여주세요",
      type: "example"
    });
  }
  
  // 비교/분석 관련
  if (userContent.includes("비교") || userContent.includes("차이") || content.includes("반면")) {
    suggestions.push({
      id: "compare-1",
      text: "각각의 장단점을 표로 정리해주세요",
      type: "deeper"
    });
    suggestions.push({
      id: "compare-2",
      text: "어떤 상황에서 각각을 사용해야 하나요?",
      type: "clarify"
    });
  }
  
  // 설명 관련
  if (content.includes("설명") || content.includes("정의") || content.length > 500) {
    suggestions.push({
      id: "explain-1",
      text: "한 문장으로 요약해주세요",
      type: "clarify"
    });
    suggestions.push({
      id: "explain-2",
      text: "초보자에게 설명하듯이 다시 설명해주세요",
      type: "related"
    });
  }
  
  // 목록 관련
  if (content.includes("1.") || content.includes("•") || content.includes("-")) {
    suggestions.push({
      id: "list-1",
      text: "가장 중요한 항목은 무엇인가요?",
      type: "deeper"
    });
    suggestions.push({
      id: "list-2", 
      text: "각 항목에 대해 더 자세히 설명해주세요",
      type: "deeper"
    });
  }
  
  // 기본 후속 질문
  if (suggestions.length === 0) {
    suggestions.push({
      id: "default-1",
      text: "이에 대해 더 자세히 설명해주세요",
      type: "deeper"
    });
    suggestions.push({
      id: "default-2",
      text: "관련된 다른 주제가 있나요?",
      type: "related"
    });
    suggestions.push({
      id: "default-3",
      text: "실제 예시를 들어주세요",
      type: "example"
    });
  }
  
  return suggestions.slice(0, 4);
}

export function FollowUpSuggestions({
  messages,
  onSelectSuggestion
}: FollowUpSuggestionsProps) {
  const suggestions = useMemo(
    () => generateFollowUpSuggestions(messages),
    [messages]
  );
  
  if (suggestions.length === 0) return null;
  
  return (
    <div className="follow-up-suggestions">
      <div className="suggestions-header">
        <MessageSquare className="header-icon" />
        <span>이어서 질문하기</span>
      </div>
      
      <div className="suggestions-grid">
        {suggestions.map(suggestion => {
          const config = SUGGESTION_TYPES[suggestion.type];
          const Icon = config.icon;
          
          return (
            <button
              key={suggestion.id}
              className="suggestion-btn"
              onClick={() => onSelectSuggestion(suggestion.text)}
              style={{ borderColor: `${config.color}40` }}
            >
              <Icon 
                className="suggestion-icon" 
                size={14}
                style={{ color: config.color }}
              />
              <span className="suggestion-text">{suggestion.text}</span>
            </button>
          );
        })}
      </div>
      
      <style jsx>{`
        .follow-up-suggestions {
          padding: 12px 16px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 12px;
        }
        
        .suggestions-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .header-icon {
          width: 14px;
          height: 14px;
        }
        
        .suggestions-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .suggestion-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: var(--bg-tertiary, #252536);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .suggestion-btn:hover {
          background: var(--bg-hover, #2e2e44);
          transform: translateY(-1px);
        }
        
        .suggestion-icon {
          flex-shrink: 0;
        }
        
        .suggestion-text {
          font-size: 12px;
          color: var(--text-secondary, #a0a0b0);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }
      `}</style>
    </div>
  );
}

export default FollowUpSuggestions;
