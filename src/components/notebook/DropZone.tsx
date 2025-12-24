"use client";

import { useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface DropZoneProps {
  onFileDrop: (files: File[]) => void;
  accept?: string;
  disabled?: boolean;
}

export function DropZone({ onFileDrop, accept = "image/*", disabled = false }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileDrop(files);
      
      // Show preview for images
      if (files[0].type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(files[0]);
      }
    }
  };

  const clearPreview = () => setPreview(null);

  if (preview) {
    return (
      <div
        style={{
          position: "relative",
          padding: "8px",
          borderRadius: "8px",
          border: "1px solid var(--border-color)",
          background: "var(--bg-secondary)",
        }}
      >
        <img
          src={preview}
          alt="Preview"
          style={{
            maxWidth: "200px",
            maxHeight: "150px",
            borderRadius: "6px",
            objectFit: "cover",
          }}
        />
        <button
          onClick={clearPreview}
          style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            border: "none",
            background: "rgba(0,0,0,0.5)",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X style={{ width: "12px", height: "12px" }} />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        padding: "16px",
        borderRadius: "8px",
        border: `2px dashed ${isDragging ? "var(--color-primary)" : "var(--border-color)"}`,
        background: isDragging ? "rgba(124, 58, 237, 0.05)" : "transparent",
        textAlign: "center",
        transition: "all 0.2s",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
        {isDragging ? (
          <Upload style={{ width: "24px", height: "24px", color: "var(--color-primary)" }} />
        ) : (
          <ImageIcon style={{ width: "24px", height: "24px", color: "var(--text-tertiary)" }} />
        )}
        <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
          {isDragging ? "여기에 놓으세요" : "이미지를 드래그하거나 붙여넣기"}
        </span>
      </div>
    </div>
  );
}
