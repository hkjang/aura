import { prisma } from "@/lib/prisma";

export type DataClassification = "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";

interface ClassificationRule {
  pattern: RegExp;
  classification: DataClassification;
  description: string;
}

/**
 * DataClassifier - Classify data sensitivity levels
 */
export class DataClassifier {
  private static rules: ClassificationRule[] = [
    // Restricted - Highest sensitivity
    { pattern: /\b(ssn|social security|passport)\b/i, classification: "RESTRICTED", description: "Personal ID documents" },
    { pattern: /\b(password|secret|private key|api.?key)\b/i, classification: "RESTRICTED", description: "Authentication credentials" },
    { pattern: /\b(credit.?card|cvv|bank.?account)\b/i, classification: "RESTRICTED", description: "Financial information" },
    
    // Confidential
    { pattern: /\b(salary|compensation|performance.?review)\b/i, classification: "CONFIDENTIAL", description: "HR-sensitive data" },
    { pattern: /\b(trade.?secret|proprietary|confidential)\b/i, classification: "CONFIDENTIAL", description: "Business secrets" },
    { pattern: /\b(merger|acquisition|ipo|pre.?announcement)\b/i, classification: "CONFIDENTIAL", description: "Material non-public info" },
    
    // Internal
    { pattern: /\b(internal|draft|not.?for.?distribution)\b/i, classification: "INTERNAL", description: "Internal use only" },
    { pattern: /\b(roadmap|strategy|quarterly.?plan)\b/i, classification: "INTERNAL", description: "Business planning" },
  ];

  /**
   * Classify text content
   */
  static classify(text: string): { classification: DataClassification; matches: string[] } {
    const matches: string[] = [];
    let highestClassification: DataClassification = "PUBLIC";
    
    const classificationOrder: DataClassification[] = ["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"];
    
    for (const rule of this.rules) {
      if (rule.pattern.test(text)) {
        matches.push(rule.description);
        
        const ruleLevel = classificationOrder.indexOf(rule.classification);
        const currentLevel = classificationOrder.indexOf(highestClassification);
        
        if (ruleLevel > currentLevel) {
          highestClassification = rule.classification;
        }
      }
    }

    return { classification: highestClassification, matches };
  }

  /**
   * Check if a document can be accessed at a given clearance level
   */
  static canAccess(docClassification: DataClassification, userClearance: DataClassification): boolean {
    const levels: DataClassification[] = ["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"];
    return levels.indexOf(userClearance) >= levels.indexOf(docClassification);
  }

  /**
   * Get classification badge color
   */
  static getColor(classification: DataClassification): string {
    switch (classification) {
      case "PUBLIC": return "bg-emerald-100 text-emerald-700";
      case "INTERNAL": return "bg-blue-100 text-blue-700";
      case "CONFIDENTIAL": return "bg-amber-100 text-amber-700";
      case "RESTRICTED": return "bg-red-100 text-red-700";
      default: return "bg-zinc-100 text-zinc-700";
    }
  }

  /**
   * Auto-classify a document and store result
   */
  static async classifyDocument(documentId: string): Promise<DataClassification> {
    try {
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        select: { content: true, metadata: true },
      });

      if (!doc) throw new Error("Document not found");

      const { classification } = this.classify(doc.content);

      // Update document metadata with classification
      const currentMetadata = doc.metadata 
        ? (typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata)
        : {};
      
      await prisma.document.update({
        where: { id: documentId },
        data: {
          metadata: JSON.stringify({
            ...currentMetadata,
            classification,
            classifiedAt: new Date().toISOString(),
          }),
        },
      });

      return classification;
    } catch (error) {
      console.error("Classification error:", error);
      return "PUBLIC"; // Default to public on error
    }
  }
}
