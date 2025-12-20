import styles from "./page.module.css";
import Link from "next/link";
import { ArrowRight, Bot, Shield, Zap } from "lucide-react";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.blob} />
      
      <div className={styles.hero}>
        <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 rounded-full px-4 py-1.5 bg-white/50 dark:bg-black/50 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">System Operational</span>
        </div>
        
        <h1 className={styles.title}>
          Enterprise AI<br />
          Intelligence Hub
        </h1>
        
        <p className={styles.subtitle}>
          Securely deploy, manage, and orchestrate multiple AI models. 
          Integrated RAG, Agentic Workflows, and Employee Productivity Tools in one platform.
        </p>

        <div className={styles.actions}>
          <Link href="/dashboard" className="btn btn-primary h-12 px-8 text-base">
            Enter Workspace <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
          <Link href="/docs" className="btn btn-ghost h-12 px-8 text-base">
            Documentation
          </Link>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 w-fit rounded-lg text-blue-600 dark:text-blue-400">
            <Bot className="w-6 h-6" />
          </div>
          <h2 className={styles.cardTitle}>Multi-Model Access</h2>
          <p className={styles.cardDesc}>
            Unified interface for vLLM, Ollama, and OpenAI. Switch models instantly based on complexity and cost.
          </p>
        </div>

        <div className={styles.card}>
          <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 w-fit rounded-lg text-purple-600 dark:text-purple-400">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className={styles.cardTitle}>Enterprise RAG</h2>
          <p className={styles.cardDesc}>
            Connect your private data sources securely. Hybrid search with vector embeddings and keyword matching.
          </p>
        </div>

        <div className={styles.card}>
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 w-fit rounded-lg text-amber-600 dark:text-amber-400">
            <Zap className="w-6 h-6" />
          </div>
          <h2 className={styles.cardTitle}>Agentic Workflows</h2>
          <p className={styles.cardDesc}>
            Deploy autonomous agents for code generation, data analysis, and report writing automation.
          </p>
        </div>
      </div>
    </main>
  );
}
