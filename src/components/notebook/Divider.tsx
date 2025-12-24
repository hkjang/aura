"use client";

interface DividerProps {
  text?: string;
  variant?: "solid" | "dashed" | "dotted";
  spacing?: "sm" | "md" | "lg";
}

export function Divider({ text, variant = "solid", spacing = "md" }: DividerProps) {
  const spacings: Record<string, string> = {
    sm: "12px",
    md: "20px",
    lg: "32px",
  };

  const borderStyle = variant === "solid" ? "solid" : variant === "dashed" ? "dashed" : "dotted";

  if (text) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          margin: `${spacings[spacing]} 0`,
        }}
      >
        <div
          style={{
            flex: 1,
            height: "1px",
            borderTop: `1px ${borderStyle} var(--border-color)`,
          }}
        />
        <span
          style={{
            fontSize: "12px",
            color: "var(--text-tertiary)",
            fontWeight: 500,
          }}
        >
          {text}
        </span>
        <div
          style={{
            flex: 1,
            height: "1px",
            borderTop: `1px ${borderStyle} var(--border-color)`,
          }}
        />
      </div>
    );
  }

  return (
    <hr
      style={{
        margin: `${spacings[spacing]} 0`,
        border: "none",
        borderTop: `1px ${borderStyle} var(--border-color)`,
      }}
    />
  );
}
