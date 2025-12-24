"use client";

import { useState, useEffect } from "react";
import { Save, Cloud, CloudOff, Check } from "lucide-react";

type SaveStatus = "saved" | "saving" | "unsaved" | "error";

interface AutoSaveIndicatorProps {
  status?: SaveStatus;
  lastSaved?: Date;
}

export function AutoSaveIndicator({ status = "saved", lastSaved }: AutoSaveIndicatorProps) {
  const [displayStatus, setDisplayStatus] = useState(status);

  useEffect(() => {
    setDisplayStatus(status);
  }, [status]);

  const statusConfig: Record<SaveStatus, { icon: React.ReactNode; text: string; color: string }> = {
    saved: {
      icon: <Check style={{ width: "12px", height: "12px" }} />,
      text: lastSaved ? `저장됨 ${formatTime(lastSaved)}` : "저장됨",
      color: "#22c55e",
    },
    saving: {
      icon: <Cloud style={{ width: "12px", height: "12px", animation: "pulse 1s infinite" }} />,
      text: "저장 중...",
      color: "#3b82f6",
    },
    unsaved: {
      icon: <Save style={{ width: "12px", height: "12px" }} />,
      text: "저장되지 않음",
      color: "#f59e0b",
    },
    error: {
      icon: <CloudOff style={{ width: "12px", height: "12px" }} />,
      text: "저장 실패",
      color: "#ef4444",
    },
  };

  function formatTime(date: Date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "방금";
    if (mins < 60) return `${mins}분 전`;
    return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  }

  const config = statusConfig[displayStatus];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "12px",
        background: `${config.color}15`,
        color: config.color,
        fontSize: "11px",
        fontWeight: 500,
      }}
    >
      {config.icon}
      <span>{config.text}</span>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
