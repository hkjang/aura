"use client";

import { Database, AlertTriangle } from "lucide-react";

interface ContextWindowProps {
  usedTokens: number;
  maxTokens?: number;
  model?: string;
}

const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  "gpt-4o": 128000,
  "gpt-4o-mini": 128000,
  "gpt-4-turbo": 128000,
  "gpt-3.5-turbo": 16385,
  "claude-3-5-sonnet": 200000,
  "claude-3-haiku": 200000,
  "gemini-pro": 32000,
  default: 32000,
};

export function ContextWindow({ usedTokens, maxTokens, model = "default" }: ContextWindowProps) {
  const contextLimit = maxTokens || MODEL_CONTEXT_WINDOWS[model] || MODEL_CONTEXT_WINDOWS.default;
  const usagePercent = Math.min((usedTokens / contextLimit) * 100, 100);
  const isNearLimit = usagePercent > 80;
  const isOverLimit = usagePercent > 95;

  const getColor = () => {
    if (isOverLimit) return "#ef4444";
    if (isNearLimit) return "#f59e0b";
    return "#22c55e";
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 12px",
        borderRadius: "8px",
        background: "var(--bg-secondary)",
        fontSize: "11px",
      }}
    >
      <Database style={{ width: "14px", height: "14px", color: getColor() }} />
      
      <div style={{ flex: 1, minWidth: "80px" }}>
        <div
          style={{
            height: "4px",
            borderRadius: "2px",
            background: "var(--border-color)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${usagePercent}%`,
              background: getColor(),
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      <span style={{ color: getColor(), fontWeight: 500, whiteSpace: "nowrap" }}>
        {(usedTokens / 1000).toFixed(1)}K / {(contextLimit / 1000).toFixed(0)}K
      </span>

      {isNearLimit && (
        <AlertTriangle style={{ width: "14px", height: "14px", color: getColor() }} />
      )}
    </div>
  );
}
