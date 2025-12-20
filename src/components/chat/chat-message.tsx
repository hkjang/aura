import { cn } from "@/lib/utils";
import styles from "./chat-message.module.css";
import { Bot, User } from "lucide-react";
// In a real app, use react-markdown
import { Message } from "ai";

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={cn(styles.message, isUser ? styles.user : styles.assistant)}>
      <div className={cn(styles.avatar, isUser ? "bg-slate-200 text-slate-700" : "bg-violet-600 text-white")}>
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>
      <div className={styles.content}>
        <div className="font-semibold mb-1 text-sm text-muted-foreground uppercase">
          {isUser ? "You" : "Aura AI"}
        </div>
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );
}
