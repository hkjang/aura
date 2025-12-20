interface PipelineConfig {
  id: string;
  name: string;
  description: string;
  type: 'training' | 'evaluation' | 'deployment' | 'data-processing';
  stages: PipelineStage[];
  schedule?: string; // cron format
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

interface PipelineStage {
  name: string;
  type: 'data-prep' | 'training' | 'validation' | 'deployment' | 'monitoring';
  config: Record<string, unknown>;
  timeout: number; // minutes
}

interface PipelineRun {
  id: string;
  pipelineId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  currentStage?: string;
  logs: string[];
  metrics?: Record<string, number>;
}

/**
 * MLPipelineManager - Integrate with ML training and deployment pipelines
 */
export class MLPipelineManager {
  private static pipelines: PipelineConfig[] = [
    {
      id: 'pipe-1',
      name: 'Model Fine-tuning Pipeline',
      description: 'Fine-tune base model on enterprise data',
      type: 'training',
      stages: [
        { name: 'Data Preparation', type: 'data-prep', config: { format: 'jsonl' }, timeout: 30 },
        { name: 'Training', type: 'training', config: { epochs: 3, batchSize: 4 }, timeout: 240 },
        { name: 'Validation', type: 'validation', config: { testSize: 0.1 }, timeout: 15 },
        { name: 'Deploy to Staging', type: 'deployment', config: { env: 'staging' }, timeout: 10 },
      ],
      schedule: '0 0 * * 0', // Weekly on Sunday
      isActive: true,
      lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'pipe-2',
      name: 'Model Evaluation Pipeline',
      description: 'Evaluate model quality on benchmark datasets',
      type: 'evaluation',
      stages: [
        { name: 'Load Benchmarks', type: 'data-prep', config: { datasets: ['mmlu', 'hellaswag'] }, timeout: 10 },
        { name: 'Run Evaluation', type: 'validation', config: { metrics: ['accuracy', 'f1'] }, timeout: 60 },
        { name: 'Generate Report', type: 'monitoring', config: { notify: true }, timeout: 5 },
      ],
      schedule: '0 6 * * *', // Daily at 6 AM
      isActive: true,
    },
    {
      id: 'pipe-3',
      name: 'Data Ingestion Pipeline',
      description: 'Process and index new documents',
      type: 'data-processing',
      stages: [
        { name: 'Fetch New Docs', type: 'data-prep', config: { sources: ['sharepoint', 'confluence'] }, timeout: 30 },
        { name: 'Extract & Chunk', type: 'data-prep', config: { chunkSize: 512 }, timeout: 45 },
        { name: 'Generate Embeddings', type: 'training', config: { model: 'text-embedding-3-small' }, timeout: 60 },
        { name: 'Index to Vector DB', type: 'deployment', config: { destination: 'milvus' }, timeout: 15 },
      ],
      schedule: '0 */4 * * *', // Every 4 hours
      isActive: true,
    },
  ];

  private static runs: PipelineRun[] = [];

  /**
   * Get all pipelines
   */
  static getPipelines(): PipelineConfig[] {
    return [...this.pipelines];
  }

  /**
   * Get pipeline by ID
   */
  static getPipeline(id: string): PipelineConfig | undefined {
    return this.pipelines.find(p => p.id === id);
  }

  /**
   * Trigger a pipeline run
   */
  static async triggerRun(pipelineId: string): Promise<PipelineRun> {
    const pipeline = this.pipelines.find(p => p.id === pipelineId);
    if (!pipeline) {
      throw new Error('Pipeline not found');
    }

    const run: PipelineRun = {
      id: `run_${Date.now()}`,
      pipelineId,
      status: 'running',
      startTime: new Date(),
      currentStage: pipeline.stages[0]?.name,
      logs: [`[${new Date().toISOString()}] Pipeline started`],
    };

    this.runs.push(run);

    // Simulate async pipeline execution
    this.simulateRun(run, pipeline);

    return run;
  }

  /**
   * Simulate pipeline execution (mock for demo)
   */
  private static async simulateRun(run: PipelineRun, pipeline: PipelineConfig): Promise<void> {
    for (const stage of pipeline.stages) {
      run.currentStage = stage.name;
      run.logs.push(`[${new Date().toISOString()}] Starting stage: ${stage.name}`);

      // Simulate stage duration
      await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));

      // Random success/failure (90% success rate)
      if (Math.random() < 0.1) {
        run.status = 'failed';
        run.logs.push(`[${new Date().toISOString()}] Stage failed: ${stage.name}`);
        run.endTime = new Date();
        return;
      }

      run.logs.push(`[${new Date().toISOString()}] Completed stage: ${stage.name}`);
    }

    run.status = 'completed';
    run.endTime = new Date();
    run.logs.push(`[${new Date().toISOString()}] Pipeline completed successfully`);
    run.metrics = {
      totalDuration: (run.endTime.getTime() - run.startTime.getTime()) / 1000,
      stagesCompleted: pipeline.stages.length,
    };

    // Update pipeline lastRun
    pipeline.lastRun = run.endTime;
  }

  /**
   * Get run status
   */
  static getRunStatus(runId: string): PipelineRun | undefined {
    return this.runs.find(r => r.id === runId);
  }

  /**
   * Get recent runs
   */
  static getRecentRuns(limit: number = 10): PipelineRun[] {
    return [...this.runs]
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  /**
   * Cancel a running pipeline
   */
  static cancelRun(runId: string): boolean {
    const run = this.runs.find(r => r.id === runId);
    if (run && run.status === 'running') {
      run.status = 'cancelled';
      run.endTime = new Date();
      run.logs.push(`[${new Date().toISOString()}] Pipeline cancelled by user`);
      return true;
    }
    return false;
  }

  /**
   * Toggle pipeline active status
   */
  static setActive(pipelineId: string, active: boolean): boolean {
    const pipeline = this.pipelines.find(p => p.id === pipelineId);
    if (pipeline) {
      pipeline.isActive = active;
      return true;
    }
    return false;
  }
}
