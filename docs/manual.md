# Aura Enterprise AI Portal - User Manual

## 1. Introduction

Aura is an enterprise-grade AI portal that provides a secure and unified interface for accessing Large Language Models (LLMs). It integrates chat, document analysis, code generation, and autonomous agents, all governed by robust security policies.

---

## 2. User Roles

### 👤 USER (Standard User)

- **Access**: Can access standard AI features under the "AI Use" menu.
- **Capabilities**: Chat with AI, summarize documents, generate code, and view personal logs.
- **Restrictions**: Cannot modify system settings, manage other users, or configure governance rules.

### 🛡️ ADMIN (Administrator)

- **Access**: Full access to all menus including "Manage", "Analyze", and "System".
- **Capabilities**:
  - Manage users and roles.
  - Configure AI models and keys.
  - Set up governance policies (PII filtering, banned topics).
  - Monitor cost, quality, and system health.
  - Manage the knowledge base and RAG settings.

---

## 3. Menu Guide

The sidebar is organized into four main sections based on purpose.

### 🤖 AI Use (AI 사용)

_Accessible to all users._

- **Chat (채팅)**: The primary interface for conversing with AI models. Supports context settings and model selection.
- **Document Summarization (문서 요약)**: Upload PDF or text documents to get concise AI-generated summaries.
- **Code Generation (코드 생성)**: Specialized interface for generating, debugging, and refactoring code snippets.
- **Model Comparison (모델 비교)**: Compare responses from different AI models side-by-side to choose the best one for your task.
- **Agents (에이전트)**: Assign complex, multi-step tasks to autonomous AI agents.
- **Prompts (프롬프트)**: Manage and use saved prompt templates for consistent outputs.

### 🛠 Manage (관리)

_Primarily for Admins and Knowledge Managers._

- **Knowledge Base (지식 베이스)**: Manage the RAG (Retrieval-Augmented Generation) index. Upload and index documents here to make them searchable by the AI.
- **Documents (문서 관리)**: General file management for uploaded assets.
- **Plugins (플러그인)**: Manage external integrations and tools that the AI can use.
- **Governance (거버넌스)**: Configure security policies.
  - **Policies**: Define PII filters, blocked keywords, and topic bans.
  - **Audit**: View policy violation logs.

### 📊 Analyze (분석)

_For Admins and Analysts._

- **Dashboard (대시보드)**: High-level overview of system usage and key metrics.
- **Quality (품질 분석)**: Analyze the accuracy and relevance of AI responses based on user feedback and automated scoring.
- **Cost (비용 분석)**: Track token usage and estimated costs per model, user, or department.
- **MLOps (ML 운영)**: Monitor model performance, deployment status, and versioning.

### ⚙️ System (시스템)

_Strictly for Admins._

- **SRE (시스템 상태)**: Real-time monitoring of system health, API status, and error rates.
- **Offline (오프라인 모드)**: Configuration for air-gapped environments.
- **Users (사용자 관리)**: specific user management including role assignment and access revocation.
- **Settings (설정)**: Global system configuration (branding, default models, etc.).
- **Logs (로그)**: Detailed system logs for troubleshooting.
- **Audit (감사)**: Comprehensive audit trail of important actions (e.g., role changes, policy updates).

---

## 4. Key Features & Workflows

### How to use RAG (Knowledge Base)

1. Go to **Manage > Knowledge Base**.
2. Upload your PDF or text documents.
3. Wait for the indexing process to complete.
4. Go to **AI Use > Chat**.
5. Enable "RAG Mode" or select the uploaded collection.
6. Ask questions; the AI will answer based on your documents.

### How to Compare Models

1. Go to **AI Use > Model Comparison**.
2. Select Model A (e.g., GPT-4) and Model B (e.g., Llama 3).
3. Enter a prompt.
4. View both responses side-by-side to evaluate quality and speed.
