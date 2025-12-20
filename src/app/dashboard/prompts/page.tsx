"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquarePlus, Trash, Sparkles, Copy } from "lucide-react";

interface Prompt {
  id: string;
  title: string;
  content: string;
  description: string;
  isPublic: boolean;
  user: { name: string };
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ title: "", content: "", description: "" });

  const fetchPrompts = async () => {
    try {
      const res = await fetch("/api/prompts");
      if (res.ok) {
        const data = await res.json();
        setPrompts(data.prompts);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchPrompts(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newPrompt, isPublic: false })
      });
      if (res.ok) {
        setShowForm(false);
        setNewPrompt({ title: "", content: "", description: "" });
        fetchPrompts();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("이 템플릿을 삭제하시겠습니까?")) return;
    await fetch(`/api/prompts/${id}`, { method: "DELETE" });
    fetchPrompts();
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Sparkles style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />
          프롬프트 라이브러리
        </h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "취소" : "새 템플릿"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '24px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <Input 
            placeholder="제목 (예: JavaScript 디버거)" 
            value={newPrompt.title}
            onChange={e => setNewPrompt({...newPrompt, title: e.target.value})}
            required
          />
          <Input 
            placeholder="설명 (선택사항)" 
            value={newPrompt.description}
            onChange={e => setNewPrompt({...newPrompt, description: e.target.value})}
          />
          <textarea 
            style={{
              minHeight: '120px',
              width: '100%',
              padding: '12px 14px',
              fontSize: '14px',
              color: 'var(--text-primary)',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color-strong)',
              borderRadius: 'var(--radius-md)',
              resize: 'vertical'
            }}
            placeholder="시스템 프롬프트 내용..."
            value={newPrompt.content}
            onChange={e => setNewPrompt({...newPrompt, content: e.target.value})}
            required
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit">템플릿 저장</Button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {prompts.map(prompt => (
          <div key={prompt.id} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '15px' }}>{prompt.title}</h3>
              <Button variant="ghost" size="icon" onClick={(e) => handleDelete(prompt.id, e)} style={{ color: 'var(--color-error)' }}>
                <Trash style={{ width: '14px', height: '14px' }} />
              </Button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              {prompt.description || "설명 없음"}
            </p>
            <div style={{
              fontSize: '12px',
              color: 'var(--text-tertiary)',
              background: 'var(--bg-secondary)',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '12px'
            }}>
              {prompt.content.slice(0, 150)}...
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge">{prompt.user?.name || "사용자"}</span>
              {prompt.isPublic && <span className="badge badge-primary">공개</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
