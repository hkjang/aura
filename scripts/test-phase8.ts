
import { prisma } from '../src/lib/prisma';
// import { PrismaClient } from '@prisma/client';
// import 'dotenv/config';

// const prisma = new PrismaClient({
//    log: ['query']
// });

async function main() {
  console.log('Starting Phase 8 Verification...');

  // 1. Test Governance Policy Creation
  console.log('1. Testing Policy Creation...');
  const policy = await prisma.policy.create({
    data: {
      name: 'Test Block List',
      type: 'BLOCK_KEYWORD',
      rules: JSON.stringify(['forbidden', 'test_block']),
      action: 'BLOCK',
    },
  });
  console.log('Created Policy:', policy.id);

  // 2. Test Cost Rate Creation
  console.log('2. Testing Cost Rate Creation...');
  const costRate = await prisma.costRate.create({
    data: {
      modelId: 'gpt-4-test',
      inputPrice: 0.03,
      outputPrice: 0.06,
    },
  });
  console.log('Created CostRate:', costRate.id);

  // 3. Test Response Evaluation Creation (Mocking dependencies)
  // First create a dummy user
  const user = await prisma.user.create({
    data: {
        email: `test-phase8-${Date.now()}@example.com`,
        name: 'Test User Phase 8'
    }
  });

  // Create a dummy chat session
  const chat = await prisma.chatSession.create({
    data: {
        title: 'Test Chat Phase 8',
        userId: user.id
    }
  });

  // Create a dummy message
  const message = await prisma.chatMessage.create({
    data: {
        chatId: chat.id,
        role: 'assistant',
        content: 'This is a test response.'
    }
  });

  console.log('3. Testing Response Evaluation Creation...');
  const evalResult = await prisma.responseEvaluation.create({
    data: {
      messageId: message.id,
      scoreAccuracy: 0.95,
      scoreRelevance: 0.98,
      feedback: 'Excellent response',
    },
  });
  console.log('Created Evaluation:', evalResult.id);

  console.log('Phase 8 Verification Completed Successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
