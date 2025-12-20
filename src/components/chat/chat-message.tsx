"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import styles from "./chat-message.module.css";
import { Bot, User, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp } from "lucide-react";
import { FeedbackDialog } from "./feedback-dialog";
import { SourceCitations } from "./source-citations";
import { ConfidenceBar } from "./confidence-bar";
import { UncertaintyAlert, LowConfidenceAlert, SpeculativeAlert } from "./uncertainty-alert";
import { ResponseActions, FollowUpActions } from "./response-actions";

interface LocalMessage {
  id: string;
  role: string;
  content: string;
}

interface ChatMessageProps {
  message: LocalMessage;
  isPinned?: boolean;
  onPin?: (id: string, pinned: boolean) => void;
}

export function ChatMessage({ message, isPinned = false, onPin }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [feedback, setFeedback] = useState<number | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [showExpanded, setShowExpanded] = useState(false);
  const [showAlert, setShowAlert] = useState(true);

  // Mock data - in real app, this would come from message metadata
  const citations = !isUser && message.content.length > 100 ? [
    { id: "1", title: "Internal Policy Guide.pdf", type: "document" as const, relevance: 0.92, page: 15 },
    { id: "2", title: "Company Knowledge Base", type: "database" as const, relevance: 0.85 },
    { id: "3", title: "https://docs.example.com/guide", url: "https://docs.example.com", type: "web" as const, relevance: 0.78 },
  ] : [];
  
  const confidence = 0.85;
  const isLongContent = message.content.length > 500;
  
  // Follow-up suggestions based on content
  const followUpSuggestions = !isUser ? [
    "Tell me more about this",
    "Give me examples",
    "How does this apply to my case?",
  ] : [];

  const handleFeedback = async (rating: number, reason?: string) => {
    setFeedback(rating);
    try {
      await fetch('/api/quality/feedback', {
        method: 'POST',
        body: JSON.stringify({
          messageId: message.id,
          rating,
          reason
        })
      });
      setIsFeedbackOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  // Determine if we should show any alerts
  const showLowConfidenceAlert = !isUser && confidence < 0.6 && showAlert;
  const showSpeculativeAlert = !isUser && message.content.includes("might") && confidence < 0.7 && showAlert;

  return (
    <div className={cn(styles.message, isUser ? styles.user : styles.assistant)}>
      <div className={cn(styles.avatar, isUser ? "bg-slate-200 text-slate-700" : "bg-violet-600 text-white")}>
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>
      <div className={styles.content}>
        <div className="font-semibold mb-1 text-sm text-muted-foreground uppercase flex items-center justify-between">
          <span>{isUser ? "You" : "Aura AI"}</span>
        </div>

        {/* Alerts */}
        {showLowConfidenceAlert && (
          <LowConfidenceAlert onDismiss={() => setShowAlert(false)} />
        )}
        {showSpeculativeAlert && !showLowConfidenceAlert && (
          <SpeculativeAlert onDismiss={() => setShowAlert(false)} />
        )}
        
        {/* Message Content */}
        <div className={cn(
          "whitespace-pre-wrap",
          isLongContent && !showExpanded && "line-clamp-6"
        )}>
          {message.content}
        </div>

        {/* Expand/Collapse for long content */}
        {isLongContent && (
          <button
            onClick={() => setShowExpanded(!showExpanded)}
            className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1 mt-2"
          >
            {showExpanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Show more
              </>
            )}
          </button>
        )}

        {!isUser && (
          <>
            {/* Confidence Bar */}
            <div className="mt-3">
              <ConfidenceBar confidence={confidence} size="sm" showWarning={false} />
            </div>

            {/* Source Citations */}
            <SourceCitations citations={citations} maxVisible={2} />

            {/* Response Actions */}
            <ResponseActions
              messageId={message.id}
              content={message.content}
              isPinned={isPinned}
              onPin={onPin}
            />

            {/* Follow-up Actions */}
            <FollowUpActions
              suggestions={followUpSuggestions}
              onSelect={(s) => console.log("Selected:", s)}
            />
            
            {/* Feedback */}
            <div className="mt-3 flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/50">
              <span className="text-xs text-muted-foreground mr-2">Was this helpful?</span>
              <button 
                onClick={() => handleFeedback(1)}
                className={cn("p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors", feedback === 1 && "text-green-600 bg-green-50")}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setIsFeedbackOpen(true)}
                className={cn("p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors", feedback === -1 && "text-red-600 bg-red-50")}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>

      <FeedbackDialog 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)}
        onSubmit={(reason) => handleFeedback(-1, reason)}
      />
    </div>
  );
}
