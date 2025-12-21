"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Plus, Trash, Server, Key, Check, Loader2, ExternalLink } from "lucide-react";

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

export default function SettingsPage() {
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
  
  // External service keys
  const [upstageKey, setUpstageKey] = useState("");
  const [upstageKeySaved, setUpstageKeySaved] = useState(false);
  const [savingUpstage, setSavingUpstage] = useState(false);
  const [upstageKeyExists, setUpstageKeyExists] = useState(false);

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

  const fetchSystemConfigs = async () => {
    try {
      const res = await fetch("/api/admin/system-config");
      if (res.ok) {
        const data = await res.json();
        const upstageConfig = data.configs?.find((c: SystemConfig) => c.key === 'UPSTAGE_API_KEY');
        if (upstageConfig?.value) {
          setUpstageKeyExists(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchModels();
    fetchSystemConfigs();
  }, []);

  const handleEdit = (model: ModelConfig & { apiKey?: string }) => {
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

  const handleClearUpstageKey = async () => {
    if (!confirm("Upstage API 키를 삭제하시겠습니까?")) return;
    try {
      const res = await fetch("/api/admin/system-config?key=UPSTAGE_API_KEY", {
        method: "DELETE"
      });
      if (res.ok) {
        setUpstageKeyExists(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />
          설정
        </h1>
      </div>

      {/* External Services Section */}
      <div className="card">
        <div className="card-header">
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key style={{ width: '18px', height: '18px' }} />
            외부 서비스 API
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            문서 OCR 및 기타 외부 서비스 연동 설정
          </p>
        </div>

        <div className="card-content">
          <div style={{ 
            padding: '20px', 
            background: 'var(--bg-secondary)', 
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '10px', 
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '14px'
              }}>UP</div>
              <div>
                <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '15px' }}>Upstage Document AI</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  PDF/이미지 OCR 및 문서 파싱 서비스
                </p>
              </div>
              <a 
                href="https://console.upstage.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  marginLeft: 'auto', 
                  fontSize: '12px', 
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                API 키 발급 <ExternalLink style={{ width: '12px', height: '12px' }} />
              </a>
            </div>

            {upstageKeyExists && (
              <div style={{ 
                padding: '12px', 
                background: 'rgba(34, 197, 94, 0.1)', 
                borderRadius: '8px',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Check style={{ width: '16px', height: '16px', color: 'var(--color-success)' }} />
                <span style={{ fontSize: '13px', color: 'var(--color-success)' }}>API 키가 설정되어 있습니다</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClearUpstageKey}
                  style={{ marginLeft: 'auto', color: 'var(--color-error)', fontSize: '12px' }}
                >
                  삭제
                </Button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <Input 
                type="password"
                placeholder={upstageKeyExists ? "새 API 키로 변경하려면 입력" : "up_**** 형식의 API 키"} 
                value={upstageKey}
                onChange={e => setUpstageKey(e.target.value)}
                style={{ flex: 1 }}
              />
              <Button 
                onClick={handleSaveUpstageKey} 
                disabled={!upstageKey || savingUpstage}
              >
                {savingUpstage ? (
                  <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                ) : upstageKeySaved ? (
                  <Check style={{ width: '16px', height: '16px' }} />
                ) : (
                  '저장'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Model Section */}
      <div className="card">
        <div className="card-header">
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>AI 모델 설정</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            OpenAI, vLLM, Ollama 연결을 관리하세요.
          </p>
        </div>

        <div className="card-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server style={{ width: '16px', height: '16px' }} /> 활성 모델
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
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>설정된 모델이 없습니다.</div>
                  )}
                </div>
              )}
            </div>

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
              <div style={{ display: 'flex', gap: '16px' }}>
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
                  placeholder="모델 ID (예: gpt-4, llama2)" 
                  value={newModel.modelId}
                  onChange={e => setNewModel({...newModel, modelId: e.target.value})}
                  required
                  style={{ flex: 1 }}
                />
              </div>
              <Input 
                placeholder="Base URL (선택, vLLM/Ollama용)" 
                value={newModel.baseUrl}
                onChange={e => setNewModel({...newModel, baseUrl: e.target.value})}
              />
              <Input 
                type="password"
                placeholder={editingId ? "API 키 (변경시에만 입력)" : "API 키 (선택)"}
                value={newModel.apiKey}
                onChange={e => setNewModel({...newModel, apiKey: e.target.value})}
              />
              
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <Button type="submit" style={{ flex: 1 }}>
                  {editingId ? (
                    <>
                      <Settings style={{ width: '16px', height: '16px', marginRight: '8px' }} /> 
                      수정 사항 저장
                    </>
                  ) : (
                    <>
                      <Plus style={{ width: '16px', height: '16px', marginRight: '8px' }} /> 
                      모델 추가
                    </>
                  )}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    취소
                  </Button>
                )}
              </div>
            </form>
          </div>
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
