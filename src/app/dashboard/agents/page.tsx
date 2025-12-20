
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Clock, Users } from "lucide-react";

// Prevent static prerendering
export const dynamic = 'force-dynamic';

// Mock data
const workflows = [
  { id: "1", name: "Weekly Report Generation", agents: ["Researcher", "Summarizer"], schedule: "0 9 * * MON", status: "active", lastRun: "2 days ago" },
  { id: "2", name: "Customer Ticket Triage", agents: ["Classifier", "Router"], schedule: null, status: "manual", lastRun: "5 mins ago" },
  { id: "3", name: "Data Quality Check", agents: ["Validator", "Reporter"], schedule: "0 0 * * *", status: "active", lastRun: "1 day ago" },
];

const recentExecutions = [
  { id: "e1", workflow: "Customer Ticket Triage", result: "SUCCESS", duration: "12s", time: "16:42" },
  { id: "e2", workflow: "Weekly Report Generation", result: "SUCCESS", duration: "2m 34s", time: "09:00" },
  { id: "e3", workflow: "Data Quality Check", result: "FAILED", duration: "45s", time: "00:00" },
];

export default function AgentDashboardPage() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Agent Automation</h1>
        <p className="text-muted-foreground">Manage automated workflows and multi-agent tasks.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Workflows */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Workflows</h2>
          <div className="grid gap-4">
            {workflows.map(wf => (
              <Card key={wf.id} className="p-4 flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                    <Users className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{wf.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{wf.agents.join(" → ")}</span>
                      {wf.schedule && (
                        <Badge variant="outline" className="text-[10px]">
                          <Clock className="w-3 h-3 mr-1" /> {wf.schedule}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Last run: {wf.lastRun}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Play className="w-4 h-4 mr-2" /> Run
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats & Recent Runs */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Stats</h2>
          <div className="grid gap-4">
            <Card className="p-4">
              <p className="text-xs font-medium text-muted-foreground">Total Workflows</p>
              <h3 className="text-2xl font-bold mt-1">{workflows.length}</h3>
            </Card>
            <Card className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
              <p className="text-xs font-medium text-emerald-600">Success Rate (7d)</p>
              <h3 className="text-2xl font-bold text-emerald-700 mt-1">94.5%</h3>
            </Card>
          </div>

          <h2 className="text-lg font-semibold mt-6">Recent Executions</h2>
          <Card className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {recentExecutions.map(ex => (
              <div key={ex.id} className="p-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    ex.result === "SUCCESS" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  }`}>{ex.result}</span>
                  <span className="text-xs text-muted-foreground">{ex.time}</span>
                </div>
                <p className="font-medium mt-1">{ex.workflow}</p>
                <p className="text-xs text-muted-foreground">Duration: {ex.duration}</p>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
