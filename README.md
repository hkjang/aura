# Aura Enterprise AI Portal

Aura is a comprehensive Enterprise AI Portal designed to empower organizations with advanced AI capabilities while ensuring data security, governance, and operational efficiency. Ideally suited for on-premise or heavy-compliance environments.

## 🚀 Key Features

- **Multi-Model Interface**: Chat with various AI models (OpenAI, Ollama, vLLM) in a unified interface.
- **RAG (Retrieval-Augmented Generation)**: Upload documents to create a knowledge base for context-aware AI responses.
- **AI Agents**: Execute complex tasks using autonomous agents.
- **Governance & Security**: Comprehensive role-based access control, PII filtering, and topic banning.
- **Analytics**: Detailed dashboards for quality, cost, and system usage monitoring.
- **Offline Capable**: Designed to run in air-gapped environments.

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: SQLite (via LibSQL) / Prisma ORM
- **Auth**: NextAuth.js
- **UI**: Tailwind CSS, Shadcn UI, Lucide Icons
- **AI Integration**: Vercel AI SDK

## 🏁 Quick Start

### Prerequisites

- Node.js 20+
- npm or pnpm

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/your-org/aura.git
    cd aura
    ```

2.  Install dependencies:

    ```bash
    npm install
    # or
    pnpm install
    ```

3.  Set up environment variables:
    Copy `.env.example` to `.env` and configure your keys.

    ```bash
    cp .env.example .env
    ```

4.  Initialize the database:

    ```bash
    npx prisma migrate dev
    npm run seed
    ```

5.  Run the development server:

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser.

## 📦 Deployment

This project is configured for standalone output, making it easy to deploy in containerized or offline environments.

See [Offline Deployment Guide](./docs/deployment/offline_deployment.md) for detailed instructions.

## 📖 Documentation

- [User Manual](./docs/manual.md): Comprehensive guide to features and menus.
- [Visual UI Guide](./docs/ui_guide.md): Screenshots of the application interface.
