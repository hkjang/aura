"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function Collapsible({ title, children, defaultOpen = false }: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        borderRadius: "12px",
        border: "1px solid var(--border-color)",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "14px 16px",
          border: "none",
          background: "var(--bg-secondary)",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: 500,
          textAlign: "left",
        }}
      >
        <span>{title}</span>
        {isOpen ? (
          <ChevronUp style={{ width: "18px", height: "18px", color: "var(--text-tertiary)" }} />
        ) : (
          <ChevronDown style={{ width: "18px", height: "18px", color: "var(--text-tertiary)" }} />
        )}
      </button>
      
      {isOpen && (
        <div style={{ padding: "16px", background: "var(--bg-primary)" }}>
          {children}
        </div>
      )}
    </div>
  );
}
