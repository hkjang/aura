# 오프라인 배포 가이드

이 가이드는 인터넷 연결이 제한된 폐쇄망(Offline) 환경에 Aura 서비스를 Docker 컨테이너로 배포하는 절차를 설명합니다.

## 사전 준비 사항

### 외부망 (인터넷 가능 PC)

- Docker가 설치되어 있어야 합니다.
- 소스 코드 및 `scripts/offline/save_images.sh` 스크립트 실행이 가능해야 합니다.

### 내부망 (운영 서버)

- Docker 및 Docker Compose가 설치되어 있어야 합니다.
- `aura-offline.tar`, `docker-compose.yml`, `.env` 파일을 전송받을 수 있어야 합니다.

## 배포 파일 구성

- **Dockerfile**: Next.js 애플리케이션을 Standalone 모드로 빌드하기 위한 정의 파일입니다.
- **docker-compose.yml**: 컨테이너 실행 및 포트 매핑, 환경 변수 주입을 관리합니다.
- **scripts/offline/save_images.sh**: 도커 이미지를 빌드하고 `.tar` 파일로 추출하는 스크립트입니다.
- **scripts/offline/load_images.sh**: 추출된 `.tar` 파일에서 이미지를 로드하고 서비스를 실행하는 스크립트입니다.

## 배포 절차

### 1단계: 이미지 빌드 및 추출 (외부망)

인터넷이 연결된 환경에서 다음 스크립트를 실행하여 도커 이미지를 생성하고 파일로 저장합니다.

#### Linux/Mac (Bash)

```bash
# 프로젝트 루트에서 실행
./scripts/offline/save_images.sh
```

#### Windows (PowerShell)

```powershell
# 프로젝트 루트에서 실행
.\scripts\offline\save_images.ps1
```

실행이 완료되면 프로젝트 루트에 `aura-offline.tar` 파일이 생성됩니다.

### 2단계: 파일 이관

다음 파일들을 오프라인 서버의 배포 디렉토리로 복사합니다.

1. `aura-offline.tar` (생성된 이미지 파일)
2. `docker-compose.yml`
3. `.env` (운영 환경에 맞는 설정으로 수정 필요)
4. `scripts/offline/load_images.sh`

### 3단계: 이미지 로드 및 서비스 실행 (내부망)

오프라인 서버에서 다음 명령어를 실행하여 서비스를 시작합니다.

#### Linux/Mac (Bash)

```bash
# 실행 권한 부여 (필요 시)
chmod +x load_images.sh

# 이미지 로드 및 컨테이너 실행
./load_images.sh
```

#### Windows (PowerShell)

```powershell
# 이미지 로드 및 컨테이너 실행
.\load_images.ps1
```

스크립트는 자동으로 이미지를 로드하고 `docker-compose up`을 실행합니다.

## 문제 해결

- **권한 오류**: 스크립트 실행 시 `Permission denied`가 발생하면 `chmod +x <script_name>`으로 권한을 부여하세요.
- **환경 변수**: `.env` 파일이 없으면 서비스가 정상적으로 동작하지 않을 수 있습니다. `DATABASE_URL`, `AUTH_SECRET` 등 필수 변수를 확인하세요.
