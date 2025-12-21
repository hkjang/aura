"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle, AlertTriangle, Info, Megaphone } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
}

const priorityConfig = {
  LOW: { 
    bg: "linear-gradient(90deg, #f3f4f6, #e5e7eb)", 
    border: "#d1d5db",
    text: "#374151",
    icon: Info 
  },
  NORMAL: { 
    bg: "linear-gradient(90deg, #dbeafe, #bfdbfe)", 
    border: "#93c5fd",
    text: "#1d4ed8",
    icon: Info 
  },
  HIGH: { 
    bg: "linear-gradient(90deg, #fef3c7, #fde68a)", 
    border: "#fbbf24",
    text: "#92400e",
    icon: AlertTriangle 
  },
  CRITICAL: { 
    bg: "linear-gradient(90deg, #fee2e2, #fecaca)", 
    border: "#f87171",
    text: "#991b1b",
    icon: AlertCircle 
  },
};

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
    }
  };

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set(prev).add(id));
    // Move to next announcement if available
    const remaining = announcements.filter(a => !dismissedIds.has(a.id) && a.id !== id);
    if (remaining.length > 0 && currentIndex >= remaining.length) {
      setCurrentIndex(0);
    }
  };

  // Filter out dismissed announcements
  const activeAnnouncements = announcements.filter(a => !dismissedIds.has(a.id));
  
  if (activeAnnouncements.length === 0) {
    return null;
  }

  const current = activeAnnouncements[currentIndex % activeAnnouncements.length];
  const config = priorityConfig[current.priority];
  const Icon = config.icon;

  return (
    <div
      style={{
        background: config.bg,
        borderBottom: `1px solid ${config.border}`,
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        position: "relative",
      }}
    >
      <Icon style={{ width: "18px", height: "18px", color: config.text, flexShrink: 0 }} />
      
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, justifyContent: "center" }}>
        <span style={{ fontWeight: 600, color: config.text, fontSize: "14px" }}>
          {current.title}
        </span>
        <span style={{ color: config.text, fontSize: "14px", opacity: 0.8 }}>
          {current.content}
        </span>
      </div>

      {activeAnnouncements.length > 1 && (
        <div style={{ display: "flex", gap: "4px", marginRight: "8px" }}>
          {activeAnnouncements.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: idx === currentIndex % activeAnnouncements.length 
                  ? config.text 
                  : `${config.text}40`,
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => handleDismiss(current.id)}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "4px",
          borderRadius: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: config.text,
          opacity: 0.6,
          transition: "opacity 150ms ease",
        }}
        title="닫기"
      >
        <X style={{ width: "16px", height: "16px" }} />
      </button>
    </div>
  );
}

// Simple inline status bar for showing system status in header/footer
export function SystemStatusBar() {
  const [status, setStatus] = useState<"OPERATIONAL" | "DEGRADED" | "OUTAGE" | null>(null);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/system-status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data.overall);
      }
    } catch {
      setStatus(null);
    }
  };

  if (!status || status === "OPERATIONAL") {
    return null;
  }

  const isOutage = status === "OUTAGE";

  return (
    <div
      style={{
        background: isOutage ? "#fef2f2" : "#fffbeb",
        borderBottom: `1px solid ${isOutage ? "#fecaca" : "#fde68a"}`,
        padding: "6px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        fontSize: "13px",
        color: isOutage ? "#991b1b" : "#92400e",
      }}
    >
      {isOutage ? (
        <AlertCircle style={{ width: "14px", height: "14px" }} />
      ) : (
        <AlertTriangle style={{ width: "14px", height: "14px" }} />
      )}
      <span>
        {isOutage 
          ? "일부 서비스에 장애가 발생했습니다." 
          : "일부 서비스의 성능이 저하되었습니다."
        }
      </span>
      <a 
        href="/status" 
        style={{ textDecoration: "underline", fontWeight: 500 }}
      >
        상세 보기
      </a>
    </div>
  );
}
