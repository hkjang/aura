// Tool definitions for AI Agents
// These tools enable agents to perform real actions

import { z } from "zod";
import { SecureCodeExecutor, AgentLogger } from "./secure-executor";

// Calculator tool - for mathematical calculations
export const calculatorTool = {
  description: "Perform mathematical calculations. Use this for any math operations.",
  parameters: z.object({
    expression: z.string().describe("The mathematical expression to evaluate, e.g., '2 + 2 * 3' or 'Math.sqrt(16)'")
  }),
  execute: async ({ expression }: { expression: string }) => {
    AgentLogger.toolCall('calculate', { expression });
    const startTime = Date.now();
    
    try {
      // Safe evaluation - only allow basic math
      const sanitized = expression.replace(/[^0-9+\-*/().,%\sMathsqrtpowabsceilfloorround]/g, '');
      const result = Function(`"use strict"; return (${sanitized})`)();
      
      AgentLogger.toolResult('calculate', true, Date.now() - startTime);
      return { result: String(result), expression };
    } catch (error) {
      AgentLogger.toolResult('calculate', false, Date.now() - startTime);
      return { error: `계산 오류: ${(error as Error).message}`, expression };
    }
  }
};

// Web search tool - using DuckDuckGo instant answers
export const webSearchTool = {
  description: "Search the web for information. Use this to find current information, news, or facts.",
  parameters: z.object({
    query: z.string().describe("The search query")
  }),
  execute: async ({ query }: { query: string }) => {
    AgentLogger.toolCall('web_search', { query });
    const startTime = Date.now();
    
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`,
        { headers: { 'Accept': 'application/json' } }
      );
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const data = await response.json();
      const results: string[] = [];
      
      if (data.Abstract) {
        results.push(`📝 ${data.Abstract}`);
      }
      
      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        const topics = data.RelatedTopics
          .slice(0, 5)
          .filter((t: { Text?: string }) => t.Text)
          .map((t: { Text: string }) => `• ${t.Text}`);
        if (topics.length > 0) {
          results.push("\n관련 정보:\n" + topics.join("\n"));
        }
      }
      
      AgentLogger.toolResult('web_search', true, Date.now() - startTime);
      
      if (results.length === 0) {
        return { query, message: "직접적인 검색 결과가 없습니다.", source: "DuckDuckGo" };
      }
      
      return { query, results: results.join("\n"), source: "DuckDuckGo", moreInfoUrl: data.AbstractURL };
    } catch (error) {
      AgentLogger.toolResult('web_search', false, Date.now() - startTime);
      return { error: `검색 오류: ${(error as Error).message}`, query };
    }
  }
};

// URL reader tool
export const readUrlTool = {
  description: "Read and extract text content from a URL.",
  parameters: z.object({
    url: z.string().url().describe("The URL to read")
  }),
  execute: async ({ url }: { url: string }) => {
    AgentLogger.toolCall('read_url', { url });
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AuraBot/1.0)' }
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const html = await response.text();
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 5000);
      
      AgentLogger.toolResult('read_url', true, Date.now() - startTime);
      return { url, content: text, length: text.length, truncated: html.length > 5000 };
    } catch (error) {
      AgentLogger.toolResult('read_url', false, Date.now() - startTime);
      return { error: `URL 읽기 오류: ${(error as Error).message}`, url };
    }
  }
};

// Code execution tool (SECURE - using SecureCodeExecutor)
export const codeExecuteTool = {
  description: "Execute JavaScript code and return the result. Code is validated and sandboxed for security.",
  parameters: z.object({
    code: z.string().describe("JavaScript code to execute"),
    description: z.string().optional().describe("Brief description of what the code does")
  }),
  execute: async ({ code, description }: { code: string; description?: string }) => {
    AgentLogger.toolCall('execute_code', { description: description || code.slice(0, 50), codeLength: code.length });
    
    const result = await SecureCodeExecutor.execute(code);
    
    AgentLogger.toolResult('execute_code', result.success, result.executionTime);
    
    return {
      code: description || code.slice(0, 100),
      result: result.result,
      error: result.error,
      logs: result.logs.length > 0 ? result.logs.join('\n') : undefined,
      success: result.success,
      executionTime: `${result.executionTime}ms`
    };
  }
};

// Time tool
export const currentTimeTool = {
  description: "Get the current date and time.",
  parameters: z.object({
    timezone: z.string().optional().describe("Timezone like 'Asia/Seoul' or 'UTC'")
  }),
  execute: async ({ timezone }: { timezone?: string }) => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false, timeZone: timezone || 'Asia/Seoul'
    };
    
    return {
      datetime: now.toLocaleString('ko-KR', options),
      iso: now.toISOString(),
      timezone: timezone || 'Asia/Seoul',
      timestamp: now.getTime()
    };
  }
};

// Export all tools
export const agentTools = {
  calculate: calculatorTool,
  web_search: webSearchTool,
  read_url: readUrlTool,
  execute_code: codeExecuteTool,
  current_time: currentTimeTool
};

export type AgentToolName = keyof typeof agentTools;

export function getToolDescriptions(): string {
  return `
사용 가능한 도구:
1. **calculate**: 수학 계산 수행
2. **web_search**: 웹에서 정보 검색
3. **read_url**: URL의 내용 읽기
4. **execute_code**: JavaScript 코드 실행
5. **current_time**: 현재 날짜/시간 확인

도구를 사용하여 정확한 정보를 제공하세요.
`;
}
