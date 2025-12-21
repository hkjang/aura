import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Seeding governance policies...");

  const policies = [
    {
      name: "경쟁사 차단",
      description: "프롬프트에서 특정 경쟁사 이름 언급을 차단합니다.",
      type: "BLOCK_KEYWORD",
      rules: JSON.stringify(["competitor-a", "competitor-b", "경쟁사명"]),
      action: "BLOCK",
      isActive: true,
    },
    {
      name: "개인정보 탐지",
      description: "출력에서 이메일, 전화번호, 주민번호를 감지하고 마스킹합니다.",
      type: "PII_FILTER",
      rules: JSON.stringify(["email", "phone", "ssn", "credit_card"]),
      action: "MASK",
      isActive: true,
    },
    {
      name: "금융 조언 필터",
      description: "특정 투자 조언이나 주식 팁을 요청하는 내용을 플래그합니다.",
      type: "TOPIC_BAN",
      rules: JSON.stringify(["투자 조언", "주식 추천", "financial advice"]),
      action: "FLAG",
      isActive: false,
    },
    {
      name: "시스템 프롬프트 인젝션",
      description: "'이전 지시 무시' 등을 통한 시스템 지시 우회 시도를 차단합니다.",
      type: "REGEX",
      rules: JSON.stringify(["ignore previous", "이전 지시 무시", "system prompt"]),
      action: "BLOCK",
      isActive: true,
    },
    {
      name: "민감 데이터 보호",
      description: "회사 내부 기밀 정보 유출을 방지합니다.",
      type: "BLOCK_KEYWORD",
      rules: JSON.stringify(["비밀번호", "API키", "secret", "confidential"]),
      action: "BLOCK",
      isActive: true,
    },
  ];

  for (const policy of policies) {
    await prisma.policy.upsert({
      where: { id: policy.name.replace(/\s/g, "-").toLowerCase() },
      update: policy,
      create: policy,
    });
  }

  console.log("Seeding governance policies completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
