
"use client";

import { Card } from "@/components/ui/card";
import { useState } from "react";
import { AlertCircle, Check } from "lucide-react";

interface BudgetCardProps {
  currentSpend: number;
  limit: number;
}

export function BudgetCard({ currentSpend, limit }: BudgetCardProps) {
  const [budgetLimit, setBudgetLimit] = useState(limit);
  const [isEditing, setIsEditing] = useState(false);
  const [tempLimit, setTempLimit] = useState(limit.toString());

  const usagePercent = Math.min((currentSpend / budgetLimit) * 100, 100);
  const isNearLimit = usagePercent > 80;
  const isOverLimit = usagePercent >= 100;

  const handleSave = () => {
    const val = parseFloat(tempLimit);
    if (!isNaN(val) && val > 0) {
      setBudgetLimit(val);
      setIsEditing(false);
      // In real app, call API to update User Budget
    }
  };

  return (
    <Card className="p-6 flex flex-col justify-between border-l-4 border-l-violet-500 relative overflow-hidden">
      <div>
        <div className="flex justify-between items-start">
             <div>
                <p className="text-sm font-medium text-muted-foreground">월간 예산</p>
                {isEditing ? (
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-xl font-bold">₩</span>
                        <input 
                            type="number" 
                            className="bg-transparent border-b border-zinc-300 dark:border-zinc-700 w-24 text-2xl font-bold focus:outline-none focus:border-violet-500"
                            value={tempLimit}
                            onChange={(e) => setTempLimit(e.target.value)}
                            autoFocus
                        />
                         <button onClick={handleSave} className="p-1 hover:bg-slate-100 rounded-full text-green-600">
                            <Check className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <h2 onClick={() => setIsEditing(true)} className="text-3xl font-bold mt-2 cursor-pointer hover:underline decoration-dashed decoration-zinc-400 underline-offset-4" title="Click to edit">
                        ₩{budgetLimit.toLocaleString()}
                    </h2>
                )}
             </div>
             {isOverLimit && <AlertCircle className="text-red-500 w-6 h-6 animate-pulse" />}
        </div>
        
        <div className="mt-4">
             <div className="flex justify-between text-xs mb-1">
                <span>{usagePercent.toFixed(1)}% Used</span>
                <span className="text-muted-foreground">₩{(budgetLimit - currentSpend).toLocaleString()} 남음</span>
             </div>
             <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${usagePercent}%` }}
                ></div>
             </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-muted-foreground">
        {isOverLimit ? "예산 초과. 서비스 접근이 제한될 수 있습니다." : "예산은 매월 1일 초기화됩니다."}
      </div>
    </Card>
  );
}
