import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Create admin user
    const password = await hash('admin123', 12);
    const user = await prisma.user.upsert({
      where: { email: 'admin@aura.local' },
      update: {},
      create: {
        email: 'admin@aura.local',
        name: 'Admin User',
        password,
        role: 'ADMIN',
      },
    });

    // 2. Create sample notebooks
    const notebookData = [
      {
        name: "회사 정책 매뉴얼",
        description: "인사, 보안, 출장 등 회사 내부 정책 문서 모음",
        scope: "ORGANIZATION",
        isPublic: false,
        tags: '["정책", "인사", "보안"]',
      },
      {
        name: "제품 기술 문서",
        description: "제품 아키텍처, API 문서, 개발 가이드",
        scope: "TEAM",
        isPublic: false,
        tags: '["기술", "API", "개발"]',
      },
      {
        name: "고객 FAQ",
        description: "자주 묻는 질문과 답변 모음",
        scope: "PERSONAL",
        isPublic: true,
        tags: '["FAQ", "고객지원"]',
      },
      {
        name: "AI 연구 논문",
        description: "LLM, RAG, 프롬프트 엔지니어링 관련 논문 요약",
        scope: "PERSONAL",
        isPublic: false,
        tags: '["AI", "연구", "논문"]',
      },
    ];

    const notebooks = [];
    for (const nb of notebookData) {
      const notebook = await prisma.notebook.upsert({
        where: { id: `seed-nb-${nb.name.slice(0, 10)}` },
        update: nb,
        create: {
          id: `seed-nb-${nb.name.slice(0, 10)}`,
          ...nb,
          ownerId: user.id,
        },
      });
      notebooks.push(notebook);
    }

    // 3. Add sample knowledge sources to first notebook
    const sampleSources = [
      {
        type: "TEXT",
        title: "휴가 정책",
        content: `# 휴가 정책

## 연차 휴가
- 1년 이상 근속 시 연간 15일 부여
- 3년 이상 근속 시 연간 20일 부여
- 미사용 연차는 다음 해로 이월 불가

## 병가
- 연간 5일 유급 병가 제공
- 3일 이상 연속 사용 시 진단서 필요

## 경조사 휴가
- 결혼: 본인 5일, 자녀 1일
- 출산: 배우자 10일
- 사망: 부모 5일, 조부모 3일

## 휴가 신청 절차
1. 최소 3일 전 시스템으로 신청
2. 직속 상사 승인 필요
3. 7일 이상 휴가는 부서장 승인 필요`,
        status: "COMPLETED",
      },
      {
        type: "TEXT",
        title: "보안 정책",
        content: `# 정보 보안 정책

## 비밀번호 규칙
- 최소 12자리 이상
- 대문자, 소문자, 숫자, 특수문자 포함
- 90일마다 변경 필수

## 접근 권한
- 최소 권한 원칙 적용
- 퇴사자 계정 즉시 삭제
- 외부 공유 시 승인 필요

## 데이터 분류
- 기밀: 경영 정보, 고객 데이터
- 내부용: 업무 문서, 회의록
- 공개: 마케팅 자료

## 보안 사고 대응
1. 즉시 IT팀에 보고
2. 피해 범위 파악
3. 증거 보존
4. 경영진 보고`,
        status: "COMPLETED",
      },
      {
        type: "TEXT",
        title: "출장 규정",
        content: `# 출장 규정

## 교통비
- 항공: 이코노미 클래스 (부장 이상 비즈니스)
- KTX: 일반실
- 자차: km당 300원

## 숙박비
- 서울/수도권: 1박 15만원 한도
- 지방: 1박 12만원 한도
- 해외: 지역별 상한액 별도

## 일비
- 국내: 2만원/일
- 해외: 미화 50달러/일

## 정산 절차
1. 출장 완료 후 7일 이내 정산
2. 영수증 원본 제출 필수
3. 법인카드 사용 권장`,
        status: "COMPLETED",
      },
    ];

    for (const source of sampleSources) {
      await prisma.knowledgeSource.upsert({
        where: { id: `seed-src-${source.title.slice(0, 10)}` },
        update: source,
        create: {
          id: `seed-src-${source.title.slice(0, 10)}`,
          notebookId: notebooks[0].id,
          uploaderId: user.id,
          ...source,
        },
      });
    }

    // 4. Create prompts
    const promptData = [
      {
        name: "요약 프롬프트",
        description: "문서를 간결하게 요약하는 프롬프트",
        content: `당신은 전문 문서 요약 전문가입니다.

다음 규칙에 따라 문서를 요약해주세요:
1. 핵심 내용을 3-5개 bullet point로 정리
2. 전문 용어는 쉽게 풀어서 설명
3. 원문 길이의 20-30% 수준으로 축약
4. 중요한 수치나 날짜는 반드시 포함

## 입력 문서
{{document}}

## 요약 결과`,
        category: "summarization",
        isPublic: true,
        tags: '["요약", "문서"]',
      },
      {
        name: "코드 리뷰 프롬프트",
        description: "코드 품질과 개선점을 분석하는 프롬프트",
        content: `당신은 10년 경력의 시니어 개발자입니다.

다음 코드를 리뷰하고 피드백을 제공해주세요:

## 검토 항목
1. 코드 품질 (가독성, 유지보수성)
2. 잠재적 버그 또는 보안 취약점
3. 성능 개선 포인트
4. 베스트 프랙티스 준수 여부

## 코드
\`\`\`
{{code}}
\`\`\`

## 리뷰 결과
각 항목별로 구체적인 피드백과 개선 코드를 제공하세요.`,
        category: "development",
        isPublic: true,
        tags: '["코드리뷰", "개발"]',
      },
      {
        name: "고객 응대 프롬프트",
        description: "친절하고 전문적인 고객 응대용 프롬프트",
        content: `당신은 친절하고 전문적인 고객 지원 담당자입니다.

## 응대 원칙
1. 항상 존댓말 사용
2. 고객의 불편함에 먼저 공감
3. 명확하고 구체적인 해결책 제시
4. 추가 도움이 필요한지 확인

## 고객 문의
{{inquiry}}

## 응답 형식
- 인사말
- 문제 상황 재확인
- 해결 방안 (단계별로)
- 마무리 인사`,
        category: "customer-service",
        isPublic: true,
        tags: '["고객응대", "CS"]',
      },
      {
        name: "회의록 작성 프롬프트",
        description: "회의 녹취록을 정리된 회의록으로 변환",
        content: `회의 녹취록을 공식 회의록 형식으로 정리해주세요.

## 회의록 형식
1. 회의 정보 (일시, 참석자, 안건)
2. 논의 내용 요약
3. 결정 사항
4. Action Items (담당자, 기한 포함)
5. 다음 회의 일정

## 녹취록
{{transcript}}

## 주의사항
- 발언자별로 주요 의견 정리
- 중요 결정은 bold로 강조
- Action Item은 표 형식으로 정리`,
        category: "productivity",
        isPublic: true,
        tags: '["회의록", "업무"]',
      },
      {
        name: "번역 프롬프트",
        description: "자연스러운 한영 번역 프롬프트",
        content: `전문 번역가로서 다음 텍스트를 번역해주세요.

## 번역 원칙
1. 직역보다 의역 선호
2. 문화적 맥락 고려
3. 전문 용어는 통용되는 표현 사용
4. 원문의 톤과 분위기 유지

## 원문 ({{source_language}})
{{text}}

## 번역문 ({{target_language}})`,
        category: "translation",
        isPublic: true,
        tags: '["번역", "다국어"]',
      },
    ];

    for (const prompt of promptData) {
      await prisma.prompt.upsert({
        where: { id: `seed-prompt-${prompt.name.slice(0, 10)}` },
        update: prompt,
        create: {
          id: `seed-prompt-${prompt.name.slice(0, 10)}`,
          userId: user.id,
          ...prompt,
        },
      });
    }

    // 5. Create sample Q&A history
    await prisma.qnAHistory.upsert({
      where: { id: "seed-qna-1" },
      update: {},
      create: {
        id: "seed-qna-1",
        userId: user.id,
        notebookId: notebooks[0].id,
        question: "연차 휴가는 몇 일 주어지나요?",
        answer: "근속 연수에 따라 다릅니다. 1년 이상 근속 시 연간 15일, 3년 이상 근속 시 연간 20일이 부여됩니다. 미사용 연차는 다음 해로 이월되지 않습니다.",
        citations: '[{"sourceTitle": "휴가 정책", "content": "1년 이상 근속 시 연간 15일 부여"}]',
        isSaved: true,
      },
    });

    await prisma.qnAHistory.upsert({
      where: { id: "seed-qna-2" },
      update: {},
      create: {
        id: "seed-qna-2",
        userId: user.id,
        notebookId: notebooks[0].id,
        question: "비밀번호 규칙이 어떻게 되나요?",
        answer: "비밀번호는 최소 12자리 이상이어야 하며, 대문자, 소문자, 숫자, 특수문자를 모두 포함해야 합니다. 또한 90일마다 변경이 필수입니다.",
        citations: '[{"sourceTitle": "보안 정책", "content": "최소 12자리 이상, 90일마다 변경 필수"}]',
        isSaved: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      user,
      notebooks: notebooks.length,
      prompts: promptData.length,
      message: "시드 데이터가 성공적으로 생성되었습니다."
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
