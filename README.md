# RE:DAY

RE:DAY는 사용자가 관심 있는 직무의 하루를 상황별로 체험하고, 자신의 대응을 근거 중심으로 돌아보는 웹 서비스입니다. 사용자는 직무와 상황에 응답하고, 백엔드는 Gemini를 통해 행동 분석과 인물 반응을 생성합니다.

## 현재 구성

```text
React + TypeScript (Vite, :3000)
       │ REST / JSON
       ▼
Spring Boot + Java 21 (:4000)
  ├─ 인증·직무·체험 API
  ├─ H2 인메모리 데이터베이스
  └─ Gemini API (상황 응답 분석)
```

| 경로 | 내용 |
|---|---|
| `frontend/src/routes/` | 랜딩, 로그인, 홈, 직무 선택, 시뮬레이션, 회고, 기록 화면 |
| `frontend/src/lib/api.ts` | 백엔드 API 호출, Bearer 토큰 주입, 오류 변환 |
| `frontend/src/lib/types.ts` | 프런트엔드 응답·요청 데이터 형식 |
| `backend/src/main/java/com/reday/auth/` | 가입, 개발용 이메일 인증, 로그인, 사용자 인증 |
| `backend/src/main/java/com/reday/jobs/` | 직무·variant 조회 및 시작 시 샘플 데이터 적재 |
| `backend/src/main/java/com/reday/sessions/` | 세션 진행, 응답 저장, 분기 재시도, 회고·기록 조회 |
| `backend/src/main/java/com/reday/ai/` | Agent 프롬프트 로드, Gemini 호출, 분석 결과 파싱 |
| `docs/dev/agent/` | 추출된 Agent 지침과 Skill 프롬프트. 실행 시 백엔드가 읽음 |
| `docs/` | 시스템 구조, 프런트엔드-백엔드 계약, 환경·개발 프로세스 문서 |

상세 아키텍처는 [`docs/dev/SAD.md`](docs/dev/SAD.md), 엔드포인트와 현재 구현 차이는 [`docs/frontend-backend-contract.md`](docs/frontend-backend-contract.md)를 참고하세요.

## 로컬 실행

필요 환경: Java 21, Maven, Node.js/npm, Gemini API key(상황 응답 분석용).

백엔드와 프런트엔드를 각각 실행합니다.

```bash
cd backend
# backend/.env에 GEMINI_API_KEY를 설정하거나 셸 환경변수로 제공
mvn spring-boot:run
```

```bash
cd frontend
npm install
npm run dev
```

프런트엔드는 `http://localhost:3000`, API는 `http://localhost:4000`에서 실행됩니다. 프런트엔드 API 주소는 `VITE_API_BASE_URL`로, 백엔드 포트는 `PORT`로 바꿀 수 있습니다. 백엔드 기본 CORS 허용 origin은 `http://localhost:3000`입니다.

백엔드 확인은 `cd backend && mvn test`, 프런트엔드 빌드는 `cd frontend && npm run build`를 사용합니다. 프런트엔드 `package.json`에는 별도 test 스크립트가 없습니다.

## 핵심 요청 흐름

1. 회원가입·로그인 후 백엔드가 발급한 Bearer 토큰을 브라우저 `localStorage`에 둡니다.
2. 직무 카탈로그에서 직무와 variant(상황 묶음)를 고릅니다.
3. 세션 생성 시 해당 variant 상황 수로 `totalSteps`를 정합니다.
4. 프런트엔드가 초안을 debounce 저장하고, 제출 시 `stateVersion`과 단계 번호를 보냅니다.
5. 백엔드가 현재 소유자와 버전을 확인한 뒤 Gemini 분석을 요청하고, 응답과 결과를 단계 기록으로 저장합니다.
6. 모든 단계가 끝나면 요약·회고를 저장하고 기록 화면에서 완료한 체험을 조회합니다.

## 현재 동작의 범위

- 데이터베이스 URL은 H2 인메모리(`jdbc:h2:mem:reday`)입니다. 서버 재시작 시 사용자, 토큰, 세션, 기록이 초기화됩니다.
- 직무와 상황은 `JobSeedData`의 로컬 fixture입니다. 외부 직무 데이터나 MCP 호출은 현재 실행 경로에 없습니다.
- 이메일 인증 메일은 발송하지 않습니다. 가입 API가 개발용 토큰을 반환하며, 현재 화면은 그 토큰으로 바로 인증합니다.
- 세션 응답 분석은 `GEMINI_API_KEY`가 필요합니다. 프롬프트는 `docs/dev/agent/`에서 읽고, 현재 `responseanalyzer`와 `consequencesimulator` Skill을 사용합니다.
- 회고의 강점·다음 시도·행동 업적은 현재 저장된 단계 결과를 규칙으로 묶어 생성합니다. 별도 Gemini 회고 생성은 하지 않습니다.

## 문서 읽는 순서

1. 이 README에서 실행 방법과 현재 범위를 확인합니다.
2. [`docs/dev/SAD.md`](docs/dev/SAD.md)에서 컴포넌트, 데이터 모델, 요청 흐름을 봅니다.
3. [`docs/frontend-backend-contract.md`](docs/frontend-backend-contract.md)에서 API 계약과 계획 대비 구현 차이를 확인합니다.
4. 코드 수정 전 [`AGENTS.md`](AGENTS.md)와 [`docs/dev/README.md`](docs/dev/README.md)의 작업·문서 파이프라인 규칙을 따릅니다.

> `docs/dev/agent/`의 Copilot 추출 문서는 프롬프트 내용의 출처입니다. README 및 일부 과거 문서는 예전 Node/Next.js/Firebase 아키텍처를 설명하므로, 실행 구조를 파악할 때는 이 문서와 현재 Java·React 소스를 기준으로 하세요.
