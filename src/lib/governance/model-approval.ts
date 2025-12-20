import { prisma } from "@/lib/prisma";

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

interface ApprovalRequest {
  id: string;
  modelId: string;
  modelName: string;
  requesterId: string;
  requesterName: string;
  reason: string;
  status: ApprovalStatus;
  reviewerId?: string;
  reviewComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ModelApprovalWorkflow - Manage approval process for new AI models
 */
export class ModelApprovalWorkflow {
  // In-memory storage for MVP (would use DB in production)
  private static approvals: ApprovalRequest[] = [];

  /**
   * Request approval for a new model
   */
  static async requestApproval(
    modelId: string,
    modelName: string,
    requesterId: string,
    requesterName: string,
    reason: string
  ): Promise<ApprovalRequest> {
    const request: ApprovalRequest = {
      id: `apr_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      modelId,
      modelName,
      requesterId,
      requesterName,
      reason,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.approvals.push(request);

    // In production, would notify admins here
    console.log(`New model approval request: ${modelName} by ${requesterName}`);

    return request;
  }

  /**
   * Approve a model request
   */
  static async approve(
    requestId: string,
    reviewerId: string,
    comment?: string
  ): Promise<ApprovalRequest | null> {
    const request = this.approvals.find(r => r.id === requestId);
    
    if (!request || request.status !== "PENDING") {
      return null;
    }

    request.status = "APPROVED";
    request.reviewerId = reviewerId;
    request.reviewComment = comment;
    request.updatedAt = new Date();

    // In production, would activate the model in the system
    console.log(`Model ${request.modelName} approved by ${reviewerId}`);

    return request;
  }

  /**
   * Reject a model request
   */
  static async reject(
    requestId: string,
    reviewerId: string,
    comment: string
  ): Promise<ApprovalRequest | null> {
    const request = this.approvals.find(r => r.id === requestId);
    
    if (!request || request.status !== "PENDING") {
      return null;
    }

    request.status = "REJECTED";
    request.reviewerId = reviewerId;
    request.reviewComment = comment;
    request.updatedAt = new Date();

    return request;
  }

  /**
   * Get all pending approvals
   */
  static getPending(): ApprovalRequest[] {
    return this.approvals.filter(r => r.status === "PENDING");
  }

  /**
   * Get approval history
   */
  static getHistory(limit: number = 50): ApprovalRequest[] {
    return [...this.approvals]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get request by ID
   */
  static getById(requestId: string): ApprovalRequest | undefined {
    return this.approvals.find(r => r.id === requestId);
  }
}
