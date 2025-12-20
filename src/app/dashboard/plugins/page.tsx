
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Download, Shield, Star } from "lucide-react";

// Prevent static prerendering
export const dynamic = 'force-dynamic';

// Mock data
const installedPlugins = [
  { id: "1", name: "RAG Enhancer", version: "1.2.0", author: "Aura Team", category: "AI", status: "active", rating: 4.8 },
  { id: "2", name: "Slack Notifier", version: "2.0.1", author: "Community", category: "Integration", status: "active", rating: 4.5 },
  { id: "3", name: "Custom Prompt Templates", version: "0.9.0", author: "Internal", category: "Productivity", status: "pending", rating: null },
];

const marketplacePlugins = [
  { id: "m1", name: "Jira Connector", category: "Integration", downloads: "12.5K", rating: 4.6 },
  { id: "m2", name: "Document Summarizer", category: "AI", downloads: "8.2K", rating: 4.9 },
  { id: "m3", name: "Multi-Language Support", category: "Localization", downloads: "5.1K", rating: 4.3 },
];

export default function PluginMarketplacePage() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plugin & Marketplace</h1>
        <p className="text-muted-foreground">Extend Aura with plugins and integrations.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Installed Plugins */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Installed Plugins</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {installedPlugins.map(plugin => (
              <Card key={plugin.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{plugin.name}</h3>
                      <Badge variant={plugin.status === "active" ? "default" : "secondary"}>
                        {plugin.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      v{plugin.version} • {plugin.author}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{plugin.category}</Badge>
                      {plugin.rating && (
                        <span className="flex items-center text-xs text-amber-600">
                          <Star className="w-3 h-3 mr-0.5 fill-current" /> {plugin.rating}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  {plugin.status === "pending" && (
                    <Button size="sm" className="w-full">
                      <Shield className="w-4 h-4 mr-2" /> Approve
                    </Button>
                  )}
                  {plugin.status === "active" && (
                    <Button size="sm" variant="outline" className="w-full">
                      Configure
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Marketplace */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Marketplace</h2>
          <Card className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {marketplacePlugins.map(plugin => (
              <div key={plugin.id} className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm">{plugin.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {plugin.category} • {plugin.downloads} downloads
                  </p>
                  <div className="mt-1 flex items-center text-xs text-amber-600">
                    <Star className="w-3 h-3 mr-0.5 fill-current" /> {plugin.rating}
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-1" /> Install
                </Button>
              </div>
            ))}
            <div className="p-3 text-center">
              <button className="text-xs text-violet-600 font-medium hover:underline">Browse All Plugins</button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
