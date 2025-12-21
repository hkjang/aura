/**
 * AI 기반 자동 태그 추출 서비스
 * 콘텐츠를 분석하여 관련 태그를 자동으로 추출합니다.
 */

interface TagExtractionResult {
  tags: string[];
  categories: string[];
  topics: string[];
  confidence: number;
}

// 한국어 키워드 패턴
const KOREAN_PATTERNS = {
  programming: ["코드", "함수", "클래스", "변수", "메서드", "알고리즘", "프로그래밍", "개발"],
  web: ["웹", "프론트엔드", "백엔드", "API", "서버", "클라이언트", "HTML", "CSS"],
  database: ["데이터베이스", "쿼리", "SQL", "테이블", "스키마", "인덱스"],
  ai: ["AI", "인공지능", "머신러닝", "딥러닝", "모델", "학습", "신경망"],
  analysis: ["분석", "비교", "평가", "검토", "리뷰", "장단점"],
  tutorial: ["설명", "가이드", "튜토리얼", "예시", "방법", "단계"],
  troubleshooting: ["에러", "오류", "버그", "문제", "해결", "디버깅", "수정"],
};

// 영어 키워드 패턴
const ENGLISH_PATTERNS = {
  programming: ["code", "function", "class", "variable", "method", "algorithm", "programming"],
  web: ["frontend", "backend", "api", "server", "client", "react", "next", "node"],
  database: ["database", "query", "sql", "table", "schema", "index", "prisma"],
  ai: ["ai", "machine learning", "deep learning", "model", "training", "neural"],
  analysis: ["analysis", "compare", "evaluate", "review", "pros", "cons"],
  tutorial: ["example", "guide", "tutorial", "how to", "step", "learn"],
  troubleshooting: ["error", "bug", "issue", "fix", "debug", "solve", "problem"],
};

// 기술 스택 키워드
const TECH_STACK = [
  "javascript", "typescript", "python", "java", "react", "vue", "angular",
  "node", "express", "next", "nest", "django", "flask", "spring",
  "postgresql", "mysql", "mongodb", "redis", "docker", "kubernetes",
  "aws", "gcp", "azure", "git", "github", "gitlab"
];

/**
 * 콘텐츠에서 태그를 추출합니다.
 */
export function extractTags(content: string): TagExtractionResult {
  const lowerContent = content.toLowerCase();
  const tags: Set<string> = new Set();
  const categories: Set<string> = new Set();
  const topics: Set<string> = new Set();
  let matchCount = 0;
  let totalPatterns = 0;
  
  // 한국어 패턴 매칭
  Object.entries(KOREAN_PATTERNS).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      totalPatterns++;
      if (content.includes(keyword)) {
        tags.add(keyword);
        categories.add(category);
        matchCount++;
      }
    });
  });
  
  // 영어 패턴 매칭
  Object.entries(ENGLISH_PATTERNS).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      totalPatterns++;
      if (lowerContent.includes(keyword)) {
        tags.add(keyword);
        categories.add(category);
        matchCount++;
      }
    });
  });
  
  // 기술 스택 매칭
  TECH_STACK.forEach(tech => {
    totalPatterns++;
    if (lowerContent.includes(tech)) {
      tags.add(tech);
      topics.add("technology");
      matchCount++;
    }
  });
  
  // 코드 블록 감지
  if (content.includes("```")) {
    tags.add("코드 예시");
    categories.add("code");
    matchCount++;
  }
  
  // 목록 형식 감지
  if (content.match(/^\s*[-*]\s+/m) || content.match(/^\s*\d+\.\s+/m)) {
    tags.add("목록");
    matchCount++;
  }
  
  // 질문 형식 감지
  if (content.includes("?") || content.includes("어떻게") || content.includes("무엇")) {
    tags.add("Q&A");
    matchCount++;
  }
  
  // 신뢰도 계산
  const confidence = Math.min(matchCount / Math.max(totalPatterns * 0.1, 1), 1);
  
  return {
    tags: Array.from(tags).slice(0, 10),
    categories: Array.from(categories),
    topics: Array.from(topics),
    confidence
  };
}

/**
 * 여러 콘텐츠에서 공통 태그를 추출합니다.
 */
export function extractCommonTags(contents: string[]): string[] {
  const tagFrequency: Map<string, number> = new Map();
  
  contents.forEach(content => {
    const { tags } = extractTags(content);
    tags.forEach(tag => {
      tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
    });
  });
  
  // 빈도순 정렬 후 상위 태그 반환
  return Array.from(tagFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);
}

/**
 * 태그 기반 관련 콘텐츠 찾기
 */
export function findRelatedByTags(
  targetTags: string[],
  items: Array<{ id: string; tags: string[] }>
): Array<{ id: string; similarity: number }> {
  return items
    .map(item => {
      const commonTags = item.tags.filter(tag => targetTags.includes(tag));
      const similarity = commonTags.length / Math.max(targetTags.length, 1);
      return { id: item.id, similarity };
    })
    .filter(item => item.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity);
}

/**
 * 태그 추천
 */
export function suggestTags(existingTags: string[], content: string): string[] {
  const { tags } = extractTags(content);
  return tags.filter(tag => !existingTags.includes(tag));
}

export default {
  extractTags,
  extractCommonTags,
  findRelatedByTags,
  suggestTags
};
