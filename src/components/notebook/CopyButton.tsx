"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface CopyButtonProps {
  text: string;
  size?: "sm" | "md" | "lg";
  variant?: "icon" | "button";
  label?: string;
}

export function CopyButton({ text, size = "md", variant = "icon", label = "복사" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const sizes: Record<string, { icon: string; padding: string; fontSize: string }> = {
    sm: { icon: "14px", padding: "4px", fontSize: "11px" },
    md: { icon: "16px", padding: "6px", fontSize: "12px" },
    lg: { icon: "20px", padding: "8px", fontSize: "14px" },
  };

  const sizeStyle = sizes[size];

  if (variant === "icon") {
    return (
      <button
        onClick={handleCopy}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: sizeStyle.padding,
          borderRadius: "6px",
          border: "none",
          background: copied ? "rgba(34, 197, 94, 0.1)" : "var(--bg-secondary)",
          color: copied ? "#22c55e" : "var(--text-tertiary)",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        title={copied ? "복사됨!" : label}
      >
        {copied ? (
          <Check style={{ width: sizeStyle.icon, height: sizeStyle.icon }} />
        ) : (
          <Copy style={{ width: sizeStyle.icon, height: sizeStyle.icon }} />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: `${sizeStyle.padding} 12px`,
        borderRadius: "8px",
        border: "1px solid var(--border-color)",
        background: copied ? "rgba(34, 197, 94, 0.1)" : "var(--bg-secondary)",
        color: copied ? "#22c55e" : "var(--text-secondary)",
        cursor: "pointer",
        fontSize: sizeStyle.fontSize,
        fontWeight: 500,
        transition: "all 0.2s",
      }}
    >
      {copied ? (
        <>
          <Check style={{ width: sizeStyle.icon, height: sizeStyle.icon }} />
          복사됨
        </>
      ) : (
        <>
          <Copy style={{ width: sizeStyle.icon, height: sizeStyle.icon }} />
          {label}
        </>
      )}
    </button>
  );
}
