"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Copy,
  Check,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Brain,
  RotateCcw,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export interface Citation {
  sourceId: string;
  sourceTitle: string;
  chunkId: string;
  content: string;
  score: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  warning?: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
  isLastMessage: boolean;
  isStreaming: boolean;
  expandedThinking: Set<string>;
  feedbackGiven: Set<string>;
  selectedCitation: Citation | null;
  onToggleThinking: (messageId: string) => void;
  onCitationSelect: (citation: Citation) => void;
  onCopy: (text: string) => void;
  onFeedback: (messageId: string, type: "up" | "down") => void;
  onRegenerate: () => void;
  copied: boolean;
}

// Parse thinking/reasoning content from response
function parseThinkingContent(content: string): { thinking: string | null; answer: string } {
  // 1. Check for GPT-OSS Harmony format
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
}

export function ChatMessage({
  message,
  isLastMessage,
  isStreaming,
  expandedThinking,
  feedbackGiven,
  selectedCitation,
  onToggleThinking,
  onCitationSelect,
  onCopy,
  onFeedback,
  onRegenerate,
  copied,
}: ChatMessageProps) {
  const isExpanded = expandedThinking.has(message.id);

  if (message.role === "user") {
    return (
      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
        }}
      >
        <div
          style={{
            maxWidth: "80%",
            padding: "16px 20px",
            borderRadius: "20px 20px 4px 20px",
            background: "linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%)",
            color: "#1e1b4b",
            boxShadow: "0 2px 12px rgba(99, 102, 241, 0.15)",
            border: "1px solid rgba(99, 102, 241, 0.2)",
          }}
        >
          <p style={{ fontSize: "15px", lineHeight: 1.7, whiteSpace: "pre-wrap", fontWeight: 500 }}>
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  // Assistant message
  const { thinking, answer } = message.content ? parseThinkingContent(message.content) : { thinking: null, answer: "" };

  return (
    <div
      style={{
        marginBottom: "24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <div style={{ maxWidth: "90%", width: "100%" }}>
        {message.warning && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              borderRadius: "8px",
              background: "rgba(245, 158, 11, 0.1)",
              marginBottom: "12px",
            }}
          >
            <AlertTriangle style={{ width: "16px", height: "16px", color: "var(--color-warning)" }} />
            <span style={{ fontSize: "13px", color: "var(--color-warning)" }}>
              {message.warning}
            </span>
          </div>
        )}

        <Card style={{ padding: "16px" }}>
          <div
            style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--text-primary)" }}
            className="prose prose-sm max-w-none dark:prose-invert"
          >
            {message.content ? (
              <>
                {/* Thinking Section */}
                {thinking && (
                  <div style={{ marginBottom: "16px" }}>
                    <button
                      onClick={() => onToggleThinking(message.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 12px",
                        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)",
                        border: "1px solid rgba(139, 92, 246, 0.2)",
                        borderRadius: "8px",
                        cursor: "pointer",
                        width: "100%",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#8b5cf6",
                      }}
                    >
                      <Brain style={{ width: "16px", height: "16px" }} />
                      <span>추론 과정 {isExpanded ? "접기" : "보기"}</span>
                      {isExpanded ? (
                        <ChevronUp style={{ width: "16px", height: "16px", marginLeft: "auto" }} />
                      ) : (
                        <ChevronDown style={{ width: "16px", height: "16px", marginLeft: "auto" }} />
                      )}
                    </button>
                    
                    {isExpanded && (
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "12px 16px",
                          background: "rgba(139, 92, 246, 0.05)",
                          border: "1px solid rgba(139, 92, 246, 0.1)",
                          borderRadius: "8px",
                          fontSize: "13px",
                          color: "var(--text-secondary)",
                          whiteSpace: "pre-wrap",
                          maxHeight: "300px",
                          overflow: "auto",
                        }}
                      >
                        {thinking}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Answer Section */}
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    p: ({children}) => <p style={{margin: "0.5em 0"}}>{children}</p>,
                    ul: ({children}) => <ul style={{margin: "0.5em 0", paddingLeft: "1.5em"}}>{children}</ul>,
                    ol: ({children}) => <ol style={{margin: "0.5em 0", paddingLeft: "1.5em"}}>{children}</ol>,
                    li: ({children}) => <li style={{margin: "0.25em 0"}}>{children}</li>,
                    code: ({inline, className, children, ...props}: {inline?: boolean; className?: string; children?: React.ReactNode}) => {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeContent = String(children).replace(/\n$/, '');
                      
                      if (!inline && match) {
                        return (
                          <div style={{ position: 'relative', margin: '0.5em 0' }}>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(codeContent);
                              }}
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: 'none',
                                background: 'rgba(255,255,255,0.1)',
                                color: '#a1a1aa',
                                fontSize: '11px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                zIndex: 10,
                              }}
                              title="코드 복사"
                              aria-label="코드 복사"
                            >
                              <Copy style={{ width: '12px', height: '12px' }} />
                              복사
                            </button>
                            <SyntaxHighlighter
                              style={oneDark}
                              language={match[1]}
                              PreTag="div"
                              customStyle={{borderRadius: '8px', fontSize: '13px', paddingTop: '32px'}}
                              {...props}
                            >
                              {codeContent}
                            </SyntaxHighlighter>
                          </div>
                        );
                      }
                      
                      return (
                        <code style={{background: "var(--bg-secondary)", padding: "0.1em 0.3em", borderRadius: "4px", fontSize: "0.9em"}} {...props}>
                          {children}
                        </code>
                      );
                    },
                    pre: ({children}) => <>{children}</>,
                    h1: ({children}) => <h1 style={{fontSize: "1.5em", fontWeight: 600, margin: "0.5em 0"}}>{children}</h1>,
                    h2: ({children}) => <h2 style={{fontSize: "1.3em", fontWeight: 600, margin: "0.5em 0"}}>{children}</h2>,
                    h3: ({children}) => <h3 style={{fontSize: "1.1em", fontWeight: 600, margin: "0.5em 0"}}>{children}</h3>,
                    strong: ({children}) => <strong style={{fontWeight: 600}}>{children}</strong>,
                    table: ({children}) => (
                      <div style={{overflowX: "auto", margin: "1em 0"}}>
                        <table style={{borderCollapse: "collapse", width: "100%", fontSize: "13px"}}>{children}</table>
                      </div>
                    ),
                    thead: ({children}) => <thead style={{background: "var(--bg-secondary)"}}>{children}</thead>,
                    tbody: ({children}) => <tbody>{children}</tbody>,
                    tr: ({children}) => <tr style={{borderBottom: "1px solid var(--border-color)"}}>{children}</tr>,
                    th: ({children}) => <th style={{padding: "10px 12px", textAlign: "left", fontWeight: 600}}>{children}</th>,
                    td: ({children}) => <td style={{padding: "10px 12px"}}>{children}</td>,
                  }}
                >
                  {answer}
                </ReactMarkdown>
              </>
            ) : (
              <Loader2
                style={{
                  width: "20px",
                  height: "20px",
                  color: "var(--color-primary)",
                  animation: "spin 1s linear infinite",
                }}
              />
            )}
          </div>

          {/* Citations */}
          {message.citations && message.citations.length > 0 && (
            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "8px" }}>
                출처 ({message.citations.length})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {message.citations.map((citation, i) => (
                  <button
                    key={i}
                    onClick={() => onCitationSelect(citation)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      background: selectedCitation === citation ? "var(--color-primary-light)" : "var(--bg-secondary)",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "12px",
                      color: "var(--text-primary)",
                    }}
                  >
                    <FileText style={{ width: "12px", height: "12px" }} />
                    {citation.sourceTitle.length > 20
                      ? citation.sourceTitle.substring(0, 20) + "..."
                      : citation.sourceTitle}
                    <span style={{ color: "var(--text-tertiary)" }}>
                      {Math.round(citation.score * 100)}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {message.content && (
            <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy(message.content)}
                style={{ fontSize: "12px", padding: "4px 8px", height: "auto" }}
              >
                {copied ? (
                  <Check style={{ width: "12px", height: "12px", marginRight: "4px" }} />
                ) : (
                  <Copy style={{ width: "12px", height: "12px", marginRight: "4px" }} />
                )}
                복사
              </Button>
              
              {/* Feedback buttons */}
              {!feedbackGiven.has(message.id) ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFeedback(message.id, 'up')}
                    style={{ fontSize: "12px", padding: "4px 8px", height: "auto" }}
                    title="도움이 됐어요"
                  >
                    <ThumbsUp style={{ width: "12px", height: "12px", marginRight: "4px" }} />
                    좋아요
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFeedback(message.id, 'down')}
                    style={{ fontSize: "12px", padding: "4px 8px", height: "auto" }}
                    title="개선이 필요해요"
                  >
                    <ThumbsDown style={{ width: "12px", height: "12px", marginRight: "4px" }} />
                    아쉬워요
                  </Button>
                </>
              ) : (
                <span style={{ fontSize: "12px", color: "var(--text-tertiary)", padding: "4px 8px" }}>
                  ✓ 피드백 감사합니다
                </span>
              )}
              
              {/* Regenerate button - only for last message */}
              {isLastMessage && !isStreaming && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRegenerate}
                  style={{ fontSize: "12px", padding: "4px 8px", height: "auto" }}
                  title="응답 다시 생성"
                >
                  <RotateCcw style={{ width: "12px", height: "12px", marginRight: "4px" }} />
                  다시 생성
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
