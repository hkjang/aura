"use client";

interface NotificationBadgeProps {
  count: number;
  max?: number;
  variant?: "primary" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}

export function NotificationBadge({
  count,
  max = 99,
  variant = "primary",
  size = "md",
  pulse = false,
}: NotificationBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  const colors: Record<string, { bg: string; text: string }> = {
    primary: { bg: "var(--color-primary)", text: "white" },
    success: { bg: "#22c55e", text: "white" },
    warning: { bg: "#f59e0b", text: "white" },
    danger: { bg: "#ef4444", text: "white" },
  };

  const sizes: Record<string, { minWidth: string; height: string; fontSize: string; padding: string }> = {
    sm: { minWidth: "16px", height: "16px", fontSize: "10px", padding: "0 4px" },
    md: { minWidth: "20px", height: "20px", fontSize: "11px", padding: "0 6px" },
    lg: { minWidth: "24px", height: "24px", fontSize: "12px", padding: "0 8px" },
  };

  const colorStyle = colors[variant];
  const sizeStyle = sizes[size];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: sizeStyle.minWidth,
        height: sizeStyle.height,
        padding: sizeStyle.padding,
        borderRadius: "12px",
        background: colorStyle.bg,
        color: colorStyle.text,
        fontSize: sizeStyle.fontSize,
        fontWeight: 600,
        lineHeight: 1,
        animation: pulse ? "pulse 2s infinite" : "none",
      }}
    >
      {displayCount}
      {pulse && (
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
        `}</style>
      )}
    </span>
  );
}
