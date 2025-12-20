"use client";

import { useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  MessageSquare,
  DollarSign,
  Clock,
  Bot,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: React.ElementType;
  color: string;
}

interface UsagePoint {
  date: string;
  requests: number;
  tokens: number;
  cost: number;
}

// Mock data
const metrics: MetricCard[] = [
  { 
    title: "Total Requests", 
    value: "24,521", 
    change: 12.5, 
    changeLabel: "vs last week",
    icon: MessageSquare,
    color: "text-violet-500 bg-violet-100 dark:bg-violet-900/30"
  },
  { 
    title: "Active Users", 
    value: "1,284", 
    change: 8.2, 
    changeLabel: "vs last week",
    icon: Users,
    color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30"
  },
  { 
    title: "Total Cost", 
    value: "$3,421", 
    change: -5.3, 
    changeLabel: "vs last week",
    icon: DollarSign,
    color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30"
  },
  { 
    title: "Avg Response Time", 
    value: "1.2s", 
    change: -15.0, 
    changeLabel: "vs last week",
    icon: Clock,
    color: "text-amber-500 bg-amber-100 dark:bg-amber-900/30"
  },
];

const usageData: UsagePoint[] = [
  { date: "Mon", requests: 3200, tokens: 125000, cost: 420 },
  { date: "Tue", requests: 4100, tokens: 156000, cost: 512 },
  { date: "Wed", requests: 3800, tokens: 142000, cost: 478 },
  { date: "Thu", requests: 4500, tokens: 168000, cost: 545 },
  { date: "Fri", requests: 4200, tokens: 158000, cost: 520 },
  { date: "Sat", requests: 2100, tokens: 82000, cost: 275 },
  { date: "Sun", requests: 2620, tokens: 98000, cost: 321 },
];

const modelUsage = [
  { model: "GPT-4o", percentage: 45, color: "bg-violet-500" },
  { model: "Claude 3.5", percentage: 28, color: "bg-blue-500" },
  { model: "GPT-4o Mini", percentage: 18, color: "bg-emerald-500" },
  { model: "Llama 3.1", percentage: 9, color: "bg-amber-500" },
];

export function UsageDashboard() {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week");
  
  const maxRequests = Math.max(...usageData.map(d => d.requests));

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-violet-500" />
          Usage Analytics
        </h2>
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
          {(["week", "month", "year"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded capitalize transition-colors ${
                timeRange === range
                  ? "bg-white dark:bg-zinc-900 shadow"
                  : "hover:bg-white/50 dark:hover:bg-zinc-900/50"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const isPositive = metric.change > 0;
          const isGoodTrend = metric.title.includes("Cost") || metric.title.includes("Time") 
            ? !isPositive : isPositive;
          
          return (
            <Card key={metric.title}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg ${metric.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${
                    isGoodTrend ? "text-green-600" : "text-red-600"
                  }`}>
                    {isPositive ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {Math.abs(metric.change)}%
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className="text-xs text-muted-foreground">{metric.title}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Bar Chart - Request Volume */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Request Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-48">
              {usageData.map((point) => (
                <div key={point.date} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-violet-500 rounded-t transition-all hover:bg-violet-600"
                    style={{ height: `${(point.requests / maxRequests) * 100}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{point.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Model Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Model Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {modelUsage.map((model) => (
                <div key={model.model}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{model.model}</span>
                    <span className="font-medium">{model.percentage}%</span>
                  </div>
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${model.color} rounded-full transition-all`}
                      style={{ width: `${model.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Daily Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="text-left py-2 font-medium">Date</th>
                  <th className="text-right py-2 font-medium">Requests</th>
                  <th className="text-right py-2 font-medium">Tokens</th>
                  <th className="text-right py-2 font-medium">Cost</th>
                </tr>
              </thead>
              <tbody>
                {usageData.map((point) => (
                  <tr key={point.date} className="border-b border-zinc-100 dark:border-zinc-800/50">
                    <td className="py-2">{point.date}</td>
                    <td className="text-right py-2">{point.requests.toLocaleString()}</td>
                    <td className="text-right py-2">{point.tokens.toLocaleString()}</td>
                    <td className="text-right py-2">${point.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
