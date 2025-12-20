"use client";

import { useState, useEffect, useRef } from "react";
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
  
  // Dynamic Model State
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [isModelsLoading, setIsModelsLoading] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch("/api/admin/models");
        if (res.ok) {
          const data = await res.json();
          // Transform API models to ModelInfo format
          const mappedModels = data.models.map((m: any) => ({
             id: m.modelId, // Use the actual model ID (e.g. gpt-4) for the API
             name: m.name,
             provider: m.provider,
             description: `${m.provider} model (${m.modelId})`,
             speed: "medium", // Default
             cost: "medium",  // Default
             capabilities: ["text", "code"], // Default
             contextWindow: 128000, // Default
             recommended: false
          }));
          
          if (mappedModels.length > 0) {
            setAvailableModels(mappedModels);
            // Ensure selected model is valid
            if (!mappedModels.find((m: any) => m.id === selectedModel)) {
              setSelectedModel(mappedModels[0].id);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch models:", error);
      } finally {
        setIsModelsLoading(false);
      }
    };

    fetchModels();
  }, []); // Run once on mount
  
  // Local input state for controlled input
  const [inputValue, setInputValue] = useState("");
  
  // Chat state - managed locally since useChat hook is unreliable
  const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Stop generation
  const stop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  // Handle sending message 
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    const content = inputValue;
    const userMessage = { id: `user-${Date.now()}`, role: 'user' as const, content };
    
    setInputValue(""); // Clear immediately
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    const assistantMessage = { id: `assistant-${Date.now()}`, role: 'assistant' as const, content: '' };
    setMessages(prev => [...prev, assistantMessage]);
    
    try {
      abortControllerRef.current = new AbortController();
      
      const currentProvider = availableModels.find((m: any) => m.id === selectedModel)?.provider || "openai";
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          model: selectedModel,
          provider: currentProvider,
          systemPrompt
        }),
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          
          // Update the assistant message with streaming content
          setMessages(prev => prev.map(m => 
            m.id === assistantMessage.id 
              ? { ...m, content: fullContent }
              : m
          ));
        }
      }
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error("Failed to send:", error);
        // Remove the empty assistant message on error
        setMessages(prev => prev.filter(m => m.id !== assistantMessage.id));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    setInputValue(suggestion);
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
                currentInput={inputValue}
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
        zIndex: 30 // Below modals (modals use 50)
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
              models={availableModels.length > 0 ? availableModels : undefined}
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
          <form onSubmit={handleSendMessage}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              background: 'var(--bg-primary)',
              border: '2px solid var(--border-color-strong)',
              borderRadius: 'var(--radius-xl)',
              padding: '8px 12px',
              transition: 'border-color 150ms ease',
              position: 'relative',
              zIndex: 31, // Slightly above input container
            }}>
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Aura에게 메시지 보내기..."
                rows={1}
                disabled={false} // Explicitly enable
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
                disabled={!inputValue.trim() && !isLoading}
                onClick={isLoading ? stop : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '44px',
                  height: '44px',
                  background: inputValue.trim() || isLoading ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                  color: inputValue.trim() || isLoading ? 'var(--color-white)' : 'var(--text-tertiary)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: inputValue.trim() || isLoading ? 'pointer' : 'not-allowed',
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
