"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChatMessage } from "./chat-message";
import { Button } from "@/components/ui/button";
import { Send, StopCircle, Settings2, ArrowUp, History, Plus, Sparkles, AlertTriangle } from "lucide-react";
import { ModelSelector } from "./model-selector";
import { StructuredPromptBuilder } from "./structured-prompt-builder";
import { SuggestionPanel, ProgressIndicator } from "./suggestion-panel";
import { ChatHistory } from "./chat-history";
// UIUX Enhancement Imports
import { SmartAutocomplete } from "./smart-autocomplete";
import { PolicyValidator } from "./policy-validator";
import { FollowUpSuggestions } from "./follow-up-suggestions";
import { PostProcessButtons } from "./post-process-buttons";
import { ETAIndicator } from "@/components/ui/eta-indicator";
import { UsageWarningSystem } from "./usage-warning-system";
import { ThemeToggle, CharacterCounter, VoiceInputButton, KeyboardShortcutsButton, ToastContainer } from "@/components/notebook";

export default function ChatInterface() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Load saved model from localStorage or use default
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('aura-selected-model') || 'gpt-4o';
    }
    return 'gpt-4o';
  });
  const [showPromptBuilder, setShowPromptBuilder] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [pinnedMessages, setPinnedMessages] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  // Thread management
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  
  // Dynamic Model State
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [isModelsLoading, setIsModelsLoading] = useState(true);

  // Load thread from URL
  useEffect(() => {
    const threadId = searchParams.get('thread');
    if (threadId && threadId !== currentThreadId) {
      loadThread(threadId);
    }
  }, [searchParams]);

  const loadThread = async (threadId: string) => {
    try {
      const res = await fetch(`/api/threads/${threadId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.thread.messages.map((m: any) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content
        })));
        setCurrentThreadId(threadId);
      }
    } catch (error) {
      console.error("Failed to load thread:", error);
    }
  };

  const handleSelectThread = (threadId: string) => {
    router.push(`/dashboard/chat?thread=${threadId}`);
    setShowHistory(false);
    // Focus input after state update
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleNewThread = () => {
    setMessages([]);
    setCurrentThreadId(null);
    router.push('/dashboard/chat');
    setShowHistory(false);
    // Focus input after state update
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch("/api/admin/models");
        if (res.ok) {
          const data = await res.json();
          const mappedModels = data.models.map((m: any) => ({
             id: m.modelId,
             name: m.name,
             provider: m.provider,
             description: `${m.provider} model (${m.modelId})`,
             speed: "medium",
             cost: "medium",
             capabilities: ["text", "code"],
             contextWindow: 128000,
             recommended: false
          }));
          
          if (mappedModels.length > 0) {
            setAvailableModels(mappedModels);
            // Check if saved model exists in available models
            const savedModel = localStorage.getItem('aura-selected-model');
            if (savedModel && mappedModels.find((m: any) => m.id === savedModel)) {
              setSelectedModel(savedModel);
            } else if (!mappedModels.find((m: any) => m.id === selectedModel)) {
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
  }, []);
  
  // Local input state for controlled input
  const [inputValue, setInputValue] = useState("");
  
  // Reasoning effort for GPT-OSS models
  const [reasoningEffort, setReasoningEffort] = useState<'low' | 'medium' | 'high'>('medium');
  const isReasoningModel = selectedModel.toLowerCase().includes('gpt-oss') || selectedModel.toLowerCase().includes('deepseek-r1');
  
  // Chat state
  const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string; tokensIn?: number; tokensOut?: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Stop generation
  const stop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  // Save message to thread
  const saveMessageToThread = async (threadId: string, role: string, content: string) => {
    try {
      await fetch(`/api/threads/${threadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, content })
      });
    } catch (error) {
      console.error("Failed to save message:", error);
    }
  };

  // Create thread if needed
  const ensureThread = async (): Promise<string> => {
    if (currentThreadId) return currentThreadId;
    
    try {
      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '새 대화' })
      });
      const data = await res.json();
      const newThreadId = data.thread.id;
      setCurrentThreadId(newThreadId);
      router.push(`/dashboard/chat?thread=${newThreadId}`, { scroll: false });
      return newThreadId;
    } catch (error) {
      console.error("Failed to create thread:", error);
      return '';
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
    
    // Ensure we have a thread
    const threadId = await ensureThread();
    
    // Save user message to DB
    if (threadId) {
      saveMessageToThread(threadId, 'user', content);
    }
    
    try {
      abortControllerRef.current = new AbortController();
      
      const currentProvider = availableModels.find((m: any) => m.id === selectedModel)?.provider || "openai";
      
      console.log("DEBUG: Sending with systemPrompt:", systemPrompt);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          model: selectedModel,
          provider: currentProvider,
          systemPrompt,
          ...(isReasoningModel && { reasoningEffort })
        }),
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        // Handle policy violation errors specially
        if (response.status === 403) {
          try {
            const errorData = await response.json();
            const policyMessage = errorData.error || "정책에 의해 요청이 차단되었습니다.";
            
            // Update assistant message to show policy warning
            setMessages(prev => prev.map(m => 
              m.id === assistantMessage.id 
                ? { 
                    ...m, 
                    content: `⚠️ **AI 거버넌스 정책 위반**\n\n${policyMessage}\n\n> 이 메시지는 조직의 AI 사용 정책에 의해 차단되었습니다. 정책을 우회하려고 하지 마세요.\n\n관련 정책 확인: [거버넌스 대시보드](/dashboard/governance)`,
                    isPolicyViolation: true 
                  }
                : m
            ));
            setIsLoading(false);
            return;
          } catch {
            // Fall through to generic error
          }
        }
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
          
          // Check for usage delimiter and parse
          const usageDelimiter = '\n---USAGE---\n';
          const usageIndex = fullContent.indexOf(usageDelimiter);
          
          if (usageIndex === -1) {
            // No usage data yet, show full content
            setMessages(prev => prev.map(m => 
              m.id === assistantMessage.id 
                ? { ...m, content: fullContent }
                : m
            ));
          } else {
            // Found usage data, split content
            const textContent = fullContent.substring(0, usageIndex);
            const usageJson = fullContent.substring(usageIndex + usageDelimiter.length);
            
            try {
              const usage = JSON.parse(usageJson);
              setMessages(prev => prev.map(m => 
                m.id === assistantMessage.id 
                  ? { ...m, content: textContent, tokensIn: usage.tokensIn, tokensOut: usage.tokensOut }
                  : m
              ));
              fullContent = textContent; // For saving to DB
            } catch (e) {
              // JSON not complete yet, keep streaming
              setMessages(prev => prev.map(m => 
                m.id === assistantMessage.id 
                  ? { ...m, content: fullContent }
                  : m
              ));
            }
          }
        }
      }
      
      // Save assistant message to DB after completion
      if (threadId && fullContent) {
        saveMessageToThread(threadId, 'assistant', fullContent);
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
    <>
      {/* History Sidebar Drawer */}
      {showHistory && (
        <>
          <div 
            onClick={() => setShowHistory(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.3)',
              zIndex: 40
            }}
          />
          <div style={{
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            width: '280px',
            zIndex: 50,
            boxShadow: 'var(--shadow-lg)'
          }}>
            <ChatHistory 
              currentThreadId={currentThreadId}
              onSelectThread={handleSelectThread}
              onNewThread={handleNewThread}
            />
          </div>
        </>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
        {/* Action Buttons - FAB style */}
        <div style={{
          position: 'fixed',
          left: 'calc(var(--sidebar-width) + 20px)',
          bottom: '140px',
          display: 'flex',
          gap: '12px',
          zIndex: 35
        }}>
          {/* New Chat Button */}
          <button
            onClick={handleNewThread}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: 'var(--color-success)',
              border: 'none',
              borderRadius: '24px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              transition: 'all 150ms ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Plus style={{ width: '18px', height: '18px' }} />
            새 대화
          </button>

          {/* History Button */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: 'var(--color-primary)',
              border: 'none',
              borderRadius: '24px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              transition: 'all 150ms ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <History style={{ width: '18px', height: '18px' }} />
            대화 이력
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>

        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: '48px', paddingBottom: '200px' }}>
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
                  <ETAIndicator 
                    modelId={selectedModel}
                    estimatedTokens={Math.max(100, inputValue.length * 2)}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            )}
            
            {/* Follow-up Suggestions after last message */}
            {!isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && (
              <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px 24px' }}>
                <FollowUpSuggestions 
                  messages={messages.map(m => ({ id: m.id, role: m.role, content: m.content }))}
                  onSelectSuggestion={(suggestion) => setInputValue(suggestion)}
                />
              </div>
            )}
            
            {/* Post-process buttons for last assistant message */}
            {!isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && (
              <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px 16px' }}>
                <PostProcessButtons 
                  content={messages[messages.length - 1].content}
                  title="AI 응답"
                />
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
              onModelChange={(model) => {
                setSelectedModel(model);
                localStorage.setItem('aura-selected-model', model);
              }}
              models={availableModels.length > 0 ? availableModels : undefined}
            />
            
            {/* Reasoning Effort Selector for GPT-OSS */}
            {isReasoningModel && (
              <select
                value={reasoningEffort}
                onChange={(e) => setReasoningEffort(e.target.value as 'low' | 'medium' | 'high')}
                style={{
                  padding: '10px 12px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                <option value="low">🧠 추론: 낮음</option>
                <option value="medium">🧠 추론: 중간</option>
                <option value="high">🧠 추론: 높음</option>
              </select>
            )}
            
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

          {/* Usage Warning System */}
          {inputValue.length > 20 && (
            <div style={{ marginBottom: '12px' }}>
              <UsageWarningSystem 
                prompt={inputValue}
                selectedModel={selectedModel}
              />
            </div>
          )}

          {/* Smart Autocomplete */}
          {inputValue.length > 5 && (
            <div style={{ marginBottom: '12px' }}>
              <SmartAutocomplete 
                inputValue={inputValue}
                onSuggestionSelect={(suggestion) => setInputValue(suggestion)}
              />
            </div>
          )}

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
                ref={inputRef}
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
              
              {/* Voice Input */}
              <VoiceInputButton 
                onTranscript={(text) => setInputValue(prev => prev + ' ' + text)}
                disabled={isLoading}
              />
            </div>
            
            {/* Character Counter & Shortcuts */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <CharacterCounter value={inputValue} maxLength={4000} />
              <KeyboardShortcutsButton />
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
    <ToastContainer />
    </>
  );
}
