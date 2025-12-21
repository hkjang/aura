# 임베딩 및 벡터 DB 설정 가이드

이 가이드에서는 Aura 포털의 임베딩 프로바이더 및 벡터 데이터베이스 설정 방법을 설명합니다.

---

## 개요

노트북 기능에서 문서를 검색 가능하게 만들려면 **임베딩**과 **벡터 DB** 설정이 필요합니다:

| 구성 요소   | 역할                                    |
| ----------- | --------------------------------------- |
| **임베딩**  | 텍스트를 수치 벡터로 변환               |
| **벡터 DB** | 변환된 벡터를 저장하고 유사도 검색 수행 |

---

## 1. 임베딩 설정

### 접속 경로

`설정` > `임베딩` 탭

### 지원 프로바이더

| 프로바이더      | 모델 예시               | 특징                 |
| --------------- | ----------------------- | -------------------- |
| **Upstage**     | solar-embedding-1-large | 한국어 특화, 고품질  |
| **OpenAI**      | text-embedding-3-small  | 비용 효율적, 안정적  |
| **Ollama**      | nomic-embed-text        | 로컬 무료, 설치 필요 |
| **HuggingFace** | BAAI/bge-m3             | 오픈소스             |

### 설정 항목

```
프로바이더:    [Upstage Solar ▼]
모델:         [solar-embedding-1-large ▼]
Base URL:     (Ollama용: http://localhost:11434)
API 키:       up_**** 또는 sk-****
```

### 권장 설정

**한국어 문서가 많은 경우:**

- 프로바이더: Upstage
- 모델: solar-embedding-1-large

**비용 최적화:**

- 프로바이더: OpenAI
- 모델: text-embedding-3-small

**오프라인/로컬:**

- 프로바이더: Ollama
- 모델: nomic-embed-text
- Base URL: http://localhost:11434

---

## 2. 벡터 DB 설정

### 접속 경로

`설정` > `벡터 DB` 탭

### 지원 벡터 DB

| DB           | 기본 포트 | 특징                |
| ------------ | --------- | ------------------- |
| **SQLite**   | -         | 기본값, 설치 불필요 |
| **Milvus**   | 19530     | 오픈소스, 고성능    |
| **ChromaDB** | 8000      | 간편한 설정         |
| **Weaviate** | 8080      | 시맨틱 검색         |
| **Pinecone** | -         | 클라우드 관리형     |
| **Qdrant**   | 6333      | 러스트 기반 고성능  |

### 설정 항목

```
호스트:       localhost
포트:         19530 (Milvus 기준)
컬렉션명:     aura_vectors
API 키:       (필요 시)
```

### 환경별 권장 설정

**개발/테스트:**

- SQLite (기본값) - 별도 설치 없이 사용

**프로덕션 (소규모):**

- ChromaDB - Docker로 간편 배포

**프로덕션 (대규모):**

- Milvus 또는 Qdrant - 고성능 벡터 검색

---

## 3. 설정 저장 위치

모든 설정은 **데이터베이스**에 저장됩니다:

```
테이블: SystemConfig
저장 형식: key-value
위치: prisma/dev.db (SQLite)
```

### 저장되는 키

| 키                    | 설명                   |
| --------------------- | ---------------------- |
| `EMBEDDING_PROVIDER`  | 임베딩 프로바이더 ID   |
| `EMBEDDING_MODEL`     | 임베딩 모델 ID         |
| `EMBEDDING_API_KEY`   | 임베딩 API 키 (마스킹) |
| `EMBEDDING_BASE_URL`  | 커스텀 베이스 URL      |
| `VECTORDB_PROVIDER`   | 벡터 DB 프로바이더 ID  |
| `VECTORDB_HOST`       | 벡터 DB 호스트         |
| `VECTORDB_PORT`       | 벡터 DB 포트           |
| `VECTORDB_COLLECTION` | 컬렉션/인덱스 이름     |
| `VECTORDB_API_KEY`    | 벡터 DB API 키         |

---

## 4. Docker로 벡터 DB 실행

### Milvus

```bash
docker run -d --name milvus \
  -p 19530:19530 \
  -p 9091:9091 \
  milvusdb/milvus:latest standalone
```

### ChromaDB

```bash
docker run -d --name chromadb \
  -p 8000:8000 \
  chromadb/chroma:latest
```

### Qdrant

```bash
docker run -d --name qdrant \
  -p 6333:6333 \
  qdrant/qdrant:latest
```

### Weaviate

```bash
docker run -d --name weaviate \
  -p 8080:8080 \
  semitechnologies/weaviate:latest
```

---

## 5. 문제 해결

### 임베딩 실패

1. API 키가 올바른지 확인
2. 프로바이더 서비스 상태 확인
3. Ollama의 경우 서비스 실행 여부 확인: `ollama serve`

### 벡터 DB 연결 실패

1. 호스트/포트 설정 확인
2. Docker 컨테이너 실행 상태 확인: `docker ps`
3. 방화벽 설정 확인

### 설정 변경 후 반영 안됨

- 새 데이터부터 새 설정이 적용됩니다
- 기존 데이터는 이전 설정으로 처리된 상태 유지

---

## 관련 문서

- [노트북 사용 가이드](./notebook_guide.ko.md)
- [시스템 설정 가이드](./system_settings_guide.ko.md)
- [관리자 가이드](./admin_guide.ko.md)
