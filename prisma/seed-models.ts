import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Seeding AI model configurations...");

  const models = [
    {
      name: "GPT-OSS 20B",
      provider: "ollama",
      modelId: "gpt-oss:20b",
      baseUrl: "http://localhost:11434/v1",
      apiKey: null,
      isActive: true,
    },
    {
      name: "Gemma 3 1B",
      provider: "ollama",
      modelId: "gemma3:1b",
      baseUrl: "http://localhost:11434/v1",
      apiKey: null,
      isActive: true,
    },
  ];

  for (const model of models) {
    // Check if model already exists
    const existing = await prisma.modelConfig.findFirst({
      where: { provider: model.provider, modelId: model.modelId }
    });

    if (!existing) {
      await prisma.modelConfig.create({ data: model });
      console.log(`Created model: ${model.name} (${model.modelId})`);
    } else {
      console.log(`Model already exists: ${model.name} (${model.modelId})`);
    }
  }

  // Also add cost rates for these models
  const costRates = [
    {
      modelId: "gpt-oss:20b",
      inputPrice: 0.0,
      outputPrice: 0.0,
      currency: "USD",
    },
    {
      modelId: "gemma3:1b",
      inputPrice: 0.0,
      outputPrice: 0.0,
      currency: "USD",
    },
  ];

  for (const rate of costRates) {
    const existing = await prisma.costRate.findUnique({
      where: { modelId: rate.modelId }
    });

    if (!existing) {
      await prisma.costRate.create({ data: rate });
      console.log(`Created cost rate for: ${rate.modelId}`);
    }
  }

  console.log("Seeding AI models completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
