"use client";

interface StatusIndicatorProps {
  status: "success" | "warning" | "error" | "info" | "pending";
  label?: string;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}

export function StatusIndicator({ status, label, size = "md", pulse = false }: StatusIndicatorProps) {
  const colors: Record<string, { bg: string; text: string; dot: string }> = {
    success: { bg: "rgba(34, 197, 94, 0.1)", text: "#22c55e", dot: "#22c55e" },
    warning: { bg: "rgba(245, 158, 11, 0.1)", text: "#f59e0b", dot: "#f59e0b" },
    error: { bg: "rgba(239, 68, 68, 0.1)", text: "#ef4444", dot: "#ef4444" },
    info: { bg: "rgba(59, 130, 246, 0.1)", text: "#3b82f6", dot: "#3b82f6" },
    pending: { bg: "rgba(107, 114, 128, 0.1)", text: "#6b7280", dot: "#6b7280" },
  };

  const labels: Record<string, string> = {
    success: "성공",
    warning: "경고",
    error: "오류",
    info: "정보",
    pending: "대기",
  };

  const sizes: Record<string, { dot: string; font: string; padding: string }> = {
    sm: { dot: "6px", font: "11px", padding: "3px 8px" },
    md: { dot: "8px", font: "12px", padding: "4px 10px" },
    lg: { dot: "10px", font: "13px", padding: "6px 12px" },
  };

  const colorStyle = colors[status];
  const sizeStyle = sizes[size];
  const displayLabel = label || labels[status];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: sizeStyle.padding,
        borderRadius: "16px",
        background: colorStyle.bg,
      }}
    >
      <span
        style={{
          width: sizeStyle.dot,
          height: sizeStyle.dot,
          borderRadius: "50%",
          background: colorStyle.dot,
          animation: pulse ? "pulse 2s infinite" : "none",
        }}
      />
      <span
        style={{
          fontSize: sizeStyle.font,
          fontWeight: 500,
          color: colorStyle.text,
        }}
      >
        {displayLabel}
      </span>
      {pulse && (
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      )}
    </div>
  );
}
