"use client";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Badge({ children, variant = "default", size = "md" }: BadgeProps) {
  const variants: Record<string, { bg: string; text: string; border: string }> = {
    default: { bg: "var(--bg-secondary)", text: "var(--text-secondary)", border: "var(--border-color)" },
    primary: { bg: "rgba(124, 58, 237, 0.1)", text: "var(--color-primary)", border: "transparent" },
    success: { bg: "rgba(34, 197, 94, 0.1)", text: "#22c55e", border: "transparent" },
    warning: { bg: "rgba(245, 158, 11, 0.1)", text: "#f59e0b", border: "transparent" },
    danger: { bg: "rgba(239, 68, 68, 0.1)", text: "#ef4444", border: "transparent" },
    outline: { bg: "transparent", text: "var(--text-secondary)", border: "var(--border-color)" },
  };

  const sizes: Record<string, { padding: string; fontSize: string }> = {
    sm: { padding: "2px 6px", fontSize: "10px" },
    md: { padding: "4px 10px", fontSize: "12px" },
    lg: { padding: "6px 14px", fontSize: "14px" },
  };

  const variantStyle = variants[variant];
  const sizeStyle = sizes[size];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: sizeStyle.padding,
        borderRadius: "16px",
        background: variantStyle.bg,
        color: variantStyle.text,
        border: `1px solid ${variantStyle.border}`,
        fontSize: sizeStyle.fontSize,
        fontWeight: 500,
        lineHeight: 1.2,
      }}
    >
      {children}
    </span>
  );
}
