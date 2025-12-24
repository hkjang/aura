"use client";

import { useState, useEffect } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

interface FocusModeProps {
  onToggle?: (isFocused: boolean) => void;
}

export function FocusMode({ onToggle }: FocusModeProps) {
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isFocused) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.setProperty("--sidebar-width", "0px");
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.setProperty("--sidebar-width", "260px");
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.setProperty("--sidebar-width", "260px");
    };
  }, [isFocused]);

  const toggle = () => {
    const newState = !isFocused;
    setIsFocused(newState);
    onToggle?.(newState);
  };

  return (
    <button
      onClick={toggle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        borderRadius: "8px",
        border: "1px solid var(--border-color)",
        background: isFocused ? "var(--color-primary)" : "var(--bg-secondary)",
        color: isFocused ? "white" : "var(--text-secondary)",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: 500,
        transition: "all 0.2s",
      }}
      title={isFocused ? "집중 모드 해제" : "집중 모드"}
    >
      {isFocused ? (
        <>
          <Minimize2 style={{ width: "14px", height: "14px" }} />
          집중 모드 해제
        </>
      ) : (
        <>
          <Maximize2 style={{ width: "14px", height: "14px" }} />
          집중 모드
        </>
      )}
    </button>
  );
}
