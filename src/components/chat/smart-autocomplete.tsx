"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, ChevronRight } from "lucide-react";

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
    suggestions.push({
      id: "1",
      text: `${input} 할 수 있을까요?`,
      confidence: 0.9,
      type: "complete"
    });
    suggestions.push({
      id: "2", 
      text: `${input} 하면 좋을까요?`,
      confidence: 0.85,
      type: "complete"
    });
  }
  
  if (lowerInput.includes("설명") || lowerInput.includes("알려")) {
    suggestions.push({
      id: "3",
      text: `${input}고 예제도 보여주세요.`,
      confidence: 0.88,
      type: "continue"
    });
  }
  
  if (lowerInput.includes("코드") || lowerInput.includes("구현")) {
    suggestions.push({
      id: "4",
      text: `${input}하고 주석도 추가해주세요.`,
      confidence: 0.87,
      type: "continue"
    });
    suggestions.push({
      id: "5",
      text: `${input}하고 테스트 코드도 작성해주세요.`,
      confidence: 0.82,
      type: "continue"
    });
  }
  
  if (lowerInput.includes("비교") || lowerInput.includes("차이")) {
    suggestions.push({
      id: "6",
      text: `${input}점을 표로 정리해주세요.`,
      confidence: 0.86,
      type: "complete"
    });
  }
  
  // 영어 패턴 매칭
  if (lowerInput.includes("how to")) {
    suggestions.push({
      id: "7",
      text: `${input} with examples`,
      confidence: 0.9,
      type: "continue"
    });
  }
  
  if (lowerInput.includes("explain")) {
    suggestions.push({
      id: "8",
      text: `${input} in simple terms`,
      confidence: 0.88,
      type: "continue"
    });
  }
  
  // 기본 제안
  if (suggestions.length === 0 && input.length > 5) {
    suggestions.push({
      id: "default-1",
      text: `${input}에 대해 자세히 설명해주세요.`,
      confidence: 0.7,
      type: "complete"
    });
    suggestions.push({
      id: "default-2",
      text: `${input}의 예시를 보여주세요.`,
      confidence: 0.65,
      type: "complete"
    });
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
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
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
    <div className="smart-autocomplete">
      <div className="autocomplete-header">
        <Sparkles className="autocomplete-icon" />
        <span>스마트 제안</span>
        <span className="autocomplete-hint">Tab으로 선택</span>
      </div>
      <ul className="autocomplete-list">
        {suggestions.map((suggestion, index) => (
          <li
            key={suggestion.id}
            className={`autocomplete-item ${index === selectedIndex ? "selected" : ""}`}
            onClick={() => {
              onSuggestionSelect(suggestion.text);
              setIsVisible(false);
            }}
          >
            <ChevronRight className="item-arrow" />
            <span className="item-text">{suggestion.text}</span>
            <span className="item-confidence">
              {Math.round(suggestion.confidence * 100)}%
            </span>
          </li>
        ))}
      </ul>
      
      <style jsx>{`
        .smart-autocomplete {
          position: absolute;
          bottom: 100%;
          left: 0;
          right: 0;
          margin-bottom: 8px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          z-index: 100;
        }
        
        .autocomplete-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--bg-tertiary, #252536);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
          font-size: 12px;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .autocomplete-icon {
          width: 14px;
          height: 14px;
          color: var(--primary, #7c3aed);
        }
        
        .autocomplete-hint {
          margin-left: auto;
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .autocomplete-list {
          list-style: none;
          margin: 0;
          padding: 4px;
        }
        
        .autocomplete-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        
        .autocomplete-item:hover,
        .autocomplete-item.selected {
          background: var(--bg-hover, #2e2e44);
        }
        
        .item-arrow {
          width: 14px;
          height: 14px;
          color: var(--primary, #7c3aed);
          flex-shrink: 0;
        }
        
        .item-text {
          flex: 1;
          font-size: 14px;
          color: var(--text-primary, #e0e0e0);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .item-confidence {
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
          background: var(--bg-secondary, #1e1e2e);
          padding: 2px 6px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}

export default SmartAutocomplete;
