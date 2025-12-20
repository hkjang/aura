import { prisma } from "@/lib/prisma";

export enum PolicyAction {
  ALLOW = "ALLOW",
  BLOCK = "BLOCK",
  FLAG = "FLAG",
  MASK = "MASK"
}

export interface PolicyEvaluationResult {
  allowed: boolean;
  action: PolicyAction;
  violations: string[]; // List of policy names or reasons
  details?: any;
}

export class PolicyEngine {
  /**
   * Evaluate input against active policies.
   */
  static async evaluate(input: string, userId: string = "system"): Promise<PolicyEvaluationResult> {
    // 1. Fetch active policies
    // In production, cache these policies!
    const policies = await prisma.policy.findMany({
      where: { isActive: true }
    });

    const violations: string[] = [];
    let finalAction = PolicyAction.ALLOW;

    for (const policy of policies) {
      if (policy.type === "BLOCK_KEYWORD") {
        const rules = JSON.parse(policy.rules || "[]") as string[];
        const lowerInput = input.toLowerCase();
        
        // Check if any blocked keyword is present
        const found = rules.find(rule => lowerInput.includes(rule.toLowerCase()));
        
        if (found) {
            violations.push(`${policy.name}: Found blocked keyword '${found}'`);
            if (policy.action === "BLOCK") {
                finalAction = PolicyAction.BLOCK;
            } else if (policy.action === "FLAG" && finalAction !== PolicyAction.BLOCK) {
                finalAction = PolicyAction.FLAG;
            }
        }
      }
      // Add other policy types here (e.g. PII_FILTER, REGEX, etc.)
    }

    // If result is BLOCK, we deny. ALLOW or FLAG proceeds (FLAG just logs/warns).
    return {
      allowed: finalAction !== PolicyAction.BLOCK,
      action: finalAction,
      violations
    };
  }
}
