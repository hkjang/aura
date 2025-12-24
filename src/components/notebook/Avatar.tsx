"use client";

import { User } from "lucide-react";

interface AvatarProps {
  src?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "busy" | "away";
}

export function Avatar({ src, name, size = "md", status }: AvatarProps) {
  const sizes: Record<string, { container: string; font: string; status: string }> = {
    xs: { container: "24px", font: "10px", status: "8px" },
    sm: { container: "32px", font: "12px", status: "10px" },
    md: { container: "40px", font: "14px", status: "12px" },
    lg: { container: "56px", font: "18px", status: "14px" },
    xl: { container: "80px", font: "24px", status: "16px" },
  };

  const statusColors: Record<string, string> = {
    online: "#22c55e",
    offline: "#6b7280",
    busy: "#ef4444",
    away: "#f59e0b",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeStyle = sizes[size];

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div
        style={{
          width: sizeStyle.container,
          height: sizeStyle.container,
          borderRadius: "50%",
          background: src ? "transparent" : "linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          border: "2px solid var(--bg-primary)",
        }}
      >
        {src ? (
          <img
            src={src}
            alt={name || "Avatar"}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : name ? (
          <span style={{ fontSize: sizeStyle.font, fontWeight: 600, color: "white" }}>
            {getInitials(name)}
          </span>
        ) : (
          <User style={{ width: "50%", height: "50%", color: "white" }} />
        )}
      </div>

      {status && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: sizeStyle.status,
            height: sizeStyle.status,
            borderRadius: "50%",
            background: statusColors[status],
            border: "2px solid var(--bg-primary)",
          }}
        />
      )}
    </div>
  );
}
