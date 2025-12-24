"use client";

import { useState, useEffect } from "react";
import { Timer, Zap } from "lucide-react";

interface ResponseTimeProps {
  startTime: number | null;
  isLoading: boolean;
}

export function ResponseTime({ startTime, isLoading }: ResponseTimeProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isLoading || !startTime) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsed(Math.round((Date.now() - startTime) / 100) / 10);
    }, 100);

    return () => clearInterval(interval);
  }, [isLoading, startTime]);

  if (!isLoading && elapsed === 0) return null;

  const getColor = () => {
    if (elapsed < 3) return "#22c55e";
    if (elapsed < 10) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "12px",
        background: "var(--bg-secondary)",
        fontSize: "12px",
        color: getColor(),
        fontWeight: 500,
        fontFamily: "monospace",
      }}
    >
      {isLoading ? (
        <>
          <Timer style={{ width: "14px", height: "14px", animation: "pulse 1s infinite" }} />
          <span>{elapsed.toFixed(1)}s</span>
        </>
      ) : (
        <>
          <Zap style={{ width: "14px", height: "14px" }} />
          <span>완료: {elapsed.toFixed(1)}s</span>
        </>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
