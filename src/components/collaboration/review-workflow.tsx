"use client";

import { useState, useCallback } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  Clock, 
  User,
  ChevronDown,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";

type ReviewStatus = "pending" | "approved" | "rejected" | "needs_revision";

interface Review {
  id: string;
  responseId: string;
  responseContent: string;
  status: ReviewStatus;
  reviewerId?: string;
  reviewerName?: string;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ReviewWorkflowProps {
  reviews: Review[];
  currentUserId: string;
  onApprove: (reviewId: string, comment?: string) => void;
  onReject: (reviewId: string, comment: string) => void;
  onRequestRevision: (reviewId: string, comment: string) => void;
}

const STATUS_CONFIG = {
  pending: { label: "대기 중", color: "#f59e0b", icon: Clock },
  approved: { label: "승인됨", color: "#10b981", icon: CheckCircle2 },
  rejected: { label: "반려됨", color: "#ef4444", icon: XCircle },
  needs_revision: { label: "수정 요청", color: "#8b5cf6", icon: MessageSquare }
};

export function ReviewWorkflow({
  reviews,
  currentUserId,
  onApprove,
  onReject,
  onRequestRevision
}: ReviewWorkflowProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [selectedAction, setSelectedAction] = useState<"approve" | "reject" | "revision" | null>(null);
  
  const handleAction = useCallback((reviewId: string) => {
    if (!selectedAction) return;
    
    switch (selectedAction) {
      case "approve":
        onApprove(reviewId, comment || undefined);
        break;
      case "reject":
        if (!comment.trim()) {
          alert("반려 사유를 입력해주세요.");
          return;
        }
        onReject(reviewId, comment);
        break;
      case "revision":
        if (!comment.trim()) {
          alert("수정 요청 내용을 입력해주세요.");
          return;
        }
        onRequestRevision(reviewId, comment);
        break;
    }
    
    setComment("");
    setSelectedAction(null);
    setExpandedId(null);
  }, [selectedAction, comment, onApprove, onReject, onRequestRevision]);
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };
  
  const pendingReviews = reviews.filter(r => r.status === "pending");
  const completedReviews = reviews.filter(r => r.status !== "pending");
  
  return (
    <div className="review-workflow">
      <div className="workflow-header">
        <h3>응답 리뷰</h3>
        <div className="stats">
          <span className="stat pending">{pendingReviews.length} 대기</span>
          <span className="stat completed">{completedReviews.length} 완료</span>
        </div>
      </div>
      
      {pendingReviews.length > 0 && (
        <div className="section">
          <h4>대기 중인 리뷰</h4>
          {pendingReviews.map(review => {
            const StatusIcon = STATUS_CONFIG[review.status].icon;
            const isExpanded = expandedId === review.id;
            
            return (
              <div key={review.id} className={`review-card ${review.status}`}>
                <div
                  className="review-header"
                  onClick={() => setExpandedId(isExpanded ? null : review.id)}
                >
                  <div className="status-badge" style={{ background: STATUS_CONFIG[review.status].color }}>
                    <StatusIcon size={14} />
                    {STATUS_CONFIG[review.status].label}
                  </div>
                  <span className="review-date">{formatDate(review.createdAt)}</span>
                  <ChevronDown className={`expand-icon ${isExpanded ? "rotated" : ""}`} />
                </div>
                
                <div className="review-preview">
                  {review.responseContent.slice(0, 100)}...
                </div>
                
                {isExpanded && (
                  <div className="review-detail">
                    <div className="response-content">
                      <h5>응답 내용</h5>
                      <p>{review.responseContent}</p>
                    </div>
                    
                    <div className="action-section">
                      <div className="action-buttons">
                        <button
                          className={`action-btn approve ${selectedAction === "approve" ? "active" : ""}`}
                          onClick={() => setSelectedAction(selectedAction === "approve" ? null : "approve")}
                        >
                          <CheckCircle2 size={16} />
                          승인
                        </button>
                        <button
                          className={`action-btn revision ${selectedAction === "revision" ? "active" : ""}`}
                          onClick={() => setSelectedAction(selectedAction === "revision" ? null : "revision")}
                        >
                          <MessageSquare size={16} />
                          수정 요청
                        </button>
                        <button
                          className={`action-btn reject ${selectedAction === "reject" ? "active" : ""}`}
                          onClick={() => setSelectedAction(selectedAction === "reject" ? null : "reject")}
                        >
                          <XCircle size={16} />
                          반려
                        </button>
                      </div>
                      
                      {selectedAction && (
                        <div className="comment-section">
                          <textarea
                            placeholder={
                              selectedAction === "approve" 
                                ? "승인 코멘트 (선택)" 
                                : selectedAction === "revision"
                                ? "수정 요청 내용을 입력하세요..."
                                : "반려 사유를 입력하세요..."
                            }
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                          />
                          <Button onClick={() => handleAction(review.id)}>
                            <Send size={16} className="mr-2" />
                            {selectedAction === "approve" ? "승인하기" : selectedAction === "revision" ? "수정 요청" : "반려하기"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {completedReviews.length > 0 && (
        <div className="section">
          <h4>완료된 리뷰</h4>
          {completedReviews.slice(0, 5).map(review => {
            const StatusIcon = STATUS_CONFIG[review.status].icon;
            
            return (
              <div key={review.id} className={`review-card completed ${review.status}`}>
                <div className="review-header">
                  <div className="status-badge" style={{ background: STATUS_CONFIG[review.status].color }}>
                    <StatusIcon size={14} />
                    {STATUS_CONFIG[review.status].label}
                  </div>
                  {review.reviewerName && (
                    <span className="reviewer">
                      <User size={12} />
                      {review.reviewerName}
                    </span>
                  )}
                  <span className="review-date">{formatDate(review.updatedAt)}</span>
                </div>
                <div className="review-preview">
                  {review.responseContent.slice(0, 80)}...
                </div>
                {review.comment && (
                  <div className="review-comment">
                    "{review.comment}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {reviews.length === 0 && (
        <div className="empty-state">
          <CheckCircle2 className="empty-icon" />
          <p>리뷰할 응답이 없습니다.</p>
        </div>
      )}
      
      <style jsx>{`
        .review-workflow {
          background: var(--bg-primary, #12121a);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 16px;
          overflow: hidden;
        }
        
        .workflow-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: var(--bg-secondary, #1e1e2e);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
        }
        
        .workflow-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary, #e0e0e0);
        }
        
        .stats {
          display: flex;
          gap: 12px;
        }
        
        .stat {
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 12px;
        }
        
        .stat.pending {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }
        
        .stat.completed {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }
        
        .section {
          padding: 16px 20px;
        }
        
        .section h4 {
          margin: 0 0 12px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary, #a0a0b0);
        }
        
        .review-card {
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 12px;
        }
        
        .review-card.completed {
          opacity: 0.8;
        }
        
        .review-header {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }
        
        .status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          color: white;
        }
        
        .reviewer {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .review-date {
          margin-left: auto;
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .expand-icon {
          width: 16px;
          height: 16px;
          color: var(--text-muted, #6e6e7e);
          transition: transform 0.2s ease;
        }
        
        .expand-icon.rotated {
          transform: rotate(180deg);
        }
        
        .review-preview {
          margin-top: 10px;
          font-size: 13px;
          color: var(--text-secondary, #a0a0b0);
          line-height: 1.5;
        }
        
        .review-comment {
          margin-top: 10px;
          padding: 10px;
          background: var(--bg-tertiary, #252536);
          border-radius: 8px;
          font-size: 13px;
          font-style: italic;
          color: var(--text-muted, #6e6e7e);
        }
        
        .review-detail {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border-color, #3e3e5a);
        }
        
        .response-content {
          margin-bottom: 16px;
        }
        
        .response-content h5 {
          margin: 0 0 8px;
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .response-content p {
          margin: 0;
          padding: 12px;
          background: var(--bg-tertiary, #252536);
          border-radius: 8px;
          font-size: 13px;
          color: var(--text-primary, #e0e0e0);
          line-height: 1.6;
        }
        
        .action-buttons {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }
        
        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: transparent;
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 8px;
          color: var(--text-secondary, #a0a0b0);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .action-btn:hover, .action-btn.active {
          border-color: currentColor;
        }
        
        .action-btn.approve:hover, .action-btn.approve.active {
          color: #10b981;
          background: rgba(16, 185, 129, 0.1);
        }
        
        .action-btn.revision:hover, .action-btn.revision.active {
          color: #8b5cf6;
          background: rgba(139, 92, 246, 0.1);
        }
        
        .action-btn.reject:hover, .action-btn.reject.active {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }
        
        .comment-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .comment-section textarea {
          width: 100%;
          min-height: 80px;
          padding: 12px;
          background: var(--bg-tertiary, #252536);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 8px;
          color: var(--text-primary, #e0e0e0);
          font-size: 13px;
          resize: vertical;
          outline: none;
        }
        
        .comment-section textarea:focus {
          border-color: var(--primary, #7c3aed);
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 48px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .empty-icon {
          width: 48px;
          height: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
}

export default ReviewWorkflow;
