"use client";

import { useState } from "react";
import { 
  ExternalLink, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Database,
  BookOpen,
  Globe,
  File
} from "lucide-react";

interface Citation {
  id: string;
  title: string;
  url?: string;
  type: "document" | "web" | "database" | "file";
  excerpt?: string;
  relevance?: number; // 0-1
  page?: number;
}

interface SourceCitationsProps {
  citations: Citation[];
  maxVisible?: number;
}

const typeIcons = {
  document: FileText,
  web: Globe,
  database: Database,
  file: File,
};

const typeLabels = {
  document: "Document",
  web: "Web Source",
  database: "Database",
  file: "File",
};

export function SourceCitations({ citations, maxVisible = 3 }: SourceCitationsProps) {
  const [expanded, setExpanded] = useState(false);
  
  if (citations.length === 0) return null;
  
  const visibleCitations = expanded ? citations : citations.slice(0, maxVisible);
  const hasMore = citations.length > maxVisible;

  return (
    <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <BookOpen className="w-3 h-3" />
          Sources ({citations.length})
        </span>
        {citations.some(c => c.relevance) && (
          <span className="text-[10px] text-muted-foreground">Relevance shown</span>
        )}
      </div>
      
      <div className="space-y-2">
        {visibleCitations.map((citation, idx) => {
          const Icon = typeIcons[citation.type] || FileText;
          return (
            <div 
              key={citation.id || idx}
              className="flex items-start gap-2 p-2 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors group"
            >
              <div className="p-1.5 rounded bg-violet-100 dark:bg-violet-900/30">
                <Icon className="w-3 h-3 text-violet-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {citation.url ? (
                      <a 
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:text-violet-600 transition-colors flex items-center gap-1 truncate"
                      >
                        <span className="truncate">{citation.title}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ) : (
                      <span className="text-sm font-medium truncate block">{citation.title}</span>
                    )}
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      {typeLabels[citation.type]}
                      {citation.page && ` • Page ${citation.page}`}
                    </span>
                  </div>
                  
                  {citation.relevance !== undefined && (
                    <div className="flex-shrink-0 text-right">
                      <span className="text-xs font-medium text-violet-600">
                        {Math.round(citation.relevance * 100)}%
                      </span>
                    </div>
                  )}
                </div>
                
                {citation.excerpt && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    &quot;{citation.excerpt}&quot;
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-2 py-1.5 text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              Show {citations.length - maxVisible} more sources
            </>
          )}
        </button>
      )}
    </div>
  );
}
