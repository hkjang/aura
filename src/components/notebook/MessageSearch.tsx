"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

interface MessageSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function MessageSearch({ onSearch, placeholder = "대화 검색..." }: MessageSearchProps) {
  const [query, setQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClear = () => {
    setQuery("");
    onSearch("");
    setIsExpanded(false);
  };

  const handleChange = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          border: "1px solid var(--border-color)",
          background: "var(--bg-secondary)",
          cursor: "pointer",
          color: "var(--text-secondary)",
        }}
        title="대화 검색"
        aria-label="대화 검색"
      >
        <Search style={{ width: "16px", height: "16px" }} />
      </button>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "4px 12px",
        borderRadius: "8px",
        border: "1px solid var(--border-color)",
        background: "var(--bg-secondary)",
        minWidth: "200px",
      }}
    >
      <Search style={{ width: "14px", height: "14px", color: "var(--text-tertiary)" }} />
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        autoFocus
        style={{
          border: "none",
          background: "transparent",
          outline: "none",
          fontSize: "13px",
          color: "var(--text-primary)",
          flex: 1,
          minWidth: "120px",
        }}
        aria-label="검색어 입력"
      />
      {query && (
        <button
          onClick={handleClear}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--text-tertiary)",
          }}
          title="검색 지우기"
          aria-label="검색 지우기"
        >
          <X style={{ width: "14px", height: "14px" }} />
        </button>
      )}
    </div>
  );
}
