
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Seeding knowledge documents...");

  const docs = [
    {
      title: "Employee Handbook 2024",
      content: "Welcome to Aura Enterprise. This handbook covers policies, benefits, and code of conduct...",
      metadata: JSON.stringify({ type: "policy", department: "HR" })
    },
    {
      title: "Quarterly Financial Report Q3",
      content: "Q3 Revenue exceeded expectations by 15% due to strong AI adoption...",
      metadata: JSON.stringify({ type: "report", quarter: "Q3" })
    },
    {
      title: "Project Phoenix Technical Spec",
      content: "Project Phoenix aims to rewrite the legacy billing system using microservices...",
      metadata: JSON.stringify({ type: "technical", project: "Phoenix" })
    },
     {
      title: "Remote Work Guidelines",
      content: "Employees are allowed to work remotely up to 3 days a week...",
      metadata: JSON.stringify({ type: "policy", department: "HR" })
    },
  ];

  for (const d of docs) {
    const existing = await prisma.document.findFirst({
      where: { title: d.title }
    });

    if (!existing) {
      await prisma.document.create({ data: d });
    }
  }

  console.log("Seeding knowledge completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
