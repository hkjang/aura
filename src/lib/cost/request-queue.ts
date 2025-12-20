interface QueuedRequest {
  id: string;
  userId: string;
  priority: number;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  query: string;
  model: string;
}

/**
 * RequestQueue - Manage concurrent AI requests with priority
 */
export class RequestQueue {
  private static queue: QueuedRequest[] = [];
  private static processing = new Set<string>();
  private static MAX_CONCURRENT = 10;

  /**
   * Add a request to the queue
   */
  static enqueue(request: Omit<QueuedRequest, 'id' | 'status' | 'timestamp'>): string {
    const id = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const queuedRequest: QueuedRequest = {
      ...request,
      id,
      status: 'pending',
      timestamp: Date.now(),
    };

    // Insert based on priority (higher priority first)
    const insertIndex = this.queue.findIndex(r => r.priority < request.priority);
    if (insertIndex === -1) {
      this.queue.push(queuedRequest);
    } else {
      this.queue.splice(insertIndex, 0, queuedRequest);
    }

    return id;
  }

  /**
   * Get the next request to process
   */
  static dequeue(): QueuedRequest | null {
    if (this.processing.size >= this.MAX_CONCURRENT) {
      return null;
    }

    const request = this.queue.find(r => r.status === 'pending');
    if (request) {
      request.status = 'processing';
      this.processing.add(request.id);
    }
    
    return request || null;
  }

  /**
   * Mark a request as completed
   */
  static complete(id: string, success: boolean = true): void {
    const request = this.queue.find(r => r.id === id);
    if (request) {
      request.status = success ? 'completed' : 'failed';
      this.processing.delete(id);
      
      // Clean up old completed requests
      this.cleanup();
    }
  }

  /**
   * Get queue statistics
   */
  static getStats(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    return {
      total: this.queue.length,
      pending: this.queue.filter(r => r.status === 'pending').length,
      processing: this.processing.size,
      completed: this.queue.filter(r => r.status === 'completed').length,
      failed: this.queue.filter(r => r.status === 'failed').length,
    };
  }

  /**
   * Get current queue
   */
  static getQueue(): QueuedRequest[] {
    return [...this.queue].slice(0, 50);
  }

  /**
   * Get user's position in queue
   */
  static getPosition(userId: string): number {
    const pending = this.queue.filter(r => r.status === 'pending');
    const index = pending.findIndex(r => r.userId === userId);
    return index === -1 ? -1 : index + 1;
  }

  /**
   * Clean up old completed/failed requests
   */
  private static cleanup(): void {
    const ONE_HOUR = 1000 * 60 * 60;
    const now = Date.now();
    
    this.queue = this.queue.filter(r => {
      if (r.status === 'completed' || r.status === 'failed') {
        return now - r.timestamp < ONE_HOUR;
      }
      return true;
    });
  }
}
