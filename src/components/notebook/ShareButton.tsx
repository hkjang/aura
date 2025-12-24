"use client";

import { useState } from "react";
import { Share2, Check, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  notebookId: string;
  conversationId?: string;
}

export function ShareButton({ notebookId, conversationId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const shareUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/dashboard/notebooks/${notebookId}/chat${conversationId ? `?c=${conversationId}` : ""}`
    : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowMenu(false);
      }, 2000);
    } catch (e) {
      console.error("Failed to copy:", e);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
        title="대화 공유"
      >
        <Share2 style={{ width: "14px", height: "14px", marginRight: "6px" }} />
        공유
      </Button>

      {showMenu && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "4px",
            padding: "8px",
            borderRadius: "8px",
            background: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 50,
            minWidth: "200px",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: 500, marginBottom: "8px", color: "var(--text-secondary)" }}>
            링크 공유
          </div>
          <button
            onClick={copyLink}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              width: "100%",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "none",
              background: copied ? "rgba(34, 197, 94, 0.1)" : "var(--bg-secondary)",
              cursor: "pointer",
              fontSize: "13px",
              color: copied ? "#22c55e" : "var(--text-primary)",
            }}
          >
            {copied ? (
              <>
                <Check style={{ width: "14px", height: "14px" }} />
                복사 완료!
              </>
            ) : (
              <>
                <LinkIcon style={{ width: "14px", height: "14px" }} />
                링크 복사
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
