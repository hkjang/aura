
import { ExternalLink } from "lucide-react";

interface Citation {
  sourceId?: string;
  url?: string;
  title?: string;
  snippet?: string;
}

interface CitationListProps {
  citations?: Citation[];
}

export function CitationList({ citations }: CitationListProps) {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-dashed border-zinc-200 dark:border-zinc-700">
      <p className="text-xs font-semibold text-zinc-500 uppercase mb-2">Sources</p>
      <div className="flex flex-wrap gap-2">
        {citations.map((cite, idx) => (
          <a
            key={idx}
            href={cite.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-xs text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <span className="truncate max-w-[150px]">{cite.title || cite.url || "Document"}</span>
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
        ))}
      </div>
    </div>
  );
}
