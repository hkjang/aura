"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Settings,
  ArrowLeft,
  Plus,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  X,
  Layers,
  Zap,
  Database,
  Edit2,
} from "lucide-react";

interface PipelineConfig {
  id: string;
  name: string;
  description: string | null;
  chunkingStrategy: string;
  chunkSize: number;
  chunkOverlap: number;
  embeddingModel: string;
  embeddingDimension: number;
  indexType: string;
  indexParameters: string;
  scope: string;
  notebookId: string | null;
  version: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProcessingJob {
  id: string;
  notebookId: string | null;
  sourceId: string | null;
  jobType: string;
  status: string;
  priority: number;
  progress: number;
  totalItems: number;
  processedItems: number;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

const CHUNKING_STRATEGIES = [
  { value: "SENTENCE", label: "문장 단위" },
  { value: "PARAGRAPH", label: "단락 단위" },
  { value: "FIXED", label: "고정 크기" },
  { value: "SEMANTIC", label: "의미 단위" },
];

const EMBEDDING_MODELS = [
  { value: "text-embedding-ada-002", label: "OpenAI Ada 002", dimension: 1536 },
  { value: "text-embedding-3-small", label: "OpenAI 3 Small", dimension: 1536 },
  { value: "text-embedding-3-large", label: "OpenAI 3 Large", dimension: 3072 },
];

const INDEX_TYPES = [
  { value: "HNSW", label: "HNSW (권장)" },
  { value: "FLAT", label: "Flat" },
  { value: "IVF", label: "IVF" },
];

export default function AdminPipelinePage() {
  const [configs, setConfigs] = useState<PipelineConfig[]>([]);
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"configs" | "jobs">("configs");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    chunkingStrategy: "SENTENCE",
    chunkSize: 512,
    chunkOverlap: 50,
    embeddingModel: "text-embedding-ada-002",
    embeddingDimension: 1536,
    indexType: "HNSW",
    isDefault: false,
  });

  // Mock data for demonstration
  const mockConfigs: PipelineConfig[] = [
    {
      id: "config-1",
      name: "기본 문서 처리 설정",
      description: "PDF, DOCX 등 일반 문서에 최적화된 기본 설정입니다.",
      chunkingStrategy: "SENTENCE",
      chunkSize: 512,
      chunkOverlap: 50,
      embeddingModel: "text-embedding-3-small",
      embeddingDimension: 1536,
      indexType: "HNSW",
      indexParameters: JSON.stringify({ efConstruction: 200, M: 16 }),
      scope: "GLOBAL",
      notebookId: null,
      version: 3,
      isDefault: true,
      isActive: true,
      createdAt: "2024-01-10T08:00:00Z",
      updatedAt: "2024-12-15T10:30:00Z",
    },
    {
      id: "config-2",
      name: "대용량 기술 문서 설정",
      description: "기술 매뉴얼, API 문서 등 대용량 기술 문서에 최적화된 설정입니다.",
      chunkingStrategy: "PARAGRAPH",
      chunkSize: 1024,
      chunkOverlap: 100,
      embeddingModel: "text-embedding-3-large",
      embeddingDimension: 3072,
      indexType: "HNSW",
      indexParameters: JSON.stringify({ efConstruction: 400, M: 32 }),
      scope: "GLOBAL",
      notebookId: null,
      version: 2,
      isDefault: false,
      isActive: true,
      createdAt: "2024-03-20T14:00:00Z",
      updatedAt: "2024-11-28T16:45:00Z",
    },
    {
      id: "config-3",
      name: "코드 분석 설정",
      description: "소스코드 파일 분석에 최적화된 의미 기반 청킹 설정입니다.",
      chunkingStrategy: "SEMANTIC",
      chunkSize: 768,
      chunkOverlap: 128,
      embeddingModel: "text-embedding-3-small",
      embeddingDimension: 1536,
      indexType: "HNSW",
      indexParameters: JSON.stringify({ efConstruction: 200, M: 16 }),
      scope: "GLOBAL",
      notebookId: null,
      version: 1,
      isDefault: false,
      isActive: true,
      createdAt: "2024-06-15T09:30:00Z",
      updatedAt: "2024-10-20T11:00:00Z",
    },
  ];

  const mockJobs: ProcessingJob[] = [
    {
      id: "job-1",
      notebookId: "notebook-001",
      sourceId: "source-001",
      jobType: "EMBEDDING",
      status: "COMPLETED",
      priority: 1,
      progress: 100,
      totalItems: 156,
      processedItems: 156,
      errorMessage: null,
      retryCount: 0,
      createdAt: "2024-12-20T10:00:00Z",
      startedAt: "2024-12-20T10:00:15Z",
      completedAt: "2024-12-20T10:02:30Z",
    },
    {
      id: "job-2",
      notebookId: "notebook-002",
      sourceId: "source-005",
      jobType: "CHUNKING",
      status: "PROCESSING",
      priority: 1,
      progress: 65,
      totalItems: 89,
      processedItems: 58,
      errorMessage: null,
      retryCount: 0,
      createdAt: "2024-12-23T05:45:00Z",
      startedAt: "2024-12-23T05:45:10Z",
      completedAt: null,
    },
    {
      id: "job-3",
      notebookId: "notebook-003",
      sourceId: "source-012",
      jobType: "REINDEX",
      status: "PENDING",
      priority: 2,
      progress: 0,
      totalItems: 234,
      processedItems: 0,
      errorMessage: null,
      retryCount: 0,
      createdAt: "2024-12-23T05:48:00Z",
      startedAt: null,
      completedAt: null,
    },
    {
      id: "job-4",
      notebookId: "notebook-001",
      sourceId: "source-003",
      jobType: "EMBEDDING",
      status: "FAILED",
      priority: 1,
      progress: 45,
      totalItems: 78,
      processedItems: 35,
      errorMessage: "OpenAI API rate limit exceeded. Please retry after 60 seconds.",
      retryCount: 2,
      createdAt: "2024-12-22T18:30:00Z",
      startedAt: "2024-12-22T18:30:05Z",
      completedAt: null,
    },
    {
      id: "job-5",
      notebookId: "notebook-005",
      sourceId: "source-018",
      jobType: "CHUNKING",
      status: "COMPLETED",
      priority: 1,
      progress: 100,
      totalItems: 45,
      processedItems: 45,
      errorMessage: null,
      retryCount: 0,
      createdAt: "2024-12-22T14:00:00Z",
      startedAt: "2024-12-22T14:00:08Z",
      completedAt: "2024-12-22T14:01:45Z",
    },
  ];

  const fetchConfigs = async () => {
    try {
      const res = await fetch("/api/admin/notebooks/pipeline?type=configs");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setConfigs(data.configs || []);
    } catch (error) {
      console.error("Failed to fetch configs:", error);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/admin/notebooks/pipeline?type=jobs");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchConfigs(), fetchJobs()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleCreateConfig = async () => {
    try {
      await fetch("/api/admin/notebooks/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_config", configData: formData }),
      });
      setCreating(false);
      resetForm();
      await fetchConfigs();
    } catch (error) {
      console.error("Create failed:", error);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      await fetch("/api/admin/notebooks/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry_job", jobId }),
      });
      await fetchJobs();
    } catch (error) {
      console.error("Retry failed:", error);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await fetch("/api/admin/notebooks/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel_job", jobId }),
      });
      await fetchJobs();
    } catch (error) {
      console.error("Cancel failed:", error);
    }
  };

  const handleEdit = (config: PipelineConfig) => {
    setEditingId(config.id);
    setCreating(true);
    setFormData({
      name: config.name,
      description: config.description || "",
      chunkingStrategy: config.chunkingStrategy,
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
      embeddingModel: config.embeddingModel,
      embeddingDimension: config.embeddingDimension,
      indexType: config.indexType,
      isDefault: config.isDefault,
    });
  };

  const handleUpdateConfig = async () => {
    if (!editingId) return;
    
    try {
      await fetch("/api/admin/notebooks/pipeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configId: editingId, ...formData }),
      });
      setCreating(false);
      setEditingId(null);
      resetForm();
      await fetchConfigs();
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      chunkingStrategy: "SENTENCE",
      chunkSize: 512,
      chunkOverlap: 50,
      embeddingModel: "text-embedding-ada-002",
      embeddingDimension: 1536,
      indexType: "HNSW",
      isDefault: false,
    });
    setEditingId(null);
  };

  const getJobStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      PENDING: { bg: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" },
      PROCESSING: { bg: "rgba(37, 99, 235, 0.1)", color: "#2563eb" },
      COMPLETED: { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981" },
      FAILED: { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444" },
    };
    const labels: Record<string, string> = {
      PENDING: "대기중",
      PROCESSING: "처리중",
      COMPLETED: "완료",
      FAILED: "실패",
    };
    const icons: Record<string, React.ElementType> = {
      PENDING: Clock,
      PROCESSING: RefreshCw,
      COMPLETED: CheckCircle,
      FAILED: XCircle,
    };

    const style = styles[status] || { bg: "rgba(107, 114, 128, 0.1)", color: "#6b7280" };
    const Icon = icons[status] || Settings;

    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "9999px", fontSize: "12px", background: style.bg, color: style.color }}>
        <Icon style={{ width: "12px", height: "12px", animation: status === "PROCESSING" ? "spin 1s linear infinite" : "none" }} />
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
        <Loader2 style={{ width: "32px", height: "32px", color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/dashboard/admin/notebooks">
            <Button variant="ghost" size="sm">
              <ArrowLeft style={{ width: "16px", height: "16px" }} />
            </Button>
          </Link>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Settings style={{ width: "24px", height: "24px", color: "var(--color-primary)" }} />
              파이프라인 설정
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
              청킹, 임베딩, 색인 설정 및 처리 작업을 관리합니다
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border-color)" }}>
        <button
          onClick={() => setActiveTab("configs")}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: 500,
            borderBottom: activeTab === "configs" ? "2px solid var(--color-primary)" : "2px solid transparent",
            marginBottom: "-1px",
            color: activeTab === "configs" ? "var(--color-primary)" : "var(--text-secondary)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <Layers style={{ width: "16px", height: "16px" }} />
          설정 ({configs.length})
        </button>
        <button
          onClick={() => setActiveTab("jobs")}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: 500,
            borderBottom: activeTab === "jobs" ? "2px solid var(--color-primary)" : "2px solid transparent",
            marginBottom: "-1px",
            color: activeTab === "jobs" ? "var(--color-primary)" : "var(--text-secondary)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <RefreshCw style={{ width: "16px", height: "16px" }} />
          작업 ({jobs.length})
        </button>
      </div>

      {/* Configs Tab */}
      {activeTab === "configs" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={() => setCreating(true)}>
              <Plus style={{ width: "16px", height: "16px", marginRight: "8px" }} />
              설정 추가
            </Button>
          </div>

          {creating && (
            <Card style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)" }}>{editingId ? "파이프라인 설정 수정" : "새 파이프라인 설정"}</h2>
                <Button variant="ghost" size="sm" onClick={() => { setCreating(false); resetForm(); }}>
                  <X style={{ width: "16px", height: "16px" }} />
                </Button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Basic Info */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>이름 *</label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="설정 이름" style={{ marginTop: "4px" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>설명</label>
                    <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="설정 설명" style={{ marginTop: "4px" }} />
                  </div>
                </div>

                {/* Chunking */}
                <div style={{ border: "1px solid var(--border-color)", borderRadius: "8px", padding: "16px" }}>
                  <h3 style={{ fontWeight: 500, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
                    <Layers style={{ width: "16px", height: "16px" }} />
                    청킹 설정
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>전략</label>
                      <select value={formData.chunkingStrategy} onChange={(e) => setFormData({ ...formData, chunkingStrategy: e.target.value })} style={{ width: "100%", marginTop: "4px", padding: "8px 12px", border: "1px solid var(--border-color)", borderRadius: "6px", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "14px" }}>
                        {CHUNKING_STRATEGIES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>청크 크기</label>
                      <Input type="number" value={formData.chunkSize} onChange={(e) => setFormData({ ...formData, chunkSize: parseInt(e.target.value) || 512 })} style={{ marginTop: "4px" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>오버랩</label>
                      <Input type="number" value={formData.chunkOverlap} onChange={(e) => setFormData({ ...formData, chunkOverlap: parseInt(e.target.value) || 50 })} style={{ marginTop: "4px" }} />
                    </div>
                  </div>
                </div>

                {/* Embedding */}
                <div style={{ border: "1px solid var(--border-color)", borderRadius: "8px", padding: "16px" }}>
                  <h3 style={{ fontWeight: 500, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
                    <Zap style={{ width: "16px", height: "16px" }} />
                    임베딩 설정
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>모델</label>
                      <select value={formData.embeddingModel} onChange={(e) => { const model = EMBEDDING_MODELS.find((m) => m.value === e.target.value); setFormData({ ...formData, embeddingModel: e.target.value, embeddingDimension: model?.dimension || 1536 }); }} style={{ width: "100%", marginTop: "4px", padding: "8px 12px", border: "1px solid var(--border-color)", borderRadius: "6px", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "14px" }}>
                        {EMBEDDING_MODELS.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>차원</label>
                      <Input type="number" value={formData.embeddingDimension} disabled style={{ marginTop: "4px" }} />
                    </div>
                  </div>
                </div>

                {/* Index */}
                <div style={{ border: "1px solid var(--border-color)", borderRadius: "8px", padding: "16px" }}>
                  <h3 style={{ fontWeight: 500, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
                    <Database style={{ width: "16px", height: "16px" }} />
                    색인 설정
                  </h3>
                  <div>
                    <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>색인 유형</label>
                    <select value={formData.indexType} onChange={(e) => setFormData({ ...formData, indexType: e.target.value })} style={{ width: "100%", marginTop: "4px", padding: "8px 12px", border: "1px solid var(--border-color)", borderRadius: "6px", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "14px" }}>
                      {INDEX_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" checked={formData.isDefault} onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })} style={{ borderRadius: "4px" }} />
                  <label style={{ fontSize: "14px", color: "var(--text-primary)" }}>기본 설정으로 지정</label>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                  <Button variant="outline" onClick={() => { setCreating(false); resetForm(); }}>취소</Button>
                  <Button onClick={editingId ? handleUpdateConfig : handleCreateConfig} disabled={!formData.name}>
                    <Save style={{ width: "16px", height: "16px", marginRight: "8px" }} />
                    {editingId ? "수정" : "저장"}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {configs.map((config) => (
              <Card key={config.id} style={{ padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <h3 style={{ fontWeight: 600, color: "var(--text-primary)" }}>{config.name}</h3>
                      {config.isDefault && (
                        <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "12px", background: "rgba(37, 99, 235, 0.1)", color: "var(--color-primary)" }}>
                          기본값
                        </span>
                      )}
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>v{config.version}</span>
                    </div>
                    {config.description && (
                      <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "8px" }}>{config.description}</p>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", fontSize: "12px", color: "var(--text-secondary)" }}>
                      <span>청킹: {config.chunkingStrategy}</span>
                      <span>크기: {config.chunkSize}</span>
                      <span>임베딩: {config.embeddingModel}</span>
                      <span>색인: {config.indexType}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(config)} title="수정">
                      <Edit2 style={{ width: "16px", height: "16px" }} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {configs.length === 0 && (
              <Card style={{ padding: "48px", textAlign: "center", color: "var(--text-secondary)" }}>
                <Settings style={{ width: "48px", height: "48px", margin: "0 auto 16px", opacity: 0.5 }} />
                <p>파이프라인 설정이 없습니다</p>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Jobs Tab */}
      {activeTab === "jobs" && (
        <Card>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "var(--bg-secondary)" }}>
                <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>작업 유형</th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>상태</th>
                  <th style={{ padding: "12px", textAlign: "center", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>진행률</th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>생성일</th>
                  <th style={{ padding: "12px", textAlign: "center", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "12px" }}>
                      <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>{job.jobType}</div>
                      {job.notebookId && (
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                          노트북: {job.notebookId.slice(0, 8)}...
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {getJobStatusBadge(job.status)}
                      {job.errorMessage && (
                        <div style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px" }}>{job.errorMessage}</div>
                      )}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <div style={{ width: "100%", background: "var(--bg-secondary)", borderRadius: "4px", height: "8px" }}>
                        <div style={{ background: "var(--color-primary)", height: "8px", borderRadius: "4px", width: `${job.progress}%`, transition: "width 0.3s" }} />
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                        {job.processedItems}/{job.totalItems}
                      </div>
                    </td>
                    <td style={{ padding: "12px", fontSize: "14px", color: "var(--text-secondary)" }}>
                      {new Date(job.createdAt).toLocaleString("ko-KR")}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      {job.status === "FAILED" && (
                        <Button size="sm" variant="ghost" onClick={() => handleRetryJob(job.id)}>
                          <RefreshCw style={{ width: "16px", height: "16px" }} />
                        </Button>
                      )}
                      {job.status === "PENDING" && (
                        <Button size="sm" variant="ghost" onClick={() => handleCancelJob(job.id)}>
                          <XCircle style={{ width: "16px", height: "16px" }} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {jobs.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: "48px", textAlign: "center", color: "var(--text-secondary)" }}>
                      <RefreshCw style={{ width: "48px", height: "48px", margin: "0 auto 16px", opacity: 0.5 }} />
                      <p>처리 작업이 없습니다</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
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
