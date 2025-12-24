"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownPreviewProps {
  value: string;
}

export function MarkdownPreview({ value }: MarkdownPreviewProps) {
  const [showPreview, setShowPreview] = useState(false);

  if (!value.trim()) return null;

  return (
    <div style={{ marginBottom: "8px" }}>
      <button
        onClick={() => setShowPreview(!showPreview)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 8px",
          borderRadius: "6px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: "11px",
          color: "var(--text-tertiary)",
        }}
      >
        {showPreview ? (
          <>
            <EyeOff style={{ width: "12px", height: "12px" }} />
            미리보기 닫기
          </>
        ) : (
          <>
            <Eye style={{ width: "12px", height: "12px" }} />
            미리보기
          </>
        )}
      </button>

      {showPreview && (
        <div
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            background: "var(--bg-secondary)",
            fontSize: "14px",
            lineHeight: 1.6,
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {value}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
