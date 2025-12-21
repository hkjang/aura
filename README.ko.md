# Aura 엔터프라이즈 AI 포털

Aura는 데이터 보안, 거버넌스 및 운영 효율성을 보장하면서 조직에 고급 AI 기능을 제공하도록 설계된 포괄적인 엔터프라이즈 AI 포털입니다. 온프레미스 또는 보안이 엄격한 환경에 이상적입니다.

## 🚀 핵심 기능

- **멀티 모델 인터페이스**: 통일된 인터페이스에서 다양한 AI 모델(OpenAI, Ollama, vLLM)과 채팅할 수 있습니다.
- **RAG (검색 증강 생성)**: 문서를 업로드하여 문맥을 인식하는 AI 답변을 위한 지식 베이스를 구축할 수 있습니다.
- **AI 에이전트**: 자율 에이전트를 사용하여 복잡한 작업을 실행할 수 있습니다.
- **거버넌스 및 보안**: 포괄적인 역할 기반 접근 제어, PII 필터링 및 금지 주제 설정이 가능합니다.
- **분석**: 품질, 비용 및 시스템 사용량 모니터링을 위한 상세 대시보드를 제공합니다.
- **오프라인 지원**: 폐쇄망(에어갭) 환경에서 실행되도록 설계되었습니다.

## 🛠 기술 스택

- **프레임워크**: Next.js 15 (App Router)
- **데이터베이스**: SQLite (via LibSQL) / Prisma ORM
- **인증**: NextAuth.js
- **UI**: Tailwind CSS, Shadcn UI, Lucide Icons
- **AI 통합**: Vercel AI SDK

## 🏁 빠른 시작

### 필수 조건

- Node.js 20+
- npm 또는 pnpm

### 설치

1.  저장소 복제:

    ```bash
    git clone https://github.com/your-org/aura.git
    cd aura
    ```

2.  의존성 설치:

    ```bash
    npm install
    # 또는
    pnpm install
    ```

3.  환경 변수 설정:
    `.env.example`을 `.env`로 복사하고 키를 설정합니다.

    ```bash
    cp .env.example .env
    ```

4.  데이터베이스 초기화:

    ```bash
    npx prisma migrate dev
    npm run seed
    ```

5.  개발 서버 실행:

    ```bash
    npm run dev
    ```

    브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

## 📦 배포

이 프로젝트는 독립형(standalone) 출력으로 구성되어 있어 컨테이너화된 환경이나 오프라인 환경에 쉽게 배포할 수 있습니다.

자세한 내용은 [오프라인 배포 가이드](./docs/deployment/offline_deployment.ko.md)를 참조하세요.

## 📖 문서

- [사용자 매뉴얼](./docs/manual.ko.md): 기능 및 메뉴에 대한 포괄적인 가이드입니다.
- [시각적 사용자 가이드](./docs/ui_guide.ko.md): 애플리케이션 인터페이스 스크린샷 갤러리.
- **상세 가이드**:
  - [AI 사용 가이드](./docs/guides/ai_usage.ko.md)
  - [관리 가이드](./docs/guides/management.ko.md)
  - [분석 가이드](./docs/guides/analytics.ko.md)
  - [시스템 가이드](./docs/guides/system.ko.md)
- **역할별 가이드**:
  - [사용자(USER) 가이드](./docs/roles/user_guide.ko.md)
  - [관리자(ADMIN) 가이드](./docs/roles/admin_guide.ko.md)
  - [관리자 AI 모델 설정 상세 가이드](./docs/guides/admin_ai_model_settings.ko.md)
