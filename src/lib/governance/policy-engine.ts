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
  violations: string[];
  details?: any;
  maskedContent?: string;
}

// Common PII patterns for detection
const PII_PATTERNS: Record<string, RegExp> = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
  phone: /(\d{2,3}[-.\s]?\d{3,4}[-.\s]?\d{4}|\+82\s?\d{2,3}[-.\s]?\d{3,4}[-.\s]?\d{4})/g,
  ssn: /\d{6}[-\s]?\d{7}/g,
  credit_card: /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g
};

export class PolicyEngine {
  /**
   * Evaluate input against active policies.
   */
  static async evaluate(input: string, userId: string = "system"): Promise<PolicyEvaluationResult> {
    // 1. Fetch active policies
    const policies = await prisma.policy.findMany({
      where: { isActive: true }
    });

    const violations: string[] = [];
    let finalAction = PolicyAction.ALLOW;
    let maskedContent = input;

    for (const policy of policies) {
      const rules = JSON.parse(policy.rules || "[]") as string[];
      const lowerInput = input.toLowerCase();

      switch (policy.type) {
        case "BLOCK_KEYWORD":
          // Check if any blocked keyword is present
          const foundKeyword = rules.find(rule => lowerInput.includes(rule.toLowerCase()));
          if (foundKeyword) {
            violations.push(`${policy.name}: 차단된 키워드 '${foundKeyword}' 발견`);
            if (policy.action === "BLOCK") {
              finalAction = PolicyAction.BLOCK;
            } else if (policy.action === "FLAG" && finalAction !== PolicyAction.BLOCK) {
              finalAction = PolicyAction.FLAG;
            }
          }
          break;

        case "PII_FILTER":
          // Check for PII patterns based on rules
          for (const piiType of rules) {
            const pattern = PII_PATTERNS[piiType];
            if (pattern && pattern.test(input)) {
              violations.push(`${policy.name}: ${piiType} 패턴 감지`);
              
              if (policy.action === "MASK") {
                maskedContent = maskedContent.replace(pattern, "[개인정보 마스킹됨]");
                if (finalAction === PolicyAction.ALLOW) {
                  finalAction = PolicyAction.MASK;
                }
              } else if (policy.action === "BLOCK") {
                finalAction = PolicyAction.BLOCK;
              } else if (policy.action === "FLAG" && finalAction !== PolicyAction.BLOCK) {
                finalAction = PolicyAction.FLAG;
              }
            }
          }
          break;

        case "TOPIC_BAN":
          // Check for banned topics
          const foundTopic = rules.find(rule => lowerInput.includes(rule.toLowerCase()));
          if (foundTopic) {
            violations.push(`${policy.name}: 금지된 주제 '${foundTopic}' 발견`);
            if (policy.action === "BLOCK") {
              finalAction = PolicyAction.BLOCK;
            } else if (policy.action === "FLAG" && finalAction !== PolicyAction.BLOCK) {
              finalAction = PolicyAction.FLAG;
            }
          }
          break;

        case "REGEX":
          // Check regex patterns
          for (const pattern of rules) {
            try {
              const regex = new RegExp(pattern, 'gi');
              if (regex.test(input)) {
                violations.push(`${policy.name}: 패턴 '${pattern}' 일치`);
                if (policy.action === "BLOCK") {
                  finalAction = PolicyAction.BLOCK;
                } else if (policy.action === "FLAG" && finalAction !== PolicyAction.BLOCK) {
                  finalAction = PolicyAction.FLAG;
                }
              }
            } catch (e) {
              console.warn(`Invalid regex pattern: ${pattern}`, e);
            }
          }
          break;
      }

      // Early exit if blocked
      if (finalAction === PolicyAction.BLOCK) {
        break;
      }
    }

    // Log policy evaluation result for audit
    if (violations.length > 0) {
      try {
        await prisma.auditLog.create({
          data: {
            userId,
            action: finalAction === PolicyAction.BLOCK ? "POLICY_BLOCKED" : 
                   finalAction === PolicyAction.FLAG ? "POLICY_FLAGGED" : "POLICY_MASKED",
            resource: "chat-input",
            details: JSON.stringify({ violations, action: finalAction })
          }
        });
      } catch (e) {
        console.warn("Failed to create audit log:", e);
      }
    }

    return {
      allowed: finalAction !== PolicyAction.BLOCK,
      action: finalAction,
      violations,
      maskedContent: finalAction === PolicyAction.MASK ? maskedContent : undefined
    };
  }

  /**
   * Evaluate and optionally transform output content
   */
  static async evaluateOutput(output: string, userId: string = "system"): Promise<PolicyEvaluationResult> {
    // Check output for PII and mask if needed
    const policies = await prisma.policy.findMany({
      where: { isActive: true, action: "MASK" }
    });

    let maskedOutput = output;
    const violations: string[] = [];

    for (const policy of policies) {
      if (policy.type === "PII_FILTER") {
        const rules = JSON.parse(policy.rules || "[]") as string[];
        for (const piiType of rules) {
          const pattern = PII_PATTERNS[piiType];
          if (pattern && pattern.test(output)) {
            violations.push(`${policy.name}: 출력에서 ${piiType} 마스킹`);
            maskedOutput = maskedOutput.replace(pattern, "[마스킹됨]");
          }
        }
      }
    }

    return {
      allowed: true,
      action: violations.length > 0 ? PolicyAction.MASK : PolicyAction.ALLOW,
      violations,
      maskedContent: violations.length > 0 ? maskedOutput : undefined
    };
  }
}
