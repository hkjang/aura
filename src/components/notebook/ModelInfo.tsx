"use client";

import { useState } from "react";
import { Info, Zap, DollarSign, FileText, Brain } from "lucide-react";

interface ModelInfoProps {
  modelId: string;
  provider?: string;
}

const MODEL_INFO: Record<string, { description: string; speed: string; cost: string; context: string; strengths: string[] }> = {
  "gpt-4o": {
    description: "OpenAI의 최신 플래그십 모델",
    speed: "빠름",
    cost: "높음",
    context: "128K",
    strengths: ["복잡한 추론", "코딩", "창의적 작성"],
  },
  "gpt-4o-mini": {
    description: "빠르고 경제적인 소형 모델",
    speed: "매우 빠름",
    cost: "낮음",
    context: "128K",
    strengths: ["일반 대화", "빠른 응답", "비용 효율"],
  },
  "claude-3-5-sonnet": {
    description: "Anthropic의 균형 잡힌 모델",
    speed: "빠름",
    cost: "중간",
    context: "200K",
    strengths: ["분석", "코딩", "긴 문서"],
  },
  default: {
    description: "AI 언어 모델",
    speed: "보통",
    cost: "보통",
    context: "32K",
    strengths: ["일반 대화"],
  },
};

export function ModelInfo({ modelId, provider }: ModelInfoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const info = MODEL_INFO[modelId] || MODEL_INFO.default;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          color: "var(--text-tertiary)",
        }}
        title="모델 정보"
      >
        <Info style={{ width: "16px", height: "16px" }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: "8px",
            padding: "16px",
            borderRadius: "12px",
            background: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            zIndex: 50,
            minWidth: "260px",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "8px" }}>{modelId}</div>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>
            {info.description}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Zap style={{ width: "14px", height: "14px", color: "#22c55e" }} />
              <span>속도: {info.speed}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <DollarSign style={{ width: "14px", height: "14px", color: "#f59e0b" }} />
              <span>비용: {info.cost}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FileText style={{ width: "14px", height: "14px", color: "#3b82f6" }} />
              <span>컨텍스트: {info.context}</span>
            </div>
          </div>

          <div style={{ marginTop: "12px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginBottom: "6px" }}>강점:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {info.strengths.map((s) => (
                <span
                  key={s}
                  style={{
                    padding: "2px 8px",
                    borderRadius: "10px",
                    background: "var(--bg-secondary)",
                    fontSize: "11px",
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
