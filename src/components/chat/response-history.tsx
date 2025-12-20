"use client";

import { useState } from "react";
import { 
  History, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  RefreshCcw,
  Diff,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResponseVersion {
  id: string;
  content: string;
  timestamp: Date;
  model: string;
  tokens: number;
  reason?: string; // "regenerated" | "edited" | "model_changed"
}

interface ResponseHistoryProps {
  versions: ResponseVersion[];
  currentIndex: number;
  onSelectVersion: (index: number) => void;
  onCompare?: (v1: number, v2: number) => void;
}

export function ResponseHistory({ 
  versions, 
  currentIndex, 
  onSelectVersion,
  onCompare 
}: ResponseHistoryProps) {
  const [expanded, setExpanded] = useState(false);
  
  if (versions.length <= 1) return null;

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const reasonLabels: Record<string, string> = {
    regenerated: "Regenerated",
    edited: "Edited",
    model_changed: "Model Changed",
  };

  return (
    <div className="mt-2 border-t border-zinc-100 dark:border-zinc-800/50 pt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <History className="w-3 h-3" />
        <span>{versions.length} versions</span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {/* Version Navigator */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectVersion(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="h-7 px-2"
            >
              <ArrowLeft className="w-3 h-3" />
            </Button>
            <span className="text-xs text-muted-foreground">
              Version {currentIndex + 1} of {versions.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectVersion(Math.min(versions.length - 1, currentIndex + 1))}
              disabled={currentIndex === versions.length - 1}
              className="h-7 px-2"
            >
              <ArrowRight className="w-3 h-3" />
            </Button>
            
            {onCompare && currentIndex > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCompare(currentIndex - 1, currentIndex)}
                className="h-7 px-2 gap-1 ml-auto"
              >
                <Diff className="w-3 h-3" />
                Compare
              </Button>
            )}
          </div>

          {/* Version List */}
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {versions.map((version, idx) => (
              <button
                key={version.id}
                onClick={() => onSelectVersion(idx)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  idx === currentIndex
                    ? "bg-violet-100 dark:bg-violet-900/30"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">
                    Version {idx + 1}
                    {idx === versions.length - 1 && (
                      <span className="ml-1 text-[10px] text-violet-600">(current)</span>
                    )}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(version.timestamp)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground">{version.model}</span>
                  <span className="text-[10px] text-muted-foreground">{version.tokens} tokens</span>
                  {version.reason && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded">
                      {reasonLabels[version.reason] || version.reason}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple diff viewer component
interface DiffViewerProps {
  oldContent: string;
  newContent: string;
  oldLabel?: string;
  newLabel?: string;
  onClose: () => void;
}

export function DiffViewer({ oldContent, newContent, oldLabel, newLabel, onClose }: DiffViewerProps) {
  // Simple word-level diff visualization
  const getSimpleDiff = () => {
    const oldWords = oldContent.split(/\s+/);
    const newWords = newContent.split(/\s+/);
    
    // This is a simplified diff - in production, use a proper diff algorithm
    const changes: { type: "same" | "added" | "removed"; text: string }[] = [];
    
    let i = 0, j = 0;
    while (i < oldWords.length || j < newWords.length) {
      if (i >= oldWords.length) {
        changes.push({ type: "added", text: newWords[j] });
        j++;
      } else if (j >= newWords.length) {
        changes.push({ type: "removed", text: oldWords[i] });
        i++;
      } else if (oldWords[i] === newWords[j]) {
        changes.push({ type: "same", text: oldWords[i] });
        i++; j++;
      } else {
        changes.push({ type: "removed", text: oldWords[i] });
        changes.push({ type: "added", text: newWords[j] });
        i++; j++;
      }
    }
    
    return changes;
  };

  const changes = getSimpleDiff();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="font-semibold flex items-center gap-2">
            <Diff className="w-4 h-4" />
            Version Comparison
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="flex items-center gap-4 mb-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-200 rounded" />
              Removed ({oldLabel || "Previous"})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-200 rounded" />
              Added ({newLabel || "Current"})
            </span>
          </div>
          
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-sm leading-relaxed">
            {changes.map((change, idx) => (
              <span
                key={idx}
                className={`${
                  change.type === "added" 
                    ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200" 
                    : change.type === "removed"
                    ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 line-through"
                    : ""
                }`}
              >
                {change.text}{" "}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
