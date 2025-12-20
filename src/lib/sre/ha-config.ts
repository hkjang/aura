interface HANode {
  id: string;
  hostname: string;
  role: 'primary' | 'secondary' | 'arbiter';
  status: 'healthy' | 'degraded' | 'offline';
  lastHeartbeat: Date;
  version: string;
}

interface BackupConfig {
  enabled: boolean;
  schedule: string; // cron format
  retentionDays: number;
  destination: 'local' | 's3' | 'gcs' | 'azure';
  lastBackup?: Date;
  nextBackup?: Date;
}

interface DRScenario {
  id: string;
  name: string;
  description: string;
  rto: number; // Recovery Time Objective in minutes
  rpo: number; // Recovery Point Objective in minutes
  steps: string[];
  lastTested?: Date;
  status: 'untested' | 'passed' | 'failed';
}

/**
 * HAConfigManager - High Availability, Backup, and DR Configuration
 */
export class HAConfigManager {
  // Mock data for cluster nodes
  private static nodes: HANode[] = [
    { id: 'node-1', hostname: 'aura-primary.local', role: 'primary', status: 'healthy', lastHeartbeat: new Date(), version: '1.0.0' },
    { id: 'node-2', hostname: 'aura-secondary.local', role: 'secondary', status: 'healthy', lastHeartbeat: new Date(), version: '1.0.0' },
    { id: 'node-3', hostname: 'aura-arbiter.local', role: 'arbiter', status: 'healthy', lastHeartbeat: new Date(), version: '1.0.0' },
  ];

  private static backupConfig: BackupConfig = {
    enabled: true,
    schedule: '0 2 * * *', // 2 AM daily
    retentionDays: 30,
    destination: 'local',
    lastBackup: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
  };

  private static drScenarios: DRScenario[] = [
    {
      id: 'dr-1',
      name: 'Primary Node Failure',
      description: 'Automatic failover when primary node becomes unavailable',
      rto: 5,
      rpo: 1,
      steps: ['Detect primary failure', 'Promote secondary to primary', 'Update DNS/Load balancer', 'Notify operations team'],
      lastTested: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: 'passed',
    },
    {
      id: 'dr-2',
      name: 'Database Corruption',
      description: 'Restore from backup when database corruption is detected',
      rto: 30,
      rpo: 60,
      steps: ['Stop application', 'Identify corruption scope', 'Restore from last good backup', 'Validate data integrity', 'Resume operations'],
      status: 'untested',
    },
    {
      id: 'dr-3',
      name: 'Complete Site Failure',
      description: 'Restore service in secondary datacenter',
      rto: 60,
      rpo: 15,
      steps: ['Activate DR site', 'Restore latest backup', 'Update global DNS', 'Verify service health', 'Notify stakeholders'],
      status: 'untested',
    },
  ];

  // HA Methods
  static getClusterStatus(): { nodes: HANode[]; healthy: boolean; primaryNode: string } {
    const healthy = this.nodes.every(n => n.status === 'healthy');
    const primary = this.nodes.find(n => n.role === 'primary');
    return {
      nodes: [...this.nodes],
      healthy,
      primaryNode: primary?.hostname || 'unknown',
    };
  }

  static failover(): { success: boolean; newPrimary: string; message: string } {
    const current = this.nodes.find(n => n.role === 'primary');
    const secondary = this.nodes.find(n => n.role === 'secondary' && n.status === 'healthy');

    if (!secondary) {
      return { success: false, newPrimary: '', message: 'No healthy secondary node available' };
    }

    if (current) current.role = 'secondary';
    secondary.role = 'primary';

    return { success: true, newPrimary: secondary.hostname, message: 'Failover completed successfully' };
  }

  // Backup Methods
  static getBackupConfig(): BackupConfig {
    return { ...this.backupConfig };
  }

  static updateBackupConfig(config: Partial<BackupConfig>): BackupConfig {
    this.backupConfig = { ...this.backupConfig, ...config };
    return this.backupConfig;
  }

  static async triggerBackup(): Promise<{ success: boolean; backupId: string; size: string }> {
    // Simulate backup
    await new Promise(r => setTimeout(r, 1000));
    
    this.backupConfig.lastBackup = new Date();
    
    return {
      success: true,
      backupId: `backup_${Date.now()}`,
      size: '256 MB',
    };
  }

  // DR Methods
  static getDRScenarios(): DRScenario[] {
    return [...this.drScenarios];
  }

  static async testDRScenario(scenarioId: string): Promise<{ success: boolean; duration: number; issues: string[] }> {
    const scenario = this.drScenarios.find(s => s.id === scenarioId);
    if (!scenario) {
      return { success: false, duration: 0, issues: ['Scenario not found'] };
    }

    // Simulate DR test
    await new Promise(r => setTimeout(r, 2000));

    const success = Math.random() > 0.2; // 80% success rate for demo
    scenario.lastTested = new Date();
    scenario.status = success ? 'passed' : 'failed';

    return {
      success,
      duration: Math.floor(scenario.rto * 0.7 + Math.random() * scenario.rto * 0.3),
      issues: success ? [] : ['Simulated issue during DR test'],
    };
  }
}
