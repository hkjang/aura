"use client";

import { Lightbulb } from "lucide-react";

const HINTS = [
  "Shift+Enter로 줄바꿈할 수 있어요",
  "코드 블록은 ```로 감싸세요",
  "@mention으로 특정 맥락 참조 가능",
  "Ctrl+/로 단축키 목록 확인",
  "음성 입력도 지원해요 🎤",
  "마크다운 문법을 지원해요",
  "템플릿으로 자주 쓰는 질문 저장",
];

interface InputHintsProps {
  showAlways?: boolean;
}

export function InputHints({ showAlways = false }: InputHintsProps) {
  const randomHint = HINTS[Math.floor(Math.random() * HINTS.length)];

  if (!showAlways) {
    // Show hint only 30% of the time
    if (Math.random() > 0.3) return null;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        borderRadius: "8px",
        background: "rgba(124, 58, 237, 0.05)",
        border: "1px solid rgba(124, 58, 237, 0.1)",
        fontSize: "12px",
        color: "var(--color-primary)",
      }}
    >
      <Lightbulb style={{ width: "14px", height: "14px" }} />
      <span>{randomHint}</span>
    </div>
  );
}
