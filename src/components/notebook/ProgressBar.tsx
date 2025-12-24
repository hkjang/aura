"use client";

interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  variant?: "primary" | "success" | "warning" | "danger" | "gradient";
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  variant = "primary",
  size = "md",
  animated = false,
}: ProgressBarProps) {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100);

  const colors: Record<string, string> = {
    primary: "var(--color-primary)",
    success: "#22c55e",
    warning: "#f59e0b",
    danger: "#ef4444",
    gradient: "linear-gradient(90deg, #8b5cf6 0%, #06b6d4 100%)",
  };

  const heights: Record<string, string> = {
    sm: "4px",
    md: "8px",
    lg: "12px",
  };

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          height: heights[size],
          borderRadius: "999px",
          background: "var(--border-color)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${percent}%`,
            background: colors[variant],
            borderRadius: "999px",
            transition: "width 0.3s ease",
            ...(animated && {
              backgroundSize: "200% 100%",
              animation: "progress-shimmer 2s infinite",
            }),
          }}
        />
      </div>
      
      {showLabel && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "4px",
            fontSize: "11px",
            color: "var(--text-tertiary)",
          }}
        >
          <span>{value.toLocaleString()}</span>
          <span>{percent.toFixed(0)}%</span>
        </div>
      )}

      {animated && (
        <style>{`
          @keyframes progress-shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      )}
    </div>
  );
}
