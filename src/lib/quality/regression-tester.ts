interface TestCase {
  id: string;
  name: string;
  input: string;
  expectedOutput?: string;
  expectedScore?: number;
  tags: string[];
}

interface TestResult {
  testCaseId: string;
  passed: boolean;
  actualOutput: string;
  actualScore: number;
  latency: number;
  timestamp: Date;
}

/**
 * QualityRegressionTester - Run quality regression tests on AI models
 */
export class QualityRegressionTester {
  private static testCases: TestCase[] = [
    // Default test cases
    {
      id: "tc1",
      name: "Basic greeting",
      input: "Hello, how are you?",
      expectedScore: 70,
      tags: ["basic", "greeting"],
    },
    {
      id: "tc2",
      name: "Simple math",
      input: "What is 2 + 2?",
      expectedOutput: "4",
      expectedScore: 90,
      tags: ["math", "basic"],
    },
    {
      id: "tc3",
      name: "Knowledge test",
      input: "What is the capital of France?",
      expectedOutput: "Paris",
      expectedScore: 95,
      tags: ["knowledge", "geography"],
    },
    {
      id: "tc4",
      name: "Reasoning test",
      input: "If all cats are animals, and Whiskers is a cat, what can we conclude?",
      expectedScore: 80,
      tags: ["reasoning", "logic"],
    },
  ];

  private static results: TestResult[] = [];

  /**
   * Run all test cases
   */
  static async runAllTests(model: string): Promise<{ passed: number; failed: number; results: TestResult[] }> {
    const results: TestResult[] = [];

    for (const testCase of this.testCases) {
      const result = await this.runTest(testCase, model);
      results.push(result);
    }

    this.results.push(...results);

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    return { passed, failed, results };
  }

  /**
   * Run a single test case
   */
  private static async runTest(testCase: TestCase, model: string): Promise<TestResult> {
    const startTime = Date.now();

    // Mock response for MVP
    await new Promise(r => setTimeout(r, 200 + Math.random() * 500));

    const mockResponses: Record<string, string> = {
      tc1: "I'm doing well, thank you for asking! How can I help you today?",
      tc2: "2 + 2 equals 4.",
      tc3: "The capital of France is Paris.",
      tc4: "Whiskers is an animal, since all cats are animals and Whiskers is a cat.",
    };

    const actualOutput = mockResponses[testCase.id] || "Mock response";
    const actualScore = Math.floor(70 + Math.random() * 25);

    // Determine if passed
    const scorePass = testCase.expectedScore ? actualScore >= testCase.expectedScore : true;
    const outputPass = testCase.expectedOutput 
      ? actualOutput.toLowerCase().includes(testCase.expectedOutput.toLowerCase())
      : true;

    return {
      testCaseId: testCase.id,
      passed: scorePass && outputPass,
      actualOutput,
      actualScore,
      latency: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  /**
   * Get test cases
   */
  static getTestCases(): TestCase[] {
    return [...this.testCases];
  }

  /**
   * Add a custom test case
   */
  static addTestCase(testCase: Omit<TestCase, 'id'>): TestCase {
    const newCase: TestCase = {
      ...testCase,
      id: `tc_${Date.now()}`,
    };
    this.testCases.push(newCase);
    return newCase;
  }

  /**
   * Get historical results
   */
  static getHistory(limit: number = 100): TestResult[] {
    return this.results.slice(-limit).reverse();
  }

  /**
   * Get pass rate over time
   */
  static getPassRate(days: number = 7): { date: string; passRate: number }[] {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const recent = this.results.filter(r => r.timestamp.getTime() > cutoff);

    // Group by day
    const byDay: Record<string, { passed: number; total: number }> = {};
    
    for (const result of recent) {
      const date = result.timestamp.toISOString().split('T')[0];
      if (!byDay[date]) {
        byDay[date] = { passed: 0, total: 0 };
      }
      byDay[date].total++;
      if (result.passed) byDay[date].passed++;
    }

    return Object.entries(byDay).map(([date, data]) => ({
      date,
      passRate: (data.passed / data.total) * 100,
    }));
  }
}
