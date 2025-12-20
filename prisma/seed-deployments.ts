
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Seeding model deployments...");

  const deployments = [
    {
      name: "gpt-3.5-turbo",
      version: "v4-optimized",
      endpoint: "https://api.openai.com/v1", // Mock endpoint
      strategy: "ROLLING",
      status: "ACTIVE",
      trafficSplit: 100,
    },
    {
      name: "llama-3-70b-instruct",
      version: "v1.0.0-stable",
      endpoint: "http://internal-vllm-cluster:8000/v1",
      strategy: "BLUE_GREEN",
      status: "ACTIVE",
      trafficSplit: 90,
    },
    {
      name: "llama-3-70b-instruct",
      version: "v1.1.0-canary",
      endpoint: "http://internal-vllm-canary:8000/v1",
      strategy: "CANARY",
      status: "ACTIVE",
      trafficSplit: 10,
    },
  ];

  for (const d of deployments) {
    // Check if this version exists
    const existing = await prisma.modelDeployment.findFirst({
      where: { name: d.name, version: d.version }
    });

    if (!existing) {
      await prisma.modelDeployment.create({ data: d });
    }
  }

  console.log("Seeding deployments completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
