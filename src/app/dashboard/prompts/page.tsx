"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquarePlus, Trash, Sparkles, Copy } from "lucide-react";
import styles from "./page.module.css";
// import { useSession } from "next-auth/react";

interface Prompt {
  id: string;
  title: string;
  content: string;
  description: string;
  isPublic: boolean;
  user: { name: string };
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ title: "", content: "", description: "" });

  const fetchPrompts = async () => {
    try {
      const res = await fetch("/api/prompts");
      if (res.ok) {
        const data = await res.json();
        setPrompts(data.prompts);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchPrompts(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newPrompt, isPublic: false })
      });
      if (res.ok) {
        setShowForm(false);
        setNewPrompt({ title: "", content: "", description: "" });
        fetchPrompts();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/prompts/${id}`, { method: "DELETE" });
    fetchPrompts();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-violet-600" />
          Prompt Library
        </h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "New Template"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="flex flex-col gap-4 p-6 border rounded-xl bg-violet-50/50 dark:bg-violet-900/10">
          <Input 
            placeholder="Title (e.g. JavaScript Debugger)" 
            value={newPrompt.title}
            onChange={e => setNewPrompt({...newPrompt, title: e.target.value})}
            required
          />
          <Input 
            placeholder="Description (Optional)" 
            value={newPrompt.description}
            onChange={e => setNewPrompt({...newPrompt, description: e.target.value})}
          />
          <textarea 
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="System Prompt Content..."
            value={newPrompt.content}
            onChange={e => setNewPrompt({...newPrompt, content: e.target.value})}
            required
          />
          <div className="flex justify-end">
            <Button type="submit">Save Template</Button>
          </div>
        </form>
      )}

      <div className={styles.grid}>
        {prompts.map(prompt => (
          <div key={prompt.id} className={styles.promptCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.title}>{prompt.title}</h3>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => handleDelete(prompt.id, e)}>
                <Trash className="w-3 h-3 text-red-400" />
              </Button>
            </div>
            <p className={styles.description}>{prompt.description || "No description"}</p>
            <div className={styles.contentPreview}>
              {prompt.content.slice(0, 150)}...
            </div>
            <div className={styles.tags}>
              <span className={styles.tag}>{prompt.user?.name || "User"}</span>
              {prompt.isPublic && <span className={`${styles.tag} ${styles.publicTag}`}>Public</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
