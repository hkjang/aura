"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Plus, Trash, Server, Key, Check, Loader2, ExternalLink, Scale, Cpu, Link2, BarChart } from "lucide-react";

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
  { id: 'external', label: '외부 서비스', icon: Link2, description: 'API 키 및 외부 연동' },
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
                transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{m.name}</div>
                  <div style={{ display: 'flex', gap: '4px' }}>
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
          {activeTab === 'external' && <ExternalServicesTab />}
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
