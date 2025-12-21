"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Send,
  Loader2,
  ChevronLeft,
  AlertTriangle,
  FileText,
  RefreshCw,
  Check,
  Copy,
  Lightbulb,
  GitCompare,
  Layers,
  X,
  Search,
} from "lucide-react";
import Link from "next/link";

interface Citation {
  sourceId: string;
  sourceTitle: string;
  chunkId: string;
  content: string;
  score: number;
  notebookName?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  warning?: string;
  mode?: "merged" | "compare";
  notebooks?: Array<{ id: string; name: string; citationCount: number }>;
  timestamp: Date;
}

interface Notebook {
  id: string;
  name: string;
  description: string | null;
  _count: {
    sources: number;
  };
}

export default function MultiNotebookChatPage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNotebooks, setSelectedNotebooks] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [showNotebookSelector, setShowNotebookSelector] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fetchNotebooks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notebooks");
      if (res.ok) {
        const data = await res.json();
        const allNotebooks = [...(data.owned || []), ...(data.shared || [])];
        setNotebooks(allNotebooks);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotebooks();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleNotebook = (id: string) => {
    const newSet = new Set(selectedNotebooks);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedNotebooks(newSet);
  };

  const handleSubmit = async (question?: string) => {
    const q = question || input.trim();
    if (!q || streaming || selectedNotebooks.size === 0) return;

    setInput("");
    setStreaming(true);
    setShowNotebookSelector(false);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: q,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

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
      const res = await fetch("/api/notebooks/multi-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          notebookIds: Array.from(selectedNotebooks),
          compareMode,
        }),
      });

      if (!res.ok) throw new Error("Query failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let citations: Citation[] = [];
      let warning: string | undefined;
      let mode: "merged" | "compare" = "merged";
      let notebooksMeta: Array<{ id: string; name: string; citationCount: number }> = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });

          if (text.includes("---CITATIONS---")) {
            const [content, citationsJson] = text.split("---CITATIONS---");
            fullContent += content;

            try {
              const metadata = JSON.parse(citationsJson.trim());
              citations = metadata.citations || [];
              warning = metadata.warning;
              mode = metadata.mode || "merged";
              notebooksMeta = metadata.notebooks || [];
            } catch {
              // Ignore
            }
          } else {
            fullContent += text;
          }

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: fullContent, citations, warning, mode, notebooks: notebooksMeta }
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
            ? { ...m, content: "죄송합니다. 오류가 발생했습니다." }
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

  const selectedCount = selectedNotebooks.size;

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
            href="/dashboard/notebooks"
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
              background: "linear-gradient(135deg, var(--color-primary), #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Layers style={{ width: "18px", height: "18px", color: "white" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
              다중 노트북 질의
            </h1>
            <p style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
              {selectedCount > 0 ? `${selectedCount}개 노트북 선택됨` : "노트북을 선택하세요"}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* Compare Mode Toggle */}
          <Button
            variant={compareMode ? "default" : "outline"}
            size="sm"
            onClick={() => setCompareMode(!compareMode)}
          >
            <GitCompare style={{ width: "14px", height: "14px", marginRight: "6px" }} />
            {compareMode ? "비교 모드" : "통합 모드"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNotebookSelector(!showNotebookSelector)}
          >
            <BookOpen style={{ width: "14px", height: "14px", marginRight: "6px" }} />
            노트북 선택
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMessages([]);
              setShowNotebookSelector(true);
            }}
          >
            <RefreshCw style={{ width: "14px", height: "14px", marginRight: "6px" }} />
            새 대화
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Notebook Selector Sidebar */}
        {showNotebookSelector && (
          <div
            style={{
              width: "280px",
              borderRight: "1px solid var(--border-color)",
              padding: "16px",
              overflow: "auto",
              background: "var(--bg-secondary)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                노트북 선택
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowNotebookSelector(false)}>
                <X style={{ width: "14px", height: "14px" }} />
              </Button>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Loader2 style={{ width: "20px", height: "20px", margin: "0 auto", animation: "spin 1s linear infinite" }} />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {notebooks.map((nb) => {
                  const isSelected = selectedNotebooks.has(nb.id);
                  return (
                    <div
                      key={nb.id}
                      onClick={() => toggleNotebook(nb.id)}
                      style={{
                        padding: "12px",
                        borderRadius: "8px",
                        border: isSelected
                          ? "2px solid var(--color-primary)"
                          : "1px solid var(--border-color)",
                        background: isSelected ? "rgba(124, 58, 237, 0.05)" : "var(--bg-primary)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "4px",
                            border: isSelected ? "none" : "2px solid var(--border-color)",
                            background: isSelected ? "var(--color-primary)" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {isSelected && <Check style={{ width: "12px", height: "12px", color: "white" }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
                            {nb.name}
                          </p>
                          <p style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                            {nb._count.sources} 소스
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Chat Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
            {messages.length === 0 ? (
              <div style={{ maxWidth: "600px", margin: "0 auto", paddingTop: "60px", textAlign: "center" }}>
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "16px",
                    background: "linear-gradient(135deg, var(--color-primary), #8b5cf6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <Layers style={{ width: "32px", height: "32px", color: "white" }} />
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-primary)" }}>
                  다중 노트북 질의
                </h2>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "8px" }}>
                  여러 노트북의 지식을 통합하거나 비교 분석할 수 있습니다
                </p>

                <div style={{ marginTop: "24px", display: "flex", gap: "12px", justifyContent: "center" }}>
                  <div
                    style={{
                      padding: "16px",
                      borderRadius: "12px",
                      background: "var(--bg-secondary)",
                      flex: 1,
                      maxWidth: "200px",
                    }}
                  >
                    <Layers style={{ width: "24px", height: "24px", color: "var(--color-primary)", margin: "0 auto" }} />
                    <p style={{ fontSize: "13px", fontWeight: 500, marginTop: "8px" }}>통합 모드</p>
                    <p style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "4px" }}>
                      모든 노트북 정보를 통합하여 답변
                    </p>
                  </div>
                  <div
                    style={{
                      padding: "16px",
                      borderRadius: "12px",
                      background: "var(--bg-secondary)",
                      flex: 1,
                      maxWidth: "200px",
                    }}
                  >
                    <GitCompare style={{ width: "24px", height: "24px", color: "var(--color-warning)", margin: "0 auto" }} />
                    <p style={{ fontSize: "13px", fontWeight: 500, marginTop: "8px" }}>비교 모드</p>
                    <p style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "4px" }}>
                      노트북별 정보를 비교 분석
                    </p>
                  </div>
                </div>
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
                        {message.mode && (
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 10px",
                              borderRadius: "12px",
                              background: message.mode === "compare" ? "rgba(245, 158, 11, 0.1)" : "rgba(124, 58, 237, 0.1)",
                              marginBottom: "8px",
                              fontSize: "11px",
                              fontWeight: 500,
                              color: message.mode === "compare" ? "var(--color-warning)" : "var(--color-primary)",
                            }}
                          >
                            {message.mode === "compare" ? (
                              <GitCompare style={{ width: "12px", height: "12px" }} />
                            ) : (
                              <Layers style={{ width: "12px", height: "12px" }} />
                            )}
                            {message.mode === "compare" ? "비교 모드" : "통합 모드"}
                          </div>
                        )}

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
                            <span style={{ fontSize: "13px", color: "var(--color-warning)" }}>{message.warning}</span>
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
                                style={{ width: "20px", height: "20px", color: "var(--color-primary)", animation: "spin 1s linear infinite" }}
                              />
                            )}
                          </div>

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
                                      background: "var(--bg-secondary)",
                                      border: "none",
                                      cursor: "pointer",
                                      fontSize: "12px",
                                      color: "var(--text-primary)",
                                    }}
                                  >
                                    <FileText style={{ width: "12px", height: "12px" }} />
                                    {citation.notebookName && (
                                      <span style={{ color: "var(--color-primary)", fontWeight: 500 }}>
                                        [{citation.notebookName}]
                                      </span>
                                    )}
                                    {citation.sourceTitle.length > 15
                                      ? citation.sourceTitle.substring(0, 15) + "..."
                                      : citation.sourceTitle}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

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
                  placeholder={selectedCount > 0 ? "질문을 입력하세요..." : "먼저 노트북을 선택하세요"}
                  disabled={streaming || selectedCount === 0}
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
                  disabled={!input.trim() || streaming || selectedCount === 0}
                  style={{ borderRadius: "12px", padding: "8px 16px" }}
                >
                  {streaming ? (
                    <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
                  ) : (
                    <Send style={{ width: "16px", height: "16px" }} />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
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
              <div>
                {selectedCitation.notebookName && (
                  <p style={{ fontSize: "11px", color: "var(--color-primary)", fontWeight: 500, marginBottom: "4px" }}>
                    {selectedCitation.notebookName}
                  </p>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <FileText style={{ width: "16px", height: "16px", color: "var(--text-primary)" }} />
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {selectedCitation.sourceTitle}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCitation(null)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
              >
                <X style={{ width: "16px", height: "16px", color: "var(--text-tertiary)" }} />
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
          </Card>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
