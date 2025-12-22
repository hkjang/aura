"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Send,
  Loader2,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Lightbulb,
  FileText,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Settings,
  Brain,
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Citation {
  sourceId: string;
  sourceTitle: string;
  chunkId: string;
  content: string;
  score: number;
}

interface SourcePreview {
  title: string;
  content: string;
  fileType?: string;
  pdfBase64?: string;
  elements?: Array<{
    id: string;
    text: string;
    page: number;
    coordinates?: { x: number; y: number; width: number; height: number };
  }>;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  warning?: string;
  timestamp: Date;
}

interface Notebook {
  id: string;
  name: string;
  description: string | null;
}

export default function NotebookChatPage() {
  const params = useParams();
  const router = useRouter();
  const notebookId = params.id as string;

  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [sourcePreview, setSourcePreview] = useState<SourcePreview | null>(null);
  const [loadingSource, setLoadingSource] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Model selection
  const [models, setModels] = useState<Array<{id: string; name: string; provider: string; modelId: string}>>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fetchNotebook = async () => {
    try {
      const res = await fetch(`/api/notebooks/${notebookId}`);
      if (res.ok) {
        const data = await res.json();
        setNotebook(data.notebook);
      } else {
        router.push("/dashboard/notebooks");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const res = await fetch(`/api/notebooks/${notebookId}/query`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchModels = async () => {
    try {
      const res = await fetch("/api/admin/models");
      if (res.ok) {
        const data = await res.json();
        const activeModels = (data.models || []).filter((m: {isActive: boolean}) => m.isActive);
        setModels(activeModels);
        // Load saved model preference or use first model
        const savedModelId = localStorage.getItem(`notebook-model-${notebookId}`);
        if (savedModelId && activeModels.some((m: {id: string}) => m.id === savedModelId)) {
          setSelectedModelId(savedModelId);
        } else if (activeModels.length > 0) {
          setSelectedModelId(activeModels[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (notebookId) {
      fetchNotebook();
      fetchSuggestions();
      fetchModels();
      // Load chat history from localStorage
      const savedMessages = localStorage.getItem(`notebook-chat-${notebookId}`);
      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages);
          setMessages(parsed.map((m: Message) => ({ ...m, timestamp: new Date(m.timestamp) })));
        } catch (e) {
          console.error("Failed to load chat history:", e);
        }
      }
    }
  }, [notebookId]);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (notebookId && messages.length > 0) {
      localStorage.setItem(`notebook-chat-${notebookId}`, JSON.stringify(messages));
    }
  }, [messages, notebookId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const clearChat = () => {
    if (confirm("대화 내역을 모두 삭제하시겠습니까?")) {
      setMessages([]);
      localStorage.removeItem(`notebook-chat-${notebookId}`);
    }
  };

  const handleSubmit = async (question?: string) => {
    const q = question || input.trim();
    if (!q || streaming) return;

    setInput("");
    setStreaming(true);

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: q,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Add placeholder assistant message
    const assistantId = `assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      },
    ]);

    try {
      // Get selected model info
      const selectedModel = models.find(m => m.id === selectedModelId);
      
      const res = await fetch(`/api/notebooks/${notebookId}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          saveHistory: true,
          model: selectedModel?.modelId,
          provider: selectedModel?.provider,
        }),
      });

      if (!res.ok) {
        throw new Error("Query failed");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let citations: Citation[] = [];
      let warning: string | undefined;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });

          // Check for citations delimiter
          if (text.includes("---CITATIONS---")) {
            const [content, citationsJson] = text.split("---CITATIONS---");
            fullContent += content;

            try {
              const metadata = JSON.parse(citationsJson.trim());
              citations = metadata.citations || [];
              warning = metadata.warning;
            } catch {
              // Ignore parse errors
            }
          } else {
            fullContent += text;
          }

          // Update message content
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: fullContent, citations, warning }
                : m
            )
          );
        }
      }
    } catch (error) {
      console.error("Query error:", error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요." }
            : m
        )
      );
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  // State for expanded thinking sections
  const [expandedThinking, setExpandedThinking] = useState<Set<string>>(new Set());

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--bg-primary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            href={`/dashboard/notebooks/${notebookId}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "var(--bg-secondary)",
              color: "var(--text-secondary)",
              textDecoration: "none",
            }}
          >
            <ChevronLeft style={{ width: "18px", height: "18px" }} />
          </Link>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "var(--color-primary-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOpen style={{ width: "18px", height: "18px", color: "var(--color-primary)" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
              {notebook?.name || "노트북"}
            </h1>
            <p style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
              지식 기반 Q&A
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
            >
              <RefreshCw style={{ width: "14px", height: "14px", marginRight: "6px" }} />
              새 대화
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
        {messages.length === 0 ? (
          <div style={{ maxWidth: "600px", margin: "0 auto", paddingTop: "40px" }}>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "16px",
                  background: "var(--color-primary-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <BookOpen style={{ width: "32px", height: "32px", color: "var(--color-primary)" }} />
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-primary)" }}>
                {notebook?.name}에게 질문하세요
              </h2>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "8px" }}>
                업로드된 문서를 기반으로 정확한 답변을 제공합니다
              </p>
            </div>

            {suggestions.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <Lightbulb style={{ width: "16px", height: "16px", color: "var(--color-warning)" }} />
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>
                    추천 질문
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {suggestions.map((suggestion, i) => (
                    <Card
                      key={i}
                      style={{ padding: "12px", cursor: "pointer", border: "1px solid var(--border-color)" }}
                      onClick={() => handleSubmit(suggestion)}
                    >
                      <p style={{ fontSize: "14px", color: "var(--text-primary)" }}>{suggestion}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  marginBottom: "24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: message.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                {message.role === "user" ? (
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
                ) : (
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
                        style={{
                          fontSize: "14px",
                          lineHeight: 1.7,
                          color: "var(--text-primary)",
                        }}
                        className="prose prose-sm max-w-none dark:prose-invert"
                      >
                        {message.content ? (() => {
                          const { thinking, answer } = parseThinkingContent(message.content);
                          const isExpanded = expandedThinking.has(message.id);
                          
                          return (
                            <>
                              {/* Thinking Section */}
                              {thinking && (
                                <div style={{ marginBottom: "16px" }}>
                                  <button
                                    onClick={() => {
                                      const newSet = new Set(expandedThinking);
                                      if (isExpanded) {
                                        newSet.delete(message.id);
                                      } else {
                                        newSet.add(message.id);
                                      }
                                      setExpandedThinking(newSet);
                                    }}
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
                                    return !inline && match ? (
                                      <SyntaxHighlighter
                                        style={oneDark}
                                        language={match[1]}
                                        PreTag="div"
                                        customStyle={{borderRadius: '8px', margin: '0.5em 0', fontSize: '13px'}}
                                        {...props}
                                      >
                                        {String(children).replace(/\n$/, '')}
                                      </SyntaxHighlighter>
                                    ) : (
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
                          );
                        })() : (
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
                                onClick={() => setSelectedCitation(citation)}
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
                        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(message.content)}
                            style={{ fontSize: "12px", padding: "4px 8px", height: "auto" }}
                          >
                            {copied ? (
                              <Check style={{ width: "12px", height: "12px", marginRight: "4px" }} />
                            ) : (
                              <Copy style={{ width: "12px", height: "12px", marginRight: "4px" }} />
                            )}
                            복사
                          </Button>
                        </div>
                      )}
                    </Card>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Citation Detail with Source Preview */}
      {selectedCitation && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
          onClick={() => { setSelectedCitation(null); setSourcePreview(null); }}
        >
          <Card
            style={{
              padding: "24px",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "var(--color-primary-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FileText style={{ width: "20px", height: "20px", color: "var(--color-primary)" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {selectedCitation.sourceTitle}
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                    관련도: {Math.round(selectedCitation.score * 100)}%
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedCitation(null); setSourcePreview(null); }}
                style={{
                  background: "var(--bg-secondary)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Citation Snippet */}
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "8px" }}>
                인용된 내용
              </p>
              <div
                style={{
                  padding: "12px 16px",
                  background: "rgba(124, 58, 237, 0.05)",
                  borderLeft: "3px solid var(--color-primary)",
                  borderRadius: "0 8px 8px 0",
                  fontSize: "14px",
                  lineHeight: 1.7,
                  color: "var(--text-primary)",
                }}
              >
                {selectedCitation.content}
              </div>
            </div>

            {/* Full Source Content */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)" }}>
                  원문 전체 보기
                </p>
                {!sourcePreview && !loadingSource && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setLoadingSource(true);
                      try {
                        const res = await fetch(`/api/notebooks/${notebookId}/sources/${selectedCitation.sourceId}`);
                        if (res.ok) {
                          const data = await res.json();
                          const metadata = data.source.metadata ? JSON.parse(data.source.metadata) : {};
                          setSourcePreview({ 
                            title: data.source.title, 
                            content: data.source.content,
                            fileType: data.source.fileType,
                            pdfBase64: metadata.pdfBase64,
                            elements: metadata.elements,
                          });
                        }
                      } catch (e) {
                        console.error(e);
                      }
                      setLoadingSource(false);
                    }}
                  >
                    원문 불러오기
                  </Button>
                )}
              </div>
              {loadingSource ? (
                <div style={{ padding: "24px", textAlign: "center" }}>
                  <Loader2 style={{ width: "24px", height: "24px", color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
                  <p style={{ marginTop: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>문서를 불러오는 중...</p>
                </div>
              ) : sourcePreview ? (
                <div>
                  {/* PDF Viewer Option */}
                  {sourcePreview.pdfBase64 && (
                    <div style={{ marginBottom: "12px" }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const pdfWindow = window.open();
                          if (pdfWindow) {
                            pdfWindow.document.write(`
                              <html>
                                <head><title>${sourcePreview.title}</title></head>
                                <body style="margin:0;padding:0;">
                                  <embed 
                                    src="data:application/pdf;base64,${sourcePreview.pdfBase64}" 
                                    type="application/pdf" 
                                    width="100%" 
                                    height="100%"
                                    style="position:fixed;top:0;left:0;width:100%;height:100%;"
                                  />
                                </body>
                              </html>
                            `);
                            pdfWindow.document.close();
                          }
                        }}
                      >
                        <ExternalLink style={{ width: "14px", height: "14px", marginRight: "6px" }} />
                        PDF 원본 보기
                      </Button>
                    </div>
                  )}
                  
                  {/* Text Content with Citation Highlighted */}
                  <div
                    style={{
                      padding: "16px",
                      background: "var(--bg-secondary)",
                      borderRadius: "8px",
                      fontSize: "13px",
                      lineHeight: 1.8,
                      color: "var(--text-primary)",
                      maxHeight: "400px",
                      overflow: "auto",
                    }}
                  >
                    {/* Highlight the citation text with red border */}
                    {(() => {
                      const citationText = selectedCitation.content;
                      const fullText = sourcePreview.content;
                      
                      // Find citation in source text
                      const citationIndex = fullText.toLowerCase().indexOf(citationText.toLowerCase().substring(0, 50));
                      
                      if (citationIndex === -1) {
                        return <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "inherit" }}>{fullText}</pre>;
                      }
                      
                      const beforeText = fullText.substring(0, citationIndex);
                      const matchedText = fullText.substring(citationIndex, citationIndex + citationText.length);
                      const afterText = fullText.substring(citationIndex + citationText.length);
                      
                      return (
                        <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "inherit" }}>
                          {beforeText}
                          <span 
                            id="citation-highlight"
                            style={{ 
                              background: "rgba(239, 68, 68, 0.15)", 
                              border: "2px solid #ef4444",
                              borderRadius: "4px",
                              padding: "2px 4px",
                            }}
                          >
                            {matchedText}
                          </span>
                          {afterText}
                        </pre>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: "16px",
                    background: "var(--bg-secondary)",
                    borderRadius: "8px",
                    textAlign: "center",
                    color: "var(--text-tertiary)",
                    fontSize: "13px",
                  }}
                >
                  "원문 불러오기" 버튼을 클릭하세요
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Input Area */}
      <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-color)", background: "var(--bg-primary)" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          {/* Model Selector */}
          {models.length > 0 && (
            <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Settings style={{ width: "14px", height: "14px", color: "var(--text-tertiary)" }} />
              <select
                value={selectedModelId}
                onChange={(e) => {
                  setSelectedModelId(e.target.value);
                  localStorage.setItem(`notebook-model-${notebookId}`, e.target.value);
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  cursor: "pointer",
                  minWidth: "200px",
                }}
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.provider})
                  </option>
                ))}
              </select>
              <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                AI 모델
              </span>
            </div>
          )}
          
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "12px",
              padding: "12px 16px",
              borderRadius: "16px",
              border: "1px solid var(--border-color)",
              background: "var(--bg-secondary)",
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="질문을 입력하세요..."
              disabled={streaming}
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                resize: "none",
                fontSize: "14px",
                lineHeight: 1.5,
                color: "var(--text-primary)",
                minHeight: "24px",
                maxHeight: "120px",
                outline: "none",
              }}
              rows={1}
            />
            <Button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || streaming}
              style={{ borderRadius: "12px", padding: "8px 16px" }}
            >
              {streaming ? (
                <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
              ) : (
                <Send style={{ width: "16px", height: "16px" }} />
              )}
            </Button>
          </div>
          <p style={{ fontSize: "11px", color: "var(--text-tertiary)", textAlign: "center", marginTop: "8px" }}>
            응답은 업로드된 문서를 기반으로 생성됩니다. 외부 정보는 포함되지 않습니다.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
