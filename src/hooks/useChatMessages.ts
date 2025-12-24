"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { Message, Citation } from "@/components/notebook";

interface UseChatMessagesOptions {
  notebookId: string;
  models: Array<{ id: string; modelId: string; provider: string }>;
  selectedModelId: string;
}

interface UseChatMessagesReturn {
  messages: Message[];
  streaming: boolean;
  lastUserMessage: string | null;
  feedbackGiven: Set<string>;
  expandedThinking: Set<string>;
  handleSubmit: (question?: string) => Promise<void>;
  handleFeedback: (messageId: string, type: "up" | "down") => Promise<void>;
  toggleThinking: (messageId: string) => void;
  regenerateLastResponse: () => void;
  clearChat: () => void;
  stopStreaming: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function useChatMessages({
  notebookId,
  models,
  selectedModelId,
}: UseChatMessagesOptions): UseChatMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());
  const [expandedThinking, setExpandedThinking] = useState<Set<string>>(new Set());

  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history from localStorage
  useEffect(() => {
    if (notebookId) {
      const savedMessages = localStorage.getItem(`notebook-chat-${notebookId}`);
      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages);
          setMessages(parsed.map((m: Message) => ({ ...m, timestamp: new Date(m.timestamp) })));
        } catch (e) {
          console.error("Failed to load chat history:", e);
        }
      }
    }
  }, [notebookId]);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (notebookId && messages.length > 0) {
      localStorage.setItem(`notebook-chat-${notebookId}`, JSON.stringify(messages));
    }
  }, [messages, notebookId]);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setStreaming(false);
    }
  }, []);

  const handleSubmit = useCallback(async (question?: string) => {
    const q = question || inputRef.current?.value?.trim() || "";
    if (!q || streaming) return;

    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.style.height = "auto";
    }
    setStreaming(true);
    setLastUserMessage(q);

    // Create abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: q,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Add placeholder assistant message
    const assistantId = `assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      },
    ]);

    try {
      // Get selected model info
      const selectedModel = models.find(m => m.id === selectedModelId);
      
      const res = await fetch(`/api/notebooks/${notebookId}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          saveHistory: true,
          model: selectedModel?.modelId,
          provider: selectedModel?.provider,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error("Query failed");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let citations: Citation[] = [];
      let warning: string | undefined;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });

          // Check for citations delimiter
          if (text.includes("---CITATIONS---")) {
            const [content, citationsJson] = text.split("---CITATIONS---");
            fullContent += content;

            try {
              const metadata = JSON.parse(citationsJson.trim());
              citations = metadata.citations || [];
              warning = metadata.warning;
            } catch {
              // Ignore parse errors
            }
          } else {
            fullContent += text;
          }

          // Update message content
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: fullContent, citations, warning }
                : m
            )
          );
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: m.content + "\n\n*(응답이 중단되었습니다)*" }
              : m
          )
        );
      } else {
        console.error("Query error:", error);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요." }
              : m
          )
        );
      }
    } finally {
      setStreaming(false);
      abortControllerRef.current = null;
      inputRef.current?.focus();
    }
  }, [streaming, notebookId, models, selectedModelId]);

  const handleFeedback = useCallback(async (messageId: string, type: "up" | "down") => {
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          notebookId,
          feedbackType: type,
        }),
      });
      setFeedbackGiven(prev => new Set([...prev, messageId]));
    } catch (e) {
      console.error("Feedback error:", e);
    }
  }, [notebookId]);

  const toggleThinking = useCallback((messageId: string) => {
    setExpandedThinking(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  }, []);

  const regenerateLastResponse = useCallback(() => {
    if (!lastUserMessage || streaming) return;
    
    // Remove last assistant message and user message
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
        newMessages.pop();
      }
      if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'user') {
        newMessages.pop();
      }
      return newMessages;
    });
    
    // Resubmit
    setTimeout(() => handleSubmit(lastUserMessage), 100);
  }, [lastUserMessage, streaming, handleSubmit]);

  const clearChat = useCallback(() => {
    if (confirm("대화 내역을 모두 삭제하시겠습니까?")) {
      setMessages([]);
      localStorage.removeItem(`notebook-chat-${notebookId}`);
    }
  }, [notebookId]);

  return {
    messages,
    streaming,
    lastUserMessage,
    feedbackGiven,
    expandedThinking,
    handleSubmit,
    handleFeedback,
    toggleThinking,
    regenerateLastResponse,
    clearChat,
    stopStreaming,
    inputRef,
  };
}
