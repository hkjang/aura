import { z } from "zod";
import { tool } from "ai";
import { prisma } from "@/lib/prisma";

export const searchDocumentsTool = tool({
  description: "Search the internal knowledge base for documents matching the query. Use this to answer questions about company policies, reports, or uploaded files.",
  parameters: z.object({
    query: z.string().describe("The search query to find relevant documents"),
  }),
  execute: async ({ query }) => {
    // Naive implementation: database LIKE query for MVP
    try {
      const docs = await prisma.document.findMany({
        where: {
          content: {
            contains: query
          }
        },
        take: 3,
        select: {
          title: true,
          content: true
        }
      });
      
      if (docs.length === 0) return "No relevant documents found.";

      return docs.map(d => `Title: ${d.title}\nContent Snippet: ${d.content.slice(0, 500)}...`).join("\n\n");
    } catch (e) {
      return "Error searching documents.";
    }
  },
});
