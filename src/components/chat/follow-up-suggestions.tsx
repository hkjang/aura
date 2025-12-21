"use client";

import { useMemo } from "react";
import { ArrowRight } from "lucide-react";

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
    suggestions.push({ id: "code-1", text: "이 코드의 시간 복잡도는 어떻게 되나요?", type: "deeper" });
    suggestions.push({ id: "code-2", text: "에러 처리를 추가한 버전을 보여주세요", type: "related" });
    suggestions.push({ id: "code-3", text: "실제 사용 예시를 보여주세요", type: "example" });
  }
  
  // 비교/분석 관련
  if (userContent.includes("비교") || userContent.includes("차이") || content.includes("반면")) {
    suggestions.push({ id: "compare-1", text: "각각의 장단점을 표로 정리해주세요", type: "deeper" });
    suggestions.push({ id: "compare-2", text: "어떤 상황에서 각각을 사용해야 하나요?", type: "clarify" });
  }
  
  // 설명 관련
  if (content.includes("설명") || content.includes("정의") || content.length > 500) {
    suggestions.push({ id: "explain-1", text: "한 문장으로 요약해주세요", type: "clarify" });
    suggestions.push({ id: "explain-2", text: "초보자에게 설명하듯이 다시 설명해주세요", type: "related" });
  }
  
  // 목록 관련
  if (content.includes("1.") || content.includes("•") || content.includes("-")) {
    suggestions.push({ id: "list-1", text: "가장 중요한 항목은 무엇인가요?", type: "deeper" });
    suggestions.push({ id: "list-2", text: "각 항목에 대해 더 자세히 설명해주세요", type: "deeper" });
  }
  
  // 기본 후속 질문
  if (suggestions.length === 0) {
    suggestions.push({ id: "default-1", text: "이에 대해 더 자세히 설명해주세요", type: "deeper" });
    suggestions.push({ id: "default-2", text: "관련된 다른 주제가 있나요?", type: "related" });
    suggestions.push({ id: "default-3", text: "실제 예시를 들어주세요", type: "example" });
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
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginTop: '8px'
    }}>
      {suggestions.map(suggestion => (
        <button
          key={suggestion.id}
          onClick={() => onSelectSuggestion(suggestion.text)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            background: 'transparent',
            border: '1px solid var(--border-color, #3e3e5a)',
            borderRadius: '18px',
            cursor: 'pointer',
            fontSize: '13px',
            color: 'var(--text-secondary, #a0a0b0)',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-tertiary, #252536)';
            e.currentTarget.style.borderColor = 'var(--color-primary, #7c3aed)';
            e.currentTarget.style.color = 'var(--color-primary, #7c3aed)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'var(--border-color, #3e3e5a)';
            e.currentTarget.style.color = 'var(--text-secondary, #a0a0b0)';
          }}
        >
          <span>{suggestion.text}</span>
          <ArrowRight style={{ width: '12px', height: '12px', opacity: 0.6 }} />
        </button>
      ))}
    </div>
  );
}

export default FollowUpSuggestions;
