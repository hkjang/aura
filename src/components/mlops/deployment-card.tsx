
"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle, RotateCcw } from "lucide-react";
import { useState } from "react";

interface Deployment {
  id: string;
  name: string;
  version: string;
  endpoint: string;
  status: string;
  strategy: string;
  trafficSplit: number;
}

interface DeploymentCardProps {
  deployment: Deployment;
}

export function DeploymentCard({ deployment }: DeploymentCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePromote = () => {
    setIsLoading(true);
    // Call API to promote
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleRollback = () => {
    setIsLoading(true);
    // Call API to rollback
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <Card className="p-4 border-l-4 border-l-blue-500">
      <div className="flex justify-between items-start">
        <div>
           <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">{deployment.name}</h3>
                <Badge variant={deployment.status === "ACTIVE" ? "default" : "secondary"}>
                    {deployment.status}
                </Badge>
           </div>
           <p className="text-sm text-muted-foreground font-mono mt-1">
             v{deployment.version} • {deployment.strategy}
           </p>
           <p className="text-xs text-muted-foreground mt-2 truncate max-w-md">
             {deployment.endpoint}
           </p>
        </div>
        
        <div className="text-right">
             <div className="text-2xl font-bold text-blue-600">
                {deployment.trafficSplit}%
             </div>
             <p className="text-xs text-muted-foreground uppercase tracking-wider">Traffic</p>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        {deployment.trafficSplit < 100 && (
            <Button size="sm" onClick={handlePromote} disabled={isLoading}>
                <PlayCircle className="w-4 h-4 mr-2" />
                Promote to 100%
            </Button>
        )}
        {deployment.trafficSplit === 100 && (
             <Button variant="outline" size="sm" onClick={handleRollback} disabled={isLoading}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Rollback
            </Button>
        )}
      </div>
    </Card>
  );
}
