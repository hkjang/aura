"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";
// import { useSession } from "next-auth/react";

interface Log {
  id: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  createdAt: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState({ totalCost: 0, totalTokens: 0 });

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/admin/logs");
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs);
          
          const totalCost = data.logs.reduce((acc: number, log: Log) => acc + log.cost, 0);
          const totalTokens = data.logs.reduce((acc: number, log: Log) => acc + log.tokensIn + log.tokensOut, 0);
          setStats({ totalCost, totalTokens });
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
        <Activity className="w-8 h-8 text-violet-600" />
        System Logs
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
             <CardTitle className="text-sm font-medium">Total Cost Est.</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCost.toFixed(6)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
             <CardTitle className="text-sm font-medium">Total Tokens Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left font-medium">Time</th>
              <th className="p-4 text-left font-medium">Model</th>
              <th className="p-4 text-right font-medium">Tokens (In/Out)</th>
              <th className="p-4 text-right font-medium">Cost</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="p-4">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="p-4 font-mono">{log.model}</td>
                <td className="p-4 text-right">{log.tokensIn} / {log.tokensOut}</td>
                <td className="p-4 text-right">${log.cost.toFixed(6)}</td>
              </tr>
            ))}
            {logs.length === 0 && (
               <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No logs found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
