"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModelSelector, ModelInfo } from "@/components/chat/model-selector";
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";
import { 
  Bot, 
  Play, 
  Search,
  FileText,
  Mail,
  Code2,
  BarChart3,
  MessageSquare,
  Loader2,
  CheckCircle2,
  Copy,
  Sparkles,
  Clock,
  Zap,
  Brain,
  Wand2,
  History,
  ChevronRight,
  RotateCcw,
  Download,
  Star,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Settings,
  Square,
  ThumbsUp,
  ThumbsDown,
  Timer,
  Wrench,
  Globe,
  Calculator,
  Terminal,
  Link
} from "lucide-react";

// Icon mapping
const ICON_MAP: Record<string, React.ElementType> = {
  Search, FileText, Mail, Code2, BarChart3, MessageSquare, Bot, Brain, Wand2
};

// Model configuration interface
interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  isActive: boolean;
}

interface Agent {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradient?: string;
  category: string;
  tags: string[];
  placeholder?: string;
  systemPrompt: string;
  usageCount: number;
  rating: number;
  isFavorite: boolean;
}

interface Execution {
  id: string;
  agentId: string;
  input: string;
  output: string;
  duration: number;
  status: string;
  createdAt: string;
  agent?: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    color: string;
    gradient?: string;
  };
}

interface Stats {
  totalAgents: number;
  totalExecutions: number;
  activeAgents: number;
  avgRating: number;
}

export default function AgentDashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [input, setInput] = useState("");
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<Execution | null>(null);
  const [recentExecutions, setRecentExecutions] = useState<Execution[]>([]);
  const [copied, setCopied] = useState(false);
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [streamingOutput, setStreamingOutput] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [tokensUsed, setTokensUsed] = useState<{in: number, out: number} | null>(null);
  const [useTools, setUseTools] = useState(true);
  const [toolCalls, setToolCalls] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  
  // Available tools
  const AVAILABLE_TOOLS = [
    { id: 'calculate', name: '계산기', icon: Calculator, desc: '수학 계산' },
    { id: 'web_search', name: '웹 검색', icon: Globe, desc: '정보 검색' },
    { id: 'read_url', name: 'URL 읽기', icon: Link, desc: '웹페이지 읽기' },
    { id: 'execute_code', name: '코드 실행', icon: Terminal, desc: 'JS 실행' },
    { id: 'current_time', name: '시간', icon: Clock, desc: '현재 시간' },
  ];
  
  // Quick start templates
  const QUICK_TEMPLATES = [
    { icon: '💻', label: '코드 작성', prompt: '다음 기능을 구현하는 코드를 작성해 주세요: ' },
    { icon: '📝', label: '문서 요약', prompt: '다음 내용을 핵심만 간략하게 요약해 주세요:\n\n' },
    { icon: '📊', label: '데이터 분석', prompt: '다음 데이터를 분석하고 인사이트를 도출해 주세요:\n\n' },
    { icon: '🔍', label: '웹 검색', prompt: '웹에서 다음 정보를 검색하고 요약해 주세요: ' },
    { icon: '🧮', label: '계산/수학', prompt: '다음 수학 문제를 풀어주세요: ' },
    { icon: '🌐', label: 'URL 분석', prompt: '다음 URL의 내용을 읽고 요약해 주세요: ' },
  ];
  
  // Active tool calls during streaming
  const [activeToolCalls, setActiveToolCalls] = useState<Array<{tool: string, status: 'running' | 'done', startTime: number}>>([]);

  // Load agents and history
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [agentsRes, historyRes, modelsRes] = await Promise.all([
        fetch("/api/agents?stats=true"),
        fetch("/api/agents/history?limit=10"),
        fetch("/api/admin/models")
      ]);
      
      if (agentsRes.ok) {
        const data = await agentsRes.json();
        setAgents(data.agents || []);
        setStats(data.stats || null);
      }
      
      if (historyRes.ok) {
        const data = await historyRes.json();
        setRecentExecutions(data.history || []);
      }
      
      if (modelsRes.ok) {
        const data = await modelsRes.json();
        const activeModels = (data.models || []).filter((m: ModelConfig) => m.isActive);
        setModels(activeModels);
        // Set default model from localStorage or first available
        const savedModel = localStorage.getItem('agent-selected-model');
        if (savedModel && activeModels.find((m: ModelConfig) => m.modelId === savedModel)) {
          setSelectedModelId(savedModel);
        } else if (activeModels.length > 0) {
          setSelectedModelId(activeModels[0].modelId);
        }
      }
    } catch (err) {
      setError("데이터를 불러오는데 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedAgent && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [selectedAgent]);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  const handleExecute = async () => {
    if (!selectedAgent || !input.trim()) return;

    // Reset state
    setExecuting(true);
    setIsStreaming(true);
    setStreamingOutput("");
    setResult(null);
    setElapsedTime(0);
    setTokensUsed(null);
    setToolCalls([]);
    
    // Start timer
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 100) / 10);
    }, 100);
    
    // Create abort controller
    abortControllerRef.current = new AbortController();

    try {
      // Find the selected model config
      const modelConfig = models.find(m => m.modelId === selectedModelId);
      
      // Build system prompt with tool instructions if enabled
      const toolPrompt = useTools 
        ? "\n\n사용 가능한 도구: calculate(수학계산), web_search(웹검색), read_url(URL읽기), execute_code(코드실행), current_time(현재시간). 필요시 도구를 활용하세요."
        : "";
      
      // Call chat API directly for streaming with tool support
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: selectedAgent.systemPrompt + toolPrompt },
            { role: "user", content: input.trim() }
          ],
          provider: modelConfig?.provider,
          model: selectedModelId,
          useAgentTools: useTools  // Enable tool usage based on toggle
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "에이전트 실행에 실패했습니다." }));
        throw new Error(errorData.error || "에이전트 실행에 실패했습니다.");
      }

      // Read streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullOutput = "";
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          fullOutput += chunk;
          
          // Check for usage separator
          const usageSeparator = "\n---USAGE---\n";
          const separatorIndex = fullOutput.indexOf(usageSeparator);
          
          if (separatorIndex !== -1) {
            const displayOutput = fullOutput.substring(0, separatorIndex);
            setStreamingOutput(displayOutput);
            
            // Try to parse usage data
            try {
              const usageJson = fullOutput.substring(separatorIndex + usageSeparator.length);
              const usageData = JSON.parse(usageJson);
              setTokensUsed({ in: usageData.tokensIn || 0, out: usageData.tokensOut || 0 });
            } catch (e) {
              // Ignore parse errors
            }
          } else {
            setStreamingOutput(fullOutput);
          }
        }
      }
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      const duration = Date.now() - startTime;
      
      // Parse final output
      const usageSeparator = "\n---USAGE---\n";
      const sepIdx = fullOutput.indexOf(usageSeparator);
      const finalOutput = sepIdx !== -1 ? fullOutput.substring(0, sepIdx) : fullOutput;
      
      // Save execution to database
      const saveRes = await fetch("/api/agents/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          input: input.trim(),
          provider: modelConfig?.provider,
          model: selectedModelId,
          // Flag to indicate this is just for saving, not executing again
          saveOnly: true,
          output: finalOutput,
          duration
        })
      });
      
      const savedData = await saveRes.json().catch(() => null);
      
      const execution: Execution = {
        id: savedData?.execution?.id || "",
        agentId: selectedAgent.id,
        input: input.trim(),
        output: finalOutput,
        duration,
        status: "SUCCESS",
        createdAt: new Date().toISOString()
      };
      
      setResult(execution);
      setRecentExecutions(prev => [execution, ...prev.slice(0, 9)]);
      
      // Refresh stats
      const statsRes = await fetch("/api/agents?stats=true");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }
    } catch (err) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if ((err as Error).name === 'AbortError') {
        setStreamingOutput(prev => prev + "\n\n[중단됨]");
        setResult({
          id: "",
          agentId: selectedAgent.id,
          input: input,
          output: streamingOutput + "\n\n[중단됨]",
          duration: elapsedTime * 1000,
          status: "CANCELLED",
          createdAt: new Date().toISOString()
        });
      } else {
        setResult({
          id: "",
          agentId: selectedAgent.id,
          input: input,
          output: `오류: ${err instanceof Error ? err.message : "알 수 없는 오류"}`,
          duration: 0,
          status: "ERROR",
          createdAt: new Date().toISOString()
        });
      }
    } finally {
      setExecuting(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };
  
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
  
  const handleRate = async (rating: number) => {
    if (!result?.id) return;
    
    try {
      await fetch(`/api/agents/history/${result.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating })
      });
      
      // Update local result
      setResult(prev => prev ? { ...prev, rating } : null);
    } catch (err) {
      console.error("Failed to rate:", err);
    }
  };

  const handleCopy = async () => {
    if (result?.output) {
      await navigator.clipboard.writeText(result.output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (result?.output) {
      const blob = new Blob([result.output], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedAgent?.name}_결과_${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const toggleFavorite = async (agentId: string, currentlyFavorite: boolean) => {
    try {
      if (currentlyFavorite) {
        await fetch(`/api/agents/favorites?agentId=${agentId}`, { method: "DELETE" });
      } else {
        await fetch("/api/agents/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId })
        });
      }
      
      setAgents(prev => prev.map(a => 
        a.id === agentId ? { ...a, isFavorite: !currentlyFavorite } : a
      ));
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleExecute();
    }
  };

  const getIcon = (iconName: string) => {
    return ICON_MAP[iconName] || Bot;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("ko-KR");
  };

  const favoriteAgents = agents.filter(a => a.isFavorite);
  const otherAgents = agents.filter(a => !a.isFavorite);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '400px',
        gap: '12px',
        color: 'var(--text-secondary)'
      }}>
        <Loader2 style={{ width: '24px', height: '24px', animation: 'spin 1s linear infinite' }} />
        에이전트 로딩 중...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '400px',
        gap: '16px',
        color: 'var(--text-secondary)'
      }}>
        <AlertCircle style={{ width: '48px', height: '48px', color: 'var(--color-error)' }} />
        <p>{error}</p>
        <Button onClick={loadData}>
          <RefreshCw style={{ width: '16px', height: '16px', marginRight: '8px' }} />
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '32px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '32px',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* Hero Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(59, 130, 246, 0.1) 50%, rgba(236, 72, 153, 0.1) 100%)',
        borderRadius: '20px',
        padding: '32px',
        border: '1px solid rgba(124, 58, 237, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse 4s ease-in-out infinite'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(124, 58, 237, 0.3)'
            }}>
              <Brain style={{ width: '28px', height: '28px', color: 'white' }} />
            </div>
            <div>
              <h1 style={{ 
                fontSize: '28px', 
                fontWeight: 700, 
                color: 'var(--text-primary)',
                background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 50%, #ec4899 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                AI 에이전트
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '4px' }}>
                전문화된 AI 에이전트로 작업 효율을 극대화하세요
              </p>
            </div>
          </div>
          
          {/* Stats Row */}
          {stats && (
            <div style={{ display: 'flex', gap: '24px', marginTop: '24px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(124, 58, 237, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Zap style={{ width: '18px', height: '18px', color: '#7c3aed' }} />
                </div>
                <div>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.totalAgents}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>활성 에이전트</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TrendingUp style={{ width: '18px', height: '18px', color: '#3b82f6' }} />
                </div>
                <div>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {stats.totalExecutions.toLocaleString()}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>총 실행 횟수</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(34, 197, 94, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Star style={{ width: '18px', height: '18px', color: '#22c55e' }} />
                </div>
                <div>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '-'}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>평균 평점</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <Card className="p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Wand2 style={{ width: '20px', height: '20px', color: 'var(--color-primary)' }} />
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>사용 방법</h2>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px', 
          fontSize: '13px', 
          color: 'var(--text-secondary)',
          flexWrap: 'wrap'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              width: '24px', height: '24px', borderRadius: '8px', 
              background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontWeight: 700, color: 'white', fontSize: '12px'
            }}>1</span>
            에이전트 선택
          </span>
          <ChevronRight style={{ width: '16px', height: '16px', color: 'var(--text-tertiary)' }} />
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              width: '24px', height: '24px', borderRadius: '8px', 
              background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontWeight: 700, color: 'white', fontSize: '12px'
            }}>2</span>
            작업 내용 입력
          </span>
          <ChevronRight style={{ width: '16px', height: '16px', color: 'var(--text-tertiary)' }} />
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              width: '24px', height: '24px', borderRadius: '8px', 
              background: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontWeight: 700, color: 'white', fontSize: '12px'
            }}>3</span>
            결과 확인 및 활용
          </span>
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Ctrl/⌘ + Enter로 빠른 실행
          </span>
        </div>
      </Card>

      {/* Favorite Agents */}
      {favoriteAgents.length > 0 && (
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star style={{ width: '18px', height: '18px', color: '#f59e0b', fill: '#f59e0b' }} />
            즐겨찾기
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {favoriteAgents.map(agent => {
              const Icon = getIcon(agent.icon);
              const isSelected = selectedAgent?.id === agent.id;
              const isHovered = hoveredAgent === agent.id;
              return (
                <Card 
                  key={agent.id}
                  className="p-4"
                  style={{ 
                    cursor: 'pointer',
                    border: isSelected ? `2px solid ${agent.color}` : '1px solid var(--border-color)',
                    background: isSelected ? `${agent.color}08` : 'var(--bg-primary)',
                    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                    boxShadow: isHovered ? `0 12px 40px ${agent.color}20` : 'none'
                  }}
                  onClick={() => { setSelectedAgent(agent); setInput(""); setResult(null); }}
                  onMouseEnter={() => setHoveredAgent(agent.id)}
                  onMouseLeave={() => setHoveredAgent(null)}
                >
                  <div style={{ display: 'flex', alignItems: 'start', gap: '14px' }}>
                    <div style={{ 
                      width: '48px', height: '48px', borderRadius: '14px', 
                      background: agent.gradient || agent.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, boxShadow: `0 4px 12px ${agent.color}30`
                    }}>
                      <Icon style={{ width: '24px', height: '24px', color: 'white' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '15px' }}>{agent.name}</h3>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(agent.id, true); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                        >
                          <Star style={{ width: '16px', height: '16px', color: '#f59e0b', fill: '#f59e0b' }} />
                        </button>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                        {agent.description}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Zap style={{ width: '12px', height: '12px' }} />
                          {agent.usageCount.toLocaleString()}회
                        </span>
                        {agent.rating > 0 && (
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Star style={{ width: '12px', height: '12px', fill: '#f59e0b', color: '#f59e0b' }} />
                            {agent.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* All Agents */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles style={{ width: '18px', height: '18px', color: 'var(--color-primary)' }} />
          {favoriteAgents.length > 0 ? '모든 에이전트' : '에이전트 선택'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {(favoriteAgents.length > 0 ? otherAgents : agents).map(agent => {
            const Icon = getIcon(agent.icon);
            const isSelected = selectedAgent?.id === agent.id;
            const isHovered = hoveredAgent === agent.id;
            return (
              <Card 
                key={agent.id}
                className="p-4"
                style={{ 
                  cursor: 'pointer',
                  border: isSelected ? `2px solid ${agent.color}` : '1px solid var(--border-color)',
                  background: isSelected ? `${agent.color}08` : 'var(--bg-primary)',
                  transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow: isHovered ? `0 12px 40px ${agent.color}20` : 'none'
                }}
                onClick={() => { setSelectedAgent(agent); setInput(""); setResult(null); }}
                onMouseEnter={() => setHoveredAgent(agent.id)}
                onMouseLeave={() => setHoveredAgent(null)}
              >
                <div style={{ display: 'flex', alignItems: 'start', gap: '14px' }}>
                  <div style={{ 
                    width: '48px', height: '48px', borderRadius: '14px', 
                    background: agent.gradient || agent.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, boxShadow: `0 4px 12px ${agent.color}30`
                  }}>
                    <Icon style={{ width: '24px', height: '24px', color: 'white' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '15px' }}>{agent.name}</h3>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(agent.id, agent.isFavorite); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                      >
                        <Star style={{ 
                          width: '16px', height: '16px', 
                          color: agent.isFavorite ? '#f59e0b' : 'var(--text-tertiary)',
                          fill: agent.isFavorite ? '#f59e0b' : 'none'
                        }} />
                      </button>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                      {agent.description}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                      {agent.tags?.slice(0, 3).map(tag => (
                        <span key={tag} style={{
                          fontSize: '10px', padding: '2px 8px', borderRadius: '10px',
                          background: `${agent.color}15`, color: agent.color, fontWeight: 500
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Zap style={{ width: '12px', height: '12px' }} />
                        {agent.usageCount.toLocaleString()}회
                      </span>
                      {agent.rating > 0 && (
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Star style={{ width: '12px', height: '12px', fill: '#f59e0b', color: '#f59e0b' }} />
                          {agent.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Input & Execution */}
      {selectedAgent && (
        <Card 
          className="p-6" 
          style={{ 
            border: `2px solid ${selectedAgent.color}40`,
            background: `linear-gradient(135deg, ${selectedAgent.color}05 0%, transparent 100%)`,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
            background: selectedAgent.gradient || selectedAgent.color
          }} />
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: selectedAgent.gradient || selectedAgent.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 12px ${selectedAgent.color}30`
              }}>
                {(() => {
                  const Icon = getIcon(selectedAgent.icon);
                  return <Icon style={{ width: '20px', height: '20px', color: 'white' }} />;
                })()}
              </div>
              <div>
                <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '16px' }}>
                  {selectedAgent.name} 에이전트
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  작업을 입력하고 실행하세요
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => { setSelectedAgent(null); setInput(""); setResult(null); }}
            >
              다른 에이전트 선택
            </Button>
          </div>

          {/* Model Selector */}
          {models.length > 0 && (
            <div style={{ 
              marginBottom: '16px', 
              padding: '12px 16px', 
              background: 'var(--bg-secondary)', 
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings style={{ width: '16px', height: '16px', color: 'var(--text-tertiary)' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>사용할 모델</span>
              </div>
              <select
                value={selectedModelId}
                onChange={(e) => {
                  setSelectedModelId(e.target.value);
                  localStorage.setItem('agent-selected-model', e.target.value);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  minWidth: '200px'
                }}
              >
                {models.map(model => (
                  <option key={model.id} value={model.modelId}>
                    {model.name} ({model.provider})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tool Panel */}
          <div style={{ 
            marginBottom: '16px', 
            padding: '12px 16px', 
            background: useTools ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)' : 'var(--bg-secondary)', 
            borderRadius: '10px',
            border: useTools ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid var(--border-color)',
            transition: 'all 200ms'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wrench style={{ width: '16px', height: '16px', color: useTools ? 'var(--color-primary)' : 'var(--text-tertiary)' }} />
                <span style={{ fontSize: '13px', fontWeight: 500, color: useTools ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  도구 사용
                </span>
              </div>
              <button
                onClick={() => setUseTools(!useTools)}
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '12px',
                  background: useTools ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 200ms'
                }}
              >
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '3px',
                  left: useTools ? '23px' : '3px',
                  transition: 'left 200ms',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }} />
              </button>
            </div>
            
            {useTools && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {AVAILABLE_TOOLS.map(tool => (
                  <div
                    key={tool.id}
                    title={tool.desc}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 10px',
                      background: 'var(--bg-primary)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <tool.icon style={{ width: '14px', height: '14px' }} />
                    {tool.name}
                  </div>
                ))}
              </div>
            )}
            
            {!useTools && (
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>
                도구 비활성화됨 - 에이전트가 단순 텍스트 응답만 생성합니다
              </p>
            )}
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedAgent.placeholder || "작업 내용을 입력하세요..."}
            style={{
              width: '100%', minHeight: '140px', padding: '16px', borderRadius: '12px',
              border: '1px solid var(--border-color)', background: 'var(--bg-primary)',
              color: 'var(--text-primary)', fontSize: '14px', resize: 'vertical', lineHeight: 1.7,
              transition: 'border-color 200ms, box-shadow 200ms'
            }}
          />
          
          {/* Quick Templates */}
          {!input && (
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              flexWrap: 'wrap', 
              marginTop: '12px',
              padding: '12px',
              background: 'var(--bg-secondary)',
              borderRadius: '10px',
              border: '1px solid var(--border-color)'
            }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', width: '100%', marginBottom: '6px' }}>
                빠른 시작 템플릿:
              </span>
              {QUICK_TEMPLATES.map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(template.prompt);
                    textareaRef.current?.focus();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 150ms'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <span>{template.icon}</span>
                  {template.label}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', alignItems: 'center' }}>
            {executing ? (
              <>
                <Button 
                  onClick={handleStop}
                  variant="destructive"
                  style={{ flex: 1 }}
                  size="lg"
                >
                  <Square style={{ width: '16px', height: '16px', marginRight: '8px', fill: 'currentColor' }} />
                  중단하기
                </Button>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: 'var(--text-secondary)'
                }}>
                  <Timer style={{ width: '16px', height: '16px', animation: 'pulse 1s infinite' }} />
                  {elapsedTime.toFixed(1)}초
                </div>
              </>
            ) : (
              <>
                <Button 
                  onClick={handleExecute}
                  disabled={!input.trim()}
                  style={{ flex: 1, background: selectedAgent.gradient || selectedAgent.color, border: 'none' }}
                  size="lg"
                >
                  <Play style={{ width: '18px', height: '18px', marginRight: '8px' }} />
                  실행하기
                </Button>
                <Button variant="outline" onClick={() => setInput("")} disabled={!input.trim()}>
                  <RotateCcw style={{ width: '16px', height: '16px' }} />
                </Button>
              </>
            )}
          </div>
          
          {/* Streaming Preview */}
          {isStreaming && streamingOutput && (
            <div style={{ marginTop: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                fontSize: '13px',
                color: 'var(--text-secondary)'
              }}>
                <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                응답 생성 중...
              </div>
              <div style={{ 
                padding: '16px', 
                background: 'var(--bg-secondary)', 
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                maxHeight: '400px',
                overflow: 'auto'
              }}>
                <MarkdownRenderer content={streamingOutput + "▌"} />
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Result */}
      {result && !isStreaming && (
        <Card ref={resultRef} className="p-6" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: result.status === 'ERROR' 
                  ? 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
                  : 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {result.status === 'ERROR' 
                  ? <AlertCircle style={{ width: '18px', height: '18px', color: 'white' }} />
                  : <CheckCircle2 style={{ width: '18px', height: '18px', color: 'white' }} />
                }
              </div>
              <div>
                <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '16px' }}>
                  {result.status === 'ERROR' ? '실행 오류' : '실행 결과'}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  <span>{formatDate(result.createdAt)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock style={{ width: '12px', height: '12px' }} />
                    {(result.duration / 1000).toFixed(1)}초
                  </span>
                  {tokensUsed && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Zap style={{ width: '12px', height: '12px' }} />
                      {tokensUsed.in + tokensUsed.out} 토큰
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Rating buttons */}
              {result.id && result.status === 'SUCCESS' && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleRate(5)}
                    style={{ 
                      color: (result as any).rating === 5 ? '#22c55e' : undefined,
                      borderColor: (result as any).rating === 5 ? '#22c55e' : undefined
                    }}
                  >
                    <ThumbsUp style={{ width: '14px', height: '14px' }} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleRate(1)}
                    style={{ 
                      color: (result as any).rating === 1 ? '#ef4444' : undefined,
                      borderColor: (result as any).rating === 1 ? '#ef4444' : undefined
                    }}
                  >
                    <ThumbsDown style={{ width: '14px', height: '14px' }} />
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <CheckCircle2 style={{ width: '14px', height: '14px' }} /> : <Copy style={{ width: '14px', height: '14px' }} />}
                <span style={{ marginLeft: '6px' }}>{copied ? '복사됨' : '복사'}</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download style={{ width: '14px', height: '14px' }} />
              </Button>
            </div>
          </div>

          <div style={{ 
            padding: '20px', background: 'var(--bg-secondary)', borderRadius: '12px',
            fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.8,
            maxHeight: '600px', overflow: 'auto',
            border: '1px solid var(--border-color)'
          }}>
            <MarkdownRenderer content={result.output} />
          </div>
        </Card>
      )}

      {/* Recent Executions */}
      {recentExecutions.length > 0 && (
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History style={{ width: '18px', height: '18px', color: 'var(--color-primary)' }} />
            최근 실행 기록
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentExecutions.map((exec) => {
              const agentData = exec.agent || agents.find(a => a.id === exec.agentId);
              const Icon = agentData ? getIcon(agentData.icon) : Bot;
              return (
                <Card 
                  key={exec.id || exec.createdAt}
                  className="p-4" 
                  style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', transition: 'all 200ms' }}
                  onClick={() => {
                    const agent = agents.find(a => a.id === exec.agentId);
                    if (agent) {
                      setSelectedAgent(agent);
                      setInput(exec.input);
                      setResult(exec);
                    }
                  }}
                >
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '10px', 
                    background: agentData?.gradient || agentData?.color || 'var(--bg-tertiary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Icon style={{ width: '18px', height: '18px', color: 'white' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {exec.input.substring(0, 60)}{exec.input.length > 60 ? '...' : ''}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      {agentData?.name || '에이전트'} · {formatDate(exec.createdAt)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock style={{ width: '12px', height: '12px' }} />
                      {(exec.duration / 1000).toFixed(1)}초
                    </span>
                    <ChevronRight style={{ width: '16px', height: '16px' }} />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        textarea:focus {
          outline: none;
          border-color: var(--color-primary) !important;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1) !important;
        }
      `}</style>
    </div>
  );
}
