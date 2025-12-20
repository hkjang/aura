"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  user: { name: string; email: string };
  createdAt: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/admin/audit");
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs);
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
        <ShieldAlert className="w-8 h-8 text-red-600" />
        Security Audit Logs
      </h1>
      
      <p className="text-muted-foreground">
        Tracking sensitive administrative actions.
      </p>

      <div className="rounded-md border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left font-medium">Time</th>
              <th className="p-4 text-left font-medium">Actor</th>
              <th className="p-4 text-left font-medium">Action</th>
              <th className="p-4 text-left font-medium">Resource</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="p-4 whitespace-nowrap text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="p-4">
                  <div className="font-medium">{log.user.name || "Unknown"}</div>
                  <div className="text-xs text-muted-foreground">{log.user.email}</div>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    {log.action}
                  </span>
                </td>
                <td className="p-4 font-mono text-xs">{log.resource}</td>
              </tr>
            ))}
            {logs.length === 0 && (
               <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No audit logs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
