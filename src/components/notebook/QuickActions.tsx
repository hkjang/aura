"use client";

import { Sparkles } from "lucide-react";

interface QuickActionsProps {
  onAction: (action: string) => void;
  disabled?: boolean;
}

const QUICK_ACTIONS = [
  { label: "요약해줘", prompt: "위 내용을 간단히 요약해줘" },
  { label: "더 자세히", prompt: "더 자세히 설명해줘" },
  { label: "예시 추가", prompt: "구체적인 예시를 들어줘" },
  { label: "비교해줘", prompt: "장단점을 비교해줘" },
];

export function QuickActions({ onAction, disabled = false }: QuickActionsProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
      }}
    >
      <Sparkles style={{ width: "14px", height: "14px", color: "var(--color-primary)" }} />
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.label}
          onClick={() => onAction(action.prompt)}
          disabled={disabled}
          style={{
            padding: "4px 10px",
            borderRadius: "12px",
            border: "1px solid var(--border-color)",
            background: "var(--bg-secondary)",
            fontSize: "12px",
            color: "var(--text-secondary)",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
            transition: "all 0.2s",
          }}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
