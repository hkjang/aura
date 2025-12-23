"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Settings, Plus, Trash, Trash2, Server, Key, Check, Loader2, ExternalLink, Scale, Cpu, Link2, BarChart, FileText, Layers, Database, Star, ToggleRight, ToggleLeft } from "lucide-react";

// ============ Interfaces ============
interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  baseUrl?: string;
  isActive: boolean;
}

interface SystemConfig {
  key: string;
  value: string;
  description?: string;
}

interface ScoringWeights {
  lengthMax: number;
  speedMax: number;
  relevanceMax: number;
  formatMax: number;
  baseScore: number;
}

// ============ Tab Definitions ============
const TABS = [
  { id: 'models', label: 'AI 모델', icon: Cpu, description: 'AI 모델 연결 설정' },
  { id: 'embedding', label: '임베딩', icon: Layers, description: '임베딩 프로바이더 및 모델' },
  { id: 'vectordb', label: '벡터 DB', icon: Database, description: '벡터 데이터베이스 연결' },
  { id: 'external', label: '외부 서비스', icon: Link2, description: 'API 키 및 외부 연동' },
  { id: 'summarize', label: '문서 요약', icon: FileText, description: '요약 모델 및 프롬프트' },
  { id: 'scoring', label: '비교 설정', icon: BarChart, description: '모델 비교 점수 가중치' },
] as const;

type TabId = typeof TABS[number]['id'];

// ============ Model Settings Tab ============
function ModelSettingsTab() {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [newModel, setNewModel] = useState({
    name: "",
    provider: "openai",
    modelId: "",
    baseUrl: "",
    apiKey: ""
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchModels = async () => {
    try {
      const res = await fetch("/api/admin/models");
      if (res.ok) {
        const data = await res.json();
        setModels(data.models);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleEdit = (model: ModelConfig) => {
    setEditingId(model.id);
    setNewModel({
      name: model.name,
      provider: model.provider,
      modelId: model.modelId,
      baseUrl: model.baseUrl || "",
      apiKey: ""
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewModel({ name: "", provider: "openai", modelId: "", baseUrl: "", apiKey: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/models/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newModel)
        });
        if (res.ok) {
          fetchModels();
          handleCancelEdit();
        }
      } else {
        const res = await fetch("/api/admin/models", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newModel)
        });
        if (res.ok) {
          fetchModels();
          setNewModel({ name: "", provider: "openai", modelId: "", baseUrl: "", apiKey: "" });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await fetch(`/api/admin/models/${id}`, { method: "DELETE" });
    fetchModels();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
      {/* Model List */}
      <div>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Server style={{ width: '16px', height: '16px' }} /> 등록된 모델
        </h3>
        {loading ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>로딩 중...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {models.map(m => (
              <div key={m.id} style={{ 
                padding: '16px', 
                background: editingId === m.id ? 'var(--bg-tertiary)' : 'var(--bg-secondary)', 
                border: editingId === m.id ? '1px solid var(--color-primary)' : '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-lg)',
                transition: 'all 0.2s',
                opacity: m.isActive ? 1 : 0.6,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{m.name}</span>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontSize: '11px', 
                      fontWeight: 500,
                      background: m.isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(156, 163, 175, 0.15)',
                      color: m.isActive ? '#22c55e' : '#9ca3af',
                    }}>
                      {m.isActive ? '활성' : '비활성'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={async () => {
                        await fetch(`/api/admin/models/${m.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ isActive: !m.isActive }),
                        });
                        fetchModels();
                      }} 
                      style={{ color: m.isActive ? '#22c55e' : 'var(--text-secondary)' }}
                      title={m.isActive ? '비활성화' : '활성화'}
                    >
                      <Check style={{ width: '14px', height: '14px' }} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(m)} style={{ color: 'var(--text-secondary)' }}>
                      <Settings style={{ width: '14px', height: '14px' }} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)} style={{ color: 'var(--color-error)' }}>
                      <Trash style={{ width: '14px', height: '14px' }} />
                    </Button>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                  <span>제공자: <strong>{m.provider}</strong></span>
                  <span>모델 ID: <strong>{m.modelId}</strong></span>
                  <span style={{ gridColumn: 'span 2' }}>URL: {m.baseUrl || "기본값"}</span>
                </div>
              </div>
            ))}
            {models.length === 0 && (
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', padding: '20px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                등록된 모델이 없습니다
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Form */}
      <form onSubmit={handleSubmit} style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px', 
        padding: '20px', 
        background: 'var(--bg-secondary)', 
        border: '1px solid var(--border-color)', 
        borderRadius: 'var(--radius-lg)',
        height: 'fit-content'
      }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {editingId ? "모델 수정" : "새 모델 추가"}
        </h3>
        <Input 
          placeholder="표시 이름 (예: GPT-4, Llama 3)" 
          value={newModel.name}
          onChange={e => setNewModel({...newModel, name: e.target.value})}
          required
        />
        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            className="select-trigger"
            style={{ flex: 1 }}
            value={newModel.provider}
            onChange={e => setNewModel({...newModel, provider: e.target.value})}
          >
            <option value="openai">OpenAI</option>
            <option value="ollama">Ollama</option>
            <option value="vllm">vLLM</option>
          </select>
          <Input 
            placeholder="모델 ID" 
            value={newModel.modelId}
            onChange={e => setNewModel({...newModel, modelId: e.target.value})}
            required
            style={{ flex: 1 }}
          />
        </div>
        <Input 
          placeholder="Base URL (선택)" 
          value={newModel.baseUrl}
          onChange={e => setNewModel({...newModel, baseUrl: e.target.value})}
        />
        <Input 
          type="password"
          placeholder={editingId ? "API 키 (변경시에만)" : "API 키 (선택)"}
          value={newModel.apiKey}
          onChange={e => setNewModel({...newModel, apiKey: e.target.value})}
        />
        
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <Button type="submit" style={{ flex: 1 }}>
            {editingId ? "수정 저장" : (
              <><Plus style={{ width: '16px', height: '16px', marginRight: '8px' }} /> 추가</>
            )}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={handleCancelEdit}>취소</Button>
          )}
        </div>
      </form>
    </div>
  );
}

// ============ External Services Tab ============
const DEFAULT_UPSTAGE_URL = "https://api.upstage.ai/v1/document-digitization";

function ExternalServicesTab() {
  const [upstageKey, setUpstageKey] = useState("");
  const [upstageUrl, setUpstageUrl] = useState(DEFAULT_UPSTAGE_URL);
  const [upstageKeySaved, setUpstageKeySaved] = useState(false);
  const [upstageUrlSaved, setUpstageUrlSaved] = useState(false);
  const [savingUpstage, setSavingUpstage] = useState(false);
  const [savingUrl, setSavingUrl] = useState(false);
  const [upstageKeyExists, setUpstageKeyExists] = useState(false);

  useEffect(() => {
    fetch("/api/admin/system-config")
      .then(res => res.json())
      .then(data => {
        const keyConfig = data.configs?.find((c: SystemConfig) => c.key === 'UPSTAGE_API_KEY');
        if (keyConfig?.value) setUpstageKeyExists(true);
        
        const urlConfig = data.configs?.find((c: SystemConfig) => c.key === 'UPSTAGE_API_URL');
        if (urlConfig?.value && !urlConfig.value.includes('***')) {
          setUpstageUrl(urlConfig.value);
        }
      })
      .catch(console.error);
  }, []);

  const handleSaveUpstageKey = async () => {
    if (!upstageKey) return;
    setSavingUpstage(true);
    try {
      const res = await fetch("/api/admin/system-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "UPSTAGE_API_KEY",
          value: upstageKey,
          description: "Upstage Document Parsing API Key"
        })
      });
      if (res.ok) {
        setUpstageKeySaved(true);
        setUpstageKeyExists(true);
        setUpstageKey("");
        setTimeout(() => setUpstageKeySaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingUpstage(false);
    }
  };

  const handleSaveUpstageUrl = async () => {
    setSavingUrl(true);
    try {
      const res = await fetch("/api/admin/system-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "UPSTAGE_API_URL",
          value: upstageUrl,
          description: "Upstage Document Parsing API URL"
        })
      });
      if (res.ok) {
        setUpstageUrlSaved(true);
        setTimeout(() => setUpstageUrlSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingUrl(false);
    }
  };

  const handleClearUpstageKey = async () => {
    if (!confirm("Upstage API 키를 삭제하시겠습니까?")) return;
    try {
      const res = await fetch("/api/admin/system-config?key=UPSTAGE_API_KEY", { method: "DELETE" });
      if (res.ok) setUpstageKeyExists(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ maxWidth: '700px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* API Key Section */}
      <div style={{ 
        padding: '20px', 
        background: 'var(--bg-secondary)', 
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ 
            width: '44px', height: '44px', borderRadius: '12px', 
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: '14px'
          }}>UP</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '15px' }}>Upstage Document AI</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>PDF/이미지 OCR 및 문서 파싱</p>
          </div>
          <a 
            href="https://console.upstage.ai" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ fontSize: '12px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            API 키 발급 <ExternalLink style={{ width: '12px', height: '12px' }} />
          </a>
        </div>

        {upstageKeyExists && (
          <div style={{ 
            padding: '12px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px',
            border: '1px solid rgba(34, 197, 94, 0.3)', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <Check style={{ width: '16px', height: '16px', color: 'var(--color-success)' }} />
            <span style={{ fontSize: '13px', color: 'var(--color-success)' }}>API 키가 설정되어 있습니다</span>
            <Button variant="ghost" size="sm" onClick={handleClearUpstageKey}
              style={{ marginLeft: 'auto', color: 'var(--color-error)', fontSize: '12px' }}>삭제</Button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <Input 
            type="password"
            placeholder={upstageKeyExists ? "새 API 키로 변경" : "up_**** 형식의 API 키"} 
            value={upstageKey}
            onChange={e => setUpstageKey(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button onClick={handleSaveUpstageKey} disabled={!upstageKey || savingUpstage}>
            {savingUpstage ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> 
              : upstageKeySaved ? <Check style={{ width: '16px', height: '16px' }} /> : '저장'}
          </Button>
        </div>
      </div>

      {/* API URL Section */}
      <div style={{ 
        padding: '20px', 
        background: 'var(--bg-secondary)', 
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)'
      }}>
        <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
          API 엔드포인트 URL
        </h4>
        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
          기본값: {DEFAULT_UPSTAGE_URL}
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Input 
            placeholder="Upstage API URL"
            value={upstageUrl}
            onChange={e => setUpstageUrl(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button variant="outline" size="sm" onClick={() => setUpstageUrl(DEFAULT_UPSTAGE_URL)}>
            기본값
          </Button>
          <Button onClick={handleSaveUpstageUrl} disabled={savingUrl}>
            {savingUrl ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> 
              : upstageUrlSaved ? <Check style={{ width: '16px', height: '16px' }} /> : '저장'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============ Summarize Settings Tab ============
const DEFAULT_SUMMARIZE_PROMPT = `당신은 전문 문서 요약 AI입니다. 한국어로 응답하세요.
사용자가 제공한 문서를 분석하고 다음 JSON 형식으로만 응답하세요:

{
  "summary": "문서 전체 요약",
  "keyPoints": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"],
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"]
}

요약은 {LENGTH_INSTRUCTION} 하세요.
핵심 포인트는 3-5개로 제한하세요.
키워드는 문서의 주요 주제를 나타내는 5개 이내의 단어로 제한하세요.`;

function SummarizeSettingsTab() {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState<string>(DEFAULT_SUMMARIZE_PROMPT);
  const [savingModel, setSavingModel] = useState(false);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [modelSaved, setModelSaved] = useState(false);
  const [promptSaved, setPromptSaved] = useState(false);

  useEffect(() => {
    // Fetch available models
    fetch("/api/admin/models")
      .then(res => res.json())
      .then(data => setModels(data.models || []))
      .catch(console.error);

    // Fetch current summarize settings
    fetch("/api/admin/system-config")
      .then(res => res.json())
      .then(data => {
        const modelConfig = data.configs?.find((c: SystemConfig) => c.key === 'SUMMARIZE_MODEL_ID');
        if (modelConfig?.value) setSelectedModel(modelConfig.value);

        const promptConfig = data.configs?.find((c: SystemConfig) => c.key === 'SUMMARIZE_PROMPT');
        if (promptConfig?.value && !promptConfig.value.includes('***')) {
          setCustomPrompt(promptConfig.value);
        }
      })
      .catch(console.error);
  }, []);

  const handleSaveModel = async () => {
    setSavingModel(true);
    try {
      const res = await fetch("/api/admin/system-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "SUMMARIZE_MODEL_ID",
          value: selectedModel,
          description: "문서 요약에 사용할 AI 모델 ID"
        })
      });
      if (res.ok) {
        setModelSaved(true);
        setTimeout(() => setModelSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingModel(false);
    }
  };

  const handleSavePrompt = async () => {
    setSavingPrompt(true);
    try {
      const res = await fetch("/api/admin/system-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "SUMMARIZE_PROMPT",
          value: customPrompt,
          description: "문서 요약 시스템 프롬프트"
        })
      });
      if (res.ok) {
        setPromptSaved(true);
        setTimeout(() => setPromptSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingPrompt(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Model Selection */}
      <div style={{ 
        padding: '20px', 
        background: 'var(--bg-secondary)', 
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)'
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu style={{ width: '18px', height: '18px', color: 'var(--color-primary)' }} />
          요약 AI 모델
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          문서 요약에 사용할 AI 모델을 선택하세요. 비워두면 기본 활성 모델이 사용됩니다.
        </p>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            className="select-trigger"
            style={{ flex: 1 }}
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
          >
            <option value="">기본 (활성 모델 사용)</option>
            {models.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.provider} - {m.modelId})
              </option>
            ))}
          </select>
          <Button onClick={handleSaveModel} disabled={savingModel}>
            {savingModel ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
              : modelSaved ? <Check style={{ width: '16px', height: '16px' }} /> : '저장'}
          </Button>
        </div>
      </div>

      {/* Custom Prompt */}
      <div style={{ 
        padding: '20px', 
        background: 'var(--bg-secondary)', 
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)'
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText style={{ width: '18px', height: '18px', color: 'var(--color-primary)' }} />
          시스템 프롬프트
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          요약 생성 시 AI에게 전달되는 시스템 프롬프트입니다. <code style={{ background: 'var(--bg-primary)', padding: '2px 4px', borderRadius: '4px' }}>{'{LENGTH_INSTRUCTION}'}</code>은 요약 길이에 따라 자동 치환됩니다.
        </p>
        
        <textarea
          value={customPrompt}
          onChange={e => setCustomPrompt(e.target.value)}
          style={{
            width: '100%',
            minHeight: '200px',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontFamily: 'monospace',
            lineHeight: 1.6,
            resize: 'vertical'
          }}
        />
        
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <Button variant="outline" size="sm" onClick={() => setCustomPrompt(DEFAULT_SUMMARIZE_PROMPT)}>
            기본값 복원
          </Button>
          <div style={{ flex: 1 }} />
          <Button onClick={handleSavePrompt} disabled={savingPrompt}>
            {savingPrompt ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
              : promptSaved ? <Check style={{ width: '16px', height: '16px' }} /> : '프롬프트 저장'}
          </Button>
        </div>
      </div>

      {/* Info */}
      <div style={{ 
        padding: '16px', 
        background: 'rgba(59, 130, 246, 0.08)',
        borderRadius: '12px',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        fontSize: '13px',
        color: 'var(--text-secondary)'
      }}>
        <strong style={{ color: 'var(--text-primary)' }}>💡 팁</strong>
        <ul style={{ marginTop: '8px', paddingLeft: '16px', lineHeight: 1.7 }}>
          <li>프롬프트에서 JSON 출력 형식을 유지하면 UI에서 결과를 올바르게 파싱합니다.</li>
          <li>요약 길이 옵션: <code>{'short'}</code>=1-2문장, <code>{'medium'}</code>=3-5문장, <code>{'detailed'}</code>=상세</li>
          <li>PDF/이미지 파싱은 외부 서비스 탭에서 Upstage 설정이 필요합니다.</li>
        </ul>
      </div>
    </div>
  );
}

// ============ Scoring Settings Tab ============
const DEFAULT_WEIGHTS: ScoringWeights = {
  lengthMax: 25, speedMax: 25, relevanceMax: 25, formatMax: 15, baseScore: 10
};

function ScoringSettingsTab() {
  const [weights, setWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/system-config")
      .then(res => res.json())
      .then(data => {
        const config = data.configs?.find((c: SystemConfig) => c.key === 'MODEL_COMPARISON_WEIGHTS');
        if (config?.value) {
          try {
            const parsed = JSON.parse(config.value.replace(/\*\*\*/g, ''));
            setWeights({ ...DEFAULT_WEIGHTS, ...parsed });
          } catch (e) { console.error(e); }
        }
      })
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/system-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "MODEL_COMPARISON_WEIGHTS",
          value: JSON.stringify(weights),
          description: "모델 비교 점수 가중치"
        })
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const totalPoints = weights.lengthMax + weights.speedMax + weights.relevanceMax + weights.formatMax + weights.baseScore;

  return (
    <div style={{ maxWidth: '700px' }}>
      <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {[
            { key: 'lengthMax', label: '📝 응답 길이', desc: '상세한 응답 선호' },
            { key: 'speedMax', label: '⚡ 응답 속도', desc: '빠른 응답 선호' },
            { key: 'relevanceMax', label: '🎯 관련성', desc: '키워드 포함 비율' },
            { key: 'formatMax', label: '📋 형식', desc: '구조화된 응답' },
            { key: 'baseScore', label: '⚙️ 기본 점수', desc: '정상 응답 시 부여' },
          ].map(item => (
            <div key={item.key}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                {item.label}
              </label>
              <Input 
                type="number"
                value={weights[item.key as keyof ScoringWeights]}
                onChange={e => setWeights({...weights, [item.key]: parseInt(e.target.value) || 0})}
                min={0} max={100}
              />
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{item.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            총 만점: <strong style={{ color: 'var(--color-primary)' }}>{totalPoints}점</strong>
            {totalPoints !== 100 && <span style={{ marginLeft: '8px', color: 'var(--color-warning)', fontSize: '12px' }}>(권장: 100점)</span>}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" size="sm" onClick={() => setWeights(DEFAULT_WEIGHTS)}>기본값 복원</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                : saved ? <><Check style={{ width: '14px', height: '14px', marginRight: '6px' }} />저장됨</> : '저장'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Embedding Settings Tab ============
interface EmbeddingModel {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  dimension: number;
  baseUrl: string | null;
  apiKey: string | null;
  isActive: boolean;
  isDefault: boolean;
}

function EmbeddingSettingsTab() {
  const [models, setModels] = useState<EmbeddingModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    provider: "upstage",
    modelId: "solar-embedding-1-large",
    dimension: 4096,
    baseUrl: "",
    apiKey: "",
    isDefault: false,
  });

  const EMBEDDING_PROVIDERS = [
    { id: 'upstage', name: 'Upstage Solar', models: [
      { id: 'solar-embedding-1-large', dim: 4096 },
      { id: 'solar-embedding-1-small', dim: 1024 }
    ]},
    { id: 'openai', name: 'OpenAI', models: [
      { id: 'text-embedding-3-small', dim: 1536 },
      { id: 'text-embedding-3-large', dim: 3072 },
      { id: 'text-embedding-ada-002', dim: 1536 }
    ]},
    { id: 'ollama', name: 'Ollama (로컬)', models: [
      { id: 'bge-m3', dim: 1024 },
      { id: 'nomic-embed-text', dim: 768 },
      { id: 'all-minilm', dim: 384 },
      { id: 'mxbai-embed-large', dim: 1024 }
    ]},
    { id: 'huggingface', name: 'HuggingFace', models: [
      { id: 'BAAI/bge-m3', dim: 1024 },
      { id: 'sentence-transformers/all-MiniLM-L6-v2', dim: 384 }
    ]},
  ];

  const fetchModels = async () => {
    try {
      const res = await fetch("/api/embedding-models");
      const data = await res.json();
      setModels(data.models || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchModels(); }, []);

  const handleAdd = async () => {
    setSaving(true);
    try {
      await fetch("/api/embedding-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setShowAddForm(false);
      setFormData({ name: "", provider: "upstage", modelId: "solar-embedding-1-large", dimension: 4096, baseUrl: "", apiKey: "", isDefault: false });
      await fetchModels();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleToggleDefault = async (id: string) => {
    await fetch("/api/embedding-models", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isDefault: true }),
    });
    await fetchModels();
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await fetch("/api/embedding-models", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    await fetchModels();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await fetch(`/api/embedding-models?id=${id}`, { method: "DELETE" });
    await fetchModels();
  };

  const currentProvider = EMBEDDING_PROVIDERS.find(p => p.id === formData.provider);

  return (
    <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers style={{ width: '18px', height: '18px', color: 'var(--color-primary)' }} />
            등록된 임베딩 모델
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            여러 임베딩 모델을 등록하고 기본 모델을 지정할 수 있습니다.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? '취소' : '+ 모델 추가'}
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card style={{ padding: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--color-primary)', borderStyle: 'dashed' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>새 임베딩 모델 추가</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px', display: 'block' }}>표시 이름</label>
              <Input placeholder="예: Upstage Solar Large" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px', display: 'block' }}>프로바이더</label>
              <select className="select-trigger" value={formData.provider} onChange={e => {
                const prov = EMBEDDING_PROVIDERS.find(p => p.id === e.target.value);
                setFormData({ ...formData, provider: e.target.value, modelId: prov?.models[0]?.id || '', dimension: prov?.models[0]?.dim || 1536 });
              }} style={{ width: '100%' }}>
                {EMBEDDING_PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px', display: 'block' }}>모델</label>
              <select className="select-trigger" value={formData.modelId} onChange={e => {
                const model = currentProvider?.models.find(m => m.id === e.target.value);
                setFormData({ ...formData, modelId: e.target.value, dimension: model?.dim || 1536 });
              }} style={{ width: '100%' }}>
                {currentProvider?.models.map(m => <option key={m.id} value={m.id}>{m.id} ({m.dim}D)</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px', display: 'block' }}>차원</label>
              <Input type="number" value={formData.dimension} readOnly style={{ background: 'var(--bg-tertiary)' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px', display: 'block' }}>Base URL</label>
              <Input placeholder={formData.provider === 'ollama' ? 'http://localhost:11434' : '선택사항'} value={formData.baseUrl} onChange={e => setFormData({ ...formData, baseUrl: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px', display: 'block' }}>API 키</label>
              <Input type="password" placeholder="API 키 (선택)" value={formData.apiKey} onChange={e => setFormData({ ...formData, apiKey: e.target.value })} />
            </div>
          </div>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" id="isDefault" checked={formData.isDefault} onChange={e => setFormData({ ...formData, isDefault: e.target.checked })} />
            <label htmlFor="isDefault" style={{ fontSize: '13px' }}>기본 모델로 설정</label>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleAdd} disabled={saving || !formData.name}>
              {saving ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : '추가'}
            </Button>
          </div>
        </Card>
      )}

      {/* Model List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Loader2 style={{ width: '24px', height: '24px', animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
          </div>
        ) : models.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
            등록된 임베딩 모델이 없습니다. 위에서 모델을 추가하세요.
          </div>
        ) : (
          models.map(model => (
            <Card key={model.id} style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: model.isActive ? 1 : 0.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: model.isDefault ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {model.isDefault ? <Star style={{ width: '18px', height: '18px', color: 'var(--color-success)' }} /> : <Layers style={{ width: '18px', height: '18px', color: 'var(--text-secondary)' }} />}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{model.name || model.modelId}</span>
                    {model.isDefault && <span style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--color-success)', color: 'white', borderRadius: '4px' }}>기본</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {model.provider} • {model.modelId} • {model.dimension}D
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {!model.isDefault && (
                  <Button variant="outline" size="sm" onClick={() => handleToggleDefault(model.id)}>
                    기본으로
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => handleToggleActive(model.id, model.isActive)}>
                  {model.isActive ? <ToggleRight style={{ width: '20px', height: '20px', color: 'var(--color-success)' }} /> : <ToggleLeft style={{ width: '20px', height: '20px' }} />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(model.id)}>
                  <Trash2 style={{ width: '16px', height: '16px', color: 'var(--color-error)' }} />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '13px', color: 'var(--text-secondary)' }}>
        <strong style={{ color: 'var(--text-primary)' }}>💡 안내</strong>
        <ul style={{ marginTop: '8px', paddingLeft: '16px', lineHeight: 1.7 }}>
          <li><strong>기본 모델:</strong> 파이프라인 설정에서 기본으로 선택됩니다.</li>
          <li><strong>활성 모델:</strong> 파이프라인 드롭다운에 표시됩니다.</li>
          <li>비활성화된 모델은 숨겨지지만 삭제되지 않습니다.</li>
        </ul>
      </div>
    </div>
  );
}


// ============ Vector DB Settings Tab ============
function VectorDBSettingsTab() {
  const [provider, setProvider] = useState("sqlite");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [collection, setCollection] = useState("aura_vectors");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    fetch("/api/admin/system-config")
      .then(res => res.json())
      .then(data => {
        const providerConfig = data.configs?.find((c: SystemConfig) => c.key === 'VECTORDB_PROVIDER');
        if (providerConfig?.value) setProvider(providerConfig.value);

        const hostConfig = data.configs?.find((c: SystemConfig) => c.key === 'VECTORDB_HOST');
        if (hostConfig?.value) setHost(hostConfig.value);

        const portConfig = data.configs?.find((c: SystemConfig) => c.key === 'VECTORDB_PORT');
        if (portConfig?.value) setPort(portConfig.value);

        const collConfig = data.configs?.find((c: SystemConfig) => c.key === 'VECTORDB_COLLECTION');
        if (collConfig?.value) setCollection(collConfig.value);

        const keyConfig = data.configs?.find((c: SystemConfig) => c.key === 'VECTORDB_API_KEY');
        if (keyConfig?.value) setHasApiKey(true);
      })
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        fetch("/api/admin/system-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "VECTORDB_PROVIDER", value: provider, description: "벡터 DB 프로바이더" })
        }),
        host && fetch("/api/admin/system-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "VECTORDB_HOST", value: host, description: "벡터 DB 호스트" })
        }),
        port && fetch("/api/admin/system-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "VECTORDB_PORT", value: port, description: "벡터 DB 포트" })
        }),
        fetch("/api/admin/system-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "VECTORDB_COLLECTION", value: collection, description: "벡터 DB 컬렉션명" })
        }),
        apiKey && fetch("/api/admin/system-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "VECTORDB_API_KEY", value: apiKey, description: "벡터 DB API 키" })
        }),
      ].filter(Boolean));
      setSaved(true);
      if (apiKey) { setHasApiKey(true); setApiKey(""); }
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const VECTORDB_PROVIDERS = [
    { id: 'sqlite', name: 'SQLite (기본)', description: '로컬 파일 기반, 설치 불필요', icon: '📁' },
    { id: 'milvus', name: 'Milvus', description: '오픈소스, 고성능 벡터 검색', icon: '🔷', defaultPort: '19530' },
    { id: 'chromadb', name: 'ChromaDB', description: '로컬/클라우드, 간편한 설정', icon: '🎨', defaultPort: '8000' },
    { id: 'weaviate', name: 'Weaviate', description: '스키마 기반, 시맨틱 검색', icon: '🔮', defaultPort: '8080' },
    { id: 'pinecone', name: 'Pinecone', description: '클라우드 관리형', icon: '🌲' },
    { id: 'qdrant', name: 'Qdrant', description: '고성능 러스트 기반', icon: '⚡', defaultPort: '6333' },
  ];

  const currentVectorDB = VECTORDB_PROVIDERS.find(p => p.id === provider);
  const needsConnection = provider !== 'sqlite';

  return (
    <div style={{ maxWidth: '700px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Provider Selection */}
      <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database style={{ width: '18px', height: '18px', color: 'var(--color-primary)' }} />
          벡터 데이터베이스 선택
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
          {VECTORDB_PROVIDERS.map(db => (
            <div
              key={db.id}
              onClick={() => { setProvider(db.id); if ('defaultPort' in db) setPort(db.defaultPort || ''); }}
              style={{
                padding: '14px',
                borderRadius: '10px',
                border: provider === db.id ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                background: provider === db.id ? 'rgba(124, 58, 237, 0.05)' : 'var(--bg-primary)',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ fontSize: '18px', marginBottom: '6px' }}>{db.icon}</div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>{db.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{db.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Connection Settings */}
      {needsConnection && (
        <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
            {currentVectorDB?.name} 연결 설정
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>호스트</label>
              <Input 
                placeholder="localhost 또는 IP 주소"
                value={host}
                onChange={e => setHost(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>포트</label>
              <Input 
                placeholder={currentVectorDB && 'defaultPort' in currentVectorDB ? currentVectorDB.defaultPort : ''}
                value={port}
                onChange={e => setPort(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginTop: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>컬렉션/인덱스 이름</label>
            <Input 
              placeholder="aura_vectors"
              value={collection}
              onChange={e => setCollection(e.target.value)}
            />
          </div>

          {(provider === 'pinecone' || provider === 'weaviate') && (
            <div style={{ marginTop: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>API 키</label>
              {hasApiKey && (
                <div style={{ padding: '6px 10px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '6px', marginBottom: '8px', fontSize: '11px', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check style={{ width: '12px', height: '12px' }} /> API 키 설정됨
                </div>
              )}
              <Input 
                type="password"
                placeholder={hasApiKey ? "새 API 키로 변경" : "API 키 입력"}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
            : saved ? <><Check style={{ width: '16px', height: '16px', marginRight: '6px' }} />저장됨</> : '설정 저장'}
        </Button>
      </div>

      {/* Info */}
      <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '13px', color: 'var(--text-secondary)' }}>
        <strong style={{ color: 'var(--text-primary)' }}>⚠️ 참고사항</strong>
        <ul style={{ marginTop: '8px', paddingLeft: '16px', lineHeight: 1.7 }}>
          <li><strong>SQLite:</strong> 기본값, 별도 설치 없이 바로 사용 가능</li>
          <li><strong>외부 DB:</strong> 해당 서비스가 미리 실행 중이어야 함</li>
          <li>설정 변경 후 새 데이터만 새 DB에 저장됩니다</li>
        </ul>
      </div>
    </div>
  );
}

// ============ Main Settings Page ============
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('models');

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />
          설정
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '6px' }}>
          AI 모델 및 시스템 설정을 관리합니다
        </p>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: '0' }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 20px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 150ms ease'
                }}
              >
                <Icon style={{ width: '16px', height: '16px' }} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="card">
        <div className="card-header">
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {TABS.find(t => t.id === activeTab)?.label}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {TABS.find(t => t.id === activeTab)?.description}
          </p>
        </div>
        <div className="card-content">
          {activeTab === 'models' && <ModelSettingsTab />}
          {activeTab === 'embedding' && <EmbeddingSettingsTab />}
          {activeTab === 'vectordb' && <VectorDBSettingsTab />}
          {activeTab === 'external' && <ExternalServicesTab />}
          {activeTab === 'summarize' && <SummarizeSettingsTab />}
          {activeTab === 'scoring' && <ScoringSettingsTab />}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
