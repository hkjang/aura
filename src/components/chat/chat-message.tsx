"use client";

import { useState } from "react";
import { Bot, User, ThumbsUp, ThumbsDown, Copy, Check, ExternalLink } from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";
import { ConfidenceBar } from "./confidence-bar";

interface Citation {
  id: string;
  title: string;
  url?: string;
  snippet?: string;
}

interface LocalMessage {
  id: string;
  role: string;
  content: string;
  confidence?: number;
  citations?: Citation[];
  tokensIn?: number;
  tokensOut?: number;
}

interface ChatMessageProps {
  message: LocalMessage;
  isPinned?: boolean;
  onPin?: (id: string, pinned: boolean) => void;
  showConfidence?: boolean;
}

export function ChatMessage({ message, isPinned = false, onPin, showConfidence = true }: ChatMessageProps) {
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

        {/* Confidence Bar for AI messages */}
        {!isUser && message.content && showConfidence && message.confidence !== undefined && (
          <div style={{ marginTop: '12px', maxWidth: '200px' }}>
            <ConfidenceBar confidence={message.confidence} size="sm" />
          </div>
        )}

        {/* Citations */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div style={{ 
            marginTop: '12px', 
            padding: '12px', 
            background: 'var(--bg-secondary)', 
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              출처
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {message.citations.map((citation, idx) => (
                <div key={citation.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                  <ExternalLink style={{ width: '12px', height: '12px', color: 'var(--color-primary)', flexShrink: 0 }} />
                  {citation.url ? (
                    <a href={citation.url} target="_blank" rel="noopener noreferrer" 
                       style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                      {citation.title}
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-primary)' }}>{citation.title}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Token Usage Display for AI messages */}
        {!isUser && message.content && (message.tokensIn || message.tokensOut) && (
          <div style={{ 
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '11px',
            color: 'var(--text-tertiary)'
          }}>
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              padding: '4px 8px',
              background: 'var(--bg-tertiary)',
              borderRadius: '4px'
            }}>
              📥 입력: {message.tokensIn?.toLocaleString() || 0} tokens
            </span>
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              padding: '4px 8px',
              background: 'var(--bg-tertiary)',
              borderRadius: '4px'
            }}>
              📤 출력: {message.tokensOut?.toLocaleString() || 0} tokens
            </span>
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              padding: '4px 8px',
              background: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              borderRadius: '4px',
              fontWeight: 500
            }}>
              ∑ {((message.tokensIn || 0) + (message.tokensOut || 0)).toLocaleString()} total
            </span>
          </div>
        )}

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
