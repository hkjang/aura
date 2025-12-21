"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface AutocompleteSuggestion {
  id: string;
  text: string;
  confidence: number;
  type: "complete" | "continue" | "rephrase";
}

interface SmartAutocompleteProps {
  inputValue: string;
  onSuggestionSelect: (suggestion: string) => void;
  isEnabled?: boolean;
  maxSuggestions?: number;
}

// 문맥 기반 자동완성 제안 (시뮬레이션)
const generateContextualSuggestions = (input: string): AutocompleteSuggestion[] => {
  if (!input || input.length < 3) return [];
  
  const suggestions: AutocompleteSuggestion[] = [];
  const lowerInput = input.toLowerCase();
  
  // 한국어 패턴 매칭
  if (lowerInput.includes("어떻게")) {
    suggestions.push({ id: "1", text: `${input} 할 수 있을까요?`, confidence: 0.9, type: "complete" });
    suggestions.push({ id: "2", text: `${input} 하면 좋을까요?`, confidence: 0.85, type: "complete" });
  }
  
  if (lowerInput.includes("설명") || lowerInput.includes("알려")) {
    suggestions.push({ id: "3", text: `${input}고 예제도 보여주세요.`, confidence: 0.88, type: "continue" });
  }
  
  if (lowerInput.includes("코드") || lowerInput.includes("구현")) {
    suggestions.push({ id: "4", text: `${input}하고 주석도 추가해주세요.`, confidence: 0.87, type: "continue" });
    suggestions.push({ id: "5", text: `${input}하고 테스트 코드도 작성해주세요.`, confidence: 0.82, type: "continue" });
  }
  
  if (lowerInput.includes("비교") || lowerInput.includes("차이")) {
    suggestions.push({ id: "6", text: `${input}점을 표로 정리해주세요.`, confidence: 0.86, type: "complete" });
  }
  
  // 영어 패턴 매칭
  if (lowerInput.includes("how to")) {
    suggestions.push({ id: "7", text: `${input} with examples`, confidence: 0.9, type: "continue" });
  }
  
  if (lowerInput.includes("explain")) {
    suggestions.push({ id: "8", text: `${input} in simple terms`, confidence: 0.88, type: "continue" });
  }
  
  // 기본 제안
  if (suggestions.length === 0 && input.length > 5) {
    suggestions.push({ id: "default-1", text: `${input}에 대해 자세히 설명해주세요.`, confidence: 0.7, type: "complete" });
    suggestions.push({ id: "default-2", text: `${input}의 예시를 보여주세요.`, confidence: 0.65, type: "complete" });
  }
  
  return suggestions.slice(0, 5);
};

export function SmartAutocomplete({
  inputValue,
  onSuggestionSelect,
  isEnabled = true,
  maxSuggestions = 3
}: SmartAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isVisible, setIsVisible] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  
  // 입력값 변경 시 제안 생성 (debounce)
  useEffect(() => {
    if (!isEnabled) {
      setSuggestions([]);
      setIsVisible(false);
      return;
    }
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      const newSuggestions = generateContextualSuggestions(inputValue);
      setSuggestions(newSuggestions.slice(0, maxSuggestions));
      setIsVisible(newSuggestions.length > 0);
      setSelectedIndex(-1);
    }, 300);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputValue, isEnabled, maxSuggestions]);
  
  // 키보드 네비게이션
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isVisible || suggestions.length === 0) return;
    
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : 0);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : suggestions.length - 1);
        break;
      case "Tab":
        if (selectedIndex >= 0) {
          e.preventDefault();
          onSuggestionSelect(suggestions[selectedIndex].text);
          setIsVisible(false);
        }
        break;
      case "Escape":
        setIsVisible(false);
        break;
    }
  }, [isVisible, suggestions, selectedIndex, onSuggestionSelect]);
  
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
  
  if (!isVisible || suggestions.length === 0) return null;
  
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      padding: '8px 0'
    }}>
      <span style={{
        display: 'flex',
        alignItems: 'center',
        fontSize: '11px',
        color: 'var(--text-muted, #6e6e7e)',
        marginRight: '4px'
      }}>
        추천:
      </span>
      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion.id}
          onClick={() => {
            onSuggestionSelect(suggestion.text);
            setIsVisible(false);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: index === selectedIndex ? 'var(--bg-tertiary, #252536)' : 'transparent',
            border: `1px solid ${index === selectedIndex ? 'var(--color-primary, #7c3aed)' : 'var(--border-color, #3e3e5a)'}`,
            borderRadius: '16px',
            cursor: 'pointer',
            fontSize: '12px',
            color: index === selectedIndex ? 'var(--color-primary, #7c3aed)' : 'var(--text-secondary, #a0a0b0)',
            transition: 'all 0.15s ease',
            maxWidth: '300px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-tertiary, #252536)';
            e.currentTarget.style.borderColor = 'var(--color-primary, #7c3aed)';
            e.currentTarget.style.color = 'var(--color-primary, #7c3aed)';
          }}
          onMouseLeave={(e) => {
            if (index !== selectedIndex) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border-color, #3e3e5a)';
              e.currentTarget.style.color = 'var(--text-secondary, #a0a0b0)';
            }
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{suggestion.text}</span>
        </button>
      ))}
      <span style={{
        display: 'flex',
        alignItems: 'center',
        fontSize: '10px',
        color: 'var(--text-muted, #6e6e7e)',
        marginLeft: '4px',
        opacity: 0.7
      }}>
        ↑↓ Tab
      </span>
    </div>
  );
}

export default SmartAutocomplete;
