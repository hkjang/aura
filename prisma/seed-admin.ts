
import { prisma } from "../src/lib/prisma";
import { hash } from "bcryptjs";

async function main() {
  console.log('Seeding admin user and basic config...');

  // 1. Admin User
  const hashedPassword = await hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@aura.local' },
    update: {},
    create: {
      email: 'admin@aura.local',
      name: 'Admin User',
      role: 'ADMIN',
      password: hashedPassword,
    },
  });

  // 2. Tool Config
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

  console.log('Seeding admin completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
