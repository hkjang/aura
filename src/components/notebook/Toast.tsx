"use client";

import { useState, useEffect, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContainerProps {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle style={{ width: "18px", height: "18px", color: "#22c55e" }} />,
  error: <AlertCircle style={{ width: "18px", height: "18px", color: "#ef4444" }} />,
  info: <Info style={{ width: "18px", height: "18px", color: "#3b82f6" }} />,
  warning: <AlertTriangle style={{ width: "18px", height: "18px", color: "#f59e0b" }} />,
};

const toastColors: Record<ToastType, string> = {
  success: "rgba(34, 197, 94, 0.1)",
  error: "rgba(239, 68, 68, 0.1)",
  info: "rgba(59, 130, 246, 0.1)",
  warning: "rgba(245, 158, 11, 0.1)",
};

// Global toast state
let toastListeners: ((toasts: Toast[]) => void)[] = [];
let globalToasts: Toast[] = [];

export function showToast(type: ToastType, message: string) {
  const id = Date.now().toString();
  const newToast = { id, type, message };
  globalToasts = [...globalToasts, newToast];
  toastListeners.forEach((listener) => listener(globalToasts));
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    globalToasts = globalToasts.filter((t) => t.id !== id);
    toastListeners.forEach((listener) => listener(globalToasts));
  }, 4000);
}

export function ToastContainer({ position = "top-right" }: ToastContainerProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== setToasts);
    };
  }, []);

  const removeToast = (id: string) => {
    globalToasts = globalToasts.filter((t) => t.id !== id);
    toastListeners.forEach((listener) => listener(globalToasts));
  };

  const positionStyles: Record<string, React.CSSProperties> = {
    "top-right": { top: "20px", right: "20px" },
    "top-left": { top: "20px", left: "20px" },
    "bottom-right": { bottom: "20px", right: "20px" },
    "bottom-left": { bottom: "20px", left: "20px" },
  };

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        ...positionStyles[position],
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        zIndex: 9999,
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 16px",
            borderRadius: "12px",
            background: "var(--bg-primary)",
            border: `1px solid var(--border-color)`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            minWidth: "280px",
            animation: "slideIn 0.3s ease",
          }}
        >
          <div
            style={{
              padding: "8px",
              borderRadius: "8px",
              background: toastColors[toast.type],
            }}
          >
            {toastIcons[toast.type]}
          </div>
          <span style={{ flex: 1, fontSize: "14px" }}>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            style={{
              padding: "4px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--text-tertiary)",
            }}
          >
            <X style={{ width: "16px", height: "16px" }} />
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
