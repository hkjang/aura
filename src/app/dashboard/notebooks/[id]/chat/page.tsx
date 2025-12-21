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
} from "lucide-react";
import Link from "next/link";

interface Citation {
  sourceId: string;
  sourceTitle: string;
  chunkId: string;
  content: string;
  score: number;
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
  const [copied, setCopied] = useState(false);

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

  useEffect(() => {
    if (notebookId) {
      fetchNotebook();
      fetchSuggestions();
    }
  }, [notebookId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      const res = await fetch(`/api/notebooks/${notebookId}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          saveHistory: true,
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMessages([]);
              fetchSuggestions();
            }}
          >
            <RefreshCw style={{ width: "14px", height: "14px", marginRight: "6px" }} />
            새 대화
          </Button>
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
                      className="p-3"
                      style={{ cursor: "pointer", border: "1px solid var(--border-color)" }}
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
                      padding: "12px 16px",
                      borderRadius: "16px 16px 4px 16px",
                      background: "var(--color-primary)",
                      color: "white",
                    }}
                  >
                    <p style={{ fontSize: "14px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
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

                    <Card className="p-4">
                      <div
                        style={{
                          fontSize: "14px",
                          lineHeight: 1.7,
                          color: "var(--text-primary)",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {message.content || (
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

      {/* Citation Detail */}
      {selectedCitation && (
        <div
          style={{
            position: "fixed",
            right: "24px",
            bottom: "120px",
            width: "360px",
            zIndex: 100,
          }}
        >
          <Card className="p-4" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FileText style={{ width: "16px", height: "16px", color: "var(--color-primary)" }} />
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {selectedCitation.sourceTitle}
                </span>
              </div>
              <button
                onClick={() => setSelectedCitation(null)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
              >
                <ChevronLeft style={{ width: "16px", height: "16px", transform: "rotate(180deg)", color: "var(--text-tertiary)" }} />
              </button>
            </div>
            <div
              style={{
                padding: "12px",
                background: "var(--bg-secondary)",
                borderRadius: "8px",
                fontSize: "13px",
                lineHeight: 1.6,
                color: "var(--text-primary)",
                maxHeight: "200px",
                overflow: "auto",
              }}
            >
              {selectedCitation.content}
            </div>
            <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-tertiary)" }}>
              관련도: {Math.round(selectedCitation.score * 100)}%
            </div>
          </Card>
        </div>
      )}

      {/* Input Area */}
      <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-color)", background: "var(--bg-primary)" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
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
