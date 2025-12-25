// AI Agent Service - Production CRUD and Execution
import { prisma } from "@/lib/prisma";

// Default agents for seeding
export const DEFAULT_AGENTS = [
  {
    slug: "researcher",
    name: "리서처",
    description: "주제에 대해 깊이있게 조사하고 정리된 보고서를 작성합니다",
    icon: "Search",
    color: "#8b5cf6",
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
    category: "research",
    tags: JSON.stringify(["리서치", "분석", "트렌드"]),
    placeholder: "조사할 주제를 입력하세요 (예: '2024년 AI 트렌드')",
    systemPrompt: `당신은 전문 리서처입니다. 사용자가 요청한 주제에 대해:
1. 핵심 개념과 정의
2. 현재 동향과 트렌드
3. 주요 사례나 예시
4. 결론 및 인사이트
형식으로 체계적으로 조사 결과를 정리해주세요. 한국어로 답변하세요.`,
    isDefault: true
  },
  {
    slug: "summarizer",
    name: "요약기",
    description: "긴 텍스트를 핵심만 추출하여 간결하게 요약합니다",
    icon: "FileText",
    color: "#3b82f6",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
    category: "productivity",
    tags: JSON.stringify(["요약", "문서", "핵심추출"]),
    placeholder: "요약할 텍스트를 붙여넣으세요",
    systemPrompt: `당신은 전문 요약 전문가입니다. 주어진 텍스트를 분석하여:
1. 핵심 요약 (2-3문장)
2. 주요 포인트 (3-5개 불릿 포인트)
3. 핵심 키워드 (5개)
형식으로 정리해주세요. 원문의 의미를 보존하면서 간결하게 요약하세요. 한국어로 답변하세요.`,
    isDefault: true
  },
  {
    slug: "writer",
    name: "작성기",
    description: "이메일, 보고서, 문서 등 다양한 글을 작성합니다",
    icon: "Mail",
    color: "#22c55e",
    gradient: "linear-gradient(135deg, #22c55e 0%, #4ade80 100%)",
    category: "productivity",
    tags: JSON.stringify(["이메일", "보고서", "문서작성"]),
    placeholder: "작성할 내용을 설명하세요 (예: '프로젝트 완료 보고 이메일')",
    systemPrompt: `당신은 전문 비즈니스 작성가입니다. 사용자의 요청에 따라 적절한 형식과 톤으로 글을 작성합니다.
- 이메일: 적절한 인사말과 맺음말 포함
- 보고서: 체계적인 구조와 명확한 내용
- 문서: 전문적이고 읽기 쉬운 형식
한국어로 작성하고, 필요시 영문 병기도 가능합니다.`,
    isDefault: true
  },
  {
    slug: "coder",
    name: "코더",
    description: "코드 작성, 리뷰, 최적화를 도와드립니다",
    icon: "Code2",
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
    category: "development",
    tags: JSON.stringify(["개발", "코딩", "리뷰"]),
    placeholder: "필요한 기능이나 코드를 설명하세요",
    systemPrompt: `당신은 시니어 소프트웨어 개발자입니다. 
- 깔끔하고 효율적인 코드 작성
- 코드에 대한 설명 주석 포함
- 베스트 프랙티스 적용
- 잠재적 문제점과 개선 사항 제안
필요시 여러 프로그래밍 언어로 예시를 제공합니다.`,
    isDefault: true
  },
  {
    slug: "analyzer",
    name: "분석기",
    description: "데이터나 상황을 분석하고 인사이트를 제공합니다",
    icon: "BarChart3",
    color: "#ec4899",
    gradient: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
    category: "research",
    tags: JSON.stringify(["데이터", "분석", "인사이트"]),
    placeholder: "분석할 데이터나 상황을 설명하세요",
    systemPrompt: `당신은 데이터 분석 전문가입니다. 주어진 정보를 분석하여:
1. 현황 분석 (As-Is)
2. 문제점/기회 도출
3. 데이터 기반 인사이트
4. 액션 아이템 제안
형식으로 체계적인 분석 결과를 제공합니다. 가능하면 수치화하고 근거를 명시하세요.`,
    isDefault: true
  },
  {
    slug: "translator",
    name: "번역기",
    description: "다국어 번역과 문화적 맥락 설명을 제공합니다",
    icon: "MessageSquare",
    color: "#06b6d4",
    gradient: "linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)",
    category: "language",
    tags: JSON.stringify(["번역", "다국어", "현지화"]),
    placeholder: "번역할 텍스트와 대상 언어를 입력하세요",
    systemPrompt: `당신은 전문 번역가입니다. 다음을 제공합니다:
1. 정확한 번역
2. 문화적 맥락이나 뉘앙스 설명 (필요시)
3. 대안 표현 제안 (중요한 경우)
자연스럽고 원문의 의도를 잘 전달하는 번역을 제공하세요.`,
    isDefault: true
  }
];

// Seed default agents
export async function seedDefaultAgents() {
  for (const agent of DEFAULT_AGENTS) {
    await prisma.aIAgent.upsert({
      where: { slug: agent.slug },
      update: {},
      create: agent
    });
  }
}

// Get all agents with stats
export async function getAgents(userId?: string) {
  const agents = await prisma.aIAgent.findMany({
    where: { isActive: true },
    orderBy: [{ usageCount: 'desc' }, { name: 'asc' }]
  });
  
  // Get user favorites if userId provided
  let favoriteIds: string[] = [];
  if (userId) {
    const favorites = await prisma.userAgentFavorite.findMany({
      where: { userId },
      select: { agentId: true }
    });
    favoriteIds = favorites.map(f => f.agentId);
  }
  
  return agents.map(agent => ({
    ...agent,
    tags: JSON.parse(agent.tags || '[]'),
    rating: agent.totalRatings > 0 ? agent.sumRatings / agent.totalRatings : 0,
    isFavorite: favoriteIds.includes(agent.id)
  }));
}

// Get single agent
export async function getAgent(idOrSlug: string) {
  const agent = await prisma.aIAgent.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      isActive: true
    }
  });
  
  if (!agent) return null;
  
  return {
    ...agent,
    tags: JSON.parse(agent.tags || '[]'),
    rating: agent.totalRatings > 0 ? agent.sumRatings / agent.totalRatings : 0
  };
}

// Create new agent (admin)
export async function createAgent(data: {
  name: string;
  slug: string;
  description: string;
  systemPrompt: string;
  icon?: string;
  color?: string;
  gradient?: string;
  category?: string;
  tags?: string[];
  placeholder?: string;
  requiredRole?: string;
  createdBy?: string;
}) {
  return prisma.aIAgent.create({
    data: {
      ...data,
      tags: JSON.stringify(data.tags || [])
    }
  });
}

// Update agent (admin)
export async function updateAgent(id: string, data: Partial<{
  name: string;
  description: string;
  systemPrompt: string;
  icon: string;
  color: string;
  gradient: string;
  category: string;
  tags: string[];
  placeholder: string;
  requiredRole: string;
  isActive: boolean;
}>) {
  const updateData: Record<string, unknown> = { ...data };
  if (data.tags) {
    updateData.tags = JSON.stringify(data.tags);
  }
  
  return prisma.aIAgent.update({
    where: { id },
    data: updateData
  });
}

// Delete agent (admin)
export async function deleteAgent(id: string) {
  return prisma.aIAgent.update({
    where: { id },
    data: { isActive: false }
  });
}

// Execute agent and record
export async function executeAgent(params: {
  agentId: string;
  userId: string;
  input: string;
  output: string;
  duration: number;
  tokensIn?: number;
  tokensOut?: number;
  modelId?: string;
  status?: string;
  errorMessage?: string;
}) {
  // Create execution record
  const execution = await prisma.agentExecution.create({
    data: {
      agentId: params.agentId,
      userId: params.userId,
      input: params.input,
      output: params.output,
      duration: params.duration,
      tokensIn: params.tokensIn || 0,
      tokensOut: params.tokensOut || 0,
      modelId: params.modelId,
      status: params.status || 'SUCCESS',
      errorMessage: params.errorMessage
    }
  });
  
  // Update agent stats
  const agent = await prisma.aIAgent.findUnique({ where: { id: params.agentId } });
  if (agent) {
    const newUsageCount = agent.usageCount + 1;
    const totalDuration = (agent.avgResponseTime || 0) * agent.usageCount + params.duration;
    
    await prisma.aIAgent.update({
      where: { id: params.agentId },
      data: {
        usageCount: newUsageCount,
        totalTokens: agent.totalTokens + (params.tokensIn || 0) + (params.tokensOut || 0),
        avgResponseTime: totalDuration / newUsageCount
      }
    });
  }
  
  return execution;
}

// Rate execution
export async function rateExecution(executionId: string, rating: number, feedback?: string) {
  const execution = await prisma.agentExecution.update({
    where: { id: executionId },
    data: { rating, feedback }
  });
  
  // Update agent rating
  const agent = await prisma.aIAgent.findUnique({ where: { id: execution.agentId } });
  if (agent) {
    await prisma.aIAgent.update({
      where: { id: execution.agentId },
      data: {
        totalRatings: agent.totalRatings + 1,
        sumRatings: agent.sumRatings + rating
      }
    });
  }
  
  return execution;
}

// Get user execution history
export async function getExecutionHistory(userId: string, limit = 20, agentId?: string) {
  return prisma.agentExecution.findMany({
    where: {
      userId,
      ...(agentId && { agentId })
    },
    include: {
      agent: {
        select: { id: true, name: true, slug: true, icon: true, color: true, gradient: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

// Get/Add/Remove favorites
export async function getUserFavorites(userId: string) {
  return prisma.userAgentFavorite.findMany({
    where: { userId },
    include: { agent: true },
    orderBy: { order: 'asc' }
  });
}

export async function addFavorite(userId: string, agentId: string) {
  const count = await prisma.userAgentFavorite.count({ where: { userId } });
  return prisma.userAgentFavorite.upsert({
    where: { userId_agentId: { userId, agentId } },
    update: {},
    create: { userId, agentId, order: count }
  });
}

export async function removeFavorite(userId: string, agentId: string) {
  return prisma.userAgentFavorite.deleteMany({
    where: { userId, agentId }
  });
}

// Get agent stats for dashboard
export async function getAgentStats() {
  const [totalAgents, totalExecutions, activeAgents] = await Promise.all([
    prisma.aIAgent.count({ where: { isActive: true } }),
    prisma.agentExecution.count(),
    prisma.aIAgent.count({ where: { isActive: true, usageCount: { gt: 0 } } })
  ]);
  
  const avgRating = await prisma.aIAgent.aggregate({
    where: { isActive: true, totalRatings: { gt: 0 } },
    _avg: { sumRatings: true }
  });
  
  return {
    totalAgents,
    totalExecutions,
    activeAgents,
    avgRating: avgRating._avg.sumRatings || 0
  };
}
