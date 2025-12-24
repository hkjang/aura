"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";

interface FavoritePromptsProps {
  onSelect: (prompt: string) => void;
}

const DEFAULT_FAVORITES = [
  "이 코드를 최적화해줘",
  "버그를 찾아서 수정해줘",
  "테스트 코드를 작성해줘",
  "문서화를 추가해줘",
  "리팩토링해줘",
];

export function FavoritePrompts({ onSelect }: FavoritePromptsProps) {
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("aura-favorite-prompts");
      return saved ? JSON.parse(saved) : DEFAULT_FAVORITES;
    }
    return DEFAULT_FAVORITES;
  });

  const [isOpen, setIsOpen] = useState(false);
  const [newPrompt, setNewPrompt] = useState("");

  const addFavorite = () => {
    if (!newPrompt.trim()) return;
    const updated = [...favorites, newPrompt.trim()];
    setFavorites(updated);
    localStorage.setItem("aura-favorite-prompts", JSON.stringify(updated));
    setNewPrompt("");
  };

  const removeFavorite = (index: number) => {
    const updated = favorites.filter((_, i) => i !== index);
    setFavorites(updated);
    localStorage.setItem("aura-favorite-prompts", JSON.stringify(updated));
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
        title="즐겨찾기 프롬프트"
      >
        <Star style={{ width: "14px", height: "14px" }} />
        즐겨찾기
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
            minWidth: "250px",
            maxHeight: "300px",
            overflow: "auto",
            zIndex: 50,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>즐겨찾기</span>
          </div>

          <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
            <input
              type="text"
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFavorite()}
              placeholder="새 프롬프트 추가..."
              style={{
                flex: 1,
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid var(--border-color)",
                fontSize: "12px",
              }}
            />
            <button
              onClick={addFavorite}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
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

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {favorites.map((prompt, i) => (
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
                <Star style={{ width: "12px", height: "12px", color: "#f59e0b" }} />
                <span style={{ flex: 1, fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {prompt}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFavorite(i); }}
                  style={{ padding: "2px", border: "none", background: "transparent", cursor: "pointer", color: "var(--text-tertiary)" }}
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
