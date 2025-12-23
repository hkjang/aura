"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  FileText, 
  Layers, 
  Settings, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  EyeOff, 
  Pin, 
  Trash2, 
  Merge, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap, 
  BarChart3,
  ArrowLeft,
  SlidersHorizontal
} from "lucide-react";

// ============ Types ============
interface ChunkData {
  id: string;
  content: string;
  index: number;
  tokenCount: number;
  strategy: string;
  documentType: string;
  startOffset: number;
  endOffset: number;
  metadata: Record<string, unknown>;
  quality?: {
    semanticScore: number;
    overlapRate: number;
    hasError: boolean;
    errorMessage?: string;
  };
  isPinned?: boolean;
  isExcluded?: boolean;
}

interface SourceDocument {
  id: string;
  name: string;
  type: string;
  content: string;
  size: number;
  mimeType?: string;
}

interface DSLSettings {
  documentType: string;
  minTokens: number;
  maxTokens: number;
  overlapTokens: number;
  similarityThreshold: number;
  primaryStrategy: string;
  secondaryStrategy: string;
  preserveElements: string[];
}

// ============ Color Palette for Chunks ============
const CHUNK_COLORS = [
  { bg: "rgba(59, 130, 246, 0.15)", border: "#3B82F6", text: "#1E40AF" },
  { bg: "rgba(34, 197, 94, 0.15)", border: "#22C55E", text: "#166534" },
  { bg: "rgba(168, 85, 247, 0.15)", border: "#A855F7", text: "#6B21A8" },
  { bg: "rgba(249, 115, 22, 0.15)", border: "#F97316", text: "#C2410C" },
  { bg: "rgba(236, 72, 153, 0.15)", border: "#EC4899", text: "#BE185D" },
  { bg: "rgba(20, 184, 166, 0.15)", border: "#14B8A6", text: "#115E59" },
  { bg: "rgba(234, 179, 8, 0.15)", border: "#EAB308", text: "#854D0E" },
  { bg: "rgba(99, 102, 241, 0.15)", border: "#6366F1", text: "#4338CA" },
];

const getChunkColor = (index: number) => CHUNK_COLORS[index % CHUNK_COLORS.length];

// ============ Main Page Component ============
export default function ChunkVisualizationPage() {
  // State
  const [sourceDoc, setSourceDoc] = useState<SourceDocument | null>(null);
  const [chunks, setChunks] = useState<ChunkData[]>([]);
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(true);
  const [dslSettings, setDslSettings] = useState<DSLSettings>({
    documentType: "GENERAL",
    minTokens: 100,
    maxTokens: 500,
    overlapTokens: 50,
    similarityThreshold: 0.75,
    primaryStrategy: "SEMANTIC_PARAGRAPH",
    secondaryStrategy: "SENTENCE_BASED",
    preserveElements: [],
  });

  const sourceRef = useRef<HTMLDivElement>(null);
  const chunksRef = useRef<HTMLDivElement>(null);

  // Load sample document for demo
  useEffect(() => {
    // Demo: Load a sample document
    const sampleDoc: SourceDocument = {
      id: "demo-1",
      name: "sample-policy.pdf",
      type: "POLICY",
      size: 15420,
      content: `제1조 (목적)
이 규정은 회사의 정보보안 정책을 정의하고, 임직원이 준수해야 할 보안 지침을 명시함을 목적으로 한다.

제2조 (적용범위)
이 규정은 모든 임직원, 계약직, 협력업체 직원에게 적용된다. 
단, 별도의 보안 협약을 체결한 경우 해당 협약을 우선 적용한다.

제3조 (정의)
1. "정보자산"이란 회사가 보유한 모든 형태의 정보 및 이를 처리하는 시스템을 말한다.
2. "개인정보"란 살아있는 개인에 관한 정보로서 성명, 주민등록번호 등을 통해 개인을 식별할 수 있는 정보를 말한다.
3. "보안사고"란 정보자산의 기밀성, 무결성, 가용성을 침해하는 모든 행위를 말한다.

제4조 (책임과 역할)
1. 정보보안최고책임자(CISO)는 회사 전체의 정보보안 정책을 총괄한다.
2. 각 부서장은 소속 부서의 정보보안 이행을 책임진다.
3. 모든 임직원은 본 규정을 숙지하고 준수할 의무가 있다.

제5조 (비밀번호 관리)
1. 비밀번호는 8자 이상으로 영문, 숫자, 특수문자를 혼합하여 설정한다.
2. 비밀번호는 90일마다 변경하며, 이전 5회 사용한 비밀번호는 재사용할 수 없다.
3. 비밀번호를 타인에게 공유하거나 메모하여 노출시키는 행위를 금지한다.

제6조 (데이터 분류)
1. 극비(Top Secret): 유출 시 회사 존립에 영향을 미치는 정보
2. 비밀(Secret): 유출 시 심각한 손해가 발생할 수 있는 정보
3. 대외비(Confidential): 내부용으로만 사용하는 정보
4. 공개(Public): 외부 공개가 가능한 정보`,
    };

    setSourceDoc(sampleDoc);
    
    // Generate demo chunks
    const demoChunks: ChunkData[] = [
      {
        id: "chunk-1",
        content: "제1조 (목적)\n이 규정은 회사의 정보보안 정책을 정의하고, 임직원이 준수해야 할 보안 지침을 명시함을 목적으로 한다.",
        index: 0,
        tokenCount: 45,
        strategy: "ARTICLE_BASED",
        documentType: "POLICY",
        startOffset: 0,
        endOffset: 85,
        metadata: { articleId: "제1조", position: 0 },
        quality: { semanticScore: 0.92, overlapRate: 0, hasError: false },
      },
      {
        id: "chunk-2",
        content: "제2조 (적용범위)\n이 규정은 모든 임직원, 계약직, 협력업체 직원에게 적용된다.\n단, 별도의 보안 협약을 체결한 경우 해당 협약을 우선 적용한다.",
        index: 1,
        tokenCount: 62,
        strategy: "ARTICLE_BASED",
        documentType: "POLICY",
        startOffset: 87,
        endOffset: 195,
        metadata: { articleId: "제2조", position: 1 },
        quality: { semanticScore: 0.88, overlapRate: 0.05, hasError: false },
      },
      {
        id: "chunk-3",
        content: "제3조 (정의)\n1. \"정보자산\"이란 회사가 보유한 모든 형태의 정보 및 이를 처리하는 시스템을 말한다.\n2. \"개인정보\"란...\n3. \"보안사고\"란...",
        index: 2,
        tokenCount: 95,
        strategy: "ARTICLE_BASED",
        documentType: "POLICY",
        startOffset: 197,
        endOffset: 420,
        metadata: { articleId: "제3조", position: 2 },
        quality: { semanticScore: 0.95, overlapRate: 0.03, hasError: false },
      },
      {
        id: "chunk-4",
        content: "제4조 (책임과 역할)\n1. 정보보안최고책임자(CISO)는 회사 전체의 정보보안 정책을 총괄한다.\n2. 각 부서장은...\n3. 모든 임직원은...",
        index: 3,
        tokenCount: 78,
        strategy: "ARTICLE_BASED",
        documentType: "POLICY",
        startOffset: 422,
        endOffset: 580,
        metadata: { articleId: "제4조", position: 3 },
        quality: { semanticScore: 0.91, overlapRate: 0.02, hasError: false },
      },
      {
        id: "chunk-5",
        content: "제5조 (비밀번호 관리)\n1. 비밀번호는 8자 이상으로 영문, 숫자, 특수문자를 혼합하여 설정한다.\n2. 비밀번호는 90일마다 변경...\n3. 비밀번호를 타인에게...",
        index: 4,
        tokenCount: 102,
        strategy: "ARTICLE_BASED",
        documentType: "POLICY",
        startOffset: 582,
        endOffset: 780,
        metadata: { articleId: "제5조", position: 4 },
        quality: { semanticScore: 0.89, overlapRate: 0.04, hasError: false },
      },
      {
        id: "chunk-6",
        content: "제6조 (데이터 분류)\n1. 극비(Top Secret): 유출 시 회사 존립에 영향을 미치는 정보\n2. 비밀(Secret): ...\n3. 대외비(Confidential): ...\n4. 공개(Public): ...",
        index: 5,
        tokenCount: 88,
        strategy: "ARTICLE_BASED",
        documentType: "POLICY",
        startOffset: 782,
        endOffset: 1050,
        metadata: { articleId: "제6조", position: 5 },
        quality: { semanticScore: 0.94, overlapRate: 0, hasError: false },
      },
    ];

    setChunks(demoChunks);
    setDslSettings(prev => ({ ...prev, documentType: "POLICY", primaryStrategy: "ARTICLE_BASED" }));
  }, []);

  // Handle re-chunking
  const handleReChunk = useCallback(async () => {
    if (!sourceDoc) return;
    
    setIsProcessing(true);
    const startTime = Date.now();

    try {
      // Simulate API call to DSL engine
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In production, this would call the ChunkingDSLEngine
      // const result = await fetch('/api/chunks/process', { ... });
      
      setProcessingTime(Date.now() - startTime);
    } catch (error) {
      console.error("Re-chunking failed:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [sourceDoc]);

  // Scroll sync
  const handleChunkSelect = (chunkId: string) => {
    setSelectedChunkId(chunkId);
    const chunk = chunks.find(c => c.id === chunkId);
    if (chunk && sourceRef.current) {
      // Scroll source panel to chunk position
      const lineHeight = 24;
      const lineNumber = Math.floor(chunk.startOffset / 50);
      sourceRef.current.scrollTop = lineNumber * lineHeight;
    }
  };

  // Chunk actions
  const handlePinChunk = (chunkId: string) => {
    setChunks(prev => prev.map(c => 
      c.id === chunkId ? { ...c, isPinned: !c.isPinned } : c
    ));
  };

  const handleExcludeChunk = (chunkId: string) => {
    setChunks(prev => prev.map(c => 
      c.id === chunkId ? { ...c, isExcluded: !c.isExcluded } : c
    ));
  };

  // Calculate quality stats
  const qualityStats = {
    avgTokens: Math.round(chunks.reduce((sum, c) => sum + c.tokenCount, 0) / (chunks.length || 1)),
    avgSemanticScore: (chunks.reduce((sum, c) => sum + (c.quality?.semanticScore || 0), 0) / (chunks.length || 1)).toFixed(2),
    errorCount: chunks.filter(c => c.quality?.hasError).length,
    totalChunks: chunks.length,
  };

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
              <Layers style={{ width: 20, height: 20, color: "var(--color-primary)" }} />
              청킹 시각화
            </h1>
            {sourceDoc && (
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
                {sourceDoc.name} • {(sourceDoc.size / 1024).toFixed(1)} KB • {sourceDoc.type}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: "8px 12px",
              background: showSettings ? "var(--color-primary)" : "var(--bg-tertiary)",
              color: showSettings ? "white" : "var(--text-primary)",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px"
            }}
          >
            <SlidersHorizontal style={{ width: 16, height: 16 }} />
            설정
          </button>
          <button
            onClick={handleReChunk}
            disabled={isProcessing}
            style={{
              padding: "8px 16px",
              background: "var(--color-primary)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: isProcessing ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              opacity: isProcessing ? 0.7 : 1
            }}
          >
            <RefreshCw style={{ width: 16, height: 16, animation: isProcessing ? "spin 1s linear infinite" : "none" }} />
            {isProcessing ? "처리 중..." : "재청킹"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        display: "grid", 
        gridTemplateColumns: showSettings ? "1fr 350px 300px" : "1fr 350px",
        gap: "1px",
        background: "var(--border-color)"
      }}>
        {/* Left: Source Panel */}
        <div 
          ref={sourceRef}
          style={{ 
            background: "var(--bg-primary)", 
            padding: "16px",
            overflowY: "auto",
            maxHeight: "calc(100vh - 140px)"
          }}
        >
          <div style={{ 
            fontSize: "12px", 
            fontWeight: 600, 
            color: "var(--text-secondary)", 
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}>
            <FileText style={{ width: 14, height: 14 }} />
            원문
          </div>
          
          <div style={{ fontFamily: "monospace", fontSize: "13px", lineHeight: "1.8" }}>
            {sourceDoc?.content.split("\n").map((line, idx) => {
              // Find if this line is part of selected chunk
              const charOffset = sourceDoc.content.split("\n").slice(0, idx).join("\n").length + idx;
              const selectedChunk = chunks.find(c => c.id === selectedChunkId);
              const isHighlighted = selectedChunk && 
                charOffset >= selectedChunk.startOffset && 
                charOffset < selectedChunk.endOffset;
              
              const chunkForLine = chunks.find(c => 
                charOffset >= c.startOffset && charOffset < c.endOffset
              );
              const chunkColor = chunkForLine ? getChunkColor(chunkForLine.index) : null;
              
              return (
                <div 
                  key={idx}
                  style={{ 
                    display: "flex",
                    background: isHighlighted ? chunkColor?.bg : "transparent",
                    borderLeft: isHighlighted ? `3px solid ${chunkColor?.border}` : "3px solid transparent",
                    paddingLeft: "8px",
                    marginLeft: "-11px",
                    transition: "all 0.2s"
                  }}
                >
                  <span style={{ 
                    width: "40px", 
                    color: "var(--text-tertiary)", 
                    fontSize: "11px",
                    userSelect: "none"
                  }}>
                    {idx + 1}
                  </span>
                  <span style={{ flex: 1 }}>{line || " "}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Chunks Panel */}
        <div 
          ref={chunksRef}
          style={{ 
            background: "var(--bg-secondary)", 
            padding: "16px",
            overflowY: "auto",
            maxHeight: "calc(100vh - 140px)"
          }}
        >
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
              <Layers style={{ width: 14, height: 14 }} />
              청크 목록 ({chunks.length})
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
              평균 {qualityStats.avgTokens} 토큰
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {chunks.map((chunk, idx) => {
              const color = getChunkColor(idx);
              const isSelected = selectedChunkId === chunk.id;
              
              return (
                <div
                  key={chunk.id}
                  onClick={() => handleChunkSelect(chunk.id)}
                  style={{
                    padding: "12px",
                    background: isSelected ? color.bg : "var(--bg-primary)",
                    border: `1px solid ${isSelected ? color.border : "var(--border-color)"}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    opacity: chunk.isExcluded ? 0.5 : 1,
                    transition: "all 0.15s"
                  }}
                >
                  {/* Header */}
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    marginBottom: "8px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ 
                        fontSize: "11px", 
                        fontWeight: 600,
                        color: color.text,
                        background: color.bg,
                        padding: "2px 6px",
                        borderRadius: "4px"
                      }}>
                        #{chunk.index + 1}
                      </span>
                      <span style={{ 
                        fontSize: "10px", 
                        color: "var(--text-secondary)",
                        background: "var(--bg-tertiary)",
                        padding: "2px 6px",
                        borderRadius: "4px"
                      }}>
                        {chunk.strategy}
                      </span>
                      {chunk.isPinned && <Pin style={{ width: 12, height: 12, color: "var(--color-warning)" }} />}
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                      {chunk.tokenCount} 토큰
                    </span>
                  </div>

                  {/* Content Preview */}
                  <div style={{ 
                    fontSize: "12px", 
                    color: "var(--text-secondary)",
                    lineHeight: "1.5",
                    maxHeight: "60px",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                    {chunk.content.slice(0, 150)}...
                  </div>

                  {/* Quality Metrics */}
                  <div style={{ 
                    display: "flex", 
                    gap: "8px", 
                    marginTop: "8px",
                    alignItems: "center"
                  }}>
                    {/* Semantic Score */}
                    <div style={{ 
                      flex: 1,
                      height: "4px",
                      background: "var(--bg-tertiary)",
                      borderRadius: "2px",
                      overflow: "hidden"
                    }}>
                      <div style={{
                        height: "100%",
                        width: `${(chunk.quality?.semanticScore || 0) * 100}%`,
                        background: "var(--color-success)",
                        borderRadius: "2px"
                      }} />
                    </div>
                    <span style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>
                      {((chunk.quality?.semanticScore || 0) * 100).toFixed(0)}%
                    </span>
                    
                    {/* Error indicator */}
                    {chunk.quality?.hasError && (
                      <AlertTriangle style={{ width: 14, height: 14, color: "var(--color-error)" }} />
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ 
                    display: "flex", 
                    gap: "4px", 
                    marginTop: "8px",
                    paddingTop: "8px",
                    borderTop: "1px solid var(--border-color)"
                  }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePinChunk(chunk.id); }}
                      style={{
                        padding: "4px 8px",
                        background: chunk.isPinned ? "var(--color-warning)" : "var(--bg-tertiary)",
                        color: chunk.isPinned ? "white" : "var(--text-secondary)",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <Pin style={{ width: 10, height: 10 }} />
                      고정
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleExcludeChunk(chunk.id); }}
                      style={{
                        padding: "4px 8px",
                        background: chunk.isExcluded ? "var(--color-error)" : "var(--bg-tertiary)",
                        color: chunk.isExcluded ? "white" : "var(--text-secondary)",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      {chunk.isExcluded ? <Eye style={{ width: 10, height: 10 }} /> : <EyeOff style={{ width: 10, height: 10 }} />}
                      {chunk.isExcluded ? "포함" : "제외"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Settings Panel */}
        {showSettings && (
          <div style={{ 
            background: "var(--bg-primary)", 
            padding: "16px",
            overflowY: "auto",
            maxHeight: "calc(100vh - 140px)"
          }}>
            <div style={{ 
              fontSize: "12px", 
              fontWeight: 600, 
              color: "var(--text-secondary)", 
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <Settings style={{ width: 14, height: 14 }} />
              DSL 설정
            </div>

            {/* Document Type */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "11px", color: "var(--text-tertiary)", display: "block", marginBottom: "6px" }}>
                문서 유형
              </label>
              <select
                value={dslSettings.documentType}
                onChange={(e) => setDslSettings(prev => ({ ...prev, documentType: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  color: "var(--text-primary)",
                  fontSize: "13px"
                }}
              >
                <option value="POLICY">정책/규정 (POLICY)</option>
                <option value="TECHNICAL">기술 문서 (TECHNICAL)</option>
                <option value="REPORT">보고서 (REPORT)</option>
                <option value="WEB">웹 문서 (WEB)</option>
                <option value="OCR">OCR 스캔 (OCR)</option>
                <option value="GENERAL">일반 (GENERAL)</option>
              </select>
            </div>

            {/* Token Settings */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "11px", color: "var(--text-tertiary)", display: "block", marginBottom: "6px" }}>
                최소 토큰: {dslSettings.minTokens}
              </label>
              <input
                type="range"
                min="50"
                max="300"
                value={dslSettings.minTokens}
                onChange={(e) => setDslSettings(prev => ({ ...prev, minTokens: parseInt(e.target.value) }))}
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "11px", color: "var(--text-tertiary)", display: "block", marginBottom: "6px" }}>
                최대 토큰: {dslSettings.maxTokens}
              </label>
              <input
                type="range"
                min="200"
                max="1000"
                value={dslSettings.maxTokens}
                onChange={(e) => setDslSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "11px", color: "var(--text-tertiary)", display: "block", marginBottom: "6px" }}>
                오버랩 토큰: {dslSettings.overlapTokens}
              </label>
              <input
                type="range"
                min="0"
                max="150"
                value={dslSettings.overlapTokens}
                onChange={(e) => setDslSettings(prev => ({ ...prev, overlapTokens: parseInt(e.target.value) }))}
                style={{ width: "100%" }}
              />
            </div>

            {/* Primary Strategy */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "11px", color: "var(--text-tertiary)", display: "block", marginBottom: "6px" }}>
                Primary 전략
              </label>
              <select
                value={dslSettings.primaryStrategy}
                onChange={(e) => setDslSettings(prev => ({ ...prev, primaryStrategy: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  color: "var(--text-primary)",
                  fontSize: "13px"
                }}
              >
                <option value="ARTICLE_BASED">조항 기반</option>
                <option value="SECTION_BASED">섹션 기반</option>
                <option value="SEMANTIC_PARAGRAPH">의미 문단</option>
                <option value="DOM_BLOCK">DOM 블록</option>
                <option value="SENTENCE_BASED">문장 기반</option>
                <option value="FIXED_SIZE">고정 크기</option>
              </select>
            </div>

            {/* Quality Stats */}
            <div style={{ 
              marginTop: "24px", 
              padding: "12px", 
              background: "var(--bg-secondary)", 
              borderRadius: "8px" 
            }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "12px" }}>
                품질 지표
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div style={{ textAlign: "center", padding: "8px", background: "var(--bg-primary)", borderRadius: "6px" }}>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-primary)" }}>
                    {qualityStats.totalChunks}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>총 청크</div>
                </div>
                <div style={{ textAlign: "center", padding: "8px", background: "var(--bg-primary)", borderRadius: "6px" }}>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-success)" }}>
                    {qualityStats.avgSemanticScore}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>평균 품질</div>
                </div>
                <div style={{ textAlign: "center", padding: "8px", background: "var(--bg-primary)", borderRadius: "6px" }}>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
                    {qualityStats.avgTokens}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>평균 토큰</div>
                </div>
                <div style={{ textAlign: "center", padding: "8px", background: "var(--bg-primary)", borderRadius: "6px" }}>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: qualityStats.errorCount > 0 ? "var(--color-error)" : "var(--color-success)" }}>
                    {qualityStats.errorCount}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>오류</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom: Status Bar */}
      <div style={{ 
        padding: "8px 24px", 
        background: "var(--bg-secondary)", 
        borderTop: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: "12px",
        color: "var(--text-secondary)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <CheckCircle style={{ width: 14, height: 14, color: "var(--color-success)" }} />
            {chunks.filter(c => !c.isExcluded).length}개 청크 활성
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Zap style={{ width: 14, height: 14, color: "var(--color-primary)" }} />
            {dslSettings.primaryStrategy}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Clock style={{ width: 14, height: 14 }} />
          {processingTime ? `처리 시간: ${processingTime}ms` : "대기 중"}
        </div>
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
