"use client";

interface SwitchToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function SwitchToggle({ checked, onChange, label, disabled = false, size = "md" }: SwitchToggleProps) {
  const sizes: Record<string, { track: { w: string; h: string }; thumb: string; translate: string }> = {
    sm: { track: { w: "32px", h: "18px" }, thumb: "14px", translate: "14px" },
    md: { track: { w: "44px", h: "24px" }, thumb: "20px", translate: "20px" },
    lg: { track: { w: "56px", h: "30px" }, thumb: "26px", translate: "26px" },
  };

  const sizeStyle = sizes[size];

  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        style={{
          position: "relative",
          width: sizeStyle.track.w,
          height: sizeStyle.track.h,
          borderRadius: "999px",
          border: "none",
          background: checked ? "var(--color-primary)" : "var(--border-color)",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "background 0.2s",
          padding: "2px",
        }}
      >
        <span
          style={{
            display: "block",
            width: sizeStyle.thumb,
            height: sizeStyle.thumb,
            borderRadius: "50%",
            background: "white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            transform: `translateX(${checked ? sizeStyle.translate : "0"})`,
            transition: "transform 0.2s",
          }}
        />
      </button>
      {label && (
        <span style={{ fontSize: size === "sm" ? "12px" : size === "lg" ? "16px" : "14px" }}>
          {label}
        </span>
      )}
    </label>
  );
}
