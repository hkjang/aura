"use client";

import { useState, useMemo } from "react";
import { 
  FlaskConical, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  Play,
  RefreshCw,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PolicySimulation {
  policyId: string;
  policyName: string;
  type: string;
  affectedUsers: number;
  affectedMessages: number;
  blockedContent: Array<{
    sample: string;
    reason: string;
  }>;
}

interface PolicySimulatorProps {
  policies: Array<{
    id: string;
    name: string;
    type: string;
    rules: string;
    action: string;
    isActive: boolean;
  }>;
  onRunSimulation: (policyId: string) => Promise<PolicySimulation>;
}

// 시뮬레이션 목업 데이터 생성
function mockSimulation(policy: { id: string; name: string; type: string; rules: string }): PolicySimulation {
  const samples = [
    { sample: "API 키: sk-xxxx...", reason: "민감 정보 감지" },
    { sample: "경쟁사 A 제품 분석 요청", reason: "금지 키워드 감지" },
    { sample: "고객 전화번호: 010-xxxx-xxxx", reason: "개인정보 감지" },
  ];
  
  const randomAffected = Math.floor(Math.random() * 100) + 10;
  const randomBlocked = Math.floor(Math.random() * 20);
  
  return {
    policyId: policy.id,
    policyName: policy.name,
    type: policy.type,
    affectedUsers: randomAffected,
    affectedMessages: randomAffected * 5,
    blockedContent: samples.slice(0, randomBlocked % 3 + 1)
  };
}

export function PolicySimulator({ policies, onRunSimulation }: PolicySimulatorProps) {
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<PolicySimulation | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const selectedPolicy = useMemo(
    () => policies.find(p => p.id === selectedPolicyId),
    [policies, selectedPolicyId]
  );
  
  const handleRunSimulation = async () => {
    if (!selectedPolicy) return;
    
    setIsRunning(true);
    try {
      // 실제로는 onRunSimulation 호출
      // const result = await onRunSimulation(selectedPolicy.id);
      
      // 데모용 목업
      await new Promise(resolve => setTimeout(resolve, 1500));
      const result = mockSimulation(selectedPolicy);
      setSimulation(result);
    } catch (error) {
      console.error("Simulation failed:", error);
    } finally {
      setIsRunning(false);
    }
  };
  
  return (
    <div className="policy-simulator">
      <div className="simulator-header">
        <h3>
          <FlaskConical className="header-icon" />
          정책 시뮬레이션
        </h3>
        <p>정책 적용 전 영향도를 미리 확인합니다.</p>
      </div>
      
      <div className="simulator-content">
        <div className="policy-selector">
          <label>시뮬레이션할 정책 선택</label>
          <div className="select-wrapper">
            <select
              value={selectedPolicyId || ""}
              onChange={e => {
                setSelectedPolicyId(e.target.value || null);
                setSimulation(null);
              }}
            >
              <option value="">정책을 선택하세요...</option>
              {policies.map(policy => (
                <option key={policy.id} value={policy.id}>
                  {policy.name} ({policy.type})
                </option>
              ))}
            </select>
            <ChevronDown className="select-icon" />
          </div>
        </div>
        
        {selectedPolicy && (
          <div className="policy-preview">
            <div className="preview-header">
              <span className="policy-type">{selectedPolicy.type}</span>
              <span className={`policy-status ${selectedPolicy.isActive ? "active" : "inactive"}`}>
                {selectedPolicy.isActive ? "활성" : "비활성"}
              </span>
            </div>
            <div className="preview-content">
              <strong>{selectedPolicy.name}</strong>
              <p>규칙: {selectedPolicy.rules}</p>
              <p>액션: {selectedPolicy.action}</p>
            </div>
          </div>
        )}
        
        <Button
          onClick={handleRunSimulation}
          disabled={!selectedPolicy || isRunning}
          className="run-btn"
        >
          {isRunning ? (
            <>
              <RefreshCw className="animate-spin mr-2" size={16} />
              시뮬레이션 중...
            </>
          ) : (
            <>
              <Play className="mr-2" size={16} />
              시뮬레이션 실행
            </>
          )}
        </Button>
        
        {simulation && (
          <div className="simulation-results">
            <h4>시뮬레이션 결과</h4>
            
            <div className="result-stats">
              <div className="stat-card">
                <Users className="stat-icon" />
                <div className="stat-content">
                  <span className="stat-value">{simulation.affectedUsers}</span>
                  <span className="stat-label">영향받는 사용자</span>
                </div>
              </div>
              
              <div className="stat-card">
                <AlertTriangle className="stat-icon warning" />
                <div className="stat-content">
                  <span className="stat-value">{simulation.affectedMessages}</span>
                  <span className="stat-label">검사 대상 메시지</span>
                </div>
              </div>
              
              <div className="stat-card">
                <CheckCircle className="stat-icon success" />
                <div className="stat-content">
                  <span className="stat-value">{simulation.blockedContent.length}</span>
                  <span className="stat-label">차단될 콘텐츠</span>
                </div>
              </div>
            </div>
            
            {simulation.blockedContent.length > 0 && (
              <div className="blocked-samples">
                <button
                  className="toggle-details"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  차단 예시 {showDetails ? "숨기기" : "보기"}
                  <ChevronDown className={showDetails ? "rotated" : ""} />
                </button>
                
                {showDetails && (
                  <div className="samples-list">
                    {simulation.blockedContent.map((item, idx) => (
                      <div key={idx} className="sample-item">
                        <code>{item.sample}</code>
                        <span className="sample-reason">{item.reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="result-actions">
              <Button variant="outline" onClick={() => setSimulation(null)}>
                초기화
              </Button>
              <Button>
                정책 적용하기
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .policy-simulator {
          background: var(--bg-primary, #12121a);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 16px;
          overflow: hidden;
        }
        
        .simulator-header {
          padding: 20px;
          background: var(--bg-secondary, #1e1e2e);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .simulator-header h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 8px;
          font-size: 18px;
          color: var(--text-primary, #e0e0e0);
        }
        
        .header-icon {
          width: 22px;
          height: 22px;
          color: var(--primary, #7c3aed);
        }
        
        .simulator-header p {
          margin: 0;
          font-size: 14px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .simulator-content {
          padding: 20px;
        }
        
        .policy-selector {
          margin-bottom: 20px;
        }
        
        .policy-selector label {
          display: block;
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .select-wrapper {
          position: relative;
        }
        
        .select-wrapper select {
          width: 100%;
          padding: 12px 40px 12px 14px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 10px;
          color: var(--text-primary, #e0e0e0);
          font-size: 14px;
          appearance: none;
          cursor: pointer;
        }
        
        .select-icon {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: 18px;
          height: 18px;
          color: var(--text-muted, #6e6e7e);
          pointer-events: none;
        }
        
        .policy-preview {
          padding: 16px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 12px;
          margin-bottom: 20px;
        }
        
        .preview-header {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }
        
        .policy-type {
          padding: 4px 10px;
          background: var(--bg-tertiary, #252536);
          border-radius: 12px;
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .policy-status {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
        }
        
        .policy-status.active {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }
        
        .policy-status.inactive {
          background: rgba(107, 114, 128, 0.1);
          color: #6b7280;
        }
        
        .preview-content strong {
          display: block;
          font-size: 15px;
          color: var(--text-primary, #e0e0e0);
          margin-bottom: 8px;
        }
        
        .preview-content p {
          margin: 4px 0;
          font-size: 13px;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .simulator-content :global(.run-btn) {
          width: 100%;
          padding: 14px;
          background: var(--primary, #7c3aed);
        }
        
        .simulation-results {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid var(--border-color, #3e3e5a);
        }
        
        .simulation-results h4 {
          margin: 0 0 16px;
          font-size: 15px;
          color: var(--text-primary, #e0e0e0);
        }
        
        .result-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .stat-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: var(--bg-secondary, #1e1e2e);
          border-radius: 12px;
        }
        
        .stat-icon {
          width: 24px;
          height: 24px;
          color: var(--primary, #7c3aed);
        }
        
        .stat-icon.warning {
          color: #f59e0b;
        }
        
        .stat-icon.success {
          color: #10b981;
        }
        
        .stat-content {
          display: flex;
          flex-direction: column;
        }
        
        .stat-value {
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary, #e0e0e0);
        }
        
        .stat-label {
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .blocked-samples {
          margin-bottom: 20px;
        }
        
        .toggle-details {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          background: transparent;
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 8px;
          color: var(--text-secondary, #a0a0b0);
          font-size: 13px;
          cursor: pointer;
          width: 100%;
        }
        
        .toggle-details :global(svg) {
          width: 16px;
          height: 16px;
          margin-left: auto;
          transition: transform 0.2s ease;
        }
        
        .toggle-details :global(svg.rotated) {
          transform: rotate(180deg);
        }
        
        .samples-list {
          margin-top: 12px;
          padding: 12px;
          background: var(--bg-secondary, #1e1e2e);
          border-radius: 8px;
        }
        
        .sample-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 10px 0;
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .sample-item:last-child {
          border-bottom: none;
        }
        
        .sample-item code {
          font-family: monospace;
          font-size: 13px;
          color: #ef4444;
        }
        
        .sample-reason {
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .result-actions {
          display: flex;
          gap: 12px;
        }
        
        .result-actions :global(button) {
          flex: 1;
        }
      `}</style>
    </div>
  );
}

export default PolicySimulator;
