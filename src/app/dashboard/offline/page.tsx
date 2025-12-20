
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, CloudOff, Package, Check, AlertTriangle } from "lucide-react";

// Mock state
const syncState = {
  lastSyncTime: "2024-12-20 10:30 AM",
  pendingChanges: 5,
  status: "pending" as "synced" | "pending" | "offline" | "error"
};

const offlinePackages = [
  { id: "1", name: "Core AI Models", version: "2.1.0", size: "450 MB", status: "installed" },
  { id: "2", name: "Policy Engine", version: "1.5.0", size: "85 MB", status: "installed" },
  { id: "3", name: "RAG Knowledge Pack", version: "3.0.0-rc1", size: "1.2 GB", status: "available" },
];

export default function OfflineDashboardPage() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Offline & Air-gapped Operations</h1>
        <p className="text-muted-foreground">Manage synchronization and offline deployment packages.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sync Status */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${syncState.status === "synced" ? "bg-emerald-100" : syncState.status === "pending" ? "bg-amber-100" : "bg-zinc-100"}`}>
                  {syncState.status === "synced" ? <Check className="w-5 h-5 text-emerald-600" /> :
                   syncState.status === "pending" ? <AlertTriangle className="w-5 h-5 text-amber-600" /> :
                   <CloudOff className="w-5 h-5 text-zinc-600" />}
                </div>
                <div>
                  <h3 className="font-semibold">Sync Status</h3>
                  <p className="text-xs text-muted-foreground">Last sync: {syncState.lastSyncTime}</p>
                </div>
              </div>
              <Badge variant={syncState.status === "synced" ? "default" : "secondary"} className="capitalize">
                {syncState.status}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Pending Changes</p>
                <p className="text-2xl font-bold text-amber-600">{syncState.pendingChanges}</p>
              </div>
              <Button>
                <RefreshCw className="w-4 h-4 mr-2" /> Sync Now
              </Button>
            </div>
          </Card>

          <h2 className="text-lg font-semibold">Offline Packages</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {offlinePackages.map(pkg => (
              <Card key={pkg.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{pkg.name}</h3>
                      <Badge variant={pkg.status === "installed" ? "default" : "outline"}>
                        {pkg.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      v{pkg.version} • {pkg.size}
                    </p>
                  </div>
                </div>
                {pkg.status === "available" && (
                  <Button size="sm" className="w-full mt-4">Install Package</Button>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <div className="grid gap-3">
            <Button variant="outline" className="justify-start">
              <Package className="w-4 h-4 mr-2" /> Create Offline Bundle
            </Button>
            <Button variant="outline" className="justify-start">
              <CloudOff className="w-4 h-4 mr-2" /> Export Logs
            </Button>
            <Button variant="outline" className="justify-start">
              <RefreshCw className="w-4 h-4 mr-2" /> Force Re-sync
            </Button>
          </div>

          <Card className="p-4 mt-6">
            <h3 className="font-semibold text-sm mb-2">System Info</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex justify-between">
                <span>Mode:</span>
                <span className="font-medium text-amber-600">Air-gapped</span>
              </li>
              <li className="flex justify-between">
                <span>Storage Used:</span>
                <span>2.4 GB / 10 GB</span>
              </li>
              <li className="flex justify-between">
                <span>Offline Since:</span>
                <span>3 days ago</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
