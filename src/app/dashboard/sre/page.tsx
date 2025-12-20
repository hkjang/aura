
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Bell, Server, Database, Cpu, AlertTriangle } from "lucide-react";

// Prevent static prerendering
export const dynamic = 'force-dynamic';

// Mock data
const healthChecks = [
  { service: "API Gateway", status: "healthy", latency: 23, icon: Server },
  { service: "Database (PostgreSQL)", status: "healthy", latency: 45, icon: Database },
  { service: "AI Model (GPT-4)", status: "healthy", latency: 320, icon: Cpu },
  { service: "Vector Database", status: "degraded", latency: 156, icon: Database },
];

const alerts = [
  { id: "1", name: "High Latency Alert", condition: "latency > 500ms", channels: ["slack"], isEnabled: true },
  { id: "2", name: "Service Down Alert", condition: "status == unhealthy", channels: ["slack", "email"], isEnabled: true },
  { id: "3", name: "Database Warning", condition: "db_connections > 80%", channels: ["email"], isEnabled: false },
];

const recentIncidents = [
  { id: "i1", title: "Vector DB high latency", time: "2 hours ago", status: "resolved" },
  { id: "i2", title: "API timeout spike", time: "1 day ago", status: "resolved" },
];

export default function SREDashboardPage() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Operations & Reliability</h1>
        <p className="text-muted-foreground">Monitor system health, manage alerts, and ensure uptime.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Health Checks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">System Health</h2>
            <Button size="sm" variant="outline">
              <Activity className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {healthChecks.map(check => {
              const Icon = check.icon;
              return (
                <Card key={check.service} className={`p-4 border-l-4 ${
                  check.status === "healthy" ? "border-l-emerald-500" :
                  check.status === "degraded" ? "border-l-amber-500" : "border-l-red-500"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      check.status === "healthy" ? "bg-emerald-100" :
                      check.status === "degraded" ? "bg-amber-100" : "bg-red-100"
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        check.status === "healthy" ? "text-emerald-600" :
                        check.status === "degraded" ? "text-amber-600" : "text-red-600"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{check.service}</h3>
                      <p className="text-xs text-muted-foreground">Latency: {check.latency}ms</p>
                    </div>
                    <Badge variant={check.status === "healthy" ? "default" : "secondary"} className="capitalize">
                      {check.status}
                    </Badge>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Alerts */}
          <h2 className="text-lg font-semibold mt-8">Alert Rules</h2>
          <Card className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {alerts.map(alert => (
              <div key={alert.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className={`w-4 h-4 ${alert.isEnabled ? "text-violet-600" : "text-zinc-400"}`} />
                  <div>
                    <h4 className="font-medium text-sm">{alert.name}</h4>
                    <p className="text-xs text-muted-foreground font-mono">{alert.condition}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {alert.channels.map(ch => (
                    <Badge key={ch} variant="outline" className="text-[10px]">{ch}</Badge>
                  ))}
                  <Badge variant={alert.isEnabled ? "default" : "secondary"}>
                    {alert.isEnabled ? "On" : "Off"}
                  </Badge>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Recent Incidents</h2>
          <Card className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {recentIncidents.map(inc => (
              <div key={inc.id} className="p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">{inc.title}</h4>
                    <p className="text-xs text-muted-foreground">{inc.time}</p>
                  </div>
                </div>
                <Badge variant="outline" className="mt-2 capitalize">{inc.status}</Badge>
              </div>
            ))}
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-3">Uptime (30 days)</h3>
            <div className="text-3xl font-bold text-emerald-600">99.95%</div>
            <p className="text-xs text-muted-foreground mt-1">Target: 99.9%</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
