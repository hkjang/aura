"use client";

import { useState, useEffect, useCallback } from "react";
import { History, X } from "lucide-react";

interface PromptHistoryProps {
  notebookId: string;
  onSelect: (prompt: string) => void;
}

export function PromptHistory({ notebookId, onSelect }: PromptHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(`prompt-history-${notebookId}`);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load prompt history:", e);
      }
    }
  }, [notebookId]);

  const addToHistory = useCallback((prompt: string) => {
    if (!prompt.trim()) return;
    const newHistory = [prompt, ...history.filter((h) => h !== prompt)].slice(0, 20);
    setHistory(newHistory);
    localStorage.setItem(`prompt-history-${notebookId}`, JSON.stringify(newHistory));
  }, [history, notebookId]);

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(`prompt-history-${notebookId}`);
  };

  const deleteItem = (index: number) => {
    const newHistory = history.filter((_, i) => i !== index);
    setHistory(newHistory);
    localStorage.setItem(`prompt-history-${notebookId}`, JSON.stringify(newHistory));
  };

  if (history.length === 0) return null;

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
        title="프롬프트 기록"
      >
        <History style={{ width: "14px", height: "14px" }} />
        기록 ({history.length})
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
            minWidth: "300px",
            maxHeight: "250px",
            overflow: "auto",
            zIndex: 50,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>최근 프롬프트</span>
            <button
              onClick={clearHistory}
              style={{
                padding: "4px 8px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "var(--text-tertiary)",
                fontSize: "11px",
              }}
            >
              전체 삭제
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {history.map((prompt, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  background: "var(--bg-secondary)",
                  cursor: "pointer",
                }}
                onClick={() => {
                  onSelect(prompt);
                  setIsOpen(false);
                }}
              >
                <span
                  style={{
                    flex: 1,
                    fontSize: "12px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {prompt}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteItem(i);
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
