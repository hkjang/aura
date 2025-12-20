interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: 'erp' | 'itsm' | 'crm' | 'custom';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  isEnabled: boolean;
}

interface ToolExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  latencyMs: number;
}

/**
 * InternalToolsIntegration - Connect AI agents with enterprise systems
 */
export class InternalToolsIntegration {
  private static tools: ToolDefinition[] = [
    // Sample ERP integration
    {
      id: 'erp-inventory',
      name: 'Check Inventory',
      description: 'Query inventory levels from ERP system',
      category: 'erp',
      endpoint: '/api/erp/inventory',
      method: 'GET',
      inputSchema: { type: 'object', properties: { sku: { type: 'string' } } },
      isEnabled: true,
    },
    {
      id: 'erp-order',
      name: 'Create Purchase Order',
      description: 'Create a new purchase order in the ERP',
      category: 'erp',
      endpoint: '/api/erp/orders',
      method: 'POST',
      inputSchema: {
        type: 'object',
        properties: {
          items: { type: 'array' },
          vendor: { type: 'string' },
          urgency: { type: 'string' },
        },
      },
      isEnabled: true,
    },
    // Sample ITSM integration
    {
      id: 'itsm-ticket',
      name: 'Create Support Ticket',
      description: 'Create a ticket in the ITSM system',
      category: 'itsm',
      endpoint: '/api/itsm/tickets',
      method: 'POST',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string' },
          assignee: { type: 'string' },
        },
      },
      isEnabled: true,
    },
    {
      id: 'itsm-status',
      name: 'Get Ticket Status',
      description: 'Check the status of an IT ticket',
      category: 'itsm',
      endpoint: '/api/itsm/tickets/{id}',
      method: 'GET',
      inputSchema: { type: 'object', properties: { ticketId: { type: 'string' } } },
      isEnabled: true,
    },
    // Sample CRM integration
    {
      id: 'crm-customer',
      name: 'Get Customer Info',
      description: 'Retrieve customer information from CRM',
      category: 'crm',
      endpoint: '/api/crm/customers/{id}',
      method: 'GET',
      inputSchema: { type: 'object', properties: { customerId: { type: 'string' } } },
      isEnabled: false, // Disabled by default
    },
  ];

  /**
   * Get all available tools
   */
  static getTools(enabledOnly: boolean = true): ToolDefinition[] {
    if (enabledOnly) {
      return this.tools.filter(t => t.isEnabled);
    }
    return [...this.tools];
  }

  /**
   * Get tools by category
   */
  static getToolsByCategory(category: ToolDefinition['category']): ToolDefinition[] {
    return this.tools.filter(t => t.category === category && t.isEnabled);
  }

  /**
   * Execute a tool
   */
  static async execute(toolId: string, input: Record<string, unknown>): Promise<ToolExecutionResult> {
    const tool = this.tools.find(t => t.id === toolId);
    
    if (!tool) {
      return { success: false, error: 'Tool not found', latencyMs: 0 };
    }

    if (!tool.isEnabled) {
      return { success: false, error: 'Tool is disabled', latencyMs: 0 };
    }

    const startTime = Date.now();

    try {
      // Mock execution for MVP - in production would call actual API
      await new Promise(r => setTimeout(r, 200 + Math.random() * 300));

      // Return mock data based on tool
      const mockResponses: Record<string, unknown> = {
        'erp-inventory': { sku: input.sku, quantity: 156, warehouse: 'WH-01', lastUpdated: new Date().toISOString() },
        'erp-order': { orderId: `PO-${Date.now()}`, status: 'created', estimatedDelivery: '2024-12-25' },
        'itsm-ticket': { ticketId: `TKT-${Date.now()}`, status: 'open', assignedTo: 'support-team' },
        'itsm-status': { ticketId: input.ticketId, status: 'in-progress', lastUpdate: new Date().toISOString() },
        'crm-customer': { customerId: input.customerId, name: 'ACME Corp', tier: 'enterprise' },
      };

      return {
        success: true,
        data: mockResponses[toolId] || { message: 'Executed successfully' },
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latencyMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Register a custom tool
   */
  static registerTool(tool: Omit<ToolDefinition, 'id'>): ToolDefinition {
    const newTool: ToolDefinition = {
      ...tool,
      id: `custom-${Date.now()}`,
    };
    this.tools.push(newTool);
    return newTool;
  }

  /**
   * Toggle tool enabled status
   */
  static setEnabled(toolId: string, enabled: boolean): boolean {
    const tool = this.tools.find(t => t.id === toolId);
    if (tool) {
      tool.isEnabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * Get tool for AI SDK integration
   */
  static getAIToolDefinitions(): { name: string; description: string; parameters: object }[] {
    return this.getTools().map(tool => ({
      name: tool.id,
      description: tool.description,
      parameters: tool.inputSchema,
    }));
  }
}
