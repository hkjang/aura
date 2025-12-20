"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { ChatMessage } from "./chat-message";
import { Button } from "@/components/ui/button";
import { Send, StopCircle, Settings2, ArrowUp } from "lucide-react";
import { ModelSelector } from "./model-selector";
import { StructuredPromptBuilder } from "./structured-prompt-builder";
import { SuggestionPanel, ProgressIndicator } from "./suggestion-panel";

export default function ChatInterface() {
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [showPromptBuilder, setShowPromptBuilder] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [pinnedMessages, setPinnedMessages] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, setInput } = useChat({
    api: "/api/chat",
    body: {
      model: selectedModel,
      systemPrompt,
    },
  } as any) as any;

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSuggestionSelect = (suggestion: string) => {
    setInput(suggestion);
  };

  const handlePinMessage = (messageId: string, pinned: boolean) => {
    setPinnedMessages((prev) => {
      const next = new Set(prev);
      if (pinned) next.add(messageId);
      else next.delete(messageId);
      return next;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {messages.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%', 
            textAlign: 'center',
            padding: '40px 24px',
            paddingBottom: '160px'
          }}>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: 700, 
              marginBottom: '16px',
              color: 'var(--text-primary)'
            }}>
              무엇을 도와드릴까요?
            </h1>
            <p style={{ 
              color: 'var(--text-secondary)', 
              maxWidth: '500px', 
              marginBottom: '48px',
              fontSize: '16px',
              lineHeight: 1.7,
              fontWeight: 400
            }}>
              코드, 문서, 또는 필요한 모든 주제에 대해 질문해 주세요.
            </p>
            
            <div style={{ width: '100%', maxWidth: '700px' }}>
              <SuggestionPanel 
                onSelectSuggestion={handleSuggestionSelect}
                currentInput={input}
              />
            </div>
          </div>
        ) : (
          <div style={{ paddingBottom: '160px' }}>
            {messages.map((m: any, i: number) => (
              <div 
                key={m.id} 
                style={{ 
                  background: i % 2 === 1 ? 'var(--bg-secondary)' : 'transparent',
                  borderBottom: '1px solid var(--border-color)'
                }}
              >
                <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
                  <ChatMessage 
                    message={m}
                    isPinned={pinnedMessages.has(m.id)}
                    onPin={handlePinMessage}
                  />
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
                  <ProgressIndicator 
                    stage="generating" 
                    progress={50}
                    tokens={150}
                    estimatedTime={3}
                  />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        marginLeft: 'var(--sidebar-width)',
        background: 'var(--bg-primary)',
        borderTop: '1px solid var(--border-color)',
        padding: '20px 24px',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Controls */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '16px',
            flexWrap: 'wrap'
          }}>
            <ModelSelector 
              selectedModelId={selectedModel}
              onModelChange={setSelectedModel}
            />
            
            <button
              type="button"
              onClick={() => setShowPromptBuilder(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
            >
              <Settings2 style={{ width: '16px', height: '16px' }} />
              {systemPrompt ? "프롬프트 수정" : "설정"}
            </button>
            
            {systemPrompt && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'var(--color-primary-light)',
                borderRadius: 'var(--radius-full)',
                fontSize: '13px',
                color: 'var(--color-primary)',
                fontWeight: 600,
                border: '1px solid var(--color-primary)'
              }}>
                ✓ 커스텀 프롬프트 적용됨
              </span>
            )}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSubmit}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              background: 'var(--bg-primary)',
              border: '2px solid var(--border-color-strong)',
              borderRadius: 'var(--radius-xl)',
              padding: '8px 12px',
              transition: 'border-color 150ms ease'
            }}>
              <textarea
                value={input || ""}
                onChange={handleInputChange as any}
                placeholder="Aura에게 메시지 보내기..."
                rows={1}
                style={{
                  flex: 1,
                  resize: 'none',
                  background: 'transparent',
                  border: 'none',
                  padding: '10px 12px',
                  fontSize: '15px',
                  fontWeight: 400,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  maxHeight: '200px',
                  minHeight: '48px',
                  lineHeight: 1.6
                }}
                onFocus={(e) => {
                  e.currentTarget.parentElement!.style.borderColor = 'var(--color-primary)';
                }}
                onBlur={(e) => {
                  e.currentTarget.parentElement!.style.borderColor = 'var(--border-color-strong)';
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 200) + 'px';
                }}
              />
              
              <button
                type={isLoading ? "button" : "submit"}
                disabled={!(input || "").trim() && !isLoading}
                onClick={isLoading ? stop : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '44px',
                  height: '44px',
                  background: (input || "").trim() || isLoading ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                  color: (input || "").trim() || isLoading ? 'var(--color-white)' : 'var(--text-tertiary)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: (input || "").trim() || isLoading ? 'pointer' : 'not-allowed',
                  transition: 'all 150ms ease'
                }}
              >
                {isLoading ? (
                  <StopCircle style={{ width: '20px', height: '20px' }} />
                ) : (
                  <ArrowUp style={{ width: '20px', height: '20px' }} />
                )}
              </button>
            </div>
            
            <p style={{ 
              textAlign: 'center', 
              fontSize: '12px', 
              fontWeight: 500,
              color: 'var(--text-tertiary)', 
              marginTop: '12px' 
            }}>
              Aura는 실수할 수 있습니다. 중요한 정보는 확인해 주세요.
            </p>
          </form>
        </div>
      </div>

      {/* Prompt Builder Modal */}
      {showPromptBuilder && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)'
        }}>
          <StructuredPromptBuilder
            onPromptGenerated={(prompt) => {
              setSystemPrompt(prompt);
              setShowPromptBuilder(false);
            }}
            onClose={() => setShowPromptBuilder(false)}
          />
        </div>
      )}
    </div>
  );
}
