# RE:DAY 환경 설정

이 문서는 현재 Java/Spring Boot 백엔드와 Vite 프런트엔드에서 읽는 설정을 정리합니다. 과거 Firebase, Copilot, HRDKorea MCP 변수는 현재 실행 경로에서 사용하지 않습니다.

## 백엔드

`backend/src/main/resources/application.yml`이 기본값을 정의합니다. Spring 환경변수 우선이며, 백엔드 실행 시 `backend/.env`를 먼저 읽고 저장소 루트의 `.env`를 다음으로 읽습니다. 이미 설정된 프로세스 환경변수는 덮어쓰지 않습니다.

| 변수 | 기본값 | 사용처 |
|---|---|---|
| `PORT` | `4000` | HTTP 서버 포트 |
| `CORS_ORIGIN` | `http://localhost:3000` | 브라우저 요청 허용 origin |
| `GEMINI_API_KEY` | 없음 | Gemini API 인증. AI 상황 분석을 쓸 때 필수 |
| `GEMINI_MODEL` | `gemini-flash-latest` | Gemini 생성 모델 |
| `REDAY_AGENT_DOCS_DIR` | `../docs/dev/agent` | 메인 지침과 Skill Markdown 위치(backend 디렉터리 기준) |

`GEMINI_API_KEY`와 `GEMINI_MODEL`은 기존 환경과의 호환을 위해 소문자 `gemini_api_key`, `gemini_model`도 fallback으로 읽습니다.

로컬에서는 `backend/.env.example`을 참고해 `backend/.env`를 만들고 키를 채우거나, 환경변수로 직접 전달합니다. 실제 키는 커밋하지 마세요.

## 프런트엔드

| 변수 | 기본값 | 사용처 |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:4000` | `frontend/src/lib/api.ts`의 API base URL |

Vite 개발 서버는 `frontend/vite.config.ts`에서 `3000` 포트를 사용합니다. 포트를 바꾸면 `CORS_ORIGIN`도 함께 맞춰야 합니다.

## 현재 미사용인 과거 설정

이전 Firebase/Copilot/MCP 구성용으로 남은 키는 현재 Java 런타임에서 읽지 않습니다.

```text
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
FIRESTORE_EMULATOR_HOST
COPILOT_MCP_URL
HRDKOREA_MCP_URL
HRDKOREA_MCP_API_KEY
HRDKOREA_MCP_ALLOWED_TOOLS
```
