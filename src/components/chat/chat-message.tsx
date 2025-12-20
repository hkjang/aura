import { useState } from "react";
import { cn } from "@/lib/utils";
import styles from "./chat-message.module.css";
import { Bot, User, ThumbsUp, ThumbsDown, CheckCircle2 } from "lucide-react";
import { FeedbackDialog } from "./feedback-dialog";
import { CitationList } from "./citation-list";

interface LocalMessage {
  id: string;
  role: string;
  content: string;
}

export function ChatMessage({ message }: { message: LocalMessage }) {
  const isUser = message.role === "user";
  const [feedback, setFeedback] = useState<number | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Mock citations data (would come from message metadata in real app)
  // const citations = (message as any).citations || [];
  const citations = !isUser && message.content.length > 50 ? [{ url: "https://example.com/doc", title: "Internal Policy.pdf" }] : [];
  
  // Mock confidence
  const confidence = 0.96;

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

  return (
    <div className={cn(styles.message, isUser ? styles.user : styles.assistant)}>
      <div className={cn(styles.avatar, isUser ? "bg-slate-200 text-slate-700" : "bg-violet-600 text-white")}>
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>
      <div className={styles.content}>
        <div className="font-semibold mb-1 text-sm text-muted-foreground uppercase flex items-center justify-between">
          <span>{isUser ? "You" : "Aura AI"}</span>
          {!isUser && (
            <span className="flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full border border-green-100">
              <CheckCircle2 className="w-3 h-3" />
              {Math.floor(confidence * 100)}% Confidence
            </span>
          )}
        </div>
        
        <div className="whitespace-pre-wrap">{message.content}</div>

        {!isUser && (
          <>
            <CitationList citations={citations} />
            
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
