
export interface EvaluationResult {
  accuracy: number;
  relevance: number;
  style: number;
  reasoning: string;
  confidence: number;
}

export interface Evaluator {
  evaluate(question: string, answer: string, context?: string): Promise<EvaluationResult>;
}

/**
 * LLM-based Quality Evaluator
 * Uses AI to evaluate response quality on multiple dimensions
 */
export class QualityEvaluator implements Evaluator {
  private apiKey: string | undefined;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    this.baseUrl = baseUrl || "https://api.openai.com/v1";
  }

  async evaluate(question: string, answer: string, context?: string): Promise<EvaluationResult> {
    // If no API key, use heuristic evaluation
    if (!this.apiKey) {
      return this.heuristicEvaluate(question, answer, context);
    }

    try {
      const evaluationPrompt = this.buildEvaluationPrompt(question, answer, context);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are an AI response quality evaluator. Analyze the given question-answer pair and provide scores.
Output ONLY a valid JSON object with this exact structure:
{
  "accuracy": <0.0-1.0>,
  "relevance": <0.0-1.0>,
  "style": <0.0-1.0>,
  "confidence": <0.0-1.0>,
  "reasoning": "<brief explanation>"
}`
            },
            { role: "user", content: evaluationPrompt }
          ],
          temperature: 0.1,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        console.error("Quality evaluation API error:", response.status);
        return this.heuristicEvaluate(question, answer, context);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      
      return this.parseEvaluationResponse(content);
    } catch (error) {
      console.error("Quality evaluation error:", error);
      return this.heuristicEvaluate(question, answer, context);
    }
  }

  private buildEvaluationPrompt(question: string, answer: string, context?: string): string {
    let prompt = `Evaluate this AI response:

**Question:** ${question}

**Answer:** ${answer}`;

    if (context) {
      prompt += `\n\n**Reference Context:** ${context}`;
    }

    prompt += `

Score criteria:
- accuracy: Is the answer factually correct and complete?
- relevance: Does it directly address the question?
- style: Is it well-structured, clear, and professional?
- confidence: How confident are you in this evaluation?`;

    return prompt;
  }

  private parseEvaluationResponse(content: string): EvaluationResult {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          accuracy: Math.max(0, Math.min(1, parsed.accuracy || 0.5)),
          relevance: Math.max(0, Math.min(1, parsed.relevance || 0.5)),
          style: Math.max(0, Math.min(1, parsed.style || 0.5)),
          confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
          reasoning: parsed.reasoning || "Evaluation completed"
        };
      }
    } catch (e) {
      console.error("Failed to parse evaluation response:", e);
    }

    return {
      accuracy: 0.5,
      relevance: 0.5,
      style: 0.5,
      confidence: 0.3,
      reasoning: "Failed to parse evaluation, using defaults"
    };
  }

  /**
   * Heuristic-based evaluation when LLM is unavailable
   */
  private heuristicEvaluate(question: string, answer: string, context?: string): EvaluationResult {
    const questionWords = question.toLowerCase().split(/\s+/);
    const answerLower = answer.toLowerCase();
    const answerLength = answer.length;

    // Relevance: Check if answer contains question keywords
    const keywordMatches = questionWords.filter(w => 
      w.length > 3 && answerLower.includes(w)
    ).length;
    const relevance = Math.min(1, 0.3 + (keywordMatches / Math.max(1, questionWords.length)) * 0.7);

    // Style: Based on length and structure
    let style = 0.5;
    if (answerLength > 50) style += 0.1;
    if (answerLength > 200) style += 0.1;
    if (answerLength > 500) style += 0.1;
    if (answer.includes("\n") || answer.includes(".")) style += 0.1;
    style = Math.min(1, style);

    // Accuracy: Context-based if available
    let accuracy = 0.7;
    if (context) {
      const contextLower = context.toLowerCase();
      const contextMatch = questionWords.filter(w => 
        w.length > 3 && contextLower.includes(w) && answerLower.includes(w)
      ).length;
      accuracy = Math.min(1, 0.5 + (contextMatch / Math.max(1, questionWords.length)) * 0.5);
    }

    // Confidence in heuristic evaluation is lower
    const confidence = 0.4;

    return {
      accuracy,
      relevance,
      style,
      confidence,
      reasoning: "Heuristic evaluation based on keyword matching and structure analysis"
    };
  }
}

/**
 * Singleton instance for convenience
 */
export const qualityEvaluator = new QualityEvaluator();
