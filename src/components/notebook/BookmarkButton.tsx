"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";

interface BookmarkButtonProps {
  messageId: string;
  isBookmarked: boolean;
  onToggle: (messageId: string) => void;
}

export function BookmarkButton({ messageId, isBookmarked, onToggle }: BookmarkButtonProps) {
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    setAnimating(true);
    onToggle(messageId);
    setTimeout(() => setAnimating(false), 300);
  };

  return (
    <button
      onClick={handleClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px",
        borderRadius: "6px",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: isBookmarked ? "#f59e0b" : "var(--text-tertiary)",
        transform: animating ? "scale(1.2)" : "scale(1)",
        transition: "all 0.2s ease",
      }}
      title={isBookmarked ? "북마크 해제" : "북마크 추가"}
      aria-label={isBookmarked ? "북마크 해제" : "북마크 추가"}
    >
      {isBookmarked ? (
        <BookmarkCheck style={{ width: "16px", height: "16px", fill: "#f59e0b" }} />
      ) : (
        <Bookmark style={{ width: "16px", height: "16px" }} />
      )}
    </button>
  );
}
