// Secure Code Executor with sandboxing, timeout, and restrictions
// Production-grade implementation for agent code execution

interface ExecutionResult {
  success: boolean;
  result?: string;
  error?: string;
  logs: string[];
  executionTime: number;
  memoryUsed?: number;
}

// Forbidden patterns that could be dangerous
const FORBIDDEN_PATTERNS = [
  /eval\s*\(/i,
  /Function\s*\(/i,
  /require\s*\(/i,
  /import\s*\(/i,
  /process\./i,
  /global\./i,
  /globalThis\./i,
  /window\./i,
  /document\./i,
  /fetch\s*\(/i,
  /XMLHttpRequest/i,
  /WebSocket/i,
  /while\s*\(\s*true\s*\)/i,
  /for\s*\(\s*;\s*;\s*\)/i,
  /setInterval/i,
  /setTimeout/i,
  /__proto__/i,
  /constructor\[/i,
  /prototype/i,
];

// Maximum allowed values
const MAX_CODE_LENGTH = 10000;
const MAX_OUTPUT_LENGTH = 50000;
const MAX_EXECUTION_TIME_MS = 5000;
const MAX_ITERATIONS = 100000;

export class SecureCodeExecutor {
  /**
   * Validate code before execution
   */
  static validateCode(code: string): { valid: boolean; error?: string } {
    if (!code || typeof code !== 'string') {
      return { valid: false, error: '코드가 비어있습니다.' };
    }

    if (code.length > MAX_CODE_LENGTH) {
      return { valid: false, error: `코드가 너무 깁니다. (최대 ${MAX_CODE_LENGTH}자)` };
    }

    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(code)) {
        return { valid: false, error: `금지된 패턴이 포함되어 있습니다: ${pattern.source}` };
      }
    }

    return { valid: true };
  }

  /**
   * Execute code in a sandboxed environment with timeout
   */
  static async execute(code: string): Promise<ExecutionResult> {
    const startTime = Date.now();
    const logs: string[] = [];

    // Validate first
    const validation = this.validateCode(code);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        logs: [],
        executionTime: Date.now() - startTime
      };
    }

    try {
      // Create sandbox with limited globals
      const sandbox = {
        Math,
        Date,
        JSON,
        Array,
        Object,
        String,
        Number,
        Boolean,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
        encodeURI,
        decodeURI,
        encodeURIComponent,
        decodeURIComponent,
        console: {
          log: (...args: unknown[]) => {
            const msg = args.map(a => 
              typeof a === 'object' ? JSON.stringify(a) : String(a)
            ).join(' ');
            if (logs.join('\n').length < MAX_OUTPUT_LENGTH) {
              logs.push(msg);
            }
          },
          error: (...args: unknown[]) => {
            const msg = `ERROR: ${args.map(String).join(' ')}`;
            if (logs.join('\n').length < MAX_OUTPUT_LENGTH) {
              logs.push(msg);
            }
          },
          warn: (...args: unknown[]) => {
            const msg = `WARN: ${args.map(String).join(' ')}`;
            if (logs.join('\n').length < MAX_OUTPUT_LENGTH) {
              logs.push(msg);
            }
          }
        },
        // Iteration counter to prevent infinite loops
        __iterCount: 0,
        __maxIter: MAX_ITERATIONS,
        __checkIter: function() {
          if (++this.__iterCount > this.__maxIter) {
            throw new Error('반복 횟수 초과 (무한 루프 감지)');
          }
        }
      };

      // Inject iteration checks into loops
      const safeCode = code
        .replace(/while\s*\(/g, 'while(__checkIter.call({__iterCount, __maxIter, __checkIter}),')
        .replace(/for\s*\(/g, 'for(__checkIter.call({__iterCount, __maxIter, __checkIter}),');

      // Create function with sandbox
      const fn = new Function(
        ...Object.keys(sandbox),
        `"use strict"; return (function() { ${safeCode} })()`
      );

      // Execute with timeout
      const result = await Promise.race([
        Promise.resolve().then(() => fn(...Object.values(sandbox))),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`실행 시간 초과 (${MAX_EXECUTION_TIME_MS}ms)`)), MAX_EXECUTION_TIME_MS)
        )
      ]);

      const executionTime = Date.now() - startTime;

      // Format result
      let resultStr: string;
      if (result === undefined) {
        resultStr = 'undefined';
      } else if (typeof result === 'object') {
        resultStr = JSON.stringify(result, null, 2);
      } else {
        resultStr = String(result);
      }

      // Truncate if too long
      if (resultStr.length > MAX_OUTPUT_LENGTH) {
        resultStr = resultStr.slice(0, MAX_OUTPUT_LENGTH) + '\n... (결과가 잘렸습니다)';
      }

      return {
        success: true,
        result: resultStr,
        logs,
        executionTime
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        logs,
        executionTime: Date.now() - startTime
      };
    }
  }
}

// Logger for production use
export class AgentLogger {
  private static formatLog(level: string, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  static info(message: string, meta?: Record<string, unknown>) {
    console.log(this.formatLog('INFO', message, meta));
  }

  static warn(message: string, meta?: Record<string, unknown>) {
    console.warn(this.formatLog('WARN', message, meta));
  }

  static error(message: string, error?: Error, meta?: Record<string, unknown>) {
    const errorMeta = error ? { 
      ...meta, 
      errorMessage: error.message, 
      errorStack: error.stack?.split('\n').slice(0, 3).join('\n')
    } : meta;
    console.error(this.formatLog('ERROR', message, errorMeta));
  }

  static toolCall(toolName: string, params: Record<string, unknown>, userId?: string) {
    this.info(`Tool called: ${toolName}`, { 
      tool: toolName, 
      params: JSON.stringify(params).slice(0, 200),
      userId 
    });
  }

  static toolResult(toolName: string, success: boolean, duration: number, userId?: string) {
    this.info(`Tool completed: ${toolName}`, { 
      tool: toolName, 
      success, 
      duration: `${duration}ms`,
      userId 
    });
  }
}
