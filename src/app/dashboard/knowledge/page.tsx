
import { Card } from "@/components/ui/card";
import { GraphView } from "@/components/knowledge/graph-view";
import { KnowledgeService } from "@/lib/knowledge/knowledge-service";
import { prisma } from "@/lib/prisma";

// Prevent static prerendering (uses DB queries)
export const dynamic = 'force-dynamic';


export default async function KnowledgeDashboardPage() {
  const graphData = await KnowledgeService.getGraphData();
  const documents = await prisma.document.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Knowledge Graph & Search</h1>
        <p className="text-muted-foreground">Explore relationships between documents and manage the knowledge base.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
         {/* Graph View */}
         <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold">Knowledge Network</h2>
            <GraphView data={graphData} />
         </div>

         {/* Stats */}
         <div className="space-y-6">
            <h2 className="text-lg font-semibold">Stats</h2>
            <div className="grid gap-4">
                <Card className="p-4">
                     <p className="text-xs font-medium text-muted-foreground">Total Documents</p>
                     <h3 className="text-2xl font-bold mt-1">{graphData.nodes.length}</h3>
                </Card>
                <Card className="p-4">
                     <p className="text-xs font-medium text-muted-foreground">Indexed Relations</p>
                     <h3 className="text-2xl font-bold mt-1 text-violet-600">{graphData.links.length}</h3>
                </Card>
            </div>
         </div>
      </div>

      <div>
          <h2 className="text-lg font-semibold mb-4">Recent Documents</h2>
          <Card className="overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-zinc-100 dark:bg-zinc-800 text-xs uppercase text-muted-foreground">
                    <tr>
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Created</th>
                        <th className="px-4 py-3">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {documents.map(doc => (
                        <tr key={doc.id} className="bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                            <td className="px-4 py-3 font-medium">{doc.title}</td>
                            <td className="px-4 py-3">{new Date(doc.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs">Indexed</span>
                            </td>
                        </tr>
                    ))}
                    {documents.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No documents found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
          </Card>
      </div>
    </div>
  );
}
