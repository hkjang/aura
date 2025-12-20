
import { Card } from "@/components/ui/card";
import { DeploymentCard } from "@/components/mlops/deployment-card";

// Mock data
const deployments = [
  { id: "1", name: "gpt-3.5-turbo", version: "2024-v2-opt", endpoint: "https://api.openai.com/v1", status: "ACTIVE", strategy: "ROLLING", trafficSplit: 100 },
  { id: "2", name: "internal-llama-3", version: "v1.0.4-rc2", endpoint: "http://gpu-cluster-1:8000/v1", status: "ACTIVE", strategy: "CANARY", trafficSplit: 10 },
  { id: "3", name: "internal-llama-3", version: "v1.0.3-stable", endpoint: "http://gpu-cluster-main:8000/v1", status: "ACTIVE", strategy: "BLUE_GREEN", trafficSplit: 90 },
];

export default function MLOpsDashboardPage() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">MLOps & Deployment</h1>
        <p className="text-muted-foreground">Manage model lifecycles, versions, and traffic routing.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
         {/* Main Deployments Column */}
         <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-semibold">Active Deployments</h2>
            <div className="grid gap-4">
                {deployments.map(d => (
                    <DeploymentCard key={d.id} deployment={d} />
                ))}
            </div>
         </div>

         {/* Sidebar Stats */}
         <div className="space-y-6">
            <h2 className="text-lg font-semibold">System Health</h2>
            <div className="grid gap-4">
                <Card className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">API Uptime (30d)</p>
                    <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">99.98%</h3>
                </Card>
                <Card className="p-4">
                    <p className="text-xs font-medium text-muted-foreground">Avg Latency (p95)</p>
                    <h3 className="text-2xl font-bold mt-1">420ms</h3>
                </Card>
                <Card className="p-4">
                     <p className="text-xs font-medium text-muted-foreground">Total Inference Req</p>
                     <h3 className="text-2xl font-bold mt-1">1.2M</h3>
                </Card>
            </div>

            <div className="mt-8 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                <h3 className="font-semibold text-sm mb-2">Automated Pipelines</h3>
                <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Evaluating v1.0.5-nightly
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Re-indexing Vector DB
                    </li>
                </ul>
            </div>
         </div>
      </div>
    </div>
  );
}
