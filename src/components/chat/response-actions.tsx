"use client";

import { useState } from "react";
import {
  Pin,
  PinOff,
  Copy,
  Check,
  Share2,
  RefreshCcw,
  Download,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Edit3,
  Bookmark,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResponseActionsProps {
  messageId: string;
  content: string;
  isPinned?: boolean;
  onPin?: (id: string, pinned: boolean) => void;
  onRetry?: () => void;
  onEdit?: () => void;
  showExpanded?: boolean;
  setShowExpanded?: (v: boolean) => void;
}

export function ResponseActions({
  messageId,
  content,
  isPinned = false,
  onPin,
  onRetry,
  onEdit,
  showExpanded,
  setShowExpanded,
}: ResponseActionsProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `response-${messageId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "AI Response",
          text: content,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="flex items-center gap-1 mt-2">
      {/* Primary Actions */}
      <Button
        type="button" 
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-7 px-2 text-xs gap-1"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3 text-green-500" />
            Copied
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" />
            Copy
          </>
        )}
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onPin?.(messageId, !isPinned)}
        className={`h-7 px-2 text-xs gap-1 ${isPinned ? "text-amber-500" : ""}`}
      >
        {isPinned ? (
          <>
            <Pin className="w-3 h-3 fill-amber-500" />
            Pinned
          </>
        ) : (
          <>
            <PinOff className="w-3 h-3" />
            Pin
          </>
        )}
      </Button>

      {/* Expand/Collapse for long responses */}
      {setShowExpanded && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowExpanded(!showExpanded)}
          className="h-7 px-2 text-xs gap-1"
        >
          {showExpanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Collapse
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              Expand
            </>
          )}
        </Button>
      )}

      {/* More Menu */}
      <div className="relative">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowMenu(!showMenu)}
          className="h-7 px-2"
        >
          <MoreHorizontal className="w-3 h-3" />
        </Button>

        {showMenu && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 py-1 min-w-[140px]">
              {onRetry && (
                <button
                  onClick={() => {
                    onRetry();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Regenerate
                </button>
              )}
              
              {onEdit && (
                <button
                  onClick={() => {
                    onEdit();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
              )}
              
              <button
                onClick={() => {
                  handleShare();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              
              <button
                onClick={() => {
                  handleDownload();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>

              <div className="my-1 border-t border-zinc-200 dark:border-zinc-800" />
              
              <button
                onClick={() => setShowMenu(false)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <Bookmark className="w-4 h-4" />
                Save to Library
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Follow-up action suggestions
interface FollowUpActionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export function FollowUpActions({ suggestions, onSelect }: FollowUpActionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/50">
      <p className="text-xs text-muted-foreground mb-2">Suggested follow-ups:</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(suggestion)}
            className="px-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 rounded-lg transition-colors flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
