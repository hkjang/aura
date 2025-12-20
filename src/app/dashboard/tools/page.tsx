"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Power, RefreshCw } from "lucide-react";

interface ToolConfig {
  id: string;
  key: string;
  name: string;
  description: string;
  isEnabled: boolean;
  config: string | null;
}

export default function ToolsPage() {
  const [tools, setTools] = useState<ToolConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTools = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tools");
      if (res.ok) {
        const data = await res.json();
        setTools(data.tools);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
  }, []);

  const toggleTool = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/tools/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: !currentStatus }),
      });
      if (res.ok) {
        fetchTools();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Bot style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />
          플러그인 관리
        </h1>
        <Button variant="outline" onClick={fetchTools} disabled={loading}>
          <RefreshCw style={{ width: '16px', height: '16px', marginRight: '8px' }} className={loading ? "animate-spin" : ""} />
          새로고침
        </Button>
      </div>
      
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
        AI 플러그인을 활성화/비활성화하고 설정을 구성하세요.
      </p>

      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {tools.map((tool) => (
          <Card key={tool.id} className="p-4">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{tool.name}</h3>
              <div style={{ 
                width: '10px', 
                height: '10px', 
                borderRadius: '50%', 
                background: tool.isEnabled ? 'var(--color-success)' : 'var(--text-tertiary)' 
              }} />
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', minHeight: '40px' }}>
              {tool.description || "설명이 없습니다."}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <code style={{ 
                fontSize: '12px', 
                background: 'var(--bg-tertiary)', 
                padding: '4px 8px', 
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)'
              }}>
                {tool.key}
              </code>
              <Button 
                size="sm" 
                variant={tool.isEnabled ? "destructive" : "outline"}
                onClick={() => toggleTool(tool.id, tool.isEnabled)}
              >
                <Power style={{ width: '14px', height: '14px', marginRight: '6px' }} />
                {tool.isEnabled ? "비활성화" : "활성화"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
      
      {tools.length === 0 && !loading && (
        <div className="empty-state">
          <p className="empty-state-title">플러그인이 없습니다</p>
          <p className="empty-state-description">등록된 플러그인이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
