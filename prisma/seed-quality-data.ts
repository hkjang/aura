import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Seeding quality data...");

  // Get some message IDs (or create mock ones)
  const messageIds = [
    "msg-quality-1",
    "msg-quality-2", 
    "msg-quality-3",
    "msg-quality-4",
    "msg-quality-5",
    "msg-quality-6",
    "msg-quality-7",
    "msg-quality-8",
  ];

  // Get admin user for feedback
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!adminUser) {
    console.log("No admin user found. Please run seed first.");
    return;
  }

  // Create sample evaluations with varying quality
  const evaluations = [
    { messageId: messageIds[0], scoreAccuracy: 0.95, scoreRelevance: 0.98, scoreStyle: 0.92 },
    { messageId: messageIds[1], scoreAccuracy: 0.88, scoreRelevance: 0.92, scoreStyle: 0.85 },
    { messageId: messageIds[2], scoreAccuracy: 0.45, scoreRelevance: 0.55, scoreStyle: 0.60 }, // Low quality
    { messageId: messageIds[3], scoreAccuracy: 0.92, scoreRelevance: 0.95, scoreStyle: 0.90 },
    { messageId: messageIds[4], scoreAccuracy: 0.55, scoreRelevance: 0.48, scoreStyle: 0.52 }, // Low quality
    { messageId: messageIds[5], scoreAccuracy: 0.97, scoreRelevance: 0.99, scoreStyle: 0.95 },
    { messageId: messageIds[6], scoreAccuracy: 0.62, scoreRelevance: 0.70, scoreStyle: 0.65 }, // Low quality
    { messageId: messageIds[7], scoreAccuracy: 0.90, scoreRelevance: 0.88, scoreStyle: 0.92 },
  ];

  for (const eval_ of evaluations) {
    await prisma.responseEvaluation.create({
      data: {
        ...eval_,
        feedback: eval_.scoreAccuracy < 0.7 
          ? "응답 품질이 기준 미달입니다. 정확도와 관련성을 개선해야 합니다."
          : null
      }
    });
  }

  // Create sample user feedbacks
  const feedbacks = [
    { messageId: messageIds[0], rating: 1, reason: null },
    { messageId: messageIds[1], rating: 1, reason: "정확하고 도움이 되었습니다." },
    { messageId: messageIds[2], rating: -1, reason: "잘못된 정보가 포함되어 있었습니다." },
    { messageId: messageIds[3], rating: 1, reason: null },
    { messageId: messageIds[4], rating: -1, reason: "응답이 너무 느렸습니다." },
    { messageId: messageIds[5], rating: 1, reason: "매우 상세하고 유용했습니다." },
    { messageId: messageIds[6], rating: -1, reason: "질문에 대한 답변이 아니었습니다." },
    { messageId: messageIds[7], rating: 1, reason: null },
  ];

  for (const fb of feedbacks) {
    await prisma.userFeedback.create({
      data: {
        messageId: fb.messageId,
        userId: adminUser.id,
        rating: fb.rating,
        reason: fb.reason
      }
    });
  }

  console.log("Quality data seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
