"use client";

import { useState } from "react";
import { Globe } from "lucide-react";

const LANGUAGES = [
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
];

interface LanguageSelectorProps {
  onLanguageChange?: (code: string) => void;
}

export function LanguageSelector({ onLanguageChange }: LanguageSelectorProps) {
  const [currentLang, setCurrentLang] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("aura-ui-language") || "ko";
    }
    return "ko";
  });
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (code: string) => {
    setCurrentLang(code);
    localStorage.setItem("aura-ui-language", code);
    setIsOpen(false);
    onLanguageChange?.(code);
  };

  const current = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          borderRadius: "8px",
          border: "1px solid var(--border-color)",
          background: "var(--bg-secondary)",
          cursor: "pointer",
          fontSize: "13px",
        }}
      >
        <span>{current.flag}</span>
        <span>{current.name}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "4px",
            padding: "4px",
            borderRadius: "8px",
            background: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 50,
          }}
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                padding: "8px 12px",
                border: "none",
                borderRadius: "6px",
                background: currentLang === lang.code ? "var(--bg-secondary)" : "transparent",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
