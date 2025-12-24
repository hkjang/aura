"use client";

import { useState } from "react";
import { Smile } from "lucide-react";

const EMOJI_LIST = ["👍", "❤️", "😀", "🎉", "🤔", "👀", "🔥", "💡"];

interface EmojiReactionsProps {
  messageId: string;
  reactions: Record<string, number>;
  onReact: (messageId: string, emoji: string) => void;
}

export function EmojiReactions({ messageId, reactions, onReact }: EmojiReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
      {/* Existing reactions */}
      {Object.entries(reactions).map(([emoji, count]) => (
        <button
          key={emoji}
          onClick={() => onReact(messageId, emoji)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "2px 8px",
            borderRadius: "12px",
            border: "1px solid var(--border-color)",
            background: "var(--bg-secondary)",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          <span>{emoji}</span>
          <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{count}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowPicker(!showPicker)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            border: "1px dashed var(--border-color)",
            background: "transparent",
            cursor: "pointer",
            color: "var(--text-tertiary)",
          }}
          title="리액션 추가"
        >
          <Smile style={{ width: "14px", height: "14px" }} />
        </button>

        {showPicker && (
          <div
            style={{
              position: "absolute",
              bottom: "100%",
              left: 0,
              marginBottom: "4px",
              padding: "8px",
              borderRadius: "12px",
              background: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              display: "flex",
              gap: "4px",
              zIndex: 50,
            }}
          >
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onReact(messageId, emoji);
                  setShowPicker(false);
                }}
                style={{
                  padding: "4px 8px",
                  borderRadius: "8px",
                  border: "none",
                  background: "transparent",
                  fontSize: "18px",
                  cursor: "pointer",
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
