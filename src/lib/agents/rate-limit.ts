// Rate Limiting Service for AI Agent API calls
// Production-grade implementation

import { prisma } from "@/lib/prisma";

interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  maxRequestsPerDay: number;
  maxTokensPerDay: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: {
    perMinute: number;
    perHour: number;
    perDay: number;
    tokens: number;
  };
  resetTime?: Date;
  reason?: string;
}

// In-memory cache for rate limiting (faster than DB for every request)
const rateLimitCache = new Map<string, {
  minute: { count: number; resetAt: number };
  hour: { count: number; resetAt: number };
  day: { count: number; resetAt: number };
  tokens: { count: number; resetAt: number };
}>();

// Default limits
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequestsPerMinute: 20,
  maxRequestsPerHour: 100,
  maxRequestsPerDay: 500,
  maxTokensPerDay: 100000
};

// Role-based configs
const ROLE_CONFIGS: Record<string, RateLimitConfig> = {
  ADMIN: {
    maxRequestsPerMinute: 60,
    maxRequestsPerHour: 500,
    maxRequestsPerDay: 5000,
    maxTokensPerDay: 1000000
  },
  USER: DEFAULT_CONFIG,
  GUEST: {
    maxRequestsPerMinute: 5,
    maxRequestsPerHour: 20,
    maxRequestsPerDay: 50,
    maxTokensPerDay: 10000
  }
};

export class RateLimitService {
  /**
   * Get or initialize user's rate limit entry
   */
  private static getOrCreateEntry(userId: string) {
    const now = Date.now();
    
    if (!rateLimitCache.has(userId)) {
      rateLimitCache.set(userId, {
        minute: { count: 0, resetAt: now + 60000 },
        hour: { count: 0, resetAt: now + 3600000 },
        day: { count: 0, resetAt: now + 86400000 },
        tokens: { count: 0, resetAt: now + 86400000 }
      });
    }

    const entry = rateLimitCache.get(userId)!;

    // Reset expired periods
    if (now > entry.minute.resetAt) {
      entry.minute = { count: 0, resetAt: now + 60000 };
    }
    if (now > entry.hour.resetAt) {
      entry.hour = { count: 0, resetAt: now + 3600000 };
    }
    if (now > entry.day.resetAt) {
      entry.day = { count: 0, resetAt: now + 86400000 };
      entry.tokens = { count: 0, resetAt: now + 86400000 };
    }

    return entry;
  }

  /**
   * Check if request is allowed and consume quota
   */
  static async checkAndConsume(userId: string, role: string = 'USER'): Promise<RateLimitResult> {
    const config = ROLE_CONFIGS[role] || DEFAULT_CONFIG;
    const entry = this.getOrCreateEntry(userId);

    // Check limits
    if (entry.minute.count >= config.maxRequestsPerMinute) {
      return {
        allowed: false,
        remaining: {
          perMinute: 0,
          perHour: Math.max(0, config.maxRequestsPerHour - entry.hour.count),
          perDay: Math.max(0, config.maxRequestsPerDay - entry.day.count),
          tokens: Math.max(0, config.maxTokensPerDay - entry.tokens.count)
        },
        resetTime: new Date(entry.minute.resetAt),
        reason: '분당 요청 한도 초과'
      };
    }

    if (entry.hour.count >= config.maxRequestsPerHour) {
      return {
        allowed: false,
        remaining: {
          perMinute: 0,
          perHour: 0,
          perDay: Math.max(0, config.maxRequestsPerDay - entry.day.count),
          tokens: Math.max(0, config.maxTokensPerDay - entry.tokens.count)
        },
        resetTime: new Date(entry.hour.resetAt),
        reason: '시간당 요청 한도 초과'
      };
    }

    if (entry.day.count >= config.maxRequestsPerDay) {
      return {
        allowed: false,
        remaining: {
          perMinute: 0,
          perHour: 0,
          perDay: 0,
          tokens: Math.max(0, config.maxTokensPerDay - entry.tokens.count)
        },
        resetTime: new Date(entry.day.resetAt),
        reason: '일일 요청 한도 초과'
      };
    }

    // Consume quota
    entry.minute.count++;
    entry.hour.count++;
    entry.day.count++;

    return {
      allowed: true,
      remaining: {
        perMinute: config.maxRequestsPerMinute - entry.minute.count,
        perHour: config.maxRequestsPerHour - entry.hour.count,
        perDay: config.maxRequestsPerDay - entry.day.count,
        tokens: config.maxTokensPerDay - entry.tokens.count
      }
    };
  }

  /**
   * Record token usage
   */
  static recordTokenUsage(userId: string, tokens: number) {
    const entry = this.getOrCreateEntry(userId);
    entry.tokens.count += tokens;
  }

  /**
   * Check if token limit is exceeded
   */
  static checkTokenLimit(userId: string, role: string = 'USER'): { allowed: boolean; remaining: number } {
    const config = ROLE_CONFIGS[role] || DEFAULT_CONFIG;
    const entry = this.getOrCreateEntry(userId);

    return {
      allowed: entry.tokens.count < config.maxTokensPerDay,
      remaining: Math.max(0, config.maxTokensPerDay - entry.tokens.count)
    };
  }

  /**
   * Get current usage stats
   */
  static getUsageStats(userId: string, role: string = 'USER') {
    const config = ROLE_CONFIGS[role] || DEFAULT_CONFIG;
    const entry = this.getOrCreateEntry(userId);

    return {
      requests: {
        minute: { used: entry.minute.count, max: config.maxRequestsPerMinute },
        hour: { used: entry.hour.count, max: config.maxRequestsPerHour },
        day: { used: entry.day.count, max: config.maxRequestsPerDay }
      },
      tokens: { used: entry.tokens.count, max: config.maxTokensPerDay },
      resetTimes: {
        minute: new Date(entry.minute.resetAt),
        hour: new Date(entry.hour.resetAt),
        day: new Date(entry.day.resetAt)
      }
    };
  }

  /**
   * Clear cache for a user (admin function)
   */
  static clearUserLimit(userId: string) {
    rateLimitCache.delete(userId);
  }

  /**
   * Clear all cache (admin function)
   */
  static clearAllLimits() {
    rateLimitCache.clear();
  }
}
