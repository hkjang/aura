import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, FileText, Users, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getStats() {
  const [chatCount, docCount, promptCount] = await Promise.all([
    prisma.chatSession.count(),
    prisma.document.count(),
    prisma.promptTemplate.count()
  ]);
  return { chatCount, docCount, promptCount };
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
            <Bot className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.chatCount}</div>
            <p className="text-xs text-muted-foreground">Conversations started</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Knowledge Base</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.docCount}</div>
            <p className="text-xs text-muted-foreground">Documents indexed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prompt Templates</CardTitle>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.promptCount}</div>
            <p className="text-xs text-muted-foreground">Saved templates</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/dashboard/chat" className="no-underline">
            <Card className="hover:border-violet-500 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6 flex flex-col items-start gap-2">
                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="font-semibold">New Chat</div>
                <p className="text-sm text-muted-foreground">Start a conversation with AI.</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/documents" className="no-underline">
            <Card className="hover:border-blue-500 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6 flex flex-col items-start gap-2">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="font-semibold">Upload Documents</div>
                <p className="text-sm text-muted-foreground">Expand the knowledge base.</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/prompts" className="no-underline">
            <Card className="hover:border-amber-500 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6 flex flex-col items-start gap-2">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="font-semibold">Create Template</div>
                <p className="text-sm text-muted-foreground">Save a useful prompt.</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/settings" className="no-underline">
            <Card className="hover:border-slate-500 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6 flex flex-col items-start gap-2">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900/30 text-slate-600">
                  <Users className="w-6 h-6" />
                </div>
                <div className="font-semibold">Settings</div>
                <p className="text-sm text-muted-foreground">Manage users and AI models.</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
