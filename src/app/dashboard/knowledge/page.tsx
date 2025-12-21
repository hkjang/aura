"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Database, 
  Upload, 
  Search, 
  FileText, 
  Trash, 
  Loader2, 
  Check, 
  X,
  RefreshCw,
  Eye,
  Download,
  FolderOpen,
  Info
} from "lucide-react";

interface Document {
  id: string;
  title: string;
  content: string;
  metadata: string | null;
  createdAt: string;
}

export default function KnowledgeDashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/knowledge/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(`${files.length}개 파일 업로드 중...`);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`${i + 1}/${files.length}: ${file.name} 처리 중...`);

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/ingest", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const error = await res.json();
          console.error(`Failed to upload ${file.name}:`, error);
        }
      }
      
      setUploadProgress("완료!");
      setTimeout(() => setUploadProgress(null), 2000);
      fetchDocuments();
    } catch (e) {
      console.error(e);
      setUploadProgress("오류 발생");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 문서를 삭제하시겠습니까?")) return;
    
    try {
      const res = await fetch(`/api/knowledge/documents/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDocuments(docs => docs.filter(d => d.id !== id));
        if (selectedDoc?.id === id) setSelectedDoc(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchDocuments();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/knowledge/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const parseMetadata = (metadata: string | null) => {
    try {
      return metadata ? JSON.parse(metadata) : {};
    } catch {
      return {};
    }
  };

  const filteredDocs = searchQuery 
    ? documents.filter(d => 
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : documents;

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Database style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />
            지식 베이스
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '14px' }}>
            문서를 업로드하고 AI가 참조할 수 있는 지식 베이스를 구축하세요
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={fetchDocuments} disabled={loading}>
            <RefreshCw style={{ width: '14px', height: '14px', marginRight: '6px' }} />
            새로고침
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.pdf,.docx,.md"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? (
              <Loader2 style={{ width: '16px', height: '16px', marginRight: '8px', animation: 'spin 1s linear infinite' }} />
            ) : (
              <Upload style={{ width: '16px', height: '16px', marginRight: '8px' }} />
            )}
            문서 업로드
          </Button>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress && (
        <Card className="p-4" style={{ background: 'rgba(124, 58, 237, 0.05)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {uploading ? (
              <Loader2 style={{ width: '20px', height: '20px', color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
            ) : (
              <Check style={{ width: '20px', height: '20px', color: 'var(--color-success)' }} />
            )}
            <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{uploadProgress}</span>
          </div>
        </Card>
      )}

      {/* How it works */}
      <Card className="p-4" style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)', border: '1px solid rgba(124, 58, 237, 0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Info style={{ width: '20px', height: '20px', color: 'var(--color-primary)' }} />
          <div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>지식 베이스란?</span>
            <span style={{ marginLeft: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              업로드한 문서의 내용이 저장되어 AI 채팅 시 관련 정보를 참조합니다. PDF, DOCX, TXT, MD 파일을 지원합니다.
            </span>
          </div>
        </div>
      </Card>

      {/* Search */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search style={{ 
            position: 'absolute', 
            left: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            width: '18px', 
            height: '18px', 
            color: 'var(--text-tertiary)' 
          }} />
          <Input
            placeholder="문서 제목 또는 내용으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{ paddingLeft: '40px' }}
          />
        </div>
        <Button variant="outline" onClick={handleSearch}>검색</Button>
        {searchQuery && (
          <Button variant="ghost" onClick={() => { setSearchQuery(""); fetchDocuments(); }}>
            <X style={{ width: '16px', height: '16px' }} />
          </Button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
        <Card className="p-4">
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>총 문서</p>
          <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{documents.length}</h3>
        </Card>
        <Card className="p-4">
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>총 용량</p>
          <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-primary)' }}>
            {(documents.reduce((acc, d) => acc + d.content.length, 0) / 1024).toFixed(1)} KB
          </h3>
        </Card>
        <Card className="p-4">
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>검색 결과</p>
          <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{filteredDocs.length}</h3>
        </Card>
      </div>

      {/* Document List & Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedDoc ? '1fr 1fr' : '1fr', gap: '24px' }}>
        {/* Document List */}
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
            문서 목록 {filteredDocs.length > 0 && `(${filteredDocs.length})`}
          </h2>
          
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Loader2 style={{ width: '24px', height: '24px', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '12px' }}>불러오는 중...</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <Card className="p-8" style={{ textAlign: 'center' }}>
              <FolderOpen style={{ width: '48px', height: '48px', color: 'var(--text-tertiary)', margin: '0 auto' }} />
              <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '16px' }}>
                {searchQuery ? '검색 결과가 없습니다' : '문서가 없습니다'}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                {searchQuery ? '다른 검색어를 시도해보세요' : '위의 "문서 업로드" 버튼을 클릭하여 시작하세요'}
              </p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredDocs.map(doc => {
                const meta = parseMetadata(doc.metadata);
                const isSelected = selectedDoc?.id === doc.id;
                return (
                  <Card 
                    key={doc.id} 
                    className="p-4"
                    style={{ 
                      cursor: 'pointer',
                      border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(124, 58, 237, 0.05)' : 'var(--bg-primary)'
                    }}
                    onClick={() => setSelectedDoc(isSelected ? null : doc)}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: 'var(--color-primary-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <FileText style={{ width: '20px', height: '20px', color: 'var(--color-primary)' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.title}
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                          {new Date(doc.createdAt).toLocaleDateString('ko-KR')} · {(doc.content.length / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); }}>
                          <Eye style={{ width: '14px', height: '14px' }} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }} style={{ color: 'var(--color-error)' }}>
                          <Trash style={{ width: '14px', height: '14px' }} />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Preview */}
        {selectedDoc && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>미리보기</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDoc(null)}>
                <X style={{ width: '16px', height: '16px' }} />
              </Button>
            </div>
            <Card className="p-4" style={{ height: 'calc(100vh - 500px)', overflow: 'auto' }}>
              <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>{selectedDoc.title}</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '16px', display: 'flex', gap: '16px' }}>
                <span>생성일: {new Date(selectedDoc.createdAt).toLocaleString('ko-KR')}</span>
                <span>크기: {(selectedDoc.content.length / 1024).toFixed(2)} KB</span>
              </div>
              <div style={{ 
                padding: '16px', 
                background: 'var(--bg-secondary)', 
                borderRadius: '8px',
                fontSize: '13px',
                lineHeight: 1.7,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap'
              }}>
                {selectedDoc.content.substring(0, 5000)}
                {selectedDoc.content.length > 5000 && (
                  <p style={{ marginTop: '16px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                    ... (총 {selectedDoc.content.length}자 중 5000자만 표시)
                  </p>
                )}
              </div>
            </Card>
          </div>
        )}
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
