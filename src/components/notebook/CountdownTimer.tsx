"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  seconds: number;
  onComplete?: () => void;
  autoStart?: boolean;
  showIcon?: boolean;
}

export function CountdownTimer({ seconds, onComplete, autoStart = true, showIcon = true }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  const progress = ((seconds - timeLeft) / seconds) * 100;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 12px",
        borderRadius: "8px",
        background: "var(--bg-secondary)",
        fontSize: "14px",
        fontFamily: "monospace",
        fontWeight: 600,
        color: timeLeft < 30 ? "#ef4444" : "var(--text-primary)",
      }}
    >
      {showIcon && <Clock style={{ width: "16px", height: "16px" }} />}
      
      <div style={{ position: "relative", width: "60px" }}>
        <div
          style={{
            position: "absolute",
            bottom: "-4px",
            left: 0,
            right: 0,
            height: "2px",
            borderRadius: "1px",
            background: "var(--border-color)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${100 - progress}%`,
              background: timeLeft < 30 ? "#ef4444" : "var(--color-primary)",
              borderRadius: "1px",
              transition: "width 1s linear",
            }}
          />
        </div>
        <span>{formatTime(timeLeft)}</span>
      </div>
    </div>
  );
}
