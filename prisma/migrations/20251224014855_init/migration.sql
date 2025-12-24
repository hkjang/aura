-- CreateTable
CREATE TABLE "EmbeddingModelConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "dimension" INTEGER NOT NULL DEFAULT 1536,
    "baseUrl" TEXT,
    "apiKey" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ChunkingRuleOverride" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "notebookId" TEXT,
    "documentType" TEXT NOT NULL,
    "minTokens" INTEGER,
    "maxTokens" INTEGER,
    "overlapTokens" INTEGER,
    "similarityThreshold" REAL,
    "minParagraphs" INTEGER,
    "primaryStrategy" TEXT,
    "secondaryStrategy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RAGTrace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notebookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalQuery" TEXT NOT NULL,
    "processedQuery" TEXT,
    "answer" TEXT NOT NULL,
    "model" TEXT,
    "generationTime" INTEGER,
    "totalChunks" INTEGER NOT NULL DEFAULT 0,
    "usedChunks" INTEGER NOT NULL DEFAULT 0,
    "avgSimilarity" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RAGTraceChunk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "traceId" TEXT NOT NULL,
    "chunkId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "similarity" REAL NOT NULL,
    "adjustedScore" REAL,
    "qualityScore" INTEGER,
    "qualityGrade" TEXT,
    "documentName" TEXT,
    "documentType" TEXT,
    "content" TEXT NOT NULL,
    "tokenCount" INTEGER,
    "isUsedInAnswer" BOOLEAN NOT NULL DEFAULT false,
    "isFiltered" BOOLEAN NOT NULL DEFAULT false,
    "filterReason" TEXT,
    "appliedRules" TEXT,
    CONSTRAINT "RAGTraceChunk_traceId_fkey" FOREIGN KEY ("traceId") REFERENCES "RAGTrace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RAGAccuracyConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "notebookId" TEXT,
    "documentType" TEXT,
    "enableSynonymExpansion" BOOLEAN NOT NULL DEFAULT true,
    "enableStopwordRemoval" BOOLEAN NOT NULL DEFAULT true,
    "enableQueryTypeClassification" BOOLEAN NOT NULL DEFAULT true,
    "maxQueryLength" INTEGER NOT NULL DEFAULT 500,
    "minQualityScore" INTEGER NOT NULL DEFAULT 40,
    "minSimilarity" REAL NOT NULL DEFAULT 0.3,
    "minTokenCount" INTEGER NOT NULL DEFAULT 20,
    "maxTokenCount" INTEGER NOT NULL DEFAULT 1000,
    "recentDocBoost" REAL NOT NULL DEFAULT 0.05,
    "approvedDocBoost" REAL NOT NULL DEFAULT 0.1,
    "adjacentChunkBonus" REAL NOT NULL DEFAULT 0.03,
    "duplicatePenalty" REAL NOT NULL DEFAULT 0.15,
    "maxReferenceChunks" INTEGER NOT NULL DEFAULT 5,
    "diversityWeight" REAL NOT NULL DEFAULT 0.2,
    "keywordMatchBoost" REAL NOT NULL DEFAULT 0.1,
    "vectorWeight" REAL NOT NULL DEFAULT 0.7,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RAGFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "traceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "isHelpful" BOOLEAN,
    "comment" TEXT,
    "feedbackType" TEXT NOT NULL DEFAULT 'RATING',
    "suggestedChunks" TEXT,
    "missedInfo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SystemStatus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "service" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT NOT NULL,
    "secret" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WebhookLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "webhookId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "response" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Snippet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "category" TEXT NOT NULL DEFAULT 'prompt',
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Snippet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SummaryHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "originalLength" INTEGER NOT NULL,
    "summaryLength" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "keyPoints" TEXT NOT NULL DEFAULT '[]',
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "modelUsed" TEXT,
    "parsingMethod" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Notebook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'PERSONAL',
    "ownerId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "deletedAt" DATETIME,
    "templateId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "KnowledgeSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notebookId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "originalName" TEXT,
    "content" TEXT NOT NULL,
    "contentHash" TEXT,
    "url" TEXT,
    "fileSize" INTEGER,
    "fileType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "uploaderId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KnowledgeSource_notebookId_fkey" FOREIGN KEY ("notebookId") REFERENCES "Notebook" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KnowledgeChunk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "startOffset" INTEGER,
    "endOffset" INTEGER,
    "embedding" TEXT,
    "embeddingModel" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KnowledgeChunk_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "KnowledgeSource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotebookShare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notebookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'READ',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NotebookShare_notebookId_fkey" FOREIGN KEY ("notebookId") REFERENCES "Notebook" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotebookComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notebookId" TEXT NOT NULL,
    "sourceId" TEXT,
    "chunkId" TEXT,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NotebookComment_notebookId_fkey" FOREIGN KEY ("notebookId") REFERENCES "Notebook" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QnAHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notebookId" TEXT,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "citations" TEXT NOT NULL DEFAULT '[]',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "isSaved" BOOLEAN NOT NULL DEFAULT false,
    "linkedQnaIds" TEXT NOT NULL DEFAULT '[]',
    "rating" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QnAHistory_notebookId_fkey" FOREIGN KEY ("notebookId") REFERENCES "Notebook" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotebookAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notebookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "NotebookAdminRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "roleType" TEXT NOT NULL,
    "orgId" TEXT,
    "permissions" TEXT NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NotebookPolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "policyType" TEXT NOT NULL,
    "rules" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "scopeId" TEXT,
    "blockExternalKnowledge" BOOLEAN NOT NULL DEFAULT false,
    "requireCitation" BOOLEAN NOT NULL DEFAULT true,
    "allowedQuestionTypes" TEXT NOT NULL DEFAULT '[]',
    "maxContextTokens" INTEGER NOT NULL DEFAULT 4000,
    "systemPrompt" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PipelineConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "chunkingStrategy" TEXT NOT NULL DEFAULT 'SENTENCE',
    "chunkSize" INTEGER NOT NULL DEFAULT 512,
    "chunkOverlap" INTEGER NOT NULL DEFAULT 50,
    "embeddingModel" TEXT NOT NULL DEFAULT 'text-embedding-ada-002',
    "embeddingDimension" INTEGER NOT NULL DEFAULT 1536,
    "indexType" TEXT NOT NULL DEFAULT 'HNSW',
    "indexParameters" TEXT NOT NULL DEFAULT '{}',
    "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "notebookId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NotebookBudget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notebookId" TEXT,
    "orgId" TEXT,
    "userId" TEXT,
    "tokenLimit" INTEGER NOT NULL DEFAULT 1000000,
    "tokenUsed" INTEGER NOT NULL DEFAULT 0,
    "costLimit" REAL NOT NULL DEFAULT 100.0,
    "costUsed" REAL NOT NULL DEFAULT 0.0,
    "embeddingLimit" INTEGER NOT NULL DEFAULT 100000,
    "embeddingUsed" INTEGER NOT NULL DEFAULT 0,
    "gpuPriority" INTEGER NOT NULL DEFAULT 5,
    "cacheEnabled" BOOLEAN NOT NULL DEFAULT true,
    "cacheTTL" INTEGER NOT NULL DEFAULT 3600,
    "period" TEXT NOT NULL,
    "alertThreshold" INTEGER NOT NULL DEFAULT 80,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NotebookTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultScope" TEXT NOT NULL DEFAULT 'PERSONAL',
    "defaultTags" TEXT NOT NULL DEFAULT '[]',
    "defaultPipelineId" TEXT,
    "defaultPolicyIds" TEXT NOT NULL DEFAULT '[]',
    "initialSources" TEXT NOT NULL DEFAULT '[]',
    "sampleQuestions" TEXT NOT NULL DEFAULT '[]',
    "category" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "createdBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NotebookQALog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notebookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "citationCount" INTEGER NOT NULL DEFAULT 0,
    "citationRate" REAL,
    "responseTime" INTEGER,
    "tokenUsed" INTEGER NOT NULL DEFAULT 0,
    "autoScore" REAL,
    "isEmptyResponse" BOOLEAN NOT NULL DEFAULT false,
    "userRating" INTEGER,
    "userFeedback" TEXT,
    "knowledgeGap" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "NotebookProcessingJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notebookId" TEXT,
    "sourceId" TEXT,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "processedItems" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "scheduledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "ChunkingRuleOverride_documentType_idx" ON "ChunkingRuleOverride"("documentType");

-- CreateIndex
CREATE INDEX "ChunkingRuleOverride_notebookId_idx" ON "ChunkingRuleOverride"("notebookId");

-- CreateIndex
CREATE INDEX "RAGTrace_notebookId_idx" ON "RAGTrace"("notebookId");

-- CreateIndex
CREATE INDEX "RAGTrace_userId_idx" ON "RAGTrace"("userId");

-- CreateIndex
CREATE INDEX "RAGTrace_createdAt_idx" ON "RAGTrace"("createdAt");

-- CreateIndex
CREATE INDEX "RAGTraceChunk_traceId_idx" ON "RAGTraceChunk"("traceId");

-- CreateIndex
CREATE INDEX "RAGTraceChunk_chunkId_idx" ON "RAGTraceChunk"("chunkId");

-- CreateIndex
CREATE INDEX "RAGAccuracyConfig_scope_idx" ON "RAGAccuracyConfig"("scope");

-- CreateIndex
CREATE INDEX "RAGAccuracyConfig_notebookId_idx" ON "RAGAccuracyConfig"("notebookId");

-- CreateIndex
CREATE INDEX "RAGAccuracyConfig_documentType_idx" ON "RAGAccuracyConfig"("documentType");

-- CreateIndex
CREATE INDEX "RAGFeedback_traceId_idx" ON "RAGFeedback"("traceId");

-- CreateIndex
CREATE INDEX "RAGFeedback_userId_idx" ON "RAGFeedback"("userId");

-- CreateIndex
CREATE INDEX "RAGFeedback_rating_idx" ON "RAGFeedback"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "SystemStatus_service_key" ON "SystemStatus"("service");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");

-- CreateIndex
CREATE UNIQUE INDEX "NotebookShare_notebookId_userId_key" ON "NotebookShare"("notebookId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotebookAdminRole_userId_roleType_orgId_key" ON "NotebookAdminRole"("userId", "roleType", "orgId");

-- CreateIndex
CREATE UNIQUE INDEX "NotebookBudget_notebookId_period_key" ON "NotebookBudget"("notebookId", "period");
