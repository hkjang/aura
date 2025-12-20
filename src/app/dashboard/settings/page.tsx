"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Plus, Trash, Server } from "lucide-react";
import styles from "./page.module.css";
// import { useSession } from "next-auth/react";

interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  baseUrl?: string;
  isActive: boolean;
}

export default function SettingsPage() {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [newModel, setNewModel] = useState({
    name: "",
    provider: "openai",
    modelId: "",
    baseUrl: "",
    apiKey: ""
  });

  const fetchModels = async () => {
    try {
      const res = await fetch("/api/admin/models");
      if (res.ok) {
        const data = await res.json();
        setModels(data.models);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newModel)
      });
      if (res.ok) {
        fetchModels();
        setNewModel({ name: "", provider: "openai", modelId: "", baseUrl: "", apiKey: "" });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await fetch(`/api/admin/models/${id}`, { method: "DELETE" });
    fetchModels();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-violet-600" />
          Settings
        </h1>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>AI Model Configuration</h2>
          <p className={styles.sectionDesc}>Manage connections to OpenAI, vLLM, or Ollama.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* List */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Server className="w-4 h-4" /> Active Models
            </h3>
            {loading ? <div>Loading...</div> : (
              <div className="flex flex-col gap-3">
                {models.map(m => (
                  <div key={m.id} className={styles.modelCard}>
                    <div className="flex justify-between items-start">
                      <div className="font-medium">{m.name}</div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)} className="h-6 w-6 text-red-500">
                        <Trash className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2">
                      <span>Provider: <strong>{m.provider}</strong></span>
                      <span>Model ID: <strong>{m.modelId}</strong></span>
                      <span className="col-span-2 truncate">URL: {m.baseUrl || "Default"}</span>
                    </div>
                  </div>
                ))}
                {models.length === 0 && <div className="text-sm text-muted-foreground">No models configured.</div>}
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleAddModel} className="flex flex-col gap-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
            <h3 className="font-semibold">Add New Model</h3>
            <Input 
              placeholder="Display Name (e.g. GPT-4, Llama 3)" 
              value={newModel.name}
              onChange={e => setNewModel({...newModel, name: e.target.value})}
              required
            />
            <div className="flex gap-4">
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newModel.provider}
                onChange={e => setNewModel({...newModel, provider: e.target.value})}
              >
                <option value="openai">OpenAI</option>
                <option value="ollama">Ollama</option>
                <option value="vllm">vLLM</option>
              </select>
              <Input 
                placeholder="Model ID (e.g. gpt-4, llama2)" 
                value={newModel.modelId}
                onChange={e => setNewModel({...newModel, modelId: e.target.value})}
                required
              />
            </div>
            <Input 
              placeholder="Base URL (Optional, for vLLM/Ollama)" 
              value={newModel.baseUrl}
              onChange={e => setNewModel({...newModel, baseUrl: e.target.value})}
            />
            <Input 
              type="password"
              placeholder="API Key (Optional)" 
              value={newModel.apiKey}
              onChange={e => setNewModel({...newModel, apiKey: e.target.value})}
            />
            <Button type="submit">
              <Plus className="w-4 h-4 mr-2" /> Add Model
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
