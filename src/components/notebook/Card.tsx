"use client";

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  variant?: "default" | "elevated" | "outlined" | "gradient";
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
}

export function Card({ children, title, subtitle, footer, variant = "default", padding = "md", onClick }: CardProps) {
  const variants: Record<string, React.CSSProperties> = {
    default: {
      background: "var(--bg-primary)",
      border: "1px solid var(--border-color)",
      boxShadow: "none",
    },
    elevated: {
      background: "var(--bg-primary)",
      border: "none",
      boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
    },
    outlined: {
      background: "transparent",
      border: "2px solid var(--border-color)",
      boxShadow: "none",
    },
    gradient: {
      background: "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)",
      border: "1px solid var(--border-color)",
      boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
    },
  };

  const paddings: Record<string, string> = {
    none: "0",
    sm: "12px",
    md: "20px",
    lg: "28px",
  };

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: "12px",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.2s, box-shadow 0.2s",
        ...variants[variant],
      }}
    >
      {(title || subtitle) && (
        <div style={{ padding: paddings[padding], borderBottom: "1px solid var(--border-color)" }}>
          {title && <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: subtitle ? "4px" : 0 }}>{title}</h3>}
          {subtitle && <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{subtitle}</p>}
        </div>
      )}
      <div style={{ padding: paddings[padding] }}>
        {children}
      </div>
      {footer && (
        <div style={{ padding: paddings[padding], borderTop: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
          {footer}
        </div>
      )}
    </div>
  );
}
