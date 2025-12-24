"use client";

import { useState } from "react";
import { MoreHorizontal, Copy, Trash2, Edit3, Pin, Share2, Flag } from "lucide-react";

interface ActionItem {
  icon: React.ReactNode;
  label: string;
  action: () => void;
  danger?: boolean;
}

interface ExpandableActionsProps {
  onCopy?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onPin?: () => void;
  onShare?: () => void;
  onReport?: () => void;
}

export function ExpandableActions({
  onCopy,
  onDelete,
  onEdit,
  onPin,
  onShare,
  onReport,
}: ExpandableActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions: ActionItem[] = [
    ...(onCopy ? [{ icon: <Copy style={{ width: "14px", height: "14px" }} />, label: "복사", action: onCopy }] : []),
    ...(onEdit ? [{ icon: <Edit3 style={{ width: "14px", height: "14px" }} />, label: "수정", action: onEdit }] : []),
    ...(onPin ? [{ icon: <Pin style={{ width: "14px", height: "14px" }} />, label: "고정", action: onPin }] : []),
    ...(onShare ? [{ icon: <Share2 style={{ width: "14px", height: "14px" }} />, label: "공유", action: onShare }] : []),
    ...(onReport ? [{ icon: <Flag style={{ width: "14px", height: "14px" }} />, label: "신고", action: onReport }] : []),
    ...(onDelete ? [{ icon: <Trash2 style={{ width: "14px", height: "14px" }} />, label: "삭제", action: onDelete, danger: true }] : []),
  ];

  if (actions.length === 0) return null;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "28px",
          height: "28px",
          borderRadius: "6px",
          border: "none",
          background: isOpen ? "var(--bg-secondary)" : "transparent",
          cursor: "pointer",
          color: "var(--text-tertiary)",
        }}
      >
        <MoreHorizontal style={{ width: "16px", height: "16px" }} />
      </button>

      {isOpen && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: "4px",
              padding: "4px",
              borderRadius: "8px",
              background: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 50,
              minWidth: "120px",
            }}
          >
            {actions.map((action, i) => (
              <button
                key={i}
                onClick={() => {
                  action.action();
                  setIsOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: "6px",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "13px",
                  color: action.danger ? "#ef4444" : "var(--text-primary)",
                  textAlign: "left",
                }}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
