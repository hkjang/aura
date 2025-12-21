"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Upload,
  FileText,
  Link2,
  Type,
  Trash,
  Loader2,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Clock,
  ChevronLeft,
  Eye,
  MoreVertical,
  Settings,
  Users,
  Share2,
  Database,
  Search,
  FolderInput,
} from "lucide-react";
import Link from "next/link";

interface KnowledgeSource {
  id: string;
  type: string;
  title: string;
  originalName: string | null;
  content: string;
  status: string;
  errorMessage: string | null;
  fileSize: number | null;
  fileType: string | null;
  version: number;
  createdAt: string;
  _count: {
    chunks: number;
  };
}

interface Notebook {
  id: string;
  name: string;
  description: string | null;
  scope: string;
  isPublic: boolean;
  tags: string;
  createdAt: string;
  updatedAt: string;
  sources: KnowledgeSource[];
}

interface NotebookStats {
  sourceCount: number;
  chunkCount: number;
  qnaCount: number;
  totalSize: number;
}

interface KBDocument {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function NotebookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const notebookId = params.id as string;

  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [stats, setStats] = useState<NotebookStats | null>(null);
  const [permission, setPermission] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<KnowledgeSource | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showDocImport, setShowDocImport] = useState(false);
  const [textInput, setTextInput] = useState({ title: "", content: "" });
  const [urlInput, setUrlInput] = useState({ title: "", url: "" });
  const [kbDocuments, setKbDocuments] = useState<KBDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docSearchQuery, setDocSearchQuery] = useState("");
  const [chunks, setChunks] = useState<Array<{ id: string; chunkIndex: number; content: string; keywords: string }>>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [previewTab, setPreviewTab] = useState<"content" | "chunks">("content");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchNotebook = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notebooks/${notebookId}`);
      if (res.ok) {
        const data = await res.json();
        setNotebook(data.notebook);
        setStats(data.stats);
        setPermission(data.permission);
      } else if (res.status === 404) {
        router.push("/dashboard/notebooks");
      }
    } catch (e) {
      console.error("Error fetching notebook:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (notebookId) fetchNotebook();
  }, [notebookId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(`${files.length}개 파일 업로드 중...`);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`${i + 1}/${files.length}: ${file.name} 업로드 중...`);

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`/api/notebooks/${notebookId}/sources`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const error = await res.json();
          console.error(`Failed to upload ${file.name}:`, error);
        }
      }

      setUploadProgress("완료! 처리 중...");
      setTimeout(() => {
        setUploadProgress(null);
        fetchNotebook();
      }, 1500);
    } catch (e) {
      console.error(e);
      setUploadProgress("오류 발생");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddText = async () => {
    if (!textInput.content.trim()) return;

    setUploading(true);
    try {
      const res = await fetch(`/api/notebooks/${notebookId}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "TEXT",
          title: textInput.title || "텍스트 입력",
          content: textInput.content,
        }),
      });

      if (res.ok) {
        setShowTextInput(false);
        setTextInput({ title: "", content: "" });
        fetchNotebook();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const handleAddUrl = async () => {
    if (!urlInput.url.trim()) return;

    setUploading(true);
    try {
      const res = await fetch(`/api/notebooks/${notebookId}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "URL",
          title: urlInput.title || urlInput.url,
          url: urlInput.url,
        }),
      });

      if (res.ok) {
        setShowUrlInput(false);
        setUrlInput({ title: "", url: "" });
        fetchNotebook();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const fetchKBDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch("/api/knowledge/documents");
      if (res.ok) {
        const data = await res.json();
        setKbDocuments(data.documents || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleOpenDocImport = () => {
    setShowDocImport(true);
    fetchKBDocuments();
  };

  const handleImportDocument = async (doc: KBDocument) => {
    setUploading(true);
    try {
      const res = await fetch(`/api/notebooks/${notebookId}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "DOCUMENT",
          documentId: doc.id,
          title: doc.title,
        }),
      });

      if (res.ok) {
        setShowDocImport(false);
        fetchNotebook();
      } else {
        const error = await res.json();
        alert(error.error || "가져오기 실패");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const fetchChunks = async (sourceId: string) => {
    setLoadingChunks(true);
    try {
      const res = await fetch(`/api/notebooks/${notebookId}/sources/${sourceId}/chunks`);
      if (res.ok) {
        const data = await res.json();
        setChunks(data.chunks || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingChunks(false);
    }
  };

  const handleSelectSource = (source: KnowledgeSource) => {
    if (selectedSource?.id === source.id) {
      setSelectedSource(null);
      setChunks([]);
    } else {
      setSelectedSource(source);
      setPreviewTab("content");
      fetchChunks(source.id);
    }
  };

  const filteredKBDocs = docSearchQuery
    ? kbDocuments.filter((d) =>
        d.title.toLowerCase().includes(docSearchQuery.toLowerCase())
      )
    : kbDocuments;

  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm("이 소스를 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/notebooks/${notebookId}/sources/${sourceId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (selectedSource?.id === sourceId) setSelectedSource(null);
        fetchNotebook();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReprocess = async (sourceId: string) => {
    try {
      const res = await fetch(`/api/notebooks/${notebookId}/sources/${sourceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reprocess" }),
      });

      if (res.ok) fetchNotebook();
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Check style={{ width: "14px", height: "14px", color: "var(--color-success)" }} />;
      case "PROCESSING":
        return <Loader2 style={{ width: "14px", height: "14px", color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />;
      case "ERROR":
        return <AlertCircle style={{ width: "14px", height: "14px", color: "var(--color-error)" }} />;
      default:
        return <Clock style={{ width: "14px", height: "14px", color: "var(--text-tertiary)" }} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "COMPLETED": return "완료";
      case "PROCESSING": return "처리 중";
      case "ERROR": return "오류";
      default: return "대기";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "URL":
        return <Link2 style={{ width: "16px", height: "16px" }} />;
      case "TEXT":
        return <Type style={{ width: "16px", height: "16px" }} />;
      case "DOCUMENT":
        return <Database style={{ width: "16px", height: "16px" }} />;
      default:
        return <FileText style={{ width: "16px", height: "16px" }} />;
    }
  };

  const canEdit = permission === "EDIT" || permission === "ADMIN";

  if (loading) {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        <Loader2 style={{ width: "32px", height: "32px", margin: "0 auto", color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
        <p style={{ marginTop: "16px", color: "var(--text-secondary)" }}>노트북 불러오는 중...</p>
      </div>
    );
  }

  if (!notebook) {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        <p style={{ color: "var(--text-secondary)" }}>노트북을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <Link
          href="/dashboard/notebooks"
          style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "12px", textDecoration: "none" }}
        >
          <ChevronLeft style={{ width: "16px", height: "16px" }} />
          노트북 목록
        </Link>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "var(--color-primary-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BookOpen style={{ width: "24px", height: "24px", color: "var(--color-primary)" }} />
            </div>
            <div>
              <h1 style={{ fontSize: "22px", fontWeight: 600, color: "var(--text-primary)" }}>{notebook.name}</h1>
              {notebook.description && (
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "2px" }}>{notebook.description}</p>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <Link href={`/dashboard/notebooks/${notebookId}/chat`}>
              <Button>
                <MessageSquare style={{ width: "16px", height: "16px", marginRight: "8px" }} />
                질문하기
              </Button>
            </Link>
            {permission === "ADMIN" && (
              <Button variant="outline" size="icon">
                <Settings style={{ width: "16px", height: "16px" }} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
        <Card className="p-4">
          <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>지식 소스</p>
          <h3 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)" }}>{stats?.sourceCount || 0}</h3>
        </Card>
        <Card className="p-4">
          <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>청크</p>
          <h3 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-primary)" }}>{stats?.chunkCount || 0}</h3>
        </Card>
        <Card className="p-4">
          <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Q&A 수</p>
          <h3 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)" }}>{stats?.qnaCount || 0}</h3>
        </Card>
        <Card className="p-4">
          <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>총 용량</p>
          <h3 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)" }}>
            {stats?.totalSize ? `${(stats.totalSize / 1024).toFixed(1)} KB` : "0 KB"}
          </h3>
        </Card>
      </div>

      {/* Upload Progress */}
      {uploadProgress && (
        <Card className="p-4" style={{ background: "rgba(124, 58, 237, 0.05)", border: "1px solid rgba(124, 58, 237, 0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {uploading ? (
              <Loader2 style={{ width: "20px", height: "20px", color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
            ) : (
              <Check style={{ width: "20px", height: "20px", color: "var(--color-success)" }} />
            )}
            <span style={{ color: "var(--text-primary)", fontSize: "14px" }}>{uploadProgress}</span>
          </div>
        </Card>
      )}

      {/* Add Source Buttons */}
      {canEdit && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.pdf,.docx,.md"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload style={{ width: "16px", height: "16px", marginRight: "8px" }} />
            파일 업로드
          </Button>
          <Button variant="outline" onClick={() => setShowTextInput(true)} disabled={uploading}>
            <Type style={{ width: "16px", height: "16px", marginRight: "8px" }} />
            텍스트 입력
          </Button>
          <Button variant="outline" onClick={() => setShowUrlInput(true)} disabled={uploading}>
            <Link2 style={{ width: "16px", height: "16px", marginRight: "8px" }} />
            URL 추가
          </Button>
          <Button variant="outline" onClick={handleOpenDocImport} disabled={uploading} 
            style={{ background: "rgba(124, 58, 237, 0.05)", borderColor: "rgba(124, 58, 237, 0.3)" }}>
            <Database style={{ width: "16px", height: "16px", marginRight: "8px", color: "#7c3aed" }} />
            지식 베이스에서 가져오기
          </Button>
        </div>
      )}

      {/* Sources List */}
      <div style={{ display: "grid", gridTemplateColumns: selectedSource ? "1fr 1fr" : "1fr", gap: "24px" }}>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>
            지식 소스 ({notebook.sources?.length || 0})
          </h2>

          {notebook.sources?.length === 0 ? (
            <Card className="p-6" style={{ textAlign: "center" }}>
              <FileText style={{ width: "40px", height: "40px", color: "var(--text-tertiary)", margin: "0 auto" }} />
              <p style={{ marginTop: "12px", color: "var(--text-secondary)", fontSize: "14px" }}>
                아직 지식 소스가 없습니다. 파일을 업로드하거나 텍스트/URL을 추가해보세요.
              </p>
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {notebook.sources?.map((source) => (
                <Card
                  key={source.id}
                  className="p-4"
                  style={{
                    cursor: "pointer",
                    border: selectedSource?.id === source.id ? "1px solid var(--color-primary)" : "1px solid var(--border-color)",
                    background: selectedSource?.id === source.id ? "rgba(124, 58, 237, 0.03)" : "var(--bg-primary)",
                  }}
                  onClick={() => handleSelectSource(source)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        background: "var(--color-primary-light)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--color-primary)",
                      }}
                    >
                      {getTypeIcon(source.type)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {source.title}
                      </h4>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", fontSize: "12px", color: "var(--text-tertiary)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          {getStatusIcon(source.status)}
                          {getStatusText(source.status)}
                        </span>
                        <span>•</span>
                        <span>{source._count?.chunks || 0} 청크</span>
                        {source.fileSize && (
                          <>
                            <span>•</span>
                            <span>{(source.fileSize / 1024).toFixed(1)} KB</span>
                          </>
                        )}
                      </div>
                    </div>
                    {canEdit && (
                      <div style={{ display: "flex", gap: "4px" }}>
                        {source.status === "ERROR" && (
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleReprocess(source.id); }}>
                            <RefreshCw style={{ width: "14px", height: "14px" }} />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteSource(source.id); }} style={{ color: "var(--color-error)" }}>
                          <Trash style={{ width: "14px", height: "14px" }} />
                        </Button>
                      </div>
                    )}
                  </div>
                  {source.status === "ERROR" && source.errorMessage && (
                    <p style={{ marginTop: "8px", fontSize: "12px", color: "var(--color-error)" }}>{source.errorMessage}</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Preview Panel */}
        {selectedSource && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>{selectedSource.title}</h2>
              <Button variant="ghost" size="sm" onClick={() => { setSelectedSource(null); setChunks([]); }}>
                <X style={{ width: "16px", height: "16px" }} />
              </Button>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "12px", borderBottom: "1px solid var(--border-color)" }}>
              <button
                onClick={() => setPreviewTab("content")}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  background: "transparent",
                  borderBottom: previewTab === "content" ? "2px solid #7c3aed" : "2px solid transparent",
                  color: previewTab === "content" ? "#7c3aed" : "var(--text-secondary)",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                원문
              </button>
              <button
                onClick={() => setPreviewTab("chunks")}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  background: "transparent",
                  borderBottom: previewTab === "chunks" ? "2px solid #7c3aed" : "2px solid transparent",
                  color: previewTab === "chunks" ? "#7c3aed" : "var(--text-secondary)",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                청크
                <span style={{
                  padding: "2px 6px",
                  borderRadius: "10px",
                  fontSize: "11px",
                  background: previewTab === "chunks" ? "rgba(124, 58, 237, 0.1)" : "var(--bg-secondary)",
                  color: previewTab === "chunks" ? "#7c3aed" : "var(--text-tertiary)",
                }}>
                  {selectedSource._count?.chunks || chunks.length}
                </span>
              </button>
            </div>

            <Card className="p-4" style={{ height: "calc(100vh - 500px)", overflow: "auto" }}>
              {previewTab === "content" ? (
                <>
                  <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginBottom: "16px" }}>
                    {selectedSource.type} • {new Date(selectedSource.createdAt).toLocaleString("ko-KR")}
                  </div>
                  <div
                    style={{
                      padding: "16px",
                      background: "var(--bg-secondary)",
                      borderRadius: "8px",
                      fontSize: "13px",
                      lineHeight: 1.7,
                      color: "var(--text-primary)",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selectedSource.content?.substring(0, 3000)}
                    {selectedSource.content?.length > 3000 && (
                      <p style={{ marginTop: "16px", color: "var(--text-tertiary)", fontStyle: "italic" }}>
                        ... (총 {selectedSource.content.length}자 중 3000자만 표시)
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {loadingChunks ? (
                    <div style={{ padding: "40px", textAlign: "center" }}>
                      <Loader2 style={{ width: "24px", height: "24px", margin: "0 auto", color: "#7c3aed", animation: "spin 1s linear infinite" }} />
                      <p style={{ marginTop: "12px", color: "var(--text-secondary)", fontSize: "14px" }}>청크 불러오는 중...</p>
                    </div>
                  ) : chunks.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center" }}>
                      <FileText style={{ width: "40px", height: "40px", color: "var(--text-tertiary)", margin: "0 auto" }} />
                      <p style={{ marginTop: "12px", color: "var(--text-secondary)", fontSize: "14px" }}>
                        아직 청크가 없습니다. 처리가 완료되면 청크가 표시됩니다.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {chunks.map((chunk, i) => (
                        <div
                          key={chunk.id}
                          style={{
                            padding: "14px",
                            borderRadius: "10px",
                            background: "var(--bg-secondary)",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                            <span style={{
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: 600,
                              background: "rgba(124, 58, 237, 0.1)",
                              color: "#7c3aed",
                            }}>
                              청크 #{chunk.chunkIndex + 1}
                            </span>
                            <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                              {chunk.content.length}자
                            </span>
                          </div>
                          <p style={{
                            fontSize: "13px",
                            lineHeight: 1.6,
                            color: "var(--text-primary)",
                            whiteSpace: "pre-wrap",
                          }}>
                            {chunk.content.substring(0, 500)}
                            {chunk.content.length > 500 && "..."}
                          </p>
                          {chunk.keywords && (
                            <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                              {JSON.parse(chunk.keywords || "[]").slice(0, 5).map((kw: string, j: number) => (
                                <span key={j} style={{
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontSize: "10px",
                                  background: "var(--bg-primary)",
                                  color: "var(--text-tertiary)",
                                  border: "1px solid var(--border-color)",
                                }}>
                                  {kw}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Text Input Modal */}
      {showTextInput && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setShowTextInput(false)}
        >
          <Card className="p-6" style={{ width: "100%", maxWidth: "600px", margin: "16px" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "20px" }}>텍스트 입력</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <Input
                placeholder="제목 (선택)"
                value={textInput.title}
                onChange={(e) => setTextInput({ ...textInput, title: e.target.value })}
              />
              <textarea
                placeholder="텍스트 내용을 입력하세요..."
                value={textInput.content}
                onChange={(e) => setTextInput({ ...textInput, content: e.target.value })}
                style={{
                  width: "100%",
                  height: "200px",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  resize: "vertical",
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "24px" }}>
              <Button variant="outline" onClick={() => setShowTextInput(false)}>취소</Button>
              <Button onClick={handleAddText} disabled={!textInput.content.trim() || uploading}>추가</Button>
            </div>
          </Card>
        </div>
      )}

      {/* URL Input Modal */}
      {showUrlInput && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setShowUrlInput(false)}
        >
          <Card className="p-6" style={{ width: "100%", maxWidth: "500px", margin: "16px" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "20px" }}>URL 추가</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <Input
                placeholder="제목 (선택)"
                value={urlInput.title}
                onChange={(e) => setUrlInput({ ...urlInput, title: e.target.value })}
              />
              <Input
                placeholder="https://example.com"
                value={urlInput.url}
                onChange={(e) => setUrlInput({ ...urlInput, url: e.target.value })}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "24px" }}>
              <Button variant="outline" onClick={() => setShowUrlInput(false)}>취소</Button>
              <Button onClick={handleAddUrl} disabled={!urlInput.url.trim() || uploading}>추가</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Document Import Modal */}
      {showDocImport && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setShowDocImport(false)}
        >
          <Card className="p-6" style={{ width: "100%", maxWidth: "600px", margin: "16px", maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Database style={{ width: "20px", height: "20px", color: "white" }} />
              </div>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)" }}>지식 베이스에서 가져오기</h2>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>기존 문서를 이 노트북에 추가합니다</p>
              </div>
            </div>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: "16px" }}>
              <Search style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "16px",
                height: "16px",
                color: "var(--text-tertiary)"
              }} />
              <Input
                placeholder="문서 검색..."
                value={docSearchQuery}
                onChange={(e) => setDocSearchQuery(e.target.value)}
                style={{ paddingLeft: "40px" }}
              />
            </div>

            {/* Document List */}
            <div style={{ flex: 1, overflow: "auto", marginBottom: "16px" }}>
              {loadingDocs ? (
                <div style={{ padding: "40px", textAlign: "center" }}>
                  <Loader2 style={{ width: "24px", height: "24px", margin: "0 auto", color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
                  <p style={{ marginTop: "12px", color: "var(--text-secondary)", fontSize: "14px" }}>문서 불러오는 중...</p>
                </div>
              ) : filteredKBDocs.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center" }}>
                  <FileText style={{ width: "40px", height: "40px", color: "var(--text-tertiary)", margin: "0 auto" }} />
                  <p style={{ marginTop: "12px", color: "var(--text-secondary)", fontSize: "14px" }}>
                    {docSearchQuery ? "검색 결과가 없습니다" : "지식 베이스에 문서가 없습니다"}
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {filteredKBDocs.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        padding: "14px",
                        borderRadius: "10px",
                        border: "1px solid var(--border-color)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        background: "var(--bg-primary)"
                      }}
                      onClick={() => handleImportDocument(doc)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#7c3aed";
                        e.currentTarget.style.background = "rgba(124, 58, 237, 0.02)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border-color)";
                        e.currentTarget.style.background = "var(--bg-primary)";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          background: "rgba(124, 58, 237, 0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          <FileText style={{ width: "16px", height: "16px", color: "#7c3aed" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: "14px" }}>{doc.title}</h4>
                          <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "2px" }}>
                            {new Date(doc.createdAt).toLocaleDateString("ko-KR")} • {doc.content.length.toLocaleString()}자
                          </p>
                        </div>
                        <FolderInput style={{ width: "18px", height: "18px", color: "#7c3aed" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <Button variant="outline" onClick={() => setShowDocImport(false)}>닫기</Button>
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
