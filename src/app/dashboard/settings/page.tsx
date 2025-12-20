"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Plus, Trash, Server } from "lucide-react";

interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  baseUrl?: string;
  isActive: boolean;
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

  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newModel)
      });
      if (res.ok) {
        fetchModels();
        setNewModel({ name: "", provider: "openai", modelId: "", baseUrl: "", apiKey: "" });
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
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />
          설정
        </h1>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>AI 모델 설정</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            OpenAI, vLLM, Ollama 연결을 관리하세요.
          </p>
        </div>

        <div className="card-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
            {/* List */}
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
                      background: 'var(--bg-secondary)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: 'var(--radius-lg)' 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{m.name}</div>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)} style={{ color: 'var(--color-error)' }}>
                          <Trash style={{ width: '14px', height: '14px' }} />
                        </Button>
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

            {/* Form */}
            <form onSubmit={handleAddModel} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px', 
              padding: '20px', 
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-lg)' 
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>새 모델 추가</h3>
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
                placeholder="API 키 (선택)" 
                value={newModel.apiKey}
                onChange={e => setNewModel({...newModel, apiKey: e.target.value})}
              />
              <Button type="submit">
                <Plus style={{ width: '16px', height: '16px', marginRight: '8px' }} /> 모델 추가
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
