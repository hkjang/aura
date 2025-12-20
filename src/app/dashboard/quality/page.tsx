
import { Card } from "@/components/ui/card";
// import styles from "./page.module.css"; 

// Prevent static prerendering
export const dynamic = 'force-dynamic';

// Mock Data
const stats = [
  { label: "Avg. Accuracy", value: "94.2%", trend: "+1.2%" },
  { label: "Avg. Relevance", value: "96.5%", trend: "+0.5%" },
  { label: "CSAT Score", value: "4.8/5.0", trend: "+0.1" },
  { label: "Total Feedback", value: "1,240", trend: "+120" },
];

export default function QualityDashboardPage() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Quality & Reliability</h1>
        <p className="text-muted-foreground">Monitor the performance and user satisfaction of your AI models.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="p-6">
            <div className="text-sm font-medium text-muted-foreground">{stat.label}</div>
            <div className="flex items-baseline mt-2">
              <span className="text-3xl font-bold">{stat.value}</span>
              <span className="ml-2 text-sm font-medium text-emerald-600">{stat.trend}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Recent Low Quality Responses</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono text-red-600 bg-red-100 px-2 py-0.5 rounded">Accuracy: 0.45</span>
                  <span className="text-xs text-muted-foreground">10 mins ago</span>
                </div>
                <p className="text-sm font-medium mb-1">Q: What is the competitor's pricing?</p>
                <p className="text-sm text-muted-foreground line-clamp-2">I cannot provide real-time pricing for competitors directly...</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Recent User Feedback</h3>
          <div className="space-y-4">
             {[1, 2, 3].map((_, i) => (
              <div key={i} className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs">U</div>
                  <span className="text-sm font-medium">User 123</span>
                  <span className="ml-auto text-xs text-muted-foreground">High Latency</span>
                </div>
                <p className="text-sm text-zinc-600">The response took way too long to generate.</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
