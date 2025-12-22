/**
 * Policy Admin Service - Admin operations for notebook policy management
 */

import { prisma } from "@/lib/prisma";

export type PolicyType =
  | "CREATION"
  | "MODIFICATION"
  | "DELETION"
  | "QA_CONTROL"
  | "UPLOAD";

export interface PolicyRules {
  // Creation policy
  maxNotebooksPerUser?: number;
  allowedScopes?: string[];

  // Upload policy
  allowedFileTypes?: string[];
  maxFileSize?: number;
  maxSourcesPerNotebook?: number;

  // Modification policy
  allowedFields?: string[];
  requireApproval?: boolean;

  // Deletion policy
  softDeleteOnly?: boolean;
  retentionDays?: number;
}

export interface QAPolicySettings {
  blockExternalKnowledge: boolean;
  requireCitation: boolean;
  allowedQuestionTypes: string[];
  maxContextTokens: number;
  systemPrompt: string | null;
}

export class PolicyAdminService {
  /**
   * Create a new policy
   */
  static async createPolicy(data: {
    name: string;
    description?: string;
    policyType: PolicyType;
    rules: PolicyRules;
    scope?: "GLOBAL" | "ORGANIZATION" | "USER";
    scopeId?: string;
    priority?: number;
    // QA specific settings
    blockExternalKnowledge?: boolean;
    requireCitation?: boolean;
    allowedQuestionTypes?: string[];
    maxContextTokens?: number;
    systemPrompt?: string;
  }) {
    return prisma.notebookPolicy.create({
      data: {
        name: data.name,
        description: data.description,
        policyType: data.policyType,
        rules: JSON.stringify(data.rules),
        scope: data.scope || "GLOBAL",
        scopeId: data.scopeId,
        priority: data.priority || 0,
        blockExternalKnowledge: data.blockExternalKnowledge || false,
        requireCitation: data.requireCitation ?? true,
        allowedQuestionTypes: JSON.stringify(data.allowedQuestionTypes || []),
        maxContextTokens: data.maxContextTokens || 4000,
        systemPrompt: data.systemPrompt,
      },
    });
  }

  /**
   * Update an existing policy
   */
  static async updatePolicy(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      rules: PolicyRules;
      priority: number;
      isActive: boolean;
      blockExternalKnowledge: boolean;
      requireCitation: boolean;
      allowedQuestionTypes: string[];
      maxContextTokens: number;
      systemPrompt: string;
    }>
  ) {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.rules !== undefined) updateData.rules = JSON.stringify(data.rules);
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.blockExternalKnowledge !== undefined)
      updateData.blockExternalKnowledge = data.blockExternalKnowledge;
    if (data.requireCitation !== undefined)
      updateData.requireCitation = data.requireCitation;
    if (data.allowedQuestionTypes !== undefined)
      updateData.allowedQuestionTypes = JSON.stringify(data.allowedQuestionTypes);
    if (data.maxContextTokens !== undefined)
      updateData.maxContextTokens = data.maxContextTokens;
    if (data.systemPrompt !== undefined) updateData.systemPrompt = data.systemPrompt;

    return prisma.notebookPolicy.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete a policy
   */
  static async deletePolicy(id: string) {
    return prisma.notebookPolicy.delete({
      where: { id },
    });
  }

  /**
   * Get all policies
   */
  static async getAllPolicies(filters: {
    policyType?: PolicyType;
    scope?: string;
    isActive?: boolean;
  } = {}) {
    const where: Record<string, unknown> = {};

    if (filters.policyType) where.policyType = filters.policyType;
    if (filters.scope) where.scope = filters.scope;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    return prisma.notebookPolicy.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });
  }

  /**
   * Get active policy by type (returns highest priority)
   */
  static async getActivePolicy(
    policyType: PolicyType,
    scopeId?: string
  ) {
    const policies = await prisma.notebookPolicy.findMany({
      where: {
        policyType,
        isActive: true,
        OR: [
          { scope: "GLOBAL" },
          { scope: "ORGANIZATION", scopeId },
          { scope: "USER", scopeId },
        ],
      },
      orderBy: { priority: "desc" },
      take: 1,
    });

    return policies[0] || null;
  }

  /**
   * Get QA policy settings for a notebook/user
   */
  static async getQAPolicy(
    userId?: string,
    orgId?: string
  ): Promise<QAPolicySettings> {
    const policy = await prisma.notebookPolicy.findFirst({
      where: {
        policyType: "QA_CONTROL",
        isActive: true,
        OR: [
          { scope: "GLOBAL" },
          orgId ? { scope: "ORGANIZATION", scopeId: orgId } : {},
          userId ? { scope: "USER", scopeId: userId } : {},
        ].filter((o) => Object.keys(o).length > 0),
      },
      orderBy: { priority: "desc" },
    });

    if (!policy) {
      // Return defaults
      return {
        blockExternalKnowledge: false,
        requireCitation: true,
        allowedQuestionTypes: [],
        maxContextTokens: 4000,
        systemPrompt: null,
      };
    }

    let allowedTypes: string[] = [];
    try {
      allowedTypes = JSON.parse(policy.allowedQuestionTypes);
    } catch {
      allowedTypes = [];
    }

    return {
      blockExternalKnowledge: policy.blockExternalKnowledge,
      requireCitation: policy.requireCitation,
      allowedQuestionTypes: allowedTypes,
      maxContextTokens: policy.maxContextTokens,
      systemPrompt: policy.systemPrompt,
    };
  }

  /**
   * Check if user can create notebook
   */
  static async canCreateNotebook(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const policy = await this.getActivePolicy("CREATION", userId);

    if (!policy) {
      return { allowed: true };
    }

    let rules: PolicyRules = {};
    try {
      rules = JSON.parse(policy.rules);
    } catch {
      return { allowed: true };
    }

    if (rules.maxNotebooksPerUser) {
      const count = await prisma.notebook.count({
        where: { ownerId: userId, status: { not: "DELETED" } },
      });

      if (count >= rules.maxNotebooksPerUser) {
        return {
          allowed: false,
          reason: `노트북 생성 한도 초과 (${count}/${rules.maxNotebooksPerUser})`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Check if file can be uploaded (file size, type, sources per notebook)
   */
  static async canUploadFile(
    notebookId: string,
    userId: string,
    file: { size: number; type: string; name: string }
  ): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const policy = await this.getActivePolicy("UPLOAD", userId);

    if (!policy) {
      return { allowed: true };
    }

    let rules: PolicyRules = {};
    try {
      rules = JSON.parse(policy.rules);
    } catch {
      return { allowed: true };
    }

    // Check file size
    if (rules.maxFileSize && file.size > rules.maxFileSize) {
      const maxMB = Math.round(rules.maxFileSize / (1024 * 1024));
      const fileMB = Math.round(file.size / (1024 * 1024) * 10) / 10;
      return {
        allowed: false,
        reason: `파일 크기 제한 초과 (${fileMB}MB / 최대 ${maxMB}MB)`,
      };
    }

    // Check file type
    if (rules.allowedFileTypes && rules.allowedFileTypes.length > 0) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const allowed = rules.allowedFileTypes.some(t => 
        t.toLowerCase() === ext || 
        t.toLowerCase() === file.type.toLowerCase()
      );
      if (!allowed) {
        return {
          allowed: false,
          reason: `허용되지 않는 파일 형식입니다. 허용: ${rules.allowedFileTypes.join(', ')}`,
        };
      }
    }

    // Check max sources per notebook
    if (rules.maxSourcesPerNotebook) {
      const count = await prisma.knowledgeSource.count({
        where: { notebookId },
      });

      if (count >= rules.maxSourcesPerNotebook) {
        return {
          allowed: false,
          reason: `노트북당 소스 수 제한 초과 (${count}/${rules.maxSourcesPerNotebook})`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Get policy by ID
   */
  static async getPolicyById(id: string) {
    return prisma.notebookPolicy.findUnique({
      where: { id },
    });
  }

  /**
   * Toggle policy active status
   */
  static async togglePolicyStatus(id: string) {
    const policy = await prisma.notebookPolicy.findUnique({
      where: { id },
    });

    if (!policy) {
      throw new Error("Policy not found");
    }

    return prisma.notebookPolicy.update({
      where: { id },
      data: { isActive: !policy.isActive },
    });
  }
}
