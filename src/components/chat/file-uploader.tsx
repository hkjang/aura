"use client";

import { useState, useRef, DragEvent } from "react";
import { Upload, Link, X, File, FileText, Image, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

interface FileUploaderProps {
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSizeBytes?: number;
  acceptedTypes?: string[];
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) return Image;
  if (type.startsWith("video/")) return Film;
  if (type.includes("pdf") || type.includes("document")) return FileText;
  return File;
};

export function FileUploader({
  onFilesChange,
  maxFiles = 5,
  maxSizeBytes = 10 * 1024 * 1024, // 10MB default
  acceptedTypes = ["image/*", "application/pdf", ".txt", ".md", ".csv"],
}: FileUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList) => {
    setError(null);
    const newFiles: UploadedFile[] = [];

    Array.from(fileList).forEach((file) => {
      // Check max files
      if (files.length + newFiles.length >= maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Check file size
      if (file.size > maxSizeBytes) {
        setError(`File "${file.name}" exceeds maximum size of ${formatFileSize(maxSizeBytes)}`);
        return;
      }

      newFiles.push({
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    });

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleUrlAdd = () => {
    if (!urlInput.trim()) return;
    
    try {
      new URL(urlInput);
      const newFile: UploadedFile = {
        id: `url-${Date.now()}`,
        name: urlInput,
        size: 0,
        type: "url",
        url: urlInput,
      };
      const updatedFiles = [...files, newFile];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
      setUrlInput("");
      setShowUrlInput(false);
    } catch {
      setError("Invalid URL format");
    }
  };

  const removeFile = (id: string) => {
    const updatedFiles = files.filter((f) => f.id !== id);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  if (files.length === 0 && !showUrlInput) {
    return (
      <div className="flex items-center gap-2">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed cursor-pointer transition-all
            ${isDragging 
              ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20" 
              : "border-zinc-200 dark:border-zinc-700 hover:border-violet-400"
            }
          `}
        >
          <Upload className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Drop files or click</span>
        </div>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowUrlInput(true)}
          className="gap-1"
        >
          <Link className="w-4 h-4" />
          URL
        </Button>
        
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* File list */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file) => {
            const Icon = file.type === "url" ? Link : getFileIcon(file.type);
            return (
              <div
                key={file.id}
                className="flex items-center gap-2 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm"
              >
                <Icon className="w-4 h-4 text-violet-500" />
                <span className="max-w-[150px] truncate">{file.name}</span>
                {file.size > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({formatFileSize(file.size)})
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* URL input */}
      {showUrlInput && (
        <div className="flex items-center gap-2">
          <Input
            type="url"
            placeholder="Enter URL..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUrlAdd()}
            className="flex-1"
          />
          <Button type="button" size="sm" onClick={handleUrlAdd}>
            Add
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowUrlInput(false)}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Add more buttons */}
      {files.length < maxFiles && !showUrlInput && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            className="gap-1"
          >
            <Upload className="w-4 h-4" />
            Add File
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowUrlInput(true)}
            className="gap-1"
          >
            <Link className="w-4 h-4" />
            Add URL
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(",")}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
