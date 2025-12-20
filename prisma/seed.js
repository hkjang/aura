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
  const password = await hash('admin123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'admin@aura.com' },
    update: {},
    create: {
      email: 'admin@aura.com',
      name: 'Admin User',
      password,
      role: 'ADMIN',
    },
  });
  console.log({ user });
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
