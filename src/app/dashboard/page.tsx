import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, FileText, Users, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

// Prevent static prerendering
export const dynamic = 'force-dynamic';

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
        <h1 className="text-2xl font-semibold">대시보드</h1>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 대화</CardTitle>
            <Bot className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.chatCount}</div>
            <p className="text-xs text-muted-foreground">시작된 대화 수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">지식 베이스</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.docCount}</div>
            <p className="text-xs text-muted-foreground">인덱싱된 문서</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">프롬프트 템플릿</CardTitle>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.promptCount}</div>
            <p className="text-xs text-muted-foreground">저장된 템플릿</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">빠른 실행</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <Link href="/dashboard/chat" style={{ textDecoration: 'none' }}>
            <Card className="hover:border-violet-500 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6 flex flex-col items-start gap-2">
                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="font-semibold">새 대화</div>
                <p className="text-sm text-muted-foreground">AI와 대화를 시작하세요.</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/documents" style={{ textDecoration: 'none' }}>
            <Card className="hover:border-blue-500 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6 flex flex-col items-start gap-2">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="font-semibold">문서 업로드</div>
                <p className="text-sm text-muted-foreground">지식 베이스를 확장하세요.</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/prompts" style={{ textDecoration: 'none' }}>
            <Card className="hover:border-amber-500 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6 flex flex-col items-start gap-2">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="font-semibold">템플릿 만들기</div>
                <p className="text-sm text-muted-foreground">유용한 프롬프트를 저장하세요.</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/settings" style={{ textDecoration: 'none' }}>
            <Card className="hover:border-slate-500 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6 flex flex-col items-start gap-2">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900/30 text-slate-600">
                  <Users className="w-6 h-6" />
                </div>
                <div className="font-semibold">설정</div>
                <p className="text-sm text-muted-foreground">사용자와 AI 모델을 관리하세요.</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
