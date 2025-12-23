"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  FileText, 
  Layers, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  CheckCircle, 
  Zap, 
  BarChart3,
  ArrowLeft,
  Search,
  Filter,
  Link2,
  ExternalLink,
  ThumbsUp,
  Ban,
  TrendingUp,
  Clock,
  Hash,
  Activity,
  ChevronRight,
  LayoutGrid,
  List,
} from "lucide-react";
import Link from "next/link";

// ============ Types ============
interface ChunkData {
  id: string;
  content: string;
  chunkIndex: number;
  startOffset?: number;
  endOffset?: number;
  keywords: string[];
  sourceId: string;
  createdAt: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  source: {
    id: string;
    title: string;
    type: string;
    notebookId: string;
  };
  usageCount?: number;
}

interface SourceDocument {
  id: string;
  title: string;
  type: string;
  chunkCount: number;
  avgQuality: number;
}

interface QualityStats {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
}

interface ChunkUsage {
  traceId: string;
  query: string;
  rank: number;
  similarity: number;
  isUsedInAnswer: boolean;
  createdAt: string;
}

// ============ Color Palette ============
const QUALITY_COLORS = {
  excellent: { bg: "rgba(34, 197, 94, 0.2)", border: "#22c55e", text: "#166534" },
  good: { bg: "rgba(59, 130, 246, 0.2)", border: "#3b82f6", text: "#1e40af" },
  fair: { bg: "rgba(245, 158, 11, 0.2)", border: "#f59e0b", text: "#92400e" },
  poor: { bg: "rgba(239, 68, 68, 0.2)", border: "#ef4444", text: "#991b1b" },
};

const getQualityLevel = (score: number) => {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "fair";
  return "poor";
};

const getQualityColor = (score: number) => QUALITY_COLORS[getQualityLevel(score)];

// ============ Main Component ============
export default function IntegratedChunkVisualizationPage() {
  // Data State
  const [chunks, setChunks] = useState<ChunkData[]>([]);
  const [sources, setSources] = useState<SourceDocument[]>([]);
  const [qualityStats, setQualityStats] = useState<QualityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Selection State
  const [selectedChunk, setSelectedChunk] = useState<ChunkData | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [chunkUsage, setChunkUsage] = useState<ChunkUsage[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [qualityFilter, setQualityFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"timeline" | "grid">("timeline");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch chunks
  const fetchChunks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSource) params.set("sourceId", selectedSource);
      params.set("includeUsage", "true");
      params.set("limit", "200");

      const res = await fetch(`/api/chunks?${params}`);
      if (res.ok) {
        const data = await res.json();
        setChunks(data.chunks || []);
        setQualityStats(data.qualityStats);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch chunks:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedSource]);

  // Fetch sources for tree
  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch("/api/knowledge-sources");
      if (res.ok) {
        const data = await res.json();
        // Group and calculate stats
        const sourceList = (data.sources || []).map((s: any) => ({
          id: s.id,
          title: s.title,
          type: s.type,
          chunkCount: s._count?.chunks || 0,
          avgQuality: 70, // Would calculate from chunks
        }));
        setSources(sourceList);
      }
    } catch (error) {
      console.error("Failed to fetch sources:", error);
    }
  }, []);

  // Fetch chunk usage
  const fetchChunkUsage = useCallback(async (chunkId: string) => {
    setUsageLoading(true);
    try {
      const res = await fetch(`/api/chunks/${chunkId}/usage`);
      if (res.ok) {
        const data = await res.json();
        setChunkUsage(data.usage || []);
      }
    } catch (error) {
      console.error("Failed to fetch usage:", error);
    } finally {
      setUsageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChunks();
    fetchSources();
  }, [fetchChunks, fetchSources]);

  useEffect(() => {
    if (selectedChunk) {
      fetchChunkUsage(selectedChunk.id);
    }
  }, [selectedChunk, fetchChunkUsage]);

  // Filter chunks
  const filteredChunks = chunks.filter(chunk => {
    // Search filter
    if (searchQuery && !chunk.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Quality filter
    if (qualityFilter !== "all") {
      const score = (chunk.metadata?.qualityScore as number) || 70;
      const level = getQualityLevel(score);
      if (level !== qualityFilter) return false;
    }
    return true;
  });

  // Actions
  const handleApprove = async (chunkId: string) => {
    try {
      await fetch("/api/chunks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          chunkIds: [chunkId],
          options: { userId: "admin" },
        }),
      });
      fetchChunks();
    } catch (error) {
      console.error("Failed to approve:", error);
    }
  };

  const handleExclude = async (chunkId: string) => {
    try {
      await fetch("/api/chunks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "exclude",
          chunkIds: [chunkId],
          options: { reason: "Manual exclusion" },
        }),
      });
      fetchChunks();
    } catch (error) {
      console.error("Failed to exclude:", error);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        padding: "16px 24px",
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--bg-secondary)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/dashboard/admin/notebooks">
            <button style={{ padding: "8px", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "6px", cursor: "pointer" }}>
              <ArrowLeft style={{ width: 16, height: 16 }} />
            </button>
          </Link>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px" }}>
              <Layers style={{ width: 20, height: 20, color: "var(--color-primary)" }} />
              청킹 통합 시각화
            </h1>
            <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "2px" }}>
              문서 → 청킹 → 검색 → 답변 연계
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Quick Stats */}
          {qualityStats && (
            <div style={{ display: "flex", gap: "8px", marginRight: "12px" }}>
              <div style={{ padding: "4px 10px", background: QUALITY_COLORS.excellent.bg, borderRadius: "4px", fontSize: "11px", fontWeight: 600, color: QUALITY_COLORS.excellent.text }}>
                우수 {qualityStats.excellent}
              </div>
              <div style={{ padding: "4px 10px", background: QUALITY_COLORS.good.bg, borderRadius: "4px", fontSize: "11px", fontWeight: 600, color: QUALITY_COLORS.good.text }}>
                양호 {qualityStats.good}
              </div>
              <div style={{ padding: "4px 10px", background: QUALITY_COLORS.fair.bg, borderRadius: "4px", fontSize: "11px", fontWeight: 600, color: QUALITY_COLORS.fair.text }}>
                보통 {qualityStats.fair}
              </div>
              <div style={{ padding: "4px 10px", background: QUALITY_COLORS.poor.bg, borderRadius: "4px", fontSize: "11px", fontWeight: 600, color: QUALITY_COLORS.poor.text }}>
                미흡 {qualityStats.poor}
              </div>
            </div>
          )}

          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: "8px 12px",
              background: showFilters ? "var(--color-primary)" : "var(--bg-primary)",
              color: showFilters ? "white" : "var(--text-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
            }}
          >
            <Filter style={{ width: 14, height: 14 }} />
            필터
          </button>

          <div style={{ display: "flex", border: "1px solid var(--border-color)", borderRadius: "6px", overflow: "hidden" }}>
            <button
              onClick={() => setViewMode("timeline")}
              style={{
                padding: "8px 12px",
                background: viewMode === "timeline" ? "var(--color-primary)" : "var(--bg-primary)",
                color: viewMode === "timeline" ? "white" : "var(--text-secondary)",
                border: "none",
                cursor: "pointer",
              }}
            >
              <List style={{ width: 14, height: 14 }} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              style={{
                padding: "8px 12px",
                background: viewMode === "grid" ? "var(--color-primary)" : "var(--bg-primary)",
                color: viewMode === "grid" ? "white" : "var(--text-secondary)",
                border: "none",
                cursor: "pointer",
              }}
            >
              <LayoutGrid style={{ width: 14, height: 14 }} />
            </button>
          </div>

          <button
            onClick={fetchChunks}
            style={{
              padding: "8px 12px",
              background: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
            }}
          >
            <RefreshCw style={{ width: 14, height: 14 }} />
            새로고침
          </button>

          <Link href="/dashboard/admin/notebooks/rag-trace">
            <button style={{
              padding: "8px 12px",
              background: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
            }}>
              <Link2 style={{ width: 14, height: 14 }} />
              RAG 추적
            </button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div style={{
          padding: "12px 24px",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          background: "var(--bg-secondary)",
        }}>
          <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
            <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--text-tertiary)" }} />
            <input
              type="text"
              placeholder="청크 내용 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 36px",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                background: "var(--bg-primary)",
                fontSize: "13px",
              }}
            />
          </div>

          <select
            value={qualityFilter}
            onChange={(e) => setQualityFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              background: "var(--bg-primary)",
              fontSize: "13px",
            }}
          >
            <option value="all">모든 품질</option>
            <option value="excellent">우수 (80+)</option>
            <option value="good">양호 (60-79)</option>
            <option value="fair">보통 (40-59)</option>
            <option value="poor">미흡 (&lt;40)</option>
          </select>

          <div style={{ color: "var(--text-tertiary)", fontSize: "13px" }}>
            {filteredChunks.length} / {total} 청크
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left Sidebar - Document Tree */}
        <div style={{
          width: "240px",
          borderRight: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-secondary)",
        }}>
          <div style={{ padding: "12px", borderBottom: "1px solid var(--border-color)", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>
            문서 구조
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "8px" }}>
            <div
              onClick={() => setSelectedSource(null)}
              style={{
                padding: "10px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                background: !selectedSource ? "rgba(37, 99, 235, 0.1)" : "transparent",
                marginBottom: "4px",
                fontSize: "13px",
                fontWeight: !selectedSource ? 600 : 400,
                color: !selectedSource ? "var(--color-primary)" : "var(--text-primary)",
              }}
            >
              <FileText style={{ width: 14, height: 14, display: "inline", marginRight: "8px" }} />
              전체 문서
            </div>
            {sources.map(source => (
              <div
                key={source.id}
                onClick={() => setSelectedSource(source.id)}
                style={{
                  padding: "10px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: selectedSource === source.id ? "rgba(37, 99, 235, 0.1)" : "transparent",
                  marginBottom: "4px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{
                    fontSize: "13px",
                    fontWeight: selectedSource === source.id ? 600 : 400,
                    color: selectedSource === source.id ? "var(--color-primary)" : "var(--text-primary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "160px",
                  }}>
                    {source.title}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                    {source.chunkCount}
                  </span>
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-tertiary)", marginTop: "4px" }}>
                  {source.type}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center - Chunk List */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {loading ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <RefreshCw style={{ width: 24, height: 24, color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
            </div>
          ) : viewMode === "timeline" ? (
            <div style={{ flex: 1, overflow: "auto", padding: "16px" }}>
              {filteredChunks.map((chunk, index) => {
                const score = (chunk.metadata?.qualityScore as number) || 70;
                const color = getQualityColor(score);
                const isSelected = selectedChunk?.id === chunk.id;

                return (
                  <div
                    key={chunk.id}
                    onClick={() => setSelectedChunk(chunk)}
                    style={{
                      display: "flex",
                      marginBottom: "12px",
                      cursor: "pointer",
                    }}
                  >
                    {/* Timeline */}
                    <div style={{ width: "60px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: color.bg,
                        border: `2px solid ${color.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: color.text,
                      }}>
                        {index + 1}
                      </div>
                      {index < filteredChunks.length - 1 && (
                        <div style={{ flex: 1, width: "2px", background: "var(--border-color)", minHeight: "40px" }} />
                      )}
                    </div>

                    {/* Chunk Card */}
                    <div style={{
                      flex: 1,
                      padding: "14px",
                      background: isSelected ? color.bg : "var(--bg-secondary)",
                      border: `1px solid ${isSelected ? color.border : "var(--border-color)"}`,
                      borderRadius: "8px",
                      transition: "all 0.2s",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            background: color.bg,
                            color: color.text,
                            fontWeight: 600,
                          }}>
                            {score}점
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                            ~{Math.ceil(chunk.content.length / 4)} tokens
                          </span>
                          {chunk.usageCount && chunk.usageCount > 0 && (
                            <span style={{ fontSize: "11px", color: "#22c55e", display: "flex", alignItems: "center", gap: "4px" }}>
                              <Activity style={{ width: 12, height: 12 }} />
                              {chunk.usageCount}회 사용
                            </span>
                          )}
                          {(chunk.metadata?.approved as boolean) && (
                            <CheckCircle style={{ width: 14, height: 14, color: "#22c55e" }} />
                          )}
                          {(chunk.metadata?.excluded as boolean) && (
                            <Ban style={{ width: 14, height: 14, color: "#ef4444" }} />
                          )}
                        </div>
                        <ChevronRight style={{ width: 14, height: 14, color: "var(--text-tertiary)" }} />
                      </div>
                      <p style={{
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                        lineHeight: 1.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        margin: 0,
                      }}>
                        {chunk.content}
                      </p>
                      {Array.isArray(chunk.keywords) && chunk.keywords.length > 0 && (
                        <div style={{ display: "flex", gap: "4px", marginTop: "8px", flexWrap: "wrap" }}>
                          {chunk.keywords.slice(0, 5).map((kw: string, i: number) => (
                            <span key={i} style={{
                              fontSize: "10px",
                              padding: "2px 6px",
                              background: "var(--bg-primary)",
                              borderRadius: "4px",
                              color: "var(--text-tertiary)",
                            }}>
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              flex: 1,
              overflow: "auto",
              padding: "16px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "12px",
              alignContent: "start",
            }}>
              {filteredChunks.map((chunk) => {
                const score = (chunk.metadata?.qualityScore as number) || 70;
                const color = getQualityColor(score);
                const isSelected = selectedChunk?.id === chunk.id;

                return (
                  <div
                    key={chunk.id}
                    onClick={() => setSelectedChunk(chunk)}
                    style={{
                      padding: "14px",
                      background: isSelected ? color.bg : "var(--bg-secondary)",
                      border: `1px solid ${isSelected ? color.border : "var(--border-color)"}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{
                        fontSize: "12px",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: color.bg,
                        color: color.text,
                        fontWeight: 600,
                      }}>
                        {score}점
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                        #{chunk.chunkIndex}
                      </span>
                    </div>
                    <p style={{
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      margin: 0,
                      height: "54px",
                    }}>
                      {chunk.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Panel - Chunk Detail & Usage */}
        {selectedChunk && (
          <div style={{
            width: "380px",
            borderLeft: "1px solid var(--border-color)",
            display: "flex",
            flexDirection: "column",
            background: "var(--bg-secondary)",
          }}>
            {/* Chunk Info */}
            <div style={{ padding: "16px", borderBottom: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 600 }}>청크 상세</h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleApprove(selectedChunk.id)}
                    style={{
                      padding: "6px 10px",
                      background: "rgba(34, 197, 94, 0.1)",
                      border: "1px solid #22c55e",
                      borderRadius: "4px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11px",
                      color: "#22c55e",
                    }}
                  >
                    <ThumbsUp style={{ width: 12, height: 12 }} />
                    승인
                  </button>
                  <button
                    onClick={() => handleExclude(selectedChunk.id)}
                    style={{
                      padding: "6px 10px",
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid #ef4444",
                      borderRadius: "4px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11px",
                      color: "#ef4444",
                    }}
                  >
                    <Ban style={{ width: 12, height: 12 }} />
                    제외
                  </button>
                </div>
              </div>

              <div style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.6, maxHeight: "150px", overflow: "auto", padding: "12px", background: "var(--bg-primary)", borderRadius: "6px" }}>
                {selectedChunk.content}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
                <div style={{ padding: "10px", background: "var(--bg-primary)", borderRadius: "6px" }}>
                  <div style={{ fontSize: "10px", color: "var(--text-tertiary)", marginBottom: "4px" }}>토큰 수</div>
                  <div style={{ fontSize: "16px", fontWeight: 600 }}>~{Math.ceil(selectedChunk.content.length / 4)}</div>
                </div>
                <div style={{ padding: "10px", background: "var(--bg-primary)", borderRadius: "6px" }}>
                  <div style={{ fontSize: "10px", color: "var(--text-tertiary)", marginBottom: "4px" }}>품질 점수</div>
                  <div style={{ fontSize: "16px", fontWeight: 600, color: getQualityColor((selectedChunk.metadata?.qualityScore as number) || 70).text }}>
                    {(selectedChunk.metadata?.qualityScore as number) || 70}점
                  </div>
                </div>
              </div>
            </div>

            {/* Usage History */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                  <Activity style={{ width: 14, height: 14 }} />
                  사용 이력
                </h3>
                <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                  {chunkUsage.length}회
                </span>
              </div>

              <div style={{ flex: 1, overflow: "auto", padding: "12px" }}>
                {usageLoading ? (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <RefreshCw style={{ width: 20, height: 20, color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
                  </div>
                ) : chunkUsage.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px", color: "var(--text-tertiary)", fontSize: "12px" }}>
                    아직 검색에 사용되지 않았습니다
                  </div>
                ) : (
                  chunkUsage.map((usage, i) => (
                    <Link key={i} href={`/dashboard/admin/notebooks/rag-trace?id=${usage.traceId}`}>
                      <div style={{
                        padding: "12px",
                        background: "var(--bg-primary)",
                        borderRadius: "6px",
                        marginBottom: "8px",
                        cursor: "pointer",
                        border: "1px solid var(--border-color)",
                      }}>
                        <div style={{ fontSize: "12px", color: "var(--text-primary)", marginBottom: "8px" }}>
                          "{usage.query.substring(0, 50)}..."
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "10px", color: "var(--text-tertiary)" }}>
                          <span>Rank #{usage.rank + 1}</span>
                          <span>유사도 {(usage.similarity * 100).toFixed(0)}%</span>
                          {usage.isUsedInAnswer && (
                            <span style={{ color: "#22c55e" }}>✓ 답변에 사용됨</span>
                          )}
                          <ExternalLink style={{ width: 10, height: 10 }} />
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
