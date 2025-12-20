"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { ChatMessage } from "./chat-message";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, StopCircle, Sparkles, Settings2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FileUploader } from "./file-uploader";
import { ModelSelector } from "./model-selector";
import { StructuredPromptBuilder } from "./structured-prompt-builder";
import { SuggestionPanel, ProgressIndicator } from "./suggestion-panel";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export default function ChatInterface() {
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showPromptBuilder, setShowPromptBuilder] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [pinnedMessages, setPinnedMessages] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, setInput } = useChat({
    api: "/api/chat",
    body: {
      model: selectedModel,
      files: uploadedFiles,
      systemPrompt,
    },
  } as any) as any;

  // Save recent questions to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      const userMessages = messages
        .filter((m: any) => m.role === "user")
        .map((m: any) => m.content)
        .slice(-10);
      try {
        localStorage.setItem("aura-recent-questions", JSON.stringify(userMessages));
      } catch (e) {
        console.error("Failed to save recent questions:", e);
      }
    }
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handlePromptGenerated = (prompt: string) => {
    setSystemPrompt(prompt);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setInput(suggestion);
  };

  const handlePinMessage = (messageId: string, pinned: boolean) => {
    setPinnedMessages((prev) => {
      const next = new Set(prev);
      if (pinned) {
        next.add(messageId);
      } else {
        next.delete(messageId);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <Card className="flex-1 flex flex-col overflow-hidden border-0 shadow-none bg-transparent">
        <div className="flex-1 overflow-y-auto px-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-900/30 dark:to-violet-800/30 rounded-2xl flex items-center justify-center mb-6">
                <Send className="w-8 h-8 text-violet-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Start a new conversation</h3>
              <p className="text-muted-foreground max-w-md mb-8">
                Ask about code, documents, or general knowledge. Use structured prompts for best results.
              </p>
              
              {/* Suggestion Panel for empty state */}
              <div className="w-full max-w-2xl">
                <SuggestionPanel 
                  onSelectSuggestion={handleSuggestionSelect}
                  currentInput={input}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Pinned Messages */}
              {pinnedMessages.size > 0 && (
                <div className="sticky top-0 z-10 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 p-2 mb-4 rounded-lg">
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2">
                    📌 Pinned Responses ({pinnedMessages.size})
                  </p>
                  <div className="space-y-2">
                    {messages
                      .filter((m: any) => pinnedMessages.has(m.id))
                      .map((m: any) => (
                        <div key={`pinned-${m.id}`} className="text-xs bg-white dark:bg-zinc-900 p-2 rounded border">
                          <span className="line-clamp-2">{m.content}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              
              {/* Messages */}
              {messages.map((m: any) => (
                <ChatMessage 
                  key={m.id} 
                  message={m}
                  isPinned={pinnedMessages.has(m.id)}
                  onPin={handlePinMessage}
                />
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="py-4">
                  <ProgressIndicator 
                    stage="generating" 
                    progress={50}
                    tokens={150}
                    estimatedTime={3}
                  />
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-background/80 backdrop-blur-sm">
          {/* Top Controls: Model Selector & System Prompt */}
          <div className="flex items-center gap-2 mb-3 max-w-4xl mx-auto">
            <ModelSelector 
              selectedModelId={selectedModel}
              onModelChange={setSelectedModel}
            />
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPromptBuilder(true)}
              className="gap-1"
            >
              <Settings2 className="w-4 h-4" />
              {systemPrompt ? "Edit Prompt" : "Structured Prompt"}
            </Button>
            
            {systemPrompt && (
              <div className="flex items-center gap-1 px-2 py-1 bg-violet-50 dark:bg-violet-900/20 rounded text-xs text-violet-600 dark:text-violet-400">
                <Sparkles className="w-3 h-3" />
                Custom prompt active
              </div>
            )}
          </div>

          {/* File Uploader */}
          <div className="mb-3 max-w-4xl mx-auto">
            <FileUploader onFilesChange={setUploadedFiles} />
          </div>

          {/* Main Input */}
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-1"
            />
            {isLoading ? (
              <Button type="button" onClick={stop} variant="destructive" size="icon">
                <StopCircle className="w-4 h-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={!input.trim()} size="icon">
                <Send className="w-4 h-4" />
              </Button>
            )}
          </form>
        </div>
      </Card>

      {/* Structured Prompt Builder Modal */}
      {showPromptBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <StructuredPromptBuilder
            onPromptGenerated={handlePromptGenerated}
            onClose={() => setShowPromptBuilder(false)}
          />
        </div>
      )}
    </div>
  );
}
