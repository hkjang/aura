"use client";

import { useState, useEffect } from "react";
import { Keyboard, X } from "lucide-react";

const SHORTCUTS = [
  { keys: ["Enter"], description: "메시지 전송" },
  { keys: ["Shift", "Enter"], description: "줄바꿈" },
  { keys: ["Esc"], description: "패널 닫기" },
  { keys: ["Ctrl", "K"], description: "검색 열기" },
  { keys: ["Ctrl", "E"], description: "대화 내보내기" },
  { keys: ["Ctrl", "/"], description: "단축키 도움말" },
];

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-primary)",
          borderRadius: "16px",
          padding: "24px",
          maxWidth: "400px",
          width: "90%",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Keyboard style={{ width: "20px", height: "20px", color: "var(--color-primary)" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 600 }}>키보드 단축키</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: "4px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--text-tertiary)",
            }}
          >
            <X style={{ width: "20px", height: "20px" }} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {SHORTCUTS.map((shortcut, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                {shortcut.description}
              </span>
              <div style={{ display: "flex", gap: "4px" }}>
                {shortcut.keys.map((key, j) => (
                  <kbd
                    key={j}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-color)",
                      fontSize: "12px",
                      fontFamily: "monospace",
                    }}
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function KeyboardShortcutsButton() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
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
          color: "var(--text-tertiary)",
        }}
        title="키보드 단축키"
      >
        <Keyboard style={{ width: "14px", height: "14px" }} />
        <span>Ctrl + /</span>
      </button>
      <KeyboardShortcuts isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
