"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FileText, Upload, Trash, Database } from "lucide-react";
import styles from "@/components/documents/documents.module.css";

// Mock data for demo
const initialDocs = [
  { id: "1", title: "Employee_Handbook_2024.pdf", size: "2.4 MB", date: "2024-12-10" },
  { id: "2", title: "Q4_Financial_Report.docx", size: "1.1 MB", date: "2024-12-15" },
];

export default function DocumentsPage() {
  const [docs, setDocs] = useState(initialDocs);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.docx,.txt';
    
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/ingest', {
          method: 'POST',
          body: formData,
        });
        
        if (res.ok) {
          const { doc } = await res.json();
          setDocs(prev => [...prev, {
            id: doc.id,
            title: doc.title,
            size: "신규",
            date: new Date().toISOString().split('T')[0]
          }]);
        }
      } catch (err) {
        console.error(err);
        alert("업로드에 실패했습니다");
      } finally {
        setIsUploading(false);
      }
    };
    
    input.click();
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Database style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />
          지식 베이스
        </h1>
        <Button>
          임베딩 관리
        </Button>
      </div>

      <div className={styles.uploadZone}>
        <div style={{ padding: '16px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
          <Upload style={{ width: '32px', height: '32px' }} />
        </div>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>문서 업로드</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
            PDF, DOCX, TXT 파일을 여기에 드래그하여 RAG 엔진에 추가하세요.
          </p>
        </div>
        <Button onClick={handleUpload} isLoading={isUploading} size="lg">
          {isUploading ? "처리 중..." : "파일 선택"}
        </Button>
      </div>

      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
          등록된 문서
        </h2>
        <div className={styles.grid}>
          {docs.map((doc) => (
            <div key={doc.id} className={styles.docCard}>
              <div className="flex items-start justify-between">
                <div className={styles.iconWrapper}>
                  <FileText />
                </div>
                <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
              <div className={styles.docInfo}>
                <h4 className={styles.docTitle}>{doc.title}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  <span>{doc.size}</span>
                  <span>•</span>
                  <span>{doc.date}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                <div style={{ height: '6px', flex: 1, background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--color-success)', width: '100%' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-success)' }}>인덱싱 완료</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
