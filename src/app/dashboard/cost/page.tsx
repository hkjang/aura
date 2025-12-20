
import { Card } from "@/components/ui/card";
import { BudgetCard } from "@/components/cost/budget-card";

// Prevent static prerendering
export const dynamic = 'force-dynamic';

// Mock data for MVP visualization
const usageData = [
  { model: "GPT-4", tokens: 15400, cost: 0.46, requests: 120 },
  { model: "GPT-3.5-Turbo", tokens: 45000, cost: 0.09, requests: 340 },
  { model: "Llama 3 70B", tokens: 2000, cost: 0.002, requests: 15 },
];

export default function CostDashboardPage() {
  const totalCost = usageData.reduce((acc, curr) => acc + curr.cost, 0);
  const totalRequests = usageData.reduce((acc, curr) => acc + curr.requests, 0);

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cost & Resource Management</h1>
        <p className="text-muted-foreground">Track AI spending, manage budgets, and analyze resource usage.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Spend (Month)</p>
            <h2 className="text-3xl font-bold mt-2">${totalCost.toFixed(2)}</h2>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            +12% from last month
          </div>
        </Card>

        <Card className="p-6 flex flex-col justify-between">
            <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <h2 className="text-3xl font-bold mt-2">{totalRequests}</h2>
            </div>
             <div className="mt-4 text-xs text-muted-foreground">
                GPT-3.5 is most active
            </div>
        </Card>

        {/* Budget Management Component */}
        <BudgetCard currentSpend={totalCost} limit={10.00} />
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="p-6">
            <h3 className="font-semibold mb-4">Cost by Model</h3>
            <div className="space-y-4">
                {usageData.map((item) => (
                    <div key={item.model} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg">
                        <div>
                            <p className="font-medium text-sm">{item.model}</p>
                            <p className="text-xs text-muted-foreground">{item.tokens.toLocaleString()} tokens</p>
                        </div>
                        <div className="text-right">
                             <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">${item.cost.toFixed(4)}</p>
                             <p className="text-xs text-muted-foreground">{item.requests} reqs</p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>

        <Card className="p-6">
             <h3 className="font-semibold mb-4">Recent Usage Logs</h3>
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-zinc-50 dark:bg-zinc-900/50">
                        <tr>
                            <th className="px-4 py-2">Model</th>
                            <th className="px-4 py-2">Type</th>
                            <th className="px-4 py-2">Tokens</th>
                            <th className="px-4 py-2">Cost</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        <tr className="bg-white dark:bg-transparent">
                            <td className="px-4 py-2 font-medium">GPT-4</td>
                            <td className="px-4 py-2">Chat</td>
                            <td className="px-4 py-2">1,204</td>
                            <td className="px-4 py-2 text-emerald-600">$0.036</td>
                        </tr>
                         <tr className="bg-white dark:bg-transparent">
                            <td className="px-4 py-2 font-medium">GPT-3.5-Turbo</td>
                            <td className="px-4 py-2">Chat</td>
                            <td className="px-4 py-2">450</td>
                            <td className="px-4 py-2 text-emerald-600">$0.001</td>
                        </tr>
                        <tr className="bg-white dark:bg-transparent">
                            <td className="px-4 py-2 font-medium">Llama 3</td>
                            <td className="px-4 py-2">Chat</td>
                            <td className="px-4 py-2">800</td>
                            <td className="px-4 py-2 text-emerald-600">$0.000</td>
                        </tr>
                    </tbody>
                </table>
             </div>
        </Card>
      </div>
    </div>
  );
}
