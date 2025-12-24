"use client";

import { BarChart3, MessageSquare, Clock, FileText } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ConversationStatsProps {
  messages: Message[];
}

export function ConversationStats({ messages }: ConversationStatsProps) {
  const userMessages = messages.filter((m) => m.role === "user").length;
  const assistantMessages = messages.filter((m) => m.role === "assistant").length;
  const totalWords = messages.reduce((acc, m) => acc + (m.content?.split(/\s+/).length || 0), 0);
  
  const duration = messages.length >= 2
    ? Math.round((new Date(messages[messages.length - 1].timestamp).getTime() - new Date(messages[0].timestamp).getTime()) / 60000)
    : 0;

  if (messages.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "8px 16px",
        borderRadius: "8px",
        background: "var(--bg-secondary)",
        fontSize: "12px",
        color: "var(--text-tertiary)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }} title="총 메시지">
        <MessageSquare style={{ width: "14px", height: "14px" }} />
        <span>{messages.length}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }} title="총 단어 수">
        <FileText style={{ width: "14px", height: "14px" }} />
        <span>{totalWords.toLocaleString()}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }} title="대화 시간">
        <Clock style={{ width: "14px", height: "14px" }} />
        <span>{duration}분</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }} title="질문/답변 비율">
        <BarChart3 style={{ width: "14px", height: "14px" }} />
        <span>{userMessages} / {assistantMessages}</span>
      </div>
    </div>
  );
}
