# Offline Deployment Guide

This guide describes how to deploy the Aura Enterprise AI Portal in an offline (air-gapped) environment.

## 1. Architecture Overview

In an offline environment, the application cannot access the public internet. This means:

- No fetching packages from npm/yarn.
- No accessing external model APIs (OpenAI, Anthropic) directly unless routed through an internal gateway.
- **Local Models**: Heavily relies on locally hosted models (e.g., Ollama, vLLM) running within the secure network.

## 2. Prerequisites

### Target Server (Offline)

- **OS**: Linux (Ubuntu/RHEL recommended) or Windows Server.
- **Node.js**: Version 20.x or higher (binary installed).
- **Database**:
  - Included SQLite (simplest).
  - Or an internal PostgreSQL/MySQL instance.
- **Process Manager**: PM2 (recommended) or Docker.

### Build Machine (Online)

- Machine with internet access to download dependencies and build the artifacts.

## 3. Build Process

Perform these steps on the **Build Machine**.

1. **Clone & Install**

   ```bash
   git clone <repo-url>
   cd aura
   npm install
   ```

2. **Configure for Standalone**
   Ensure `next.config.ts` has `output: 'standalone'`.
   _(This is already configured in the default project)_.

3. **Build**

   ```bash
   npm run build
   ```

   This will create a `.next/standalone` directory containing a minimal Node.js server and all necessary dependencies.

4. **Prepare Artifacts**
   You need to copy the following to the offline server:

   - `.next/standalone` (The executable server)
   - `.next/static` -> copy to `.next/standalone/.next/static` (Static assets)
   - `public` -> copy to `.next/standalone/public` (Public assets like images)

   **Packaging Command (Example):**

   ```bash
   # Create a clean deployment folder
   mkdir deploy_package
   cp -r .next/standalone/* deploy_package/

   # Copy static assets (Required!)
   mkdir -p deploy_package/.next/static
   cp -r .next/static/* deploy_package/.next/static/

   # Copy public assets
   mkdir -p deploy_package/public
   cp -r public/* deploy_package/public/

   # Zip it
   zip -r aura-offline-deploy.zip deploy_package
   ```

## 4. Deployment to Offline Server

1. **Transfer**: Move `aura-offline-deploy.zip` to the target server via secure USB or internal transfer.
2. **Extract**:

   ```bash
   unzip aura-offline-deploy.zip -d /opt/aura
   cd /opt/aura
   ```

3. **Environment Setup**:
   Create a `.env` file in the root of the deployment folder.

   ```env
   DATABASE_URL="file:./dev.db"  # Or your internal DB URL
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://your-server-ip:3000"

   # Offline Model Configuration
   # Point these to your internal Ollama/vLLM instances
   OLLAMA_BASE_URL="http://internal-ollama-host:11434"
   ```

4. **Database Migration (SQLite)**:
   If using SQLite, simply copy the pre-seeded `dev.db` from your dev machine if schema matches, or run migration scripts if you have the prisma binary available.
   _Note: The standalone build puts `node_modules` inside. You may need to run migrations using the generated client._

5. **Start Application**:
   ```bash
   node server.js
   ```
   Or using PM2:
   ```bash
   pm2 start server.js --name aura
   ```

## 5. Troubleshooting

- **Missing Static Files**: If CSS/JS is missing, ensure `.next/static` was correctly copied to `.next/standalone/.next/static`.
- **Database Errors**: Verify `DATABASE_URL` is accessible. For SQLite, ensure the process has write permissions to the db file directory.
- **Model Connection**: Ensure the internal model server (Ollama/vLLM) is reachable from the Aura server.
