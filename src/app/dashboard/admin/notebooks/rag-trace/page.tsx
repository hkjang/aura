"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Search,
  Layers,
  FileText,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle,
  Info,
  Clock,
  Link2,
  RefreshCw,
  ChevronDown,
} from "lucide-react";

// ============ Types ============
interface RAGTraceChunk {
  id: string;
  chunkId: string;
  rank: number;
  similarity: number;
  qualityScore: number | null;
  qualityGrade: string | null;
  documentName: string | null;
  documentType: string | null;
  content: string;
  tokenCount: number | null;
  isUsedInAnswer: boolean;
}

interface RAGTrace {
  id: string;
  notebookId: string;
  userId: string;
  originalQuery: string;
  processedQuery: string | null;
  answer: string;
  model: string | null;
  generationTime: number | null;
  totalChunks: number;
  usedChunks: number;
  avgSimilarity: number | null;
  createdAt: string;
  chunks: RAGTraceChunk[];
}

// ============ Quality Colors ============
const QUALITY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Excellent: { bg: "#E0F2F1", border: "#00897B", text: "#004D40" },
  Good: { bg: "#E8F5E9", border: "#43A047", text: "#1B5E20" },
  Fair: { bg: "#FFFDE7", border: "#F9A825", text: "#F57F17" },
  Poor: { bg: "#FFF3E0", border: "#F57C00", text: "#E65100" },
  Critical: { bg: "#FFEBEE", border: "#E53935", text: "#B71C1C" },
};

const getQualityGrade = (score: number): string => {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 40) return "Poor";
  return "Critical";
};

const getQualityColor = (grade: string | null, similarity?: number) => {
  if (grade && QUALITY_COLORS[grade]) {
    return QUALITY_COLORS[grade];
  }
  // Fallback based on similarity
  if (similarity !== undefined) {
    if (similarity >= 0.85) return QUALITY_COLORS.Excellent;
    if (similarity >= 0.7) return QUALITY_COLORS.Good;
    if (similarity >= 0.5) return QUALITY_COLORS.Fair;
    return QUALITY_COLORS.Poor;
  }
  return QUALITY_COLORS.Fair;
};

// ============ Main Component ============
export default function RAGTracePage() {
  const [traces, setTraces] = useState<RAGTrace[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<RAGTrace | null>(null);
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [showUnused, setShowUnused] = useState(true);
  const [qualityFilter, setQualityFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch traces from API
  const fetchTraces = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rag-traces?limit=50");
      if (!res.ok) throw new Error("Failed to fetch traces");
      const data = await res.json();
      setTraces(data.traces || []);
      if (data.traces?.length > 0 && !selectedTrace) {
        setSelectedTrace(data.traces[0]);
      }
    } catch (err) {
      console.error("Failed to fetch traces:", err);
      setError("추적 데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraces();
  }, []);

  const selectedChunk = selectedTrace?.chunks.find((c) => c.id === selectedChunkId);

  const filteredChunks = selectedTrace?.chunks.filter((c) => {
    if (!showUnused && !c.isUsedInAnswer) return false;
    if (qualityFilter !== "all") {
      const grade = c.qualityGrade || getQualityGrade(c.similarity * 100);
      if (grade !== qualityFilter) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <RefreshCw style={{ width: 32, height: 32, color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
          <p style={{ marginTop: "12px", color: "var(--text-secondary)" }}>추적 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "var(--bg-primary)", 
      color: "var(--text-primary)",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Header */}
      <div style={{ 
        padding: "16px 24px", 
        borderBottom: "1px solid var(--border-color)",
        background: "var(--bg-secondary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <a href="/dashboard/admin/notebooks/pipeline" style={{ color: "var(--text-secondary)" }}>
            <ArrowLeft style={{ width: 20, height: 20 }} />
          </a>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
              <Link2 style={{ width: 20, height: 20, color: "var(--color-primary)" }} />
              RAG 검색-청크 연결 분석
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
              {traces.length}개의 추적 기록 • 실시간 데이터
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={fetchTraces}
            style={{
              padding: "8px 12px",
              background: "var(--bg-tertiary)",
              color: "var(--text-primary)",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px"
            }}
          >
            <RefreshCw style={{ width: 14, height: 14 }} />
            새로고침
          </button>
          <button
            onClick={() => setShowUnused(!showUnused)}
            style={{
              padding: "8px 12px",
              background: showUnused ? "var(--bg-tertiary)" : "var(--color-primary)",
              color: showUnused ? "var(--text-primary)" : "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px"
            }}
          >
            {showUnused ? <Eye style={{ width: 14, height: 14 }} /> : <EyeOff style={{ width: 14, height: 14 }} />}
            미사용 {showUnused ? "숨기기" : "표시"}
          </button>
          <select
            value={qualityFilter}
            onChange={(e) => setQualityFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              color: "var(--text-primary)",
              fontSize: "12px"
            }}
          >
            <option value="all">모든 품질</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Poor">Poor</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 24px", background: "var(--color-error)", color: "white", textAlign: "center" }}>
          {error}
        </div>
      )}

      {traces.length === 0 && !loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px" }}>
          <MessageSquare style={{ width: 64, height: 64, color: "var(--text-tertiary)", opacity: 0.5 }} />
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>추적 기록 없음</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              노트북에서 질문을 하면 RAG 추적 기록이 자동으로 저장됩니다.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ 
          flex: 1, 
          display: "grid", 
          gridTemplateColumns: "280px 1fr 320px",
          gridTemplateRows: "1fr auto",
          gap: "1px",
          background: "var(--border-color)"
        }}>
          {/* Left: Trace List + Query Panel */}
          <div style={{ 
            background: "var(--bg-primary)", 
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            overflowY: "auto",
            maxHeight: "calc(100vh - 180px)"
          }}>
            {/* Trace Selector */}
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: "8px" }}>
                추적 기록 선택
              </div>
              <select
                value={selectedTrace?.id || ""}
                onChange={(e) => {
                  const trace = traces.find(t => t.id === e.target.value);
                  setSelectedTrace(trace || null);
                  setSelectedChunkId(null);
                }}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  color: "var(--text-primary)",
                  fontSize: "12px"
                }}
              >
                {traces.map((trace) => (
                  <option key={trace.id} value={trace.id}>
                    {new Date(trace.createdAt).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} - {trace.originalQuery.slice(0, 30)}...
                  </option>
                ))}
              </select>
            </div>

            {selectedTrace && (
              <>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <MessageSquare style={{ width: 14, height: 14 }} />
                  사용자 질문
                </div>
                
                <div style={{ 
                  padding: "12px", 
                  background: "var(--bg-secondary)", 
                  borderRadius: "8px",
                  borderLeft: "3px solid var(--color-primary)"
                }}>
                  <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginBottom: "6px" }}>원문</div>
                  <div style={{ fontSize: "14px", lineHeight: 1.5 }}>{selectedTrace.originalQuery}</div>
                </div>

                {selectedTrace.processedQuery && selectedTrace.processedQuery !== selectedTrace.originalQuery && (
                  <div style={{ 
                    padding: "12px", 
                    background: "var(--bg-secondary)", 
                    borderRadius: "8px" 
                  }}>
                    <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginBottom: "6px" }}>전처리 쿼리</div>
                    <div style={{ fontSize: "12px", lineHeight: 1.5, color: "var(--text-secondary)" }}>
                      {selectedTrace.processedQuery}
                    </div>
                  </div>
                )}

                {/* Search Stats */}
                <div style={{ 
                  padding: "12px", 
                  background: "var(--bg-secondary)", 
                  borderRadius: "8px" 
                }}>
                  <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginBottom: "8px" }}>검색 결과</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <div style={{ textAlign: "center", padding: "8px", background: "var(--bg-primary)", borderRadius: "6px" }}>
                      <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-primary)" }}>
                        {selectedTrace.totalChunks}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>총 청크</div>
                    </div>
                    <div style={{ textAlign: "center", padding: "8px", background: "var(--bg-primary)", borderRadius: "6px" }}>
                      <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-success)" }}>
                        {selectedTrace.usedChunks}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>사용됨</div>
                    </div>
                    <div style={{ textAlign: "center", padding: "8px", background: "var(--bg-primary)", borderRadius: "6px" }}>
                      <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
                        {selectedTrace.avgSimilarity ? (selectedTrace.avgSimilarity * 100).toFixed(0) : "-"}%
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>평균 유사도</div>
                    </div>
                    <div style={{ textAlign: "center", padding: "8px", background: "var(--bg-primary)", borderRadius: "6px" }}>
                      <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
                        {selectedTrace.generationTime || "-"}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>ms</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Center: Connection Graph */}
          <div style={{ 
            background: "var(--bg-secondary)", 
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            overflowX: "auto"
          }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
              <Link2 style={{ width: 14, height: 14 }} />
              검색-청크 연결 그래프
            </div>

            {/* Flow Visualization */}
            <div style={{ 
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "40px",
              padding: "20px"
            }}>
              {/* Query Node */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <div style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
                }}>
                  <MessageSquare style={{ width: 32, height: 32, color: "white" }} />
                </div>
                <span style={{ fontSize: "11px", fontWeight: 600 }}>질문</span>
              </div>

              <ArrowRight style={{ width: 24, height: 24, color: "var(--text-tertiary)" }} />

              {/* Search Results */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div 
                  style={{
                    padding: "12px 16px",
                    background: "var(--bg-primary)",
                    border: "2px solid #43A047",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <Search style={{ width: 16, height: 16, color: "#43A047" }} />
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 600 }}>벡터 검색</div>
                    <div style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>
                      Top-{selectedTrace?.totalChunks || 0} 결과
                    </div>
                  </div>
                </div>
              </div>

              <ArrowRight style={{ width: 24, height: 24, color: "var(--text-tertiary)" }} />

              {/* Chunks */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
                {filteredChunks?.map((chunk) => {
                  const grade = chunk.qualityGrade || getQualityGrade(chunk.similarity * 100);
                  const color = getQualityColor(grade);
                  const isSelected = selectedChunkId === chunk.id;
                  
                  return (
                    <div
                      key={chunk.id}
                      onClick={() => setSelectedChunkId(chunk.id)}
                      style={{
                        padding: "10px 14px",
                        background: color.bg,
                        border: `2px solid ${isSelected ? color.border : "transparent"}`,
                        borderRadius: "8px",
                        cursor: "pointer",
                        opacity: chunk.isUsedInAnswer ? 1 : 0.6,
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        transition: "all 0.15s",
                        boxShadow: chunk.isUsedInAnswer ? `0 2px 8px ${color.border}40` : "none"
                      }}
                    >
                      <Layers style={{ width: 16, height: 16, color: color.text }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "11px", fontWeight: 600, color: color.text }}>
                          #{chunk.rank}
                          {chunk.isUsedInAnswer && (
                            <CheckCircle style={{ width: 12, height: 12, marginLeft: "4px", verticalAlign: "middle" }} />
                          )}
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>
                          {(chunk.similarity * 100).toFixed(0)}% • {grade}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(!filteredChunks || filteredChunks.length === 0) && (
                  <div style={{ padding: "20px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "12px" }}>
                    청크가 없습니다
                  </div>
                )}
              </div>

              <ArrowRight style={{ width: 24, height: 24, color: "var(--text-tertiary)" }} />

              {/* Answer Node */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <div style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #F97316, #EA580C)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(249, 115, 22, 0.3)"
                }}>
                  <FileText style={{ width: 32, height: 32, color: "white" }} />
                </div>
                <span style={{ fontSize: "11px", fontWeight: 600 }}>답변</span>
              </div>
            </div>

            {/* Legend */}
            <div style={{ 
              display: "flex", 
              gap: "16px", 
              justifyContent: "center",
              padding: "12px",
              background: "var(--bg-primary)",
              borderRadius: "8px"
            }}>
              {Object.entries(QUALITY_COLORS).map(([grade, colors]) => (
                <div key={grade} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ 
                    width: "12px", 
                    height: "12px", 
                    borderRadius: "3px", 
                    background: colors.bg,
                    border: `1px solid ${colors.border}`
                  }} />
                  <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>{grade}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Chunk Detail Panel */}
          <div style={{ 
            background: "var(--bg-primary)", 
            padding: "16px",
            overflowY: "auto"
          }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Info style={{ width: 14, height: 14 }} />
              청크 상세
            </div>

            {selectedChunk ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Quality Badge */}
                <div style={{ 
                  padding: "8px 12px", 
                  background: getQualityColor(selectedChunk.qualityGrade, selectedChunk.similarity).bg,
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <span style={{ 
                    fontSize: "12px", 
                    fontWeight: 600, 
                    color: getQualityColor(selectedChunk.qualityGrade, selectedChunk.similarity).text 
                  }}>
                    {selectedChunk.qualityGrade || getQualityGrade(selectedChunk.similarity * 100)}
                  </span>
                  <span style={{ fontSize: "18px", fontWeight: 700, color: getQualityColor(selectedChunk.qualityGrade, selectedChunk.similarity).text }}>
                    {(selectedChunk.similarity * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Usage Status */}
                <div style={{ 
                  padding: "8px 12px", 
                  background: selectedChunk.isUsedInAnswer ? "rgba(34, 197, 94, 0.1)" : "var(--bg-secondary)",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  {selectedChunk.isUsedInAnswer ? (
                    <>
                      <CheckCircle style={{ width: 16, height: 16, color: "var(--color-success)" }} />
                      <span style={{ fontSize: "12px", color: "var(--color-success)" }}>답변 생성에 사용됨</span>
                    </>
                  ) : (
                    <>
                      <EyeOff style={{ width: 16, height: 16, color: "var(--text-tertiary)" }} />
                      <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>답변에 미사용</span>
                    </>
                  )}
                </div>

                {/* Meta Info */}
                <div style={{ padding: "12px", background: "var(--bg-secondary)", borderRadius: "8px" }}>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>문서</span>
                      <span style={{ fontSize: "11px", fontWeight: 600 }}>{selectedChunk.documentName || "Unknown"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>유형</span>
                      <span style={{ fontSize: "11px" }}>{selectedChunk.documentType || "-"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>순위</span>
                      <span style={{ fontSize: "11px" }}>#{selectedChunk.rank}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>토큰 수</span>
                      <span style={{ fontSize: "11px" }}>{selectedChunk.tokenCount || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: "12px", background: "var(--bg-secondary)", borderRadius: "8px" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginBottom: "8px" }}>원문 내용</div>
                  <div style={{ 
                    fontSize: "12px", 
                    lineHeight: 1.6, 
                    color: "var(--text-secondary)",
                    whiteSpace: "pre-wrap",
                    maxHeight: "200px",
                    overflowY: "auto"
                  }}>
                    {selectedChunk.content}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ 
                textAlign: "center", 
                padding: "40px 20px", 
                color: "var(--text-tertiary)" 
              }}>
                <Layers style={{ width: 40, height: 40, margin: "0 auto 12px", opacity: 0.5 }} />
                <div style={{ fontSize: "13px" }}>청크를 선택하면<br />상세 정보가 표시됩니다</div>
              </div>
            )}
          </div>

          {/* Bottom: Answer Panel */}
          {selectedTrace && (
            <div style={{ 
              gridColumn: "1 / -1",
              background: "var(--bg-primary)", 
              padding: "16px 24px",
              borderTop: "1px solid var(--border-color)"
            }}>
              <div style={{ 
                fontSize: "12px", 
                fontWeight: 600, 
                color: "var(--text-secondary)", 
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <FileText style={{ width: 14, height: 14 }} />
                  LLM 최종 답변
                  <span style={{ 
                    fontSize: "10px", 
                    color: "var(--text-tertiary)",
                    background: "var(--bg-secondary)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    marginLeft: "8px"
                  }}>
                    {selectedTrace.model || "Unknown"} • {selectedTrace.generationTime || "-"}ms
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {selectedTrace.chunks.filter(c => c.isUsedInAnswer).map(chunk => (
                    <span 
                      key={chunk.id}
                      onClick={() => setSelectedChunkId(chunk.id)}
                      style={{ 
                        fontSize: "10px", 
                        padding: "2px 8px", 
                        background: getQualityColor(chunk.qualityGrade, chunk.similarity).bg,
                        color: getQualityColor(chunk.qualityGrade, chunk.similarity).text,
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      인용: #{chunk.rank}
                    </span>
                  ))}
                </div>
              </div>
              
              <div style={{ 
                padding: "16px", 
                background: "var(--bg-secondary)", 
                borderRadius: "8px",
                borderLeft: "3px solid var(--color-warning)",
                fontSize: "13px",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
                maxHeight: "200px",
                overflowY: "auto"
              }}>
                {selectedTrace.answer}
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
