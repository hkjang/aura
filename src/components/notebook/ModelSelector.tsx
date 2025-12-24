"use client";

import { Settings } from "lucide-react";

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  modelId: string;
}

interface ModelSelectorProps {
  models: ModelConfig[];
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

export function ModelSelector({
  models,
  selectedModelId,
  onModelChange,
  disabled = false,
}: ModelSelectorProps) {
  if (models.length === 0) return null;

  return (
    <div 
      style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}
      role="group"
      aria-label="AI 모델 선택"
    >
      <Settings 
        style={{ width: "14px", height: "14px", color: "var(--text-tertiary)" }} 
        aria-hidden="true"
      />
      <select
        value={selectedModelId}
        onChange={(e) => onModelChange(e.target.value)}
        disabled={disabled}
        aria-label="AI 모델"
        style={{
          padding: "6px 12px",
          borderRadius: "8px",
          border: "1px solid var(--border-color)",
          background: "var(--bg-secondary)",
          color: "var(--text-primary)",
          fontSize: "13px",
          cursor: disabled ? "not-allowed" : "pointer",
          minWidth: "200px",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name} ({model.provider})
          </option>
        ))}
      </select>
      <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
        AI 모델
      </span>
    </div>
  );
}
