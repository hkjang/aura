import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Seeding usage logs...");

  // Get first admin user for associating logs
  let user = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!user) {
    user = await prisma.user.findFirst();
  }
  if (!user) {
    console.log("No user found. Please run seed first.");
    return;
  }

  const models = [
    { model: "gpt-4", avgInput: 500, avgOutput: 800, costPerKToken: 0.03 },
    { model: "gpt-3.5-turbo", avgInput: 400, avgOutput: 600, costPerKToken: 0.002 },
    { model: "gemma3:1b", avgInput: 300, avgOutput: 500, costPerKToken: 0 },
  ];

  const types = ["chat", "summarize", "code"];
  const now = new Date();

  // Generate usage logs for last 7 days
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(now);
    date.setDate(now.getDate() - dayOffset);

    // Generate 5-15 logs per day
    const logsPerDay = 5 + Math.floor(Math.random() * 10);

    for (let i = 0; i < logsPerDay; i++) {
      const modelInfo = models[Math.floor(Math.random() * models.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      
      const tokensIn = Math.floor(modelInfo.avgInput * (0.5 + Math.random()));
      const tokensOut = Math.floor(modelInfo.avgOutput * (0.5 + Math.random()));
      const cost = ((tokensIn + tokensOut) / 1000) * modelInfo.costPerKToken;

      const logDate = new Date(date);
      logDate.setHours(Math.floor(Math.random() * 14) + 8); // 8 AM to 10 PM
      logDate.setMinutes(Math.floor(Math.random() * 60));

      await prisma.usageLog.create({
        data: {
          userId: user.id,
          model: modelInfo.model,
          type,
          tokensIn,
          tokensOut,
          cost,
          createdAt: logDate,
        },
      });
    }
  }

  // Ensure budget record exists
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const totalCost = await prisma.usageLog.aggregate({
    _sum: { cost: true },
  });

  await prisma.budget.upsert({
    where: {
      entityType_entityId_period: {
        entityType: "global",
        entityId: "all",
        period,
      },
    },
    update: {
      spent: totalCost._sum.cost || 0,
    },
    create: {
      entityType: "global",
      entityId: "all",
      period,
      limit: 10,
      spent: totalCost._sum.cost || 0,
    },
  });

  console.log("Seeding usage logs completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
