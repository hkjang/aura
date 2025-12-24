"use client";

import { AlertTriangle, Trash2, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "확인",
  cancelLabel = "취소",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const isDanger = variant === "danger";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "24px",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "var(--bg-primary)",
          borderRadius: "16px",
          padding: "24px",
          maxWidth: "400px",
          width: "100%",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <div
            style={{
              padding: "12px",
              borderRadius: "12px",
              background: isDanger ? "rgba(239, 68, 68, 0.1)" : "rgba(124, 58, 237, 0.1)",
            }}
          >
            {isDanger ? (
              <AlertTriangle style={{ width: "24px", height: "24px", color: "#ef4444" }} />
            ) : (
              <Trash2 style={{ width: "24px", height: "24px", color: "var(--color-primary)" }} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>{title}</h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {message}
            </p>
          </div>
          <button
            onClick={onCancel}
            style={{
              padding: "4px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--text-tertiary)",
            }}
          >
            <X style={{ width: "20px", height: "20px" }} />
          </button>
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "24px", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              background: "transparent",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              background: isDanger ? "#ef4444" : "var(--color-primary)",
              color: "white",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
