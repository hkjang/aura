import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, CloudOff, Package, Check, AlertTriangle } from "lucide-react";

export const dynamic = 'force-dynamic';

// Mock state
const syncState = {
  lastSyncTime: "2024-12-20 10:30 AM",
  pendingChanges: 5,
  status: "pending" as "synced" | "pending" | "offline" | "error"
};

const offlinePackages = [
  { id: "1", name: "Core AI 모델", version: "2.1.0", size: "450 MB", status: "설치됨" },
  { id: "2", name: "정책 엔진", version: "1.5.0", size: "85 MB", status: "설치됨" },
  { id: "3", name: "RAG 지식 팩", version: "3.0.0-rc1", size: "1.2 GB", status: "사용 가능" },
];

export default function OfflineDashboardPage() {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>오프라인 & 에어갭 운영</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
          동기화 및 오프라인 배포 패키지를 관리하세요.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* Sync Status */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card className="p-6">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  padding: '10px', 
                  borderRadius: 'var(--radius-md)', 
                  background: syncState.status === "synced" ? '#dcfce7' : '#fef3c7' 
                }}>
                  {syncState.status === "synced" ? 
                    <Check style={{ width: '20px', height: '20px', color: 'var(--color-success)' }} /> :
                    <AlertTriangle style={{ width: '20px', height: '20px', color: 'var(--color-warning)' }} />
                  }
                </div>
                <div>
                  <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>동기화 상태</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>마지막 동기화: {syncState.lastSyncTime}</p>
                </div>
              </div>
              <span className={`status ${syncState.status === "synced" ? 'status-success' : 'status-warning'}`}>
                {syncState.status === "synced" ? "동기화됨" : "대기 중"}
              </span>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '16px', 
              background: 'var(--bg-secondary)', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>대기 중인 변경</p>
                <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-warning)' }}>{syncState.pendingChanges}</p>
              </div>
              <Button>
                <RefreshCw style={{ width: '16px', height: '16px', marginRight: '8px' }} /> 지금 동기화
              </Button>
            </div>
          </Card>

          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>오프라인 패키지</h2>
          <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {offlinePackages.map(pkg => (
              <Card key={pkg.id} className="p-4">
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <div style={{ padding: '10px', background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)' }}>
                    <Package style={{ width: '20px', height: '20px', color: 'var(--color-primary)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h3 style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{pkg.name}</h3>
                      <span className={`status ${pkg.status === "설치됨" ? 'status-success' : 'status-info'}`}>
                        {pkg.status}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      v{pkg.version} • {pkg.size}
                    </p>
                  </div>
                </div>
                {pkg.status === "사용 가능" && (
                  <Button size="sm" style={{ width: '100%', marginTop: '12px' }}>패키지 설치</Button>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>빠른 작업</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Button variant="outline" style={{ justifyContent: 'flex-start' }}>
              <Package style={{ width: '16px', height: '16px', marginRight: '8px' }} /> 오프라인 번들 생성
            </Button>
            <Button variant="outline" style={{ justifyContent: 'flex-start' }}>
              <CloudOff style={{ width: '16px', height: '16px', marginRight: '8px' }} /> 로그 내보내기
            </Button>
            <Button variant="outline" style={{ justifyContent: 'flex-start' }}>
              <RefreshCw style={{ width: '16px', height: '16px', marginRight: '8px' }} /> 강제 재동기화
            </Button>
          </div>

          <Card className="p-4">
            <h3 style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '12px' }}>시스템 정보</h3>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>모드:</span>
                <span style={{ fontWeight: 500, color: 'var(--color-warning)' }}>에어갭</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>스토리지 사용:</span>
                <span>2.4 GB / 10 GB</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>오프라인 기간:</span>
                <span>3일 전</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
