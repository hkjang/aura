"use client";

import { useState, useEffect } from "react";
import { Clock, Sparkles, History, ArrowRight, X } from "lucide-react";

interface SuggestionPanelProps {
  onSelectSuggestion: (suggestion: string) => void;
  currentInput?: string;
  recentQuestions?: string[];
}

// Sample suggestions based on context
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

  // Load recent questions from localStorage
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

  // Don't show if user has typed something
  if (currentInput.length > 0) return null;

  return (
    <div className="space-y-4">
      {/* Quick Suggestions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-medium">Quick Start</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {contextualSuggestions.map((category) => (
            <div key={category.category} className="space-y-1">
              <span className="text-xs text-muted-foreground">{category.category}</span>
              {category.suggestions.slice(0, 2).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => onSelectSuggestion(suggestion)}
                  className="w-full text-left px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/50 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors border border-transparent hover:border-violet-200 dark:hover:border-violet-800"
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
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <History className="w-4 h-4" />
            <span>Recent Questions</span>
            <ArrowRight className={`w-3 h-3 transition-transform ${showRecent ? "rotate-90" : ""}`} />
          </button>
          
          {showRecent && (
            <div className="mt-2 space-y-1">
              {recentItems.slice(0, 5).map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectSuggestion(question)}
                  className="w-full text-left px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center justify-between group"
                >
                  <span className="truncate flex-1">{question}</span>
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
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
  progress?: number; // 0-100
  tokens?: number;
  estimatedTime?: number; // seconds
}

export function ProgressIndicator({ stage, progress = 0, tokens = 0, estimatedTime }: ProgressIndicatorProps) {
  const stages = {
    thinking: { label: "Thinking...", color: "bg-amber-500" },
    generating: { label: "Generating...", color: "bg-violet-500" },
    done: { label: "Complete", color: "bg-green-500" },
  };

  const current = stages[stage];

  return (
    <div className="flex items-center gap-3 py-2 px-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
      <div className="relative flex items-center justify-center w-8 h-8">
        {stage !== "done" && (
          <div className="absolute inset-0 rounded-full border-2 border-zinc-200 dark:border-zinc-700" />
        )}
        <div 
          className={`absolute inset-0 rounded-full border-2 border-transparent ${stage !== "done" ? "animate-spin" : ""}`}
          style={{
            borderTopColor: stage === "thinking" ? "#f59e0b" : "#8b5cf6",
            display: stage === "done" ? "none" : "block",
          }}
        />
        {stage === "done" && (
          <div className="w-full h-full rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-green-600" />
          </div>
        )}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">{current.label}</span>
          {stage === "generating" && progress > 0 && (
            <span className="text-xs text-muted-foreground">{progress}%</span>
          )}
        </div>
        
        {stage === "generating" && (
          <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${current.color} transition-all duration-300`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {tokens > 0 && <span>{tokens} tokens</span>}
          {estimatedTime && stage !== "done" && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              ~{estimatedTime}s remaining
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
