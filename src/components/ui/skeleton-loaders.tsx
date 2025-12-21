"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: "text" | "circular" | "rectangular" | "rounded";
  animation?: "pulse" | "wave" | "none";
}

export function Skeleton({
  className = "",
  width,
  height,
  variant = "text",
  animation = "pulse"
}: SkeletonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "circular":
        return "border-radius: 50%;";
      case "rectangular":
        return "border-radius: 0;";
      case "rounded":
        return "border-radius: 8px;";
      case "text":
      default:
        return "border-radius: 4px; height: 1em;";
    }
  };
  
  return (
    <span
      className={`skeleton ${variant} ${animation} ${className}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height
      }}
    >
      <style jsx>{`
        .skeleton {
          display: inline-block;
          background: var(--bg-tertiary, #252536);
          ${getVariantStyles()}
        }
        
        .skeleton.pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        .skeleton.wave {
          position: relative;
          overflow: hidden;
        }
        
        .skeleton.wave::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          animation: wave 1.5s linear infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }
        
        @keyframes wave {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </span>
  );
}

// 미리 정의된 스켈레톤 컴포넌트들

export function ChatMessageSkeleton() {
  return (
    <div className="chat-message-skeleton">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="content">
        <Skeleton width="30%" height={14} />
        <Skeleton width="100%" height={16} />
        <Skeleton width="80%" height={16} />
        <Skeleton width="60%" height={16} />
      </div>
      
      <style jsx>{`
        .chat-message-skeleton {
          display: flex;
          gap: 12px;
          padding: 16px;
        }
        
        .content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}

export function ChatInputSkeleton() {
  return (
    <div className="chat-input-skeleton">
      <Skeleton variant="rounded" width="100%" height={56} />
      <div className="buttons">
        <Skeleton variant="rounded" width={100} height={40} />
        <Skeleton variant="circular" width={40} height={40} />
      </div>
      
      <style jsx>{`
        .chat-input-skeleton {
          display: flex;
          gap: 12px;
          padding: 16px;
        }
        
        .buttons {
          display: flex;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="sidebar-skeleton">
      <Skeleton variant="rounded" width="60%" height={24} />
      <div className="items">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="item">
            <Skeleton variant="rounded" width={20} height={20} />
            <Skeleton width="70%" height={16} />
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .sidebar-skeleton {
          padding: 16px;
        }
        
        .items {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 20px;
        }
        
        .item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
      `}</style>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card-skeleton">
      <div className="header">
        <Skeleton variant="circular" width={32} height={32} />
        <div className="title">
          <Skeleton width={120} height={16} />
          <Skeleton width={80} height={12} />
        </div>
      </div>
      <Skeleton variant="rectangular" width="100%" height={100} />
      <div className="footer">
        <Skeleton width={60} height={28} animation="wave" />
        <Skeleton width={60} height={28} animation="wave" />
      </div>
      
      <style jsx>{`
        .card-skeleton {
          padding: 16px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 12px;
        }
        
        .header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .title {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .footer {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }
      `}</style>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="table-skeleton">
      <div className="header-row">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} width={`${20 + i * 5}%`} height={16} />
        ))}
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="row">
          {[...Array(4)].map((_, j) => (
            <Skeleton key={j} width={`${25 + j * 3}%`} height={14} />
          ))}
        </div>
      ))}
      
      <style jsx>{`
        .table-skeleton {
          width: 100%;
        }
        
        .header-row {
          display: flex;
          gap: 16px;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .row {
          display: flex;
          gap: 16px;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
      `}</style>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">
      <div className="stats">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat-card">
            <Skeleton width="40%" height={14} />
            <Skeleton width="60%" height={28} />
          </div>
        ))}
      </div>
      <div className="main-content">
        <div className="chart">
          <Skeleton variant="rectangular" width="100%" height={300} />
        </div>
        <div className="sidebar">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
      
      <style jsx>{`
        .dashboard-skeleton {
          padding: 24px;
        }
        
        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .stat-card {
          padding: 20px;
          background: var(--bg-secondary, #1e1e2e);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .main-content {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }
        
        .sidebar {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
      `}</style>
    </div>
  );
}

export default Skeleton;
