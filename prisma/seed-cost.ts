
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Seeding cost rates...");

  const rates = [
    { modelId: "gpt-4", inputPrice: 0.03, outputPrice: 0.06, currency: "USD" },
    { modelId: "gpt-3.5-turbo", inputPrice: 0.0005, outputPrice: 0.0015, currency: "USD" },
    { modelId: "gpt-4o", inputPrice: 0.005, outputPrice: 0.015, currency: "USD" },
    { modelId: "claude-3-opus", inputPrice: 0.015, outputPrice: 0.075, currency: "USD" },
    { modelId: "claude-3-sonnet", inputPrice: 0.003, outputPrice: 0.015, currency: "USD" },
  ];

  for (const rate of rates) {
    await prisma.costRate.upsert({
      where: { modelId: rate.modelId },
      update: rate,
      create: rate,
    });
  }

  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
