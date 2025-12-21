"use client";

import { useState, useEffect } from "react";
import { FileText, History, Trash2, Search, ArrowLeft, Calendar, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";

interface HistoryItem {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  originalLength: number;
  summaryLength: number;
  summary: string;
  keyPoints: string[];
  keywords: string[];
  modelUsed?: string;
  parsingMethod?: string;
  createdAt: string;
}

export default function SummaryHistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/summarize/history?page=${page}&limit=10`);
      const data = await res.json();
      setHistory(data.history || []);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm("이 요약 이력을 삭제하시겠습니까?")) return;
    try {
      await fetch(`/api/summarize/history?id=${id}`, { method: "DELETE" });
      fetchHistory();
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch (e) {
      console.error(e);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredHistory = history.filter(item => 
    item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <a href="/dashboard/summarize" style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", textDecoration: "none", fontSize: "13px", marginBottom: "12px" }}>
          <ArrowLeft style={{ width: "14px", height: "14px" }} />
          문서 요약으로 돌아가기
        </a>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px" }}>
          <History style={{ width: "24px", height: "24px", color: "#8b5cf6" }} />
          요약 이력
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
          총 {history.length}개의 요약 이력이 있습니다
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
            <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "var(--text-tertiary)" }} />
            <Input
              placeholder="파일명 또는 내용으로 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "40px" }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "24px" }}>
        {/* History List */}
        <div style={{ 
          background: "var(--bg-primary)", 
          borderRadius: "12px", 
          border: "1px solid var(--border-color)",
          overflow: "hidden"
        }}>
          <div style={{ padding: "16px", borderBottom: "1px solid var(--border-color)" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>요약 목록</h2>
          </div>
          
          <div style={{ maxHeight: "calc(100vh - 300px)", overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-tertiary)" }}>
                로딩 중...
              </div>
            ) : filteredHistory.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-tertiary)" }}>
                {searchQuery ? "검색 결과가 없습니다" : "요약 이력이 없습니다"}
              </div>
            ) : (
              filteredHistory.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid var(--border-color)",
                    cursor: "pointer",
                    background: selectedItem?.id === item.id ? "rgba(139, 92, 246, 0.08)" : "transparent",
                    borderLeft: selectedItem?.id === item.id ? "3px solid #8b5cf6" : "3px solid transparent",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ 
                        fontSize: "14px", 
                        fontWeight: 500, 
                        color: "var(--text-primary)", 
                        marginBottom: "4px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {item.fileName}
                      </p>
                      <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "var(--text-tertiary)" }}>
                        <span>{formatFileSize(item.fileSize)}</span>
                        <span>{item.originalLength?.toLocaleString()}자 → {item.summaryLength?.toLocaleString()}자</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px", fontSize: "11px", color: "var(--text-tertiary)" }}>
                        <Calendar style={{ width: "11px", height: "11px" }} />
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                      style={{ padding: "4px", color: "var(--text-tertiary)" }}
                    >
                      <Trash2 style={{ width: "14px", height: "14px" }} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "center", gap: "8px" }}>
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                이전
              </Button>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>
                {page} / {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                다음
              </Button>
            </div>
          )}
        </div>

        {/* Detail View */}
        <div style={{ 
          background: "var(--bg-primary)", 
          borderRadius: "12px", 
          border: "1px solid var(--border-color)",
          overflow: "hidden"
        }}>
          {selectedItem ? (
            <div>
              {/* Detail Header */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "12px" }}>
                <FileType style={{ width: "20px", height: "20px", color: "#8b5cf6" }} />
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>{selectedItem.fileName}</h2>
                  <p style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                    {selectedItem.modelUsed && `모델: ${selectedItem.modelUsed} | `}
                    {selectedItem.parsingMethod && `파싱: ${selectedItem.parsingMethod}`}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div style={{ padding: "12px 20px", background: "var(--bg-secondary)", display: "flex", gap: "24px", fontSize: "12px", color: "var(--text-tertiary)" }}>
                <span>📖 원문: {selectedItem.originalLength?.toLocaleString()}자</span>
                <span>📝 요약: {selectedItem.summaryLength?.toLocaleString()}자</span>
                <span>📉 압축률: {Math.round((1 - selectedItem.summaryLength / selectedItem.originalLength) * 100)}%</span>
              </div>

              {/* Summary Content */}
              <div style={{ padding: "20px", maxHeight: "calc(100vh - 400px)", overflowY: "auto" }}>
                <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>요약</h3>
                <div style={{ 
                  padding: "16px", 
                  background: "var(--bg-secondary)", 
                  borderRadius: "10px",
                  fontSize: "14px",
                  lineHeight: 1.8,
                  color: "var(--text-primary)"
                }} className="markdown-content">
                  <ReactMarkdown>{selectedItem.summary}</ReactMarkdown>
                </div>

                {selectedItem.keyPoints?.length > 0 && (
                  <div style={{ marginTop: "20px" }}>
                    <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>핵심 포인트</h3>
                    <ul style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {selectedItem.keyPoints.map((point, i) => (
                        <li key={i} style={{ padding: "10px 12px", background: "var(--bg-secondary)", borderRadius: "8px", fontSize: "13px", color: "var(--text-primary)" }}>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedItem.keywords?.length > 0 && (
                  <div style={{ marginTop: "20px" }}>
                    <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>키워드</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {selectedItem.keywords.map((kw, i) => (
                        <span key={i} style={{ padding: "4px 12px", background: "rgba(139, 92, 246, 0.1)", borderRadius: "12px", fontSize: "12px", color: "#8b5cf6" }}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: "80px 40px", textAlign: "center", color: "var(--text-tertiary)" }}>
              <FileText style={{ width: "48px", height: "48px", margin: "0 auto 16px", opacity: 0.5 }} />
              <p>왼쪽 목록에서 요약 이력을 선택하세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
