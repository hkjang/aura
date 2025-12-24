"use client";

import { MessageSquare, Sparkles, ArrowRight } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = "대화를 시작해보세요",
  description = "무엇이든 질문해 주세요. AI가 도와드립니다.",
  suggestions = [],
  onSuggestionClick,
  icon,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px",
        }}
      >
        {icon || <MessageSquare style={{ width: "36px", height: "36px", color: "var(--color-primary)" }} />}
      </div>

      <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "12px", color: "var(--text-primary)" }}>
        {title}
      </h2>

      <p style={{ fontSize: "15px", color: "var(--text-secondary)", maxWidth: "400px", lineHeight: 1.6, marginBottom: "32px" }}>
        {description}
      </p>

      {suggestions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "400px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center", marginBottom: "8px" }}>
            <Sparkles style={{ width: "16px", height: "16px", color: "var(--color-primary)" }} />
            <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-tertiary)" }}>추천 질문</span>
          </div>
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => onSuggestionClick?.(suggestion)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px",
                borderRadius: "12px",
                border: "1px solid var(--border-color)",
                background: "var(--bg-secondary)",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "14px",
                transition: "all 0.2s",
              }}
            >
              <span>{suggestion}</span>
              <ArrowRight style={{ width: "16px", height: "16px", color: "var(--text-tertiary)" }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
