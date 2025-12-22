"use client";

import { useState } from "react";
import { Bot, User, ThumbsUp, ThumbsDown, Copy, Check, ExternalLink, Brain, ChevronDown, ChevronUp } from "lucide-react";
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

// Parse thinking/reasoning content from response
// Supports: <think>, <thinking>, <reasoning>, <thought>, <reflection>
// Also supports GPT-OSS Harmony format: <analysis>, <commentary>, <final>
const parseThinkingContent = (content: string): { thinking: string | null; answer: string } => {
  // 1. Check for GPT-OSS Harmony format (analysis + commentary + final)
  const analysisMatch = content.match(/<analysis>([\s\S]*?)<\/analysis>/i);
  const commentaryMatch = content.match(/<commentary>([\s\S]*?)<\/commentary>/i);
  const finalMatch = content.match(/<final>([\s\S]*?)<\/final>/i);
  
  if (analysisMatch || commentaryMatch) {
    const thinkingParts: string[] = [];
    if (analysisMatch) thinkingParts.push(`[분석]\n${analysisMatch[1].trim()}`);
    if (commentaryMatch) thinkingParts.push(`[해설]\n${commentaryMatch[1].trim()}`);
    
    const thinking = thinkingParts.join('\n\n');
    const answer = finalMatch ? finalMatch[1].trim() : content
      .replace(/<analysis>[\s\S]*?<\/analysis>/gi, '')
      .replace(/<commentary>[\s\S]*?<\/commentary>/gi, '')
      .replace(/<final>[\s\S]*?<\/final>/gi, '')
      .trim();
    
    return { thinking: thinking || null, answer: answer || content };
  }
  
  // 2. Check for standard reasoning tags
  const thinkRegex = /<(think(?:ing)?|reason(?:ing)?|thought|reflection)>([\s\S]*?)<\/\1>/i;
  const thinkMatch = content.match(thinkRegex);
  if (thinkMatch) {
    const thinking = thinkMatch[2].trim();
    const answer = content.replace(thinkRegex, '').trim();
    return { thinking, answer };
  }
  
  return { thinking: null, answer: content };
};

export function ChatMessage({ message, isPinned = false, onPin, showConfidence = true }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [feedback, setFeedback] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [pendingRating, setPendingRating] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [showThinking, setShowThinking] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = async (rating: number) => {
    setFeedback(rating);
    setPendingRating(rating);
    setShowReasonInput(true);
  };

  const submitFeedback = async () => {
    try {
      await fetch('/api/quality/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messageId: message.id, 
          rating: pendingRating,
          reason: reason || undefined
        })
      });
      setFeedbackSaved(true);
      setShowReasonInput(false);
      setTimeout(() => setFeedbackSaved(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const skipReason = async () => {
    try {
      await fetch('/api/quality/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: message.id, rating: pendingRating })
      });
      setFeedbackSaved(true);
      setShowReasonInput(false);
      setTimeout(() => setFeedbackSaved(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Parse thinking content for AI messages
  const { thinking, answer } = !isUser ? parseThinkingContent(message.content) : { thinking: null, answer: message.content };

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

        {/* Thinking Section for AI */}
        {!isUser && thinking && (
          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={() => setShowThinking(!showThinking)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '8px',
                cursor: 'pointer',
                width: '100%',
                fontSize: '13px',
                fontWeight: 500,
                color: '#8b5cf6',
              }}
            >
              <Brain style={{ width: '16px', height: '16px' }} />
              <span>추론 과정 {showThinking ? '접기' : '보기'}</span>
              {showThinking ? (
                <ChevronUp style={{ width: '16px', height: '16px', marginLeft: 'auto' }} />
              ) : (
                <ChevronDown style={{ width: '16px', height: '16px', marginLeft: 'auto' }} />
              )}
            </button>
            
            {showThinking && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '12px 16px',
                  background: 'rgba(139, 92, 246, 0.05)',
                  border: '1px solid rgba(139, 92, 246, 0.1)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '300px',
                  overflow: 'auto',
                }}
              >
                {thinking}
              </div>
            )}
          </div>
        )}

        {/* Message Content */}
        <div style={{
          fontSize: '15px',
          lineHeight: 1.7,
          color: 'var(--text-primary)'
        }}>
          {isUser ? (
            <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
          ) : (
            <MarkdownRenderer content={answer} />
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
              disabled={feedbackSaved}
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
                cursor: feedbackSaved ? 'default' : 'pointer',
                transition: 'all 150ms ease',
                opacity: feedbackSaved ? 0.5 : 1
              }}
            >
              <ThumbsDown style={{ width: '14px', height: '14px' }} />
            </button>

            {/* Feedback Saved Indicator */}
            {feedbackSaved && (
              <span style={{ 
                fontSize: '12px', 
                color: 'var(--color-success)', 
                marginLeft: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                ✓ 피드백 저장됨
              </span>
            )}
          </div>
        )}

        {/* Feedback Reason Input Popup */}
        {showReasonInput && (
          <div style={{
            marginTop: '12px',
            padding: '16px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ 
              fontSize: '13px', 
              fontWeight: 600, 
              color: 'var(--text-primary)', 
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {pendingRating === 1 ? (
                <>
                  <ThumbsUp style={{ width: '14px', height: '14px', color: 'var(--color-success)' }} />
                  좋아요 피드백
                </>
              ) : (
                <>
                  <ThumbsDown style={{ width: '14px', height: '14px', color: 'var(--color-error)' }} />
                  싫어요 피드백
                </>
              )}
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={pendingRating === 1 
                ? "무엇이 도움이 되었나요? (선택사항)" 
                : "무엇이 문제였나요? (선택사항)"
              }
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                resize: 'none',
                minHeight: '60px'
              }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button
                onClick={submitFeedback}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                제출
              </button>
              <button
                onClick={skipReason}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                건너뛰기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
