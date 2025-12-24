"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface SessionTimerProps {
  startTime?: Date;
}

export function SessionTimer({ startTime = new Date() }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = startTime.getTime();
    
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
        fontFamily: "monospace",
        color: "var(--text-tertiary)",
      }}
      title="세션 시간"
    >
      <Clock style={{ width: "12px", height: "12px" }} />
      <span>{formatTime(elapsed)}</span>
    </div>
  );
}
