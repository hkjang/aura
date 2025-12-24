"use client";

import { AlertCircle, RefreshCw, X } from "lucide-react";

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: "inline" | "banner" | "card";
}

export function ErrorMessage({
  title = "오류가 발생했습니다",
  message,
  onRetry,
  onDismiss,
  variant = "card",
}: ErrorMessageProps) {
  const styles: Record<string, React.CSSProperties> = {
    inline: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 12px",
      borderRadius: "8px",
      background: "rgba(239, 68, 68, 0.1)",
      color: "#ef4444",
      fontSize: "13px",
    },
    banner: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 16px",
      background: "linear-gradient(90deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)",
      borderBottom: "1px solid rgba(239, 68, 68, 0.2)",
    },
    card: {
      padding: "20px",
      borderRadius: "12px",
      background: "var(--bg-primary)",
      border: "1px solid rgba(239, 68, 68, 0.3)",
      boxShadow: "0 4px 12px rgba(239, 68, 68, 0.1)",
    },
  };

  return (
    <div style={styles[variant]}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: 1 }}>
        <div
          style={{
            padding: "8px",
            borderRadius: "8px",
            background: "rgba(239, 68, 68, 0.1)",
          }}
        >
          <AlertCircle style={{ width: "20px", height: "20px", color: "#ef4444" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: "#ef4444", marginBottom: "4px" }}>{title}</div>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{message}</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              background: "transparent",
              color: "#ef4444",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            <RefreshCw style={{ width: "14px", height: "14px" }} />
            다시 시도
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "none",
              background: "transparent",
              color: "var(--text-tertiary)",
              cursor: "pointer",
            }}
          >
            <X style={{ width: "16px", height: "16px" }} />
          </button>
        )}
      </div>
    </div>
  );
}
