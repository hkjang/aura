"use client";

import { useState, useEffect } from "react";
import { 
  FileText, 
  Plus, 
  Search, 
  Edit2, 
  Trash2,
  Copy,
  Star,
  StarOff,
  Users,
  Lock,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  category: string;
  visibility: "private" | "team" | "public";
  createdBy: {
    id: string;
    name: string;
  };
  usageCount: number;
  isFavorite: boolean;
  createdAt: Date;
}

// Mock data
const mockTemplates: Template[] = [
  {
    id: "1",
    name: "Code Review Template",
    description: "Standard template for reviewing code changes",
    content: "Please review the following code for:\n1. Security vulnerabilities\n2. Performance issues\n3. Code style consistency\n\n[CODE]\n\nProvide specific line-by-line feedback.",
    category: "Engineering",
    visibility: "team",
    createdBy: { id: "u1", name: "Admin User" },
    usageCount: 234,
    isFavorite: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
  },
  {
    id: "2",
    name: "Meeting Summary",
    description: "Generate structured meeting notes",
    content: "Summarize the following meeting transcript into:\n- Key decisions\n- Action items with owners\n- Next steps\n- Open questions",
    category: "General",
    visibility: "team",
    createdBy: { id: "u2", name: "Product Manager" },
    usageCount: 156,
    isFavorite: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14)
  },
  {
    id: "3",
    name: "Bug Report Analysis",
    description: "Analyze bug reports and suggest fixes",
    content: "You are a debugging expert. Analyze this bug report:\n\n[BUG]\n\nProvide:\n1. Likely root cause\n2. Reproduction steps\n3. Potential fixes\n4. Prevention measures",
    category: "Engineering",
    visibility: "public",
    createdBy: { id: "u1", name: "Admin User" },
    usageCount: 89,
    isFavorite: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
  }
];

const visibilityIcons = {
  private: Lock,
  team: Users,
  public: Globe
};

const visibilityLabels = {
  private: "Only you",
  team: "Team",
  public: "Everyone"
};

export function TeamTemplates() {
  const [templates, setTemplates] = useState<Template[]>(mockTemplates);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = search === "" ||
      template.name.toLowerCase().includes(search.toLowerCase()) ||
      template.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || 
      filter === "favorites" && template.isFavorite ||
      template.category.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const toggleFavorite = (id: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
    ));
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const copyTemplate = (template: Template) => {
    const newTemplate: Template = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Copy)`,
      createdAt: new Date(),
      usageCount: 0,
      isFavorite: false,
      visibility: "private"
    };
    setTemplates(prev => [newTemplate, ...prev]);
  };

  const categories = [...new Set(templates.map(t => t.category))];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-violet-500" />
          Team Templates
        </h2>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              filter === "all"
                ? "bg-violet-100 dark:bg-violet-900/30 border-violet-500"
                : "border-zinc-200 dark:border-zinc-700"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("favorites")}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors flex items-center gap-1 ${
              filter === "favorites"
                ? "bg-violet-100 dark:bg-violet-900/30 border-violet-500"
                : "border-zinc-200 dark:border-zinc-700"
            }`}
          >
            <Star className="w-3 h-3" />
            Favorites
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat.toLowerCase())}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                filter === cat.toLowerCase()
                  ? "bg-violet-100 dark:bg-violet-900/30 border-violet-500"
                  : "border-zinc-200 dark:border-zinc-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(template => {
          const VisibilityIcon = visibilityIcons[template.visibility];
          return (
            <Card key={template.id} className="p-4 hover:border-violet-300 transition-colors group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-medium">{template.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                </div>
                <button
                  onClick={() => toggleFavorite(template.id)}
                  className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                >
                  {template.isFavorite ? (
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  ) : (
                    <StarOff className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <VisibilityIcon className="w-3 h-3" />
                  {visibilityLabels[template.visibility]}
                </span>
                <span>{template.usageCount} uses</span>
                <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">
                  {template.category}
                </span>
              </div>

              {/* Preview */}
              <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded text-xs text-muted-foreground line-clamp-3 mb-3 font-mono">
                {template.content}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="outline" size="sm" className="flex-1">
                  Use Template
                </Button>
                <Button variant="ghost" size="sm" onClick={() => copyTemplate(template)}>
                  <Copy className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteTemplate(template.id)}>
                  <Trash2 className="w-3 h-3 text-red-500" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No templates found</p>
        </div>
      )}
    </div>
  );
}
