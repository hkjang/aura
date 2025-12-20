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
    // Create a hidden file input programmatically
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
          // Add new doc to list (converting DB format to UI format)
          setDocs(prev => [...prev, {
            id: doc.id,
            title: doc.title,
            size: "New", // Real size would be in metadata
            date: new Date().toISOString().split('T')[0]
          }]);
        }
      } catch (err) {
        console.error(err);
        alert("Upload failed");
      } finally {
        setIsUploading(false);
      }
    };
    
    input.click();
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Database className="w-8 h-8 text-violet-600" />
          Knowledge Base
        </h1>
        <Button>
          Manage Embeddings
        </Button>
      </div>

      <div className={styles.uploadZone}>
        <div className="p-4 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600">
          <Upload className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Upload Documents</h3>
          <p className="text-muted-foreground mt-1">Drag and drop PDF, DOCX, or TXT files here to ingest into the RAG engine.</p>
        </div>
        <Button onClick={handleUpload} isLoading={isUploading} size="lg">
          {isUploading ? "Ingesting..." : "Select Files"}
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Ingested Documents</h2>
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{doc.size}</span>
                  <span>•</span>
                  <span>{doc.date}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-full" />
                </div>
                <span className="text-xs font-medium text-green-600">Indexed</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
