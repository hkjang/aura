
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({});

async function main() {
  console.log("Seeding governance policies...");

  const policies = [
    {
      name: "Block Competitors",
      description: "Blocks mentions of known competitors (Example, DemoCorp).",
      type: "BLOCK_KEYWORD",
      rules: JSON.stringify(["CompetitorA", "CompetitorB", "DemoCorp"]),
      action: "BLOCK",
      isActive: true,
    },
    {
      name: "PII Warning",
      description: "Flags inputs that look like SSN or credit cards.",
      type: "PII_FILTER",
      rules: JSON.stringify([]), // Logic handled by code for now, this is a placeholder
      action: "FLAG",
      isActive: true,
    },
    {
      name: "System Prompt Protection",
      description: "Prevents users from trying to override system instructions.",
      type: "REGEX",
      rules: JSON.stringify(["ignore previous instructions"]),
      action: "BLOCK",
      isActive: true,
    },
  ];

  for (const p of policies) {
    const existing = await prisma.policy.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.policy.create({ data: p });
    } else {
      await prisma.policy.update({ where: { id: existing.id }, data: p });
    }
  }

  console.log("Seeding policies completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
