import * as React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", style, ...props }, ref) => {
    return (
      <textarea
        className={className}
        ref={ref}
        style={{
          display: "flex",
          minHeight: "80px",
          width: "100%",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-color)",
          background: "var(--bg-primary)",
          padding: "12px",
          fontSize: "14px",
          lineHeight: "1.5",
          color: "var(--text-primary)",
          outline: "none",
          transition: "border-color 150ms ease",
          resize: "vertical",
          fontFamily: "inherit",
          ...style,
        }}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
