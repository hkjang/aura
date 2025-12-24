"use client";

import { useState } from "react";
import { Wand2, Loader2 } from "lucide-react";

interface PromptEnhancerProps {
  prompt: string;
  onEnhanced: (enhanced: string) => void;
}

const ENHANCEMENT_TIPS = [
  "더 구체적인 맥락 추가",
  "원하는 출력 형식 명시",
  "예시 포함하기",
  "단계별 설명 요청",
];

export function PromptEnhancer({ prompt, onEnhanced }: PromptEnhancerProps) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const enhancePrompt = async () => {
    if (!prompt.trim() || isEnhancing) return;
    
    setIsEnhancing(true);
    
    // Simple client-side enhancement
    setTimeout(() => {
      let enhanced = prompt;
      
      // Add structure if missing
      if (!prompt.includes("단계") && !prompt.includes("step")) {
        enhanced = `${prompt}\n\n단계별로 자세히 설명해주세요.`;
      }
      
      // Add format request if short
      if (prompt.length < 50) {
        enhanced = `${enhanced}\n\n마크다운 형식으로 정리해서 답변해주세요.`;
      }
      
      onEnhanced(enhanced);
      setIsEnhancing(false);
    }, 500);
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={enhancePrompt}
        onMouseEnter={() => setShowTips(true)}
        onMouseLeave={() => setShowTips(false)}
        disabled={!prompt.trim() || isEnhancing}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          borderRadius: "8px",
          border: "1px solid var(--border-color)",
          background: "linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%)",
          color: "white",
          cursor: prompt.trim() && !isEnhancing ? "pointer" : "not-allowed",
          fontSize: "12px",
          fontWeight: 500,
          opacity: prompt.trim() ? 1 : 0.5,
        }}
        title="프롬프트 향상"
      >
        {isEnhancing ? (
          <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />
        ) : (
          <Wand2 style={{ width: "14px", height: "14px" }} />
        )}
        향상
      </button>

      {showTips && !isEnhancing && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            marginBottom: "8px",
            padding: "12px",
            borderRadius: "8px",
            background: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 50,
            minWidth: "200px",
          }}
        >
          <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginBottom: "8px" }}>
            프롬프트 향상 팁:
          </div>
          {ENHANCEMENT_TIPS.map((tip, i) => (
            <div key={i} style={{ fontSize: "12px", padding: "4px 0" }}>• {tip}</div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
