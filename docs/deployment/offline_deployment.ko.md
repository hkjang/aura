# 오프라인 배포 가이드

이 가이드는 오프라인(폐쇄망/에어갭) 환경에서 Aura 엔터프라이즈 AI 포털을 배포하는 방법을 설명합니다.

## 1. 아키텍처 개요

오프라인 환경에서는 애플리케이션이 공용 인터넷에 액세스할 수 없습니다. 즉:

- npm/yarn에서 패키지를 가져올 수 없습니다.
- 내부 게이트웨이를 통하지 않는 한 외부 모델 API(OpenAI, Anthropic)에 직접 액세스할 수 없습니다.
- **로컬 모델**: 보안 네트워크 내에서 실행되는 로컬 호스팅 모델(예: Ollama, vLLM)에 크게 의존합니다.

## 2. 필수 조건

### 타겟 서버 (오프라인)

- **OS**: Linux (Ubuntu/RHEL 권장) 또는 Windows Server.
- **Node.js**: 버전 20.x 이상 (바이너리 설치).
- **데이터베이스**:
  - 포함된 SQLite (가장 간단함).
  - 또는 내부 PostgreSQL/MySQL 인스턴스.
- **프로세스 관리자**: PM2 (권장) 또는 Docker.

### 빌드 머신 (온라인)

- 의존성을 다운로드하고 아티팩트를 빌드할 수 있는 인터넷 액세스가 가능한 머신.

## 3. 빌드 프로세스

이 단계는 **빌드 머신**에서 수행하세요.

1. **복제 및 설치**

   ```bash
   git clone <repo-url>
   cd aura
   npm install
   ```

2. **독립형(Standalone) 구성**
   `next.config.ts` 파일에 `output: 'standalone'`이 있는지 확인하세요.
   _(기본 프로젝트에 이미 구성되어 있습니다)._

3. **빌드**

   ```bash
   npm run build
   ```

   이 명령은 최소한의 Node.js 서버와 모든 필요한 의존성을 포함하는 `.next/standalone` 디렉토리를 생성합니다.

4. **아티팩트 준비**
   오프라인 서버에 다음 항목을 복사해야 합니다:

   - `.next/standalone` (실행 가능한 서버)
   - `.next/static` -> `.next/standalone/.next/static`으로 복사 (정적 자산)
   - `public` -> `.next/standalone/public`으로 복사 (이미지 등 공용 자산)

   **패키징 명령 (예시):**

   ```bash
   # 배포용 폴더 생성
   mkdir deploy_package
   cp -r .next/standalone/* deploy_package/

   # 정적 자산 복사 (필수!)
   mkdir -p deploy_package/.next/static
   cp -r .next/static/* deploy_package/.next/static/

   # 공용 자산 복사
   mkdir -p deploy_package/public
   cp -r public/* deploy_package/public/

   # 압축
   zip -r aura-offline-deploy.zip deploy_package
   ```

## 4. 오프라인 서버로 배포

1. **전송**: 보안 USB나 내부 전송망을 통해 `aura-offline-deploy.zip`을 타겟 서버로 이동합니다.
2. **압축 해제**:

   ```bash
   unzip aura-offline-deploy.zip -d /opt/aura
   cd /opt/aura
   ```

3. **환경 설정**:
   배포 폴더의 루트에 `.env` 파일을 생성합니다.

   ```env
   DATABASE_URL="file:./dev.db"  # 또는 내부 DB URL
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://your-server-ip:3000"

   # 오프라인 모델 구성
   # 내부 Ollama/vLLM 인스턴스를 가리키도록 설정
   OLLAMA_BASE_URL="http://internal-ollama-host:11434"
   ```

4. **데이터베이스 마이그레이션 (SQLite)**:
   SQLite를 사용하는 경우, 스키마가 일치한다면 개발 머신에서 미리 시드된 `dev.db`를 복사하거나, prisma 바이너리가 있는 경우 마이그레이션 스크립트를 실행합니다.
   _참고: 독립형 빌드에는 `node_modules`가 포함되어 있습니다. 생성된 클라이언트를 사용하여 마이그레이션을 실행할 수 있습니다._

5. **애플리케이션 시작**:
   ```bash
   node server.js
   ```
   또는 PM2 사용:
   ```bash
   pm2 start server.js --name aura
   ```

## 5. 문제 해결

- **정적 파일 누락**: CSS/JS가 누락된 경우 `.next/static`이 `.next/standalone/.next/static`으로 올바르게 복사되었는지 확인하세요.
- **데이터베이스 오류**: `DATABASE_URL`에 접근 가능한지 확인하세요. SQLite의 경우 프로세스가 db 파일 디렉토리에 쓰기 권한이 있는지 확인하세요.
- **모델 연결**: 내부 모델 서버(Ollama/vLLM)가 Aura 서버에서 접근 가능한지 확인하세요.
