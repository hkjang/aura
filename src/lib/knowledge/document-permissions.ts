import { prisma } from "@/lib/prisma";

type PermissionLevel = "read" | "write" | "admin" | "none";

interface DocumentPermission {
  documentId: string;
  userId?: string;
  groupId?: string;
  permission: PermissionLevel;
}

/**
 * DocumentPermissions - Manage access control for documents
 */
export class DocumentPermissions {
  // In-memory permission store for MVP
  private static permissions: DocumentPermission[] = [];

  /**
   * Set permission for a document
   */
  static setPermission(
    documentId: string,
    permission: PermissionLevel,
    userId?: string,
    groupId?: string
  ): void {
    // Remove existing permission for this combo
    this.permissions = this.permissions.filter(
      p => !(p.documentId === documentId && p.userId === userId && p.groupId === groupId)
    );

    if (permission !== "none") {
      this.permissions.push({ documentId, userId, groupId, permission });
    }
  }

  /**
   * Check if a user can access a document
   */
  static async canAccess(
    documentId: string,
    userId: string,
    requiredLevel: PermissionLevel = "read"
  ): Promise<boolean> {
    const levels: PermissionLevel[] = ["none", "read", "write", "admin"];
    const requiredIndex = levels.indexOf(requiredLevel);

    // Check user-specific permission
    const userPerm = this.permissions.find(
      p => p.documentId === documentId && p.userId === userId
    );

    if (userPerm) {
      return levels.indexOf(userPerm.permission) >= requiredIndex;
    }

    // Check if document is public (no permissions set = public read)
    const hasAnyPerm = this.permissions.some(p => p.documentId === documentId);
    if (!hasAnyPerm && requiredLevel === "read") {
      return true; // Default: public read access
    }

    return false;
  }

  /**
   * Get all permissions for a document
   */
  static getPermissions(documentId: string): DocumentPermission[] {
    return this.permissions.filter(p => p.documentId === documentId);
  }

  /**
   * Get all documents a user can access
   */
  static async getAccessibleDocuments(userId: string): Promise<string[]> {
    const userPerms = this.permissions
      .filter(p => p.userId === userId && p.permission !== "none")
      .map(p => p.documentId);

    // Also include documents with no permissions (public)
    const allDocs = this.permissions.map(p => p.documentId);
    const restrictedDocs = new Set(allDocs);
    
    // For MVP, return user's permitted docs
    return [...new Set(userPerms)];
  }

  /**
   * Bulk set permissions from a document's metadata
   */
  static initializeFromMetadata(documentId: string, metadata: { 
    isPublic?: boolean; 
    allowedUsers?: string[];
    allowedGroups?: string[];
  }): void {
    if (metadata.isPublic) {
      // Public documents have no restrictions
      return;
    }

    if (metadata.allowedUsers) {
      for (const userId of metadata.allowedUsers) {
        this.setPermission(documentId, "read", userId);
      }
    }

    if (metadata.allowedGroups) {
      for (const groupId of metadata.allowedGroups) {
        this.setPermission(documentId, "read", undefined, groupId);
      }
    }
  }
}
