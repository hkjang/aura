"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({ value, onChange, placeholder = "태그 추가...", maxTags = 10 }: TagInputProps) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const tag = input.trim();
    if (tag && !value.includes(tag) && value.length < maxTags) {
      onChange([...value, tag]);
      setInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        padding: "8px 12px",
        borderRadius: "8px",
        border: "1px solid var(--border-color)",
        background: "var(--bg-primary)",
        minHeight: "42px",
      }}
    >
      {value.map((tag) => (
        <span
          key={tag}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 8px",
            borderRadius: "6px",
            background: "var(--color-primary)",
            color: "white",
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          {tag}
          <button
            onClick={() => removeTag(tag)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "2px",
              border: "none",
              background: "transparent",
              color: "white",
              cursor: "pointer",
              opacity: 0.8,
            }}
          >
            <X style={{ width: "12px", height: "12px" }} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={value.length === 0 ? placeholder : ""}
        disabled={value.length >= maxTags}
        style={{
          flex: 1,
          minWidth: "100px",
          border: "none",
          background: "transparent",
          outline: "none",
          fontSize: "14px",
          padding: "4px 0",
        }}
      />
    </div>
  );
}
