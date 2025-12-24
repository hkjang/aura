"use client";

import { Coins, TrendingUp } from "lucide-react";

interface TokenUsageProps {
  tokensIn?: number;
  tokensOut?: number;
  model?: string;
}

// Estimated costs per 1M tokens (rough estimates)
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  "claude-3-5-sonnet": { input: 3, output: 15 },
  "claude-3-haiku": { input: 0.25, output: 1.25 },
  default: { input: 1, output: 3 },
};

export function TokenUsage({ tokensIn = 0, tokensOut = 0, model = "default" }: TokenUsageProps) {
  const totalTokens = tokensIn + tokensOut;
  
  if (totalTokens === 0) return null;

  const costs = MODEL_COSTS[model] || MODEL_COSTS.default;
  const estimatedCost = ((tokensIn * costs.input) + (tokensOut * costs.output)) / 1000000;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "12px",
        padding: "6px 12px",
        borderRadius: "8px",
        background: "var(--bg-secondary)",
        fontSize: "11px",
        color: "var(--text-tertiary)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }} title="입력 토큰">
        <TrendingUp style={{ width: "12px", height: "12px", color: "#22c55e" }} />
        <span>{tokensIn.toLocaleString()}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }} title="출력 토큰">
        <TrendingUp style={{ width: "12px", height: "12px", color: "#3b82f6", transform: "rotate(180deg)" }} />
        <span>{tokensOut.toLocaleString()}</span>
      </div>
      <div 
        style={{ display: "flex", alignItems: "center", gap: "4px", color: "#f59e0b" }} 
        title="예상 비용"
      >
        <Coins style={{ width: "12px", height: "12px" }} />
        <span>${estimatedCost.toFixed(4)}</span>
      </div>
    </div>
  );
}
