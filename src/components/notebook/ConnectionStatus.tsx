"use client";

import { useState, useEffect } from "react";
import { Wifi, WifiOff, Signal, SignalLow, SignalMedium, SignalHigh } from "lucide-react";

type ConnectionQuality = "excellent" | "good" | "fair" | "poor" | "offline";

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [quality, setQuality] = useState<ConnectionQuality>("good");
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const start = performance.now();
        const response = await fetch("/api/system-status", { 
          method: "HEAD",
          cache: "no-store" 
        });
        const end = performance.now();
        const ms = Math.round(end - start);
        
        setLatency(ms);
        setIsOnline(response.ok);
        
        if (ms < 100) setQuality("excellent");
        else if (ms < 300) setQuality("good");
        else if (ms < 600) setQuality("fair");
        else setQuality("poor");
      } catch {
        setIsOnline(false);
        setQuality("offline");
        setLatency(null);
      }
    };

    // Check on mount and every 30 seconds
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    
    // Also listen for online/offline events
    const handleOnline = () => { setIsOnline(true); checkConnection(); };
    const handleOffline = () => { setIsOnline(false); setQuality("offline"); };
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const qualityColors: Record<ConnectionQuality, string> = {
    excellent: "#22c55e",
    good: "#84cc16",
    fair: "#f59e0b",
    poor: "#ef4444",
    offline: "#6b7280",
  };

  const qualityLabels: Record<ConnectionQuality, string> = {
    excellent: "매우 좋음",
    good: "좋음",
    fair: "보통",
    poor: "느림",
    offline: "오프라인",
  };

  const SignalIcon = () => {
    if (!isOnline) return <WifiOff style={{ width: "14px", height: "14px" }} />;
    if (quality === "excellent") return <SignalHigh style={{ width: "14px", height: "14px" }} />;
    if (quality === "good") return <SignalMedium style={{ width: "14px", height: "14px" }} />;
    if (quality === "fair") return <SignalLow style={{ width: "14px", height: "14px" }} />;
    return <Signal style={{ width: "14px", height: "14px" }} />;
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "12px",
        background: `${qualityColors[quality]}15`,
        color: qualityColors[quality],
        fontSize: "11px",
        fontWeight: 500,
      }}
      title={latency ? `응답 시간: ${latency}ms` : "연결 상태"}
    >
      <SignalIcon />
      <span>{qualityLabels[quality]}</span>
      {latency && isOnline && (
        <span style={{ opacity: 0.7 }}>{latency}ms</span>
      )}
    </div>
  );
}
