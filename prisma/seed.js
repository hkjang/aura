require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
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
