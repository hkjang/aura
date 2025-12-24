"use client";

import { useState, useEffect } from "react";
import { Type, Minus, Plus } from "lucide-react";

interface FontSizeSelectorProps {
  onChange?: (size: number) => void;
}

export function FontSizeSelector({ onChange }: FontSizeSelectorProps) {
  const [size, setSize] = useState(() => {
    if (typeof window !== "undefined") {
      return parseInt(localStorage.getItem("aura-font-size") || "14");
    }
    return 14;
  });

  useEffect(() => {
    document.documentElement.style.setProperty("--chat-font-size", `${size}px`);
    localStorage.setItem("aura-font-size", size.toString());
    onChange?.(size);
  }, [size, onChange]);

  const decrease = () => setSize((s) => Math.max(12, s - 1));
  const increase = () => setSize((s) => Math.min(20, s + 1));

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px",
        borderRadius: "8px",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
      }}
    >
      <button
        onClick={decrease}
        disabled={size <= 12}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "28px",
          height: "28px",
          border: "none",
          borderRadius: "6px",
          background: "transparent",
          cursor: size <= 12 ? "not-allowed" : "pointer",
          opacity: size <= 12 ? 0.5 : 1,
        }}
        title="글꼴 줄이기"
      >
        <Minus style={{ width: "14px", height: "14px" }} />
      </button>
      
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: "0 8px",
          fontSize: "12px",
          fontWeight: 500,
          color: "var(--text-secondary)",
        }}
      >
        <Type style={{ width: "14px", height: "14px" }} />
        <span>{size}px</span>
      </div>

      <button
        onClick={increase}
        disabled={size >= 20}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "28px",
          height: "28px",
          border: "none",
          borderRadius: "6px",
          background: "transparent",
          cursor: size >= 20 ? "not-allowed" : "pointer",
          opacity: size >= 20 ? 0.5 : 1,
        }}
        title="글꼴 키우기"
      >
        <Plus style={{ width: "14px", height: "14px" }} />
      </button>
    </div>
  );
}
