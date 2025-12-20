
"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { ShieldAlert, ShieldCheck, Flag } from "lucide-react";

interface Policy {
  id: string;
  name: string;
  type: string;
  action: string;
  isActive: boolean;
  description: string;
}

interface PolicyCardProps {
  policy: Policy;
}

export function PolicyCard({ policy: initialPolicy }: PolicyCardProps) {
  const [isActive, setIsActive] = useState(initialPolicy.isActive);

  const handleToggle = (checked: boolean) => {
    setIsActive(checked);
    // In real app, call API to update policy status
  };

  const getIcon = () => {
    switch(initialPolicy.action) {
        case "BLOCK": return <ShieldAlert className="text-red-500 w-5 h-5" />;
        case "FLAG": return <Flag className="text-amber-500 w-5 h-5" />;
        default: return <ShieldCheck className="text-emerald-500 w-5 h-5" />;
    }
  };

  return (
    <Card className="p-4 flex items-center justify-between">
      <div className="flex items-start gap-4">
        <div className="mt-1 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            {getIcon()}
        </div>
        <div>
           <h4 className="font-semibold text-sm">{initialPolicy.name}</h4>
           <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Badge variant="outline" className="text-[10px] h-5 px-1.5">{initialPolicy.type}</Badge>
                <span>Action: <b>{initialPolicy.action}</b></span>
           </div>
           <p className="text-xs text-muted-foreground mt-2 max-w-sm line-clamp-2">
                {initialPolicy.description}
           </p>
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-2">
         <Switch checked={isActive} onCheckedChange={handleToggle} />
         <span className={`text-[10px] uppercase font-bold ${isActive ? 'text-emerald-600' : 'text-zinc-400'}`}>
            {isActive ? "Active" : "Disabled"}
         </span>
      </div>
    </Card>
  );
}
