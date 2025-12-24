"use client";

interface CharacterCounterProps {
  value: string;
  maxLength?: number;
}

export function CharacterCounter({ value, maxLength = 2000 }: CharacterCounterProps) {
  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const isNearLimit = charCount > maxLength * 0.8;
  const isOverLimit = charCount > maxLength;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontSize: "11px",
        color: isOverLimit ? "#ef4444" : isNearLimit ? "#f59e0b" : "var(--text-tertiary)",
      }}
    >
      <span>{wordCount} 단어</span>
      <span
        style={{
          fontWeight: isNearLimit ? 500 : 400,
        }}
      >
        {charCount.toLocaleString()} / {maxLength.toLocaleString()}
      </span>
    </div>
  );
}
