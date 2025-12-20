"use client";

import { useState } from "react";
import { Bot, User, ThumbsUp, ThumbsDown, Copy, Check } from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";

interface LocalMessage {
  id: string;
  role: string;
  content: string;
}

interface ChatMessageProps {
  message: LocalMessage;
  isPinned?: boolean;
  onPin?: (id: string, pinned: boolean) => void;
}

export function ChatMessage({ message, isPinned = false, onPin }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [feedback, setFeedback] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = async (rating: number) => {
    setFeedback(rating);
    try {
      await fetch('/api/quality/feedback', {
        method: 'POST',
        body: JSON.stringify({ messageId: message.id, rating })
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      padding: '24px 0',
      animation: 'fadeIn 200ms ease'
    }}>
      {/* Avatar */}
      <div style={{
        flexShrink: 0,
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isUser ? 'var(--color-primary)' : 'var(--bg-tertiary)',
        color: isUser ? 'white' : 'var(--text-primary)'
      }}>
        {isUser ? <User style={{ width: '18px', height: '18px' }} /> : <Bot style={{ width: '18px', height: '18px' }} />}
      </div>
      
      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ 
          fontSize: '13px', 
          fontWeight: 600, 
          color: 'var(--text-secondary)',
          marginBottom: '8px',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.5px'
        }}>
          {isUser ? "You" : "Aura AI"}
        </div>

        {/* Message Content */}
        <div style={{
          fontSize: '15px',
          lineHeight: 1.7,
          color: 'var(--text-primary)'
        }}>
          {isUser ? (
            <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>

        {/* Actions for AI messages */}
        {!isUser && message.content && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-color)'
          }}>
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                fontSize: '12px',
                color: copied ? 'var(--color-success)' : 'var(--text-secondary)',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
            >
              {copied ? <Check style={{ width: '14px', height: '14px' }} /> : <Copy style={{ width: '14px', height: '14px' }} />}
              {copied ? '복사됨' : '복사'}
            </button>

            {/* Divider */}
            <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 4px' }} />

            {/* Feedback */}
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginRight: '4px' }}>
              도움이 되었나요?
            </span>
            <button
              onClick={() => handleFeedback(1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                background: feedback === 1 ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: feedback === 1 ? 'rgb(34, 197, 94)' : 'var(--text-tertiary)',
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
            >
              <ThumbsUp style={{ width: '14px', height: '14px' }} />
            </button>
            <button
              onClick={() => handleFeedback(-1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                background: feedback === -1 ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: feedback === -1 ? 'rgb(239, 68, 68)' : 'var(--text-tertiary)',
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
            >
              <ThumbsDown style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
