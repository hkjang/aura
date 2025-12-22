require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const { hash } = require('bcryptjs');

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db',
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const hashedPassword = await hash('admin123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'admin@aura.local' },
    update: {},
    create: {
      email: 'admin@aura.local',
      name: 'Admin User',
      role: 'ADMIN',
      password: hashedPassword,
    },
  });

  await prisma.toolConfig.upsert({
    where: { key: 'search_documents' },
    update: {},
    create: {
      key: 'search_documents',
      name: 'Knowledge Base Search',
      description: 'Search internal documents.',
      isEnabled: true,
    }
  });

  // Seed embedding configuration - Ollama bge-m3 as default
  // Also seed AI model configuration for notebook chat
  const embeddingConfigs = [
    { key: 'EMBEDDING_PROVIDER', value: 'ollama' },
    { key: 'EMBEDDING_MODEL', value: 'bge-m3' },
    { key: 'EMBEDDING_BASE_URL', value: 'http://localhost:11434' },
    { key: 'EMBEDDING_API_KEY', value: '' },
    { key: 'VECTORDB_PROVIDER', value: 'sqlite' },
    // AI model settings for chat/notebook queries
    { key: 'AI_PROVIDER', value: 'ollama' },
    { key: 'AI_MODEL', value: 'gemma3:4b' },
    { key: 'OLLAMA_BASE_URL', value: 'http://localhost:11434/v1' },
  ];

  for (const config of embeddingConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: {
        key: config.key,
        value: config.value,
      },
    });
  }

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
