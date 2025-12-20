
import { prisma } from "@/lib/prisma";

export interface GraphNode {
  id: string;
  label: string;
  type: string; // 'document' | 'concept'
  val: number; // Size
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export class KnowledgeService {
  /**
   * Mock function to simulate indexing a document.
   * In a real app, this would generate embeddings and store them in a vector DB.
   */
  static async indexDocument(docId: string) {
    console.log(`Indexing document ${docId}...`);
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await prisma.document.update({
      where: { id: docId },
      data: { 
        // We would update a status field here if we had one
        // For now, no-op update or update content slightly to trigger db write
        metadata: JSON.stringify({ lastIndexed: new Date() })
      }
    });
    return true;
  }

  /**
   * Get knowledge graph data.
   * For this MVP, we verify relationships between documents or mock them if none exist.
   */
  static async getGraphData(): Promise<GraphData> {
    const documents = await prisma.document.findMany({
      take: 20,
      select: { id: true, title: true }
    });

    const nodes: GraphNode[] = documents.map(d => ({
      id: d.id,
      label: d.title,
      type: 'document',
      val: 5
    }));

    // Generate some mock links for visualization purposes
    // Real links would come from a "References" or "RelatedDocs" table
    const links: GraphLink[] = [];
    
    if (nodes.length > 1) {
        for (let i = 0; i < nodes.length - 1; i++) {
            // Link to the next one to form a chain
            links.push({
                source: nodes[i].id,
                target: nodes[i+1].id
            });
            
            // Random extra links
            if (Math.random() > 0.7 && i + 2 < nodes.length) {
                 links.push({
                    source: nodes[i].id,
                    target: nodes[i+2].id
                });
            }
        }
    }

    return { nodes, links };
  }
}
