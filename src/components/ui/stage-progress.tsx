"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Circle, Loader2, AlertCircle, Clock } from "lucide-react";

interface Stage {
  id: string;
  label: string;
  status: "pending" | "active" | "completed" | "error";
  duration?: number; // ms
  description?: string;
}

interface StageProgressProps {
  stages: Stage[];
  currentStageId?: string;
  estimatedTime?: number; // 전체 예상 시간 (ms)
  showTimeEstimate?: boolean;
  variant?: "horizontal" | "vertical";
}

export function StageProgress({
  stages,
  currentStageId,
  estimatedTime,
  showTimeEstimate = true,
  variant = "horizontal"
}: StageProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(Date.now());
  
  // 경과 시간 추적
  useEffect(() => {
    const hasActiveStage = stages.some(s => s.status === "active");
    if (!hasActiveStage) return;
    
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 100);
    
    return () => clearInterval(interval);
  }, [stages, startTime]);
  
  const completedCount = stages.filter(s => s.status === "completed").length;
  const progress = (completedCount / stages.length) * 100;
  
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}분 ${seconds % 60}초`;
    }
    return `${seconds}초`;
  };
  
  const getStageIcon = (status: Stage["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="stage-icon completed" />;
      case "active":
        return <Loader2 className="stage-icon active spinning" />;
      case "error":
        return <AlertCircle className="stage-icon error" />;
      default:
        return <Circle className="stage-icon pending" />;
    }
  };
  
  const remainingTime = estimatedTime ? Math.max(0, estimatedTime - elapsedTime) : 0;
  
  return (
    <div className={`stage-progress ${variant}`}>
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }} />
        <div className="progress-glow" style={{ left: `${progress}%` }} />
      </div>
      
      <div className="stages">
        {stages.map((stage, index) => (
          <div
            key={stage.id}
            className={`stage ${stage.status} ${stage.id === currentStageId ? "current" : ""}`}
          >
            <div className="stage-line">
              {index > 0 && <div className={`connector ${stages[index - 1].status === "completed" ? "completed" : ""}`} />}
              {getStageIcon(stage.status)}
              {index < stages.length - 1 && <div className={`connector ${stage.status === "completed" ? "completed" : ""}`} />}
            </div>
            <div className="stage-content">
              <span className="stage-label">{stage.label}</span>
              {stage.description && stage.status === "active" && (
                <span className="stage-description">{stage.description}</span>
              )}
              {stage.duration && stage.status === "completed" && (
                <span className="stage-duration">{formatTime(stage.duration)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {showTimeEstimate && (
        <div className="time-info">
          <Clock className="time-icon" />
          <span>경과: {formatTime(elapsedTime)}</span>
          {estimatedTime && (
            <>
              <span className="separator">·</span>
              <span>남은 시간: ~{formatTime(remainingTime)}</span>
            </>
          )}
        </div>
      )}
      
      <style jsx>{`
        .stage-progress {
          padding: 16px;
        }
        
        .progress-bar-container {
          position: relative;
          height: 4px;
          background: var(--bg-tertiary, #252536);
          border-radius: 2px;
          overflow: visible;
          margin-bottom: 24px;
        }
        
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--primary, #7c3aed), #a78bfa);
          border-radius: 2px;
          transition: width 0.3s ease;
        }
        
        .progress-glow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          background: var(--primary, #7c3aed);
          border-radius: 50%;
          filter: blur(10px);
          opacity: 0.5;
          transition: left 0.3s ease;
        }
        
        .stages {
          display: flex;
          justify-content: space-between;
        }
        
        .stage-progress.vertical .stages {
          flex-direction: column;
          gap: 24px;
        }
        
        .stage {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          position: relative;
        }
        
        .stage-progress.vertical .stage {
          flex-direction: row;
          align-items: flex-start;
          gap: 16px;
        }
        
        .stage-line {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          margin-bottom: 8px;
        }
        
        .stage-progress.vertical .stage-line {
          flex-direction: column;
          width: auto;
          margin-bottom: 0;
        }
        
        .connector {
          flex: 1;
          height: 2px;
          background: var(--bg-tertiary, #252536);
          transition: background 0.3s ease;
        }
        
        .connector.completed {
          background: var(--primary, #7c3aed);
        }
        
        .stage-progress.vertical .connector {
          width: 2px;
          height: 30px;
        }
        
        .stage :global(.stage-icon) {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
          z-index: 1;
        }
        
        .stage :global(.stage-icon.pending) {
          color: var(--text-muted, #6e6e7e);
        }
        
        .stage :global(.stage-icon.active) {
          color: var(--primary, #7c3aed);
        }
        
        .stage :global(.stage-icon.completed) {
          color: #10b981;
        }
        
        .stage :global(.stage-icon.error) {
          color: #ef4444;
        }
        
        .stage :global(.spinning) {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .stage-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          text-align: center;
        }
        
        .stage-progress.vertical .stage-content {
          align-items: flex-start;
          text-align: left;
        }
        
        .stage-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .stage.active .stage-label,
        .stage.completed .stage-label {
          color: var(--text-primary, #e0e0e0);
        }
        
        .stage-description {
          font-size: 11px;
          color: var(--primary, #7c3aed);
        }
        
        .stage-duration {
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .time-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 20px;
          padding: 10px;
          background: var(--bg-secondary, #1e1e2e);
          border-radius: 8px;
          font-size: 13px;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .time-icon {
          width: 16px;
          height: 16px;
        }
        
        .separator {
          color: var(--text-muted, #6e6e7e);
        }
      `}</style>
    </div>
  );
}

export default StageProgress;
