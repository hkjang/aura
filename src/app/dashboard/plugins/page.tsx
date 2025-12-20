import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Download, Shield, Star } from "lucide-react";

export const dynamic = 'force-dynamic';

// Mock data
const installedPlugins = [
  { id: "1", name: "RAG 강화기", version: "1.2.0", author: "Aura Team", category: "AI", status: "활성", rating: 4.8 },
  { id: "2", name: "Slack 알림", version: "2.0.1", author: "커뮤니티", category: "통합", status: "활성", rating: 4.5 },
  { id: "3", name: "커스텀 프롬프트 템플릿", version: "0.9.0", author: "내부", category: "생산성", status: "대기", rating: null },
];

const marketplacePlugins = [
  { id: "m1", name: "Jira 커넥터", category: "통합", downloads: "12.5K", rating: 4.6 },
  { id: "m2", name: "문서 요약기", category: "AI", downloads: "8.2K", rating: 4.9 },
  { id: "m3", name: "다국어 지원", category: "현지화", downloads: "5.1K", rating: 4.3 },
];

export default function PluginMarketplacePage() {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>플러그인 & 마켓플레이스</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
          플러그인과 통합으로 Aura를 확장하세요.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* Installed Plugins */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>설치된 플러그인</h2>
          <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {installedPlugins.map(plugin => (
              <Card key={plugin.id} className="p-4">
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <div style={{ padding: '10px', background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)' }}>
                    <Package style={{ width: '20px', height: '20px', color: 'var(--color-primary)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{plugin.name}</h3>
                      <span className={`status ${plugin.status === "활성" ? 'status-success' : 'status-warning'}`}>
                        {plugin.status}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      v{plugin.version} • {plugin.author}
                    </p>
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge">{plugin.category}</span>
                      {plugin.rating && (
                        <span style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: 'var(--color-warning)' }}>
                          <Star style={{ width: '12px', height: '12px', marginRight: '2px', fill: 'currentColor' }} /> {plugin.rating}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  {plugin.status === "대기" && (
                    <Button size="sm" style={{ width: '100%' }}>
                      <Shield style={{ width: '14px', height: '14px', marginRight: '6px' }} /> 승인
                    </Button>
                  )}
                  {plugin.status === "활성" && (
                    <Button size="sm" variant="outline" style={{ width: '100%' }}>
                      설정
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Marketplace */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>마켓플레이스</h2>
          <Card>
            {marketplacePlugins.map((plugin, idx) => (
              <div key={plugin.id} style={{ 
                padding: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                borderBottom: idx < marketplacePlugins.length - 1 ? '1px solid var(--border-color)' : 'none'
              }}>
                <div>
                  <h4 style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-primary)' }}>{plugin.name}</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {plugin.category} • {plugin.downloads} 다운로드
                  </p>
                  <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', fontSize: '12px', color: 'var(--color-warning)' }}>
                    <Star style={{ width: '12px', height: '12px', marginRight: '2px', fill: 'currentColor' }} /> {plugin.rating}
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Download style={{ width: '14px', height: '14px', marginRight: '4px' }} /> 설치
                </Button>
              </div>
            ))}
            <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid var(--border-color)' }}>
              <button style={{ 
                fontSize: '13px', 
                color: 'var(--color-primary)', 
                fontWeight: 500, 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer' 
              }}>
                모든 플러그인 보기
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
