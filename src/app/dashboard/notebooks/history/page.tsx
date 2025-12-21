"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  History,
  Search,
  Loader2,
  Trash,
  Star,
  StarOff,
  Download,
  ChevronLeft,
  MessageSquare,
  BookOpen,
  RefreshCw,
  Filter,
  Calendar,
  Check,
} from "lucide-react";
import Link from "next/link";

interface QnAItem {
  id: string;
  question: string;
  answer: string;
  citations: Array<{ sourceTitle?: string; sourceId: string }>;
  tags: string[];
  isSaved: boolean;
  rating: number | null;
  createdAt: string;
  notebook: { id: string; name: string } | null;
}

export default function QnAHistoryPage() {
  const [history, setHistory] = useState<QnAItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSaved, setFilterSaved] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterSaved) params.set("savedOnly", "true");
      
      const res = await fetch(`/api/notebooks/history?${params}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filterSaved]);

  const handleToggleSave = async (id: string, currentSaved: boolean) => {
    try {
      const res = await fetch(`/api/notebooks/history/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSaved: !currentSaved }),
      });

      if (res.ok) {
        setHistory((prev) =>
          prev.map((h) => (h.id === id ? { ...h, isSaved: !currentSaved } : h))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 Q&A를 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/notebooks/history/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setHistory((prev) => prev.filter((h) => h.id !== id));
        setSelectedItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExport = async () => {
    if (selectedItems.size === 0) return;

    setExporting(true);
    try {
      const res = await fetch("/api/notebooks/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "qna",
          format: "md",
          qnaIds: Array.from(selectedItems),
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `qa-export-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
        setSelectedItems(new Set());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  const toggleSelectItem = (id: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedItems(newSet);
  };

  const selectAll = () => {
    if (selectedItems.size === filteredHistory.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredHistory.map((h) => h.id)));
    }
  };

  const filteredHistory = searchQuery
    ? history.filter(
        (h) =>
          h.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          h.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : history;

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "12px" }}>
              <History style={{ width: "28px", height: "28px", color: "var(--color-primary)" }} />
              Q&A 히스토리
            </h1>
            <p style={{ color: "var(--text-secondary)", marginTop: "4px", fontSize: "14px" }}>
              저장된 질문과 답변을 관리하세요
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <Button variant="outline" size="sm" onClick={fetchHistory} disabled={loading}>
            <RefreshCw style={{ width: "14px", height: "14px", marginRight: "6px" }} />
            새로고침
          </Button>
          {selectedItems.size > 0 && (
            <Button onClick={handleExport} disabled={exporting}>
              <Download style={{ width: "16px", height: "16px", marginRight: "8px" }} />
              {exporting ? "내보내는 중..." : `내보내기 (${selectedItems.size})`}
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <div style={{ flex: 1, maxWidth: "400px", position: "relative" }}>
          <Search
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "18px",
              height: "18px",
              color: "var(--text-tertiary)",
            }}
          />
          <Input
            placeholder="질문 또는 답변 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: "40px" }}
          />
        </div>

        <Button
          variant={filterSaved ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterSaved(!filterSaved)}
        >
          <Star style={{ width: "14px", height: "14px", marginRight: "6px" }} />
          저장됨만
        </Button>

        {filteredHistory.length > 0 && (
          <Button variant="outline" size="sm" onClick={selectAll}>
            <Check style={{ width: "14px", height: "14px", marginRight: "6px" }} />
            {selectedItems.size === filteredHistory.length ? "선택 해제" : "전체 선택"}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
        <Card className="p-4">
          <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>전체 Q&A</p>
          <h3 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)" }}>{history.length}</h3>
        </Card>
        <Card className="p-4">
          <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>저장됨</p>
          <h3 style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-primary)" }}>
            {history.filter((h) => h.isSaved).length}
          </h3>
        </Card>
        <Card className="p-4">
          <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>선택됨</p>
          <h3 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)" }}>{selectedItems.size}</h3>
        </Card>
      </div>

      {/* History List */}
      {loading ? (
        <div style={{ padding: "60px", textAlign: "center" }}>
          <Loader2 style={{ width: "32px", height: "32px", margin: "0 auto", color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
          <p style={{ marginTop: "16px", color: "var(--text-secondary)" }}>불러오는 중...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <Card className="p-8" style={{ textAlign: "center" }}>
          <MessageSquare style={{ width: "48px", height: "48px", color: "var(--text-tertiary)", margin: "0 auto" }} />
          <h3 style={{ fontWeight: 600, color: "var(--text-primary)", marginTop: "16px" }}>
            {searchQuery || filterSaved ? "검색 결과가 없습니다" : "Q&A 히스토리가 없습니다"}
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "8px" }}>
            노트북에서 질문을 하면 자동으로 저장됩니다
          </p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredHistory.map((item) => {
            const isSelected = selectedItems.has(item.id);
            return (
              <Card
                key={item.id}
                className="p-4"
                style={{
                  border: isSelected ? "2px solid var(--color-primary)" : "1px solid var(--border-color)",
                  background: isSelected ? "rgba(124, 58, 237, 0.02)" : "var(--bg-primary)",
                }}
              >
                <div style={{ display: "flex", gap: "12px" }}>
                  {/* Checkbox */}
                  <div
                    onClick={() => toggleSelectItem(item.id)}
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "4px",
                      border: isSelected ? "none" : "2px solid var(--border-color)",
                      background: isSelected ? "var(--color-primary)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  >
                    {isSelected && <Check style={{ width: "12px", height: "12px", color: "white" }} />}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      {item.notebook && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            background: "var(--color-primary-light)",
                            fontSize: "11px",
                            color: "var(--color-primary)",
                            fontWeight: 500,
                          }}
                        >
                          <BookOpen style={{ width: "10px", height: "10px" }} />
                          {item.notebook.name}
                        </span>
                      )}
                      <span style={{ fontSize: "12px", color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Calendar style={{ width: "12px", height: "12px" }} />
                        {new Date(item.createdAt).toLocaleString("ko-KR")}
                      </span>
                    </div>

                    <h4 style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "14px", marginBottom: "6px" }}>
                      {item.question}
                    </h4>

                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                        lineHeight: 1.5,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {item.answer}
                    </p>

                    {item.citations.length > 0 && (
                      <p style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "8px" }}>
                        출처: {item.citations.length}개
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleSave(item.id, item.isSaved)}
                      style={{ color: item.isSaved ? "var(--color-warning)" : "var(--text-tertiary)" }}
                    >
                      {item.isSaved ? (
                        <Star style={{ width: "16px", height: "16px", fill: "currentColor" }} />
                      ) : (
                        <StarOff style={{ width: "16px", height: "16px" }} />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                      style={{ color: "var(--color-error)" }}
                    >
                      <Trash style={{ width: "16px", height: "16px" }} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
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
