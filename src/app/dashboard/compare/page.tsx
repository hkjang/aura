"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Scale, Loader2, Clock, Zap } from "lucide-react";

// Mock comparison results for demo
const mockResults = [
  { model: "gpt-4", provider: "openai", response: "This is a detailed response from GPT-4 with comprehensive analysis and nuanced understanding of the query.", latency: 2340, score: 85 },
  { model: "gpt-3.5-turbo", provider: "openai", response: "A quick response from GPT-3.5 that covers the main points efficiently.", latency: 890, score: 72 },
  { model: "llama-3-70b", provider: "vllm", response: "Open-source model response with good balance of detail and speed.", latency: 1560, score: 78 },
];

export default function ModelComparisonPage() {
  const [query, setQuery] = useState("");
  const [comparing, setComparing] = useState(false);
  const [results, setResults] = useState<typeof mockResults>([]);

  const handleCompare = async () => {
    if (!query.trim()) return;
    
    setComparing(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 2000));
    setResults(mockResults);
    setComparing(false);
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <Scale className="w-7 h-7 text-violet-600" />
          Model Comparison
        </h1>
        <p className="text-muted-foreground">
          Compare responses from different AI models side by side.
        </p>
      </div>

      {/* Query Input */}
      <Card className="p-6">
        <div className="flex gap-4">
          <Input
            placeholder="Enter your query to compare across models..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleCompare} disabled={comparing || !query.trim()}>
            {comparing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Scale className="w-4 h-4 mr-2" />}
            {comparing ? "Comparing..." : "Compare"}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Comparison Results</h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.sort((a, b) => b.score - a.score).map((result, idx) => (
              <Card key={result.model} className={`p-4 ${idx === 0 ? "border-2 border-violet-500" : ""}`}>
                {idx === 0 && (
                  <Badge className="mb-2 bg-violet-500">Best Match</Badge>
                )}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{result.model}</h3>
                    <p className="text-xs text-muted-foreground">{result.provider}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-violet-600">{result.score}</div>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {result.latency}ms
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {result.response.length} chars
                  </span>
                </div>

                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-sm">
                  {result.response}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && !comparing && (
        <div className="text-center py-16 text-muted-foreground">
          <Scale className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Enter a query above and click Compare to see results from multiple models.</p>
        </div>
      )}
    </div>
  );
}
