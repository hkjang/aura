
import { prisma } from "@/lib/prisma";

export interface WorkflowStep {
  id: string;
  type: "LLM_CALL" | "API_CALL" | "CONDITION" | "LOOP";
  config: any;
  next?: string; // ID of next step
  onTrue?: string; // For CONDITION type
  onFalse?: string;
}

export interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  entryPoint: string; // ID of first step
}

export interface ExecutionContext {
  variables: Record<string, any>;
  logs: string[];
}

export class WorkflowEngine {
  private workflow: Workflow;
  private context: ExecutionContext;

  constructor(workflow: Workflow) {
    this.workflow = workflow;
    this.context = { variables: {}, logs: [] };
  }

  async execute(initialVars: Record<string, any> = {}): Promise<ExecutionContext> {
    this.context.variables = { ...initialVars };
    this.context.logs.push(`[START] Workflow: ${this.workflow.name}`);

    let currentStepId: string | undefined = this.workflow.entryPoint;

    while (currentStepId) {
      const step = this.workflow.steps.find(s => s.id === currentStepId);
      if (!step) {
        this.context.logs.push(`[ERROR] Step not found: ${currentStepId}`);
        break;
      }

      this.context.logs.push(`[STEP] Executing: ${step.id} (${step.type})`);
      currentStepId = await this.executeStep(step);
    }

    this.context.logs.push(`[END] Workflow completed.`);
    return this.context;
  }

  private async executeStep(step: WorkflowStep): Promise<string | undefined> {
    switch (step.type) {
      case "LLM_CALL":
        // Mock LLM call
        this.context.logs.push(`  -> Calling LLM with: ${JSON.stringify(step.config.prompt)}`);
        this.context.variables[step.config.outputVar || "llmResult"] = "Mock LLM Response";
        return step.next;

      case "API_CALL":
        // Mock API call
        this.context.logs.push(`  -> Calling API: ${step.config.url}`);
        this.context.variables[step.config.outputVar || "apiResult"] = { status: 200, data: {} };
        return step.next;

      case "CONDITION":
        const conditionResult = this.evaluateCondition(step.config.condition);
        this.context.logs.push(`  -> Condition "${step.config.condition}": ${conditionResult}`);
        return conditionResult ? step.onTrue : step.onFalse;

      case "LOOP":
        // Simple mock for loop
        this.context.logs.push(`  -> Loop: ${step.config.iterations} iterations (Mocked)`);
        return step.next;

      default:
        return step.next;
    }
  }

  private evaluateCondition(condition: string): boolean {
    // Very naive condition evaluation for MVP
    // e.g., "{{var}} == true" or "{{count}} > 5"
    try {
      const resolved = condition.replace(/\{\{(\w+)\}\}/g, (_, varName) => {
        return JSON.stringify(this.context.variables[varName]);
      });
      // eslint-disable-next-line no-eval
      return eval(resolved);
    } catch {
      return false;
    }
  }
}
