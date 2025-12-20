import { z } from "zod";
import { tool } from "ai";
import { prisma } from "@/lib/prisma";

export const searchDocumentsTool = tool({
  description: "Search the internal knowledge base for documents matching the query. Use this to answer questions about company policies, reports, or uploaded files.",
  parameters: z.object({
    query: z.string().describe("The search query to find relevant documents"),
  }),
  execute: async ({ query }: { query: string }) => {
    // Naive implementation: database LIKE query for MVP
    try {
      // Improved MVP Search: Split query into keywords and find matches
      // This simulates a "Hybrid" search by being smarter than exact match
      const keywords = query.split(/\s+/).filter(k => k.length > 2);
      
      if (keywords.length === 0) {
        // Fallback for very short queries
         const docs = await prisma.document.findMany({
          where: { content: { contains: query } },
          take: 3
        });
        if (docs.length === 0) return "No relevant documents found.";
        return docs.map(d => `Title: ${d.title}\nContent Snippet: ${d.content.slice(0, 500)}...`).join("\n\n");
      }

      // Find docs containing ANY keyword
      const docs = await prisma.document.findMany({
        where: {
          OR: keywords.map(k => ({ content: { contains: k } }))
        },
        take: 20 // Fetch wider candidate set
      });
      
      // Calculate relevance score in-memory (very simple TF-ish)
      const scoredDocs = docs.map((doc: { content: string; title: string }) => {
        let score = 0;
        const lowerContent = doc.content.toLowerCase();
        keywords.forEach((k: string) => {
          const lowerK = k.toLowerCase();
          // Bonus for title match
          if (doc.title.toLowerCase().includes(lowerK)) score += 5;
          // Count occurrences in content
          const matches = lowerContent.split(lowerK).length - 1;
          score += matches;
        });
        return { ...doc, score };
      });

      // Sort by score and take top 3
      scoredDocs.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
      const topDocs = scoredDocs.slice(0, 3);
      
      if (topDocs.length === 0) return "No relevant documents found.";

      return topDocs.map((d: any) => `Title: ${d.title}\nRelevance: ${d.score}\nContent Snippet: ${d.content.slice(0, 500)}...`).join("\n\n");
    } catch (e) {
      return "Error searching documents.";
    }
  },
} as any);
