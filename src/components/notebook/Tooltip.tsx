"use client";

import { useState, useRef } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

export function Tooltip({ content, children, position = "top", delay = 300 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const positions: Record<string, React.CSSProperties> = {
    top: { bottom: "100%", left: "50%", transform: "translateX(-50%)", marginBottom: "8px" },
    bottom: { top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: "8px" },
    left: { right: "100%", top: "50%", transform: "translateY(-50%)", marginRight: "8px" },
    right: { left: "100%", top: "50%", transform: "translateY(-50%)", marginLeft: "8px" },
  };

  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            ...positions[position],
            padding: "6px 12px",
            borderRadius: "6px",
            background: "#1f2937",
            color: "white",
            fontSize: "12px",
            fontWeight: 500,
            whiteSpace: "nowrap",
            zIndex: 100,
            animation: "fadeIn 0.15s ease",
          }}
        >
          {content}
        </div>
      )}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
