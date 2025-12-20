
import { Card } from "@/components/ui/card";
import { PolicyCard } from "@/components/governance/policy-card";

// Prevent static prerendering
export const dynamic = 'force-dynamic';

// Mock data for MVP
const policies = [
  { id: "1", name: "Block Competitors", type: "BLOCK_KEYWORD", action: "BLOCK", isActive: true, description: "Prevents users from mentioning specific competitor names in prompts." },
  { id: "2", name: "PII Detection", type: "PII_FILTER", action: "MASK", isActive: true, description: "Detects and masks emails, phone numbers, and SSNs in outputs." },
  { id: "3", name: "Financial Advice Filter", type: "TOPIC_BAN", action: "FLAG", isActive: false, description: "Flags requests asking for specific investment advice or stock tips." },
  { id: "4", name: "System Prompt Injection", type: "REGEX", action: "BLOCK", isActive: true, description: "Blocks attempts to override system instructions via 'Ignore previous instructions'." },
];

const auditLogs = [
  { id: "1", user: "user-123", action: "CHAT_REQUEST", resource: "model-inference", status: "BLOCKED", details: "Competitor mention", time: "2 mins ago" },
  { id: "2", user: "user-456", action: "CHAT_REQUEST", resource: "model-inference", status: "ALLOWED", details: "-", time: "5 mins ago" },
  { id: "3", user: "admin-1", action: "UPDATE_POLICY", resource: "policy-2", status: "SUCCESS", details: "Changed action to MASK", time: "1 hour ago" },
  { id: "4", user: "user-789", action: "CHAT_REQUEST", resource: "model-inference", status: "FLAGGED", details: "Potential PII", time: "3 hours ago" },
];

export default function GovernanceDashboardPage() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Governance & Control</h1>
        <p className="text-muted-foreground">Manage usage policies, view audit logs, and control AI safety guardrails.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Policy Management Column */}
        <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-semibold">Active Policies</h2>
            <div className="grid gap-4 md:grid-cols-2">
                {policies.map(p => (
                    <PolicyCard key={p.id} policy={p} />
                ))}
            </div>

            <div className="mt-8">
                 <h2 className="text-lg font-semibold mb-4">Security Insights</h2>
                 <div className="grid gap-4 md:grid-cols-3">
                    <Card className="p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
                        <p className="text-xs font-medium text-red-600 dark:text-red-400">Blocked Requests (24h)</p>
                        <h3 className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">12</h3>
                    </Card>
                    <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                        <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Flagged Incidents</p>
                        <h3 className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">45</h3>
                    </Card>
                     <Card className="p-4">
                        <p className="text-xs font-medium text-muted-foreground">Active Rules</p>
                        <h3 className="text-2xl font-bold mt-1">104</h3>
                    </Card>
                 </div>
            </div>
        </div>

        {/* Audit Log Column */}
        <div className="lg:col-span-1">
             <h2 className="text-lg font-semibold mb-4">Recent Audit Logs</h2>
             <Card className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {auditLogs.map(log => (
                    <div key={log.id} className="p-4 text-sm">
                        <div className="flex justify-between items-start mb-1">
                            <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                                log.status === 'BLOCKED' ? 'bg-red-100 text-red-700' :
                                log.status === 'FLAGGED' ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'
                            }`}>{log.status}</span>
                            <span className="text-xs text-muted-foreground">{log.time}</span>
                        </div>
                        <p className="font-medium mt-1">{log.action}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            User: {log.user} • {log.details}
                        </p>
                    </div>
                ))}
                <div className="p-3 text-center">
                    <button className="text-xs text-violet-600 font-medium hover:underline">View All Logs</button>
                </div>
             </Card>
        </div>
      </div>
    </div>
  );
}
