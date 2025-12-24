"use client";

import { useState } from "react";
import { FileText, Plus, X } from "lucide-react";

const DEFAULT_TEMPLATES = [
  { id: "1", name: "요약 요청", content: "위 내용을 핵심만 간단하게 요약해주세요." },
  { id: "2", name: "예시 요청", content: "구체적인 예시를 들어서 설명해주세요." },
  { id: "3", name: "비교 분석", content: "장단점을 비교 분석해주세요." },
  { id: "4", name: "단계별 설명", content: "단계별로 자세히 설명해주세요." },
  { id: "5", name: "코드 요청", content: "코드로 작성해주세요." },
];

interface MessageTemplatesProps {
  onSelect: (content: string) => void;
}

export function MessageTemplates({ onSelect }: MessageTemplatesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [newTemplate, setNewTemplate] = useState({ name: "", content: "" });
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = () => {
    if (newTemplate.name && newTemplate.content) {
      setTemplates([...templates, { ...newTemplate, id: Date.now().toString() }]);
      setNewTemplate({ name: "", content: "" });
      setShowAdd(false);
    }
  };

  const handleDelete = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id));
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 10px",
          borderRadius: "8px",
          border: "1px solid var(--border-color)",
          background: "var(--bg-secondary)",
          cursor: "pointer",
          fontSize: "12px",
          color: "var(--text-secondary)",
        }}
        title="템플릿"
      >
        <FileText style={{ width: "14px", height: "14px" }} />
        템플릿
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            marginBottom: "8px",
            padding: "12px",
            borderRadius: "12px",
            background: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            minWidth: "280px",
            maxHeight: "300px",
            overflow: "auto",
            zIndex: 50,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>메시지 템플릿</span>
            <button
              onClick={() => setShowAdd(!showAdd)}
              style={{
                padding: "4px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "var(--color-primary)",
              }}
            >
              <Plus style={{ width: "16px", height: "16px" }} />
            </button>
          </div>

          {showAdd && (
            <div style={{ marginBottom: "12px", padding: "8px", background: "var(--bg-secondary)", borderRadius: "8px" }}>
              <input
                type="text"
                placeholder="템플릿 이름"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                style={{
                  width: "100%",
                  padding: "6px",
                  marginBottom: "6px",
                  border: "1px solid var(--border-color)",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
              />
              <textarea
                placeholder="템플릿 내용"
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                style={{
                  width: "100%",
                  padding: "6px",
                  marginBottom: "6px",
                  border: "1px solid var(--border-color)",
                  borderRadius: "4px",
                  fontSize: "12px",
                  minHeight: "60px",
                  resize: "vertical",
                }}
              />
              <button
                onClick={handleAdd}
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  border: "none",
                  background: "var(--color-primary)",
                  color: "white",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                추가
              </button>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {templates.map((template) => (
              <div
                key={template.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  background: "var(--bg-secondary)",
                  cursor: "pointer",
                }}
                onClick={() => {
                  onSelect(template.content);
                  setIsOpen(false);
                }}
              >
                <span style={{ fontSize: "13px" }}>{template.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(template.id);
                  }}
                  style={{
                    padding: "2px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "var(--text-tertiary)",
                  }}
                >
                  <X style={{ width: "12px", height: "12px" }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
