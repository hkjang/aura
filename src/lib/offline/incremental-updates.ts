interface IncrementalUpdate {
  id: string;
  type: 'model' | 'policy' | 'config' | 'data';
  name: string;
  description: string;
  version: string;
  size: string;
  source: string;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  requestedBy: string;
  requestedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewComment?: string;
  changelog: string[];
}

/**
 * IncrementalUpdateManager - Manage incremental updates with manual approval
 */
export class IncrementalUpdateManager {
  private static updates: IncrementalUpdate[] = [
    {
      id: 'upd-1',
      type: 'model',
      name: 'Llama-3-70B v1.0.5',
      description: 'Updated model with improved reasoning',
      version: '1.0.5',
      size: '140 GB',
      source: 'internal-registry',
      status: 'pending',
      requestedBy: 'ml-team',
      requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      changelog: ['Improved math reasoning', 'Better code generation', 'Reduced hallucinations'],
    },
    {
      id: 'upd-2',
      type: 'policy',
      name: 'Updated Content Policy',
      description: 'New content filtering rules',
      version: '2.3.0',
      size: '12 KB',
      source: 'governance-team',
      status: 'approved',
      requestedBy: 'governance',
      requestedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      reviewedBy: 'admin@company.com',
      reviewedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      changelog: ['Added PII detection rules', 'Updated forbidden terms'],
    },
    {
      id: 'upd-3',
      type: 'config',
      name: 'Rate Limit Configuration',
      description: 'Adjusted rate limits for peak hours',
      version: '1.1.0',
      size: '2 KB',
      source: 'ops-team',
      status: 'applied',
      requestedBy: 'operations',
      requestedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      reviewedBy: 'admin@company.com',
      reviewedAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
      changelog: ['Increased burst limit to 100/min', 'Added regional limits'],
    },
  ];

  /**
   * Get all pending updates
   */
  static getPendingUpdates(): IncrementalUpdate[] {
    return this.updates.filter(u => u.status === 'pending');
  }

  /**
   * Get all updates
   */
  static getAllUpdates(): IncrementalUpdate[] {
    return [...this.updates].sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  }

  /**
   * Request a new update
   */
  static requestUpdate(update: Omit<IncrementalUpdate, 'id' | 'status' | 'requestedAt'>): IncrementalUpdate {
    const newUpdate: IncrementalUpdate = {
      ...update,
      id: `upd_${Date.now()}`,
      status: 'pending',
      requestedAt: new Date(),
    };

    this.updates.push(newUpdate);
    return newUpdate;
  }

  /**
   * Approve an update
   */
  static approveUpdate(updateId: string, reviewerId: string, comment?: string): IncrementalUpdate | null {
    const update = this.updates.find(u => u.id === updateId);
    
    if (!update || update.status !== 'pending') {
      return null;
    }

    update.status = 'approved';
    update.reviewedBy = reviewerId;
    update.reviewedAt = new Date();
    update.reviewComment = comment;

    return update;
  }

  /**
   * Reject an update
   */
  static rejectUpdate(updateId: string, reviewerId: string, reason: string): IncrementalUpdate | null {
    const update = this.updates.find(u => u.id === updateId);
    
    if (!update || update.status !== 'pending') {
      return null;
    }

    update.status = 'rejected';
    update.reviewedBy = reviewerId;
    update.reviewedAt = new Date();
    update.reviewComment = reason;

    return update;
  }

  /**
   * Apply an approved update
   */
  static async applyUpdate(updateId: string): Promise<{ success: boolean; message: string }> {
    const update = this.updates.find(u => u.id === updateId);
    
    if (!update) {
      return { success: false, message: 'Update not found' };
    }

    if (update.status !== 'approved') {
      return { success: false, message: 'Update must be approved before applying' };
    }

    // Simulate apply process
    await new Promise(r => setTimeout(r, 1000));

    update.status = 'applied';

    return { success: true, message: `Successfully applied ${update.name}` };
  }

  /**
   * Get update by ID
   */
  static getUpdate(updateId: string): IncrementalUpdate | undefined {
    return this.updates.find(u => u.id === updateId);
  }

  /**
   * Get updates by type
   */
  static getUpdatesByType(type: IncrementalUpdate['type']): IncrementalUpdate[] {
    return this.updates.filter(u => u.type === type);
  }
}
