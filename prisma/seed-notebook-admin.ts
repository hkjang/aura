import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Seeding notebook policies and pipeline configs...");

  // Get first admin user for createdBy fields
  let user = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!user) {
    user = await prisma.user.findFirst();
  }
  const createdBy = user?.id || "system";

  // ========================================
  // Notebook Policies
  // ========================================
  const policies = [
    {
      name: "기본 Q&A 제어 정책",
      description: "모든 노트북에 적용되는 기본 질문답변 제어 정책입니다. 외부 지식 참조를 제한하고 반드시 인용을 포함하도록 합니다.",
      policyType: "QA_CONTROL",
      rules: JSON.stringify({ maxQuestionsPerDay: 100, requireApproval: false }),
      scope: "GLOBAL",
      scopeId: null,
      blockExternalKnowledge: true,
      requireCitation: true,
      allowedQuestionTypes: JSON.stringify(["SUMMARY", "COMPARE", "EXPLAIN", "ANALYZE"]),
      maxContextTokens: 4000,
      systemPrompt: "당신은 업로드된 문서만을 기반으로 답변해야 합니다. 반드시 출처를 인용하세요.",
      priority: 100,
      isActive: true,
    },
    {
      name: "파일 업로드 제한 정책",
      description: "업로드 가능한 파일 크기와 형식을 제한합니다. 최대 50MB, PDF/DOCX/TXT/MD/XLSX 허용.",
      policyType: "UPLOAD",
      rules: JSON.stringify({ 
        maxFileSize: 52428800, 
        allowedTypes: ["pdf", "docx", "txt", "md", "xlsx", "csv", "json"],
        maxFilesPerUpload: 10
      }),
      scope: "GLOBAL",
      scopeId: null,
      blockExternalKnowledge: false,
      requireCitation: false,
      allowedQuestionTypes: JSON.stringify([]),
      maxContextTokens: 4000,
      systemPrompt: null,
      priority: 90,
      isActive: true,
    },
    {
      name: "노트북 생성 제한",
      description: "사용자당 최대 노트북 생성 수를 제한합니다. 일반 사용자 10개, 관리자 무제한.",
      policyType: "CREATION",
      rules: JSON.stringify({ 
        maxNotebooksPerUser: 10, 
        requireDescription: true,
        adminOverride: true
      }),
      scope: "GLOBAL",
      scopeId: null,
      blockExternalKnowledge: false,
      requireCitation: false,
      allowedQuestionTypes: JSON.stringify([]),
      maxContextTokens: 4000,
      systemPrompt: null,
      priority: 80,
      isActive: true,
    },
    {
      name: "민감 데이터 보호 정책",
      description: "민감한 정보가 포함된 답변을 자동으로 필터링합니다. 주민번호, 신용카드, 비밀번호 패턴 탐지.",
      policyType: "QA_CONTROL",
      rules: JSON.stringify({ 
        filterPatterns: ["주민번호", "신용카드", "비밀번호", "SSN", "credit card"],
        maskingEnabled: true
      }),
      scope: "GLOBAL",
      scopeId: null,
      blockExternalKnowledge: true,
      requireCitation: true,
      allowedQuestionTypes: JSON.stringify(["SUMMARY", "ANALYZE"]),
      maxContextTokens: 8000,
      systemPrompt: "개인정보나 민감한 정보를 답변에 포함하지 마세요. 마스킹 처리하세요.",
      priority: 95,
      isActive: true,
    },
    {
      name: "삭제 보존 정책",
      description: "삭제된 노트북을 30일간 보존합니다. 영구 삭제는 관리자만 가능.",
      policyType: "DELETION",
      rules: JSON.stringify({ 
        retentionDays: 30, 
        requireConfirmation: true,
        permanentDeleteAdminOnly: true
      }),
      scope: "GLOBAL",
      scopeId: null,
      blockExternalKnowledge: false,
      requireCitation: false,
      allowedQuestionTypes: JSON.stringify([]),
      maxContextTokens: 4000,
      systemPrompt: null,
      priority: 70,
      isActive: true,
    },
  ];

  for (const policy of policies) {
    const existing = await prisma.notebookPolicy.findFirst({ 
      where: { name: policy.name } 
    });
    if (existing) {
      await prisma.notebookPolicy.update({
        where: { id: existing.id },
        data: policy,
      });
      console.log(`  Updated policy: ${policy.name}`);
    } else {
      await prisma.notebookPolicy.create({ data: policy });
      console.log(`  Created policy: ${policy.name}`);
    }
  }

  // ========================================
  // Pipeline Configs
  // ========================================
  const pipelineConfigs = [
    {
      name: "기본 문서 처리 설정",
      description: "PDF, DOCX 등 일반 문서에 최적화된 기본 설정입니다.",
      chunkingStrategy: "SENTENCE",
      chunkSize: 512,
      chunkOverlap: 50,
      embeddingModel: "text-embedding-3-small",
      embeddingDimension: 1536,
      indexType: "HNSW",
      indexParameters: JSON.stringify({ efConstruction: 200, M: 16 }),
      scope: "GLOBAL",
      notebookId: null,
      version: 1,
      isDefault: true,
      isActive: true,
    },
    {
      name: "대용량 기술 문서 설정",
      description: "기술 매뉴얼, API 문서 등 대용량 기술 문서에 최적화된 설정입니다.",
      chunkingStrategy: "PARAGRAPH",
      chunkSize: 1024,
      chunkOverlap: 100,
      embeddingModel: "text-embedding-3-large",
      embeddingDimension: 3072,
      indexType: "HNSW",
      indexParameters: JSON.stringify({ efConstruction: 400, M: 32 }),
      scope: "GLOBAL",
      notebookId: null,
      version: 1,
      isDefault: false,
      isActive: true,
    },
    {
      name: "코드 분석 설정",
      description: "소스코드 파일 분석에 최적화된 의미 기반 청킹 설정입니다.",
      chunkingStrategy: "SEMANTIC",
      chunkSize: 768,
      chunkOverlap: 128,
      embeddingModel: "text-embedding-3-small",
      embeddingDimension: 1536,
      indexType: "HNSW",
      indexParameters: JSON.stringify({ efConstruction: 200, M: 16 }),
      scope: "GLOBAL",
      notebookId: null,
      version: 1,
      isDefault: false,
      isActive: true,
    },
  ];

  for (const config of pipelineConfigs) {
    const existing = await prisma.pipelineConfig.findFirst({ 
      where: { name: config.name } 
    });
    if (existing) {
      await prisma.pipelineConfig.update({
        where: { id: existing.id },
        data: config,
      });
      console.log(`  Updated pipeline config: ${config.name}`);
    } else {
      await prisma.pipelineConfig.create({ data: config });
      console.log(`  Created pipeline config: ${config.name}`);
    }
  }

  // ========================================
  // Processing Jobs (sample data)
  // ========================================
  // Get any notebook for job references
  const notebook = await prisma.notebook.findFirst();
  const source = await prisma.knowledgeSource.findFirst();

  const jobs = [
    {
      notebookId: notebook?.id || null,
      sourceId: source?.id || null,
      jobType: "EMBEDDING",
      status: "COMPLETED",
      priority: 1,
      progress: 100,
      totalItems: 156,
      processedItems: 156,
      errorMessage: null,
      retryCount: 0,
      maxRetries: 3,
      createdBy,
    },
    {
      notebookId: notebook?.id || null,
      sourceId: null,
      jobType: "REINDEX",
      status: "PENDING",
      priority: 2,
      progress: 0,
      totalItems: 234,
      processedItems: 0,
      errorMessage: null,
      retryCount: 0,
      maxRetries: 3,
      createdBy,
    },
    {
      notebookId: notebook?.id || null,
      sourceId: source?.id || null,
      jobType: "EMBEDDING",
      status: "FAILED",
      priority: 1,
      progress: 45,
      totalItems: 78,
      processedItems: 35,
      errorMessage: "OpenAI API rate limit exceeded. Please retry after 60 seconds.",
      retryCount: 2,
      maxRetries: 3,
      createdBy,
    },
  ];

  // Clear existing jobs and create new ones
  await prisma.notebookProcessingJob.deleteMany({});
  for (const job of jobs) {
    await prisma.notebookProcessingJob.create({ data: job });
    console.log(`  Created job: ${job.jobType} (${job.status})`);
  }

  console.log("\nSeeding notebook admin data completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
