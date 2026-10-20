# RE:DAY 서비스 아키텍처 및 Agent 설정 추출

> 대상 저장소: [options0179/RE-DAY](https://github.com/options0179/RE-DAY)  
> 기준 브랜치: `main`  
> 기준 트리: `0b6fcda2fb985111b2f6ec9ddb91cae504d5d7d1`  
> 조사일: 2026-10-19
>
> **현재 상태 주의:** 아래 본문은 Copilot Studio 추출 당시의 기준 아키텍처다. 현재 Gemini 전환 결과와 코드 변경은 [`docs/agent/gemini-migration-decision.md`](docs/agent/gemini-migration-decision.md)와 [`docs/agent/implementation-gaps.md`](docs/agent/implementation-gaps.md)에 반영되어 있다.
>
> **문서 전용 브랜치 주의:** `feat/ai-agent`에서는 실행 코드와 배포 설정을 제거했다. 아래의 runtime 경로는 삭제 전 구조를 설명하는 역사적 기록이며, 현재 보존 대상은 문서와 [`docs/database-summary.md`](docs/database-summary.md)뿐이다.

## 현재 Gemini 전환 델타

- `/copilot`은 Copilot Studio iframe이 아니라 Gemini Agent 대화 화면을 렌더링한다.
- `/ai/chat`은 추출된 메인 안내와 9개 Skill prompt를 서버에서 로드해 Gemini에 전달한다.
- `/simulations/:sessionId/scenes`는 클라이언트의 분석 결과를 받지 않고 서버에서 Gemini 분석·결과를 생성해 저장한다.
- MCP는 `backend/src/mcp/http-client.ts`의 HTTP JSON-RPC adapter와 `HRDKOREA_MCP_ALLOWED_TOOLS` allowlist를 사용한다.

## 1. 결론 요약

RE:DAY는 사용자가 관심 직무의 하루를 선택하고, 장면별로 직접 대응한 뒤, 행동 근거와 결과를 회고하는 커리어 시뮬레이션 서비스다.

현재 저장소에서 확인되는 런타임 구조는 다음과 같다.

```text
사용자 브라우저
  ├─ Next.js 정적 프론트엔드 → GitHub Pages
  │    ├─ 온보딩 / 직무 선택 / 시뮬레이션 / 회고 / 히스토리
  │    └─ Copilot Studio Web Chat iframe
  │
  └─ REST API → Express TypeScript 백엔드
       ├─ 인증·권한 경계
       ├─ 직무·시뮬레이션·회고 도메인
       ├─ 채팅 세션·메시지·메모리 저장
       ├─ MCP Gateway 클래스(명시적 Tool 계약)
       └─ Firebase Admin SDK → Firestore

외부 Agent
  └─ Microsoft Copilot Studio의 RE:DAY Agent
       ├─ 대화 흐름과 Skill 오케스트레이션
       ├─ 시작 시 백엔드 세션/컨텍스트 조회
       └─ 완료 시 메시지/요약/메모리 후보 저장
```

중요한 사실은 두 가지다.

1. 저장소는 **하나의 Orchestrator Agent**를 전제로 한다. Multi-Agent Team은 향후 확장 대상으로만 언급된다.
2. 실제 Copilot Studio의 **메인 시스템 프롬프트 원문과 Skill 정의 원문은 Git 저장소에 포함되어 있지 않다.** 저장소에는 그 Agent가 따라야 할 행동 계약과 백엔드 API가 있을 뿐이다.

2026-10-19에 인증된 Copilot Studio 편집 화면을 읽기 전용으로 확인했다. 외부 Agent 원문은 [`docs/agent/`](docs/agent/)에 별도로 추출했다. 이 폴더에는 메인 안내의 두 연속 버전, 실제 설정된 Skill 9개, HTTP 도구, HRDKorea-MCP의 45개 활성 capability가 보존되어 있다.

## 2. Agent 원문 설정의 존재 여부

### 2.1 저장소에서 직접 확인된 Agent 관련 사실

| 항목 | 확인 결과 | 근거 |
|---|---|---|
| Agent 수 | MVP에서는 Orchestrator Agent 1개 | [`README.md`](https://github.com/options0179/RE-DAY/blob/main/README.md) |
| Agent 역할 | 대화 흐름 및 Skill 오케스트레이션 | [`README.md`](https://github.com/options0179/RE-DAY/blob/main/README.md) |
| Agent가 호출할 경계 | MCP Gateway의 명시적 Tool 계약 | [`backend/src/mcp/gateway.ts`](https://github.com/options0179/RE-DAY/blob/main/backend/src/mcp/gateway.ts) |
| 외부 Agent UI | Copilot Studio Web Chat iframe | [`frontend/app/copilot/page.tsx`](https://github.com/options0179/RE-DAY/blob/main/frontend/app/copilot/page.tsx) |
| Agent 환경 | `Default-a5a060c4-00b2-4343-b6c9-23625439a0c0` | [`frontend/app/copilot/page.tsx`](https://github.com/options0179/RE-DAY/blob/main/frontend/app/copilot/page.tsx) |
| Agent 식별자 | `cr9fa_reday_4T-Zrr` | [`frontend/app/copilot/page.tsx`](https://github.com/options0179/RE-DAY/blob/main/frontend/app/copilot/page.tsx) |
| 별도 `SKILL.md` | 없음 | `main` 전체 파일 트리 조사 결과 |
| 프롬프트 파일 | 없음 | `prompt`, `system`, `agent` 이름의 tracked 파일 없음 |
| Copilot Studio 설정 원문 | Git에는 없음; 외부 편집 화면에서 별도 추출 완료 | [`docs/agent/`](docs/agent/) |

Copilot Studio 설정 페이지는 저장소 외부 리소스다. 인증된 Agent 편집 화면에서 읽은 원문은 [`docs/agent/main-instructions.md`](docs/agent/main-instructions.md)와 [`docs/agent/skills/`](docs/agent/skills/)에 보존했다. 저장소에서 확인되는 운영 계약과 외부 화면의 설정은 [`docs/agent/implementation-gaps.md`](docs/agent/implementation-gaps.md)에서 비교한다.

## 3. Agent 메인 프롬프트 추출 결과

### 3.1 원문 상태

다음 내용은 저장소 Git 트리에는 **문자 그대로 존재하지 않는다**.

```text
Copilot Studio Agent의 system prompt / instructions 전문
각 Skill의 Copilot Studio 내부 정의 전문
Topic, trigger phrase, orchestration 설정 전문

외부 편집 화면에서 확인한 현재 원문은 별도 추출 문서에 있다. 이 파일의 아래 복원 계약은 코드·Git 문서 기준의 아키텍처 설명이며, 외부 원문을 대체하지 않는다.
```

### 3.2 저장소로부터 복원 가능한 행동 계약

다음은 README, Copilot Studio 연동 문서, 백엔드 API 및 데이터 모델을 종합한 Agent 계약이다.

```text
당신은 RE:DAY의 단일 Orchestrator Agent다.

목적:
- 사용자가 관심 직무의 하루를 안전하게 경험하도록 돕는다.
- 정답이나 취업 가능성을 판정하지 않는다.
- 여러 직무를 탐색하고, 사용자의 판단과 소통 방식을 행동 근거로 돌아보게 한다.

오케스트레이션:
- 대화 흐름과 Skill 호출 순서를 관리한다.
- MVP에서는 Multi-Agent Team을 만들지 않고 하나의 Orchestrator로 처리한다.
- 직무 데이터와 현실 조건은 명시적 Gateway/API 계약을 통해서만 사용한다.
- 공공·외부 직무 데이터는 시나리오 원문이 아니라 직무 사실과 현실 조건의 근거로 사용한다.

시작 흐름:
1. 대화마다 안정적인 conversationId를 생성하거나 재사용한다.
2. POST /chat/sessions로 세션을 생성하거나 기존 세션을 재사용한다.
3. GET /chat/sessions/{conversationId}/context로 확인된 memory와 대화 context를 조회한다.
4. 세션 또는 context 저장/조회가 실패하면 해당 하루를 시작했다고 말하지 않는다.
5. 내부 ID와 API secret은 사용자에게 노출하지 않는다.

시뮬레이션 흐름:
1. 사용자의 관심사에서 직무 후보를 찾는다.
2. 직무와 variant를 선택한다.
3. 직무에 근거한 incident, 상황 정보, 시간 압박을 제시한다.
4. 사용자의 자유 텍스트 응답을 받는다.
5. 응답을 행동 태그, 즉시 효과, 지연 효과, 관계 변화, 업무 변화, 근거로 분석한다.
6. 캐릭터 반응, 소요 시간, 이월 이슈, 슬롯 완료 여부를 consequence로 만든다.
7. 저장되는 scene은 immutable하고, 상태 버전을 증가시킨다.

완료 흐름:
1. 하루의 최종 요약을 생성한다.
2. POST /chat/sessions/{conversationId}/messages로 최종 Agent 메시지를 저장한다.
3. PUT /chat/sessions/{conversationId}/summary로 구조화된 요약을 저장한다.
4. 사용자가 명시적으로 확인할 수 있는 장기 사실만 memory candidate로 만든다.
5. memory는 항상 pending_confirmation으로 저장한다.
6. 사용자가 확인하기 전에는 memory를 confirmed로 표시하지 않는다.
7. 저장 요청 중 하나라도 실패하면 저장 실패를 사용자에게 알리고 완료했다고 말하지 않는다.
```

### 3.3 반드시 지켜야 하는 실패·보안 규칙

- Copilot action의 `x-api-key`는 secret으로만 구성한다. OpenAPI 문서, 소스, 채팅 응답에 값을 넣지 않는다.
- `x-user-id`는 Firebase Auth UID가 연결되기 전까지의 임시 안정 사용자 식별자다.
- 운영 환경은 Firebase Auth Bearer token 또는 유효한 `x-api-key`가 있어야 통과한다.
- 세션 소유자가 인증 사용자와 다르면 접근을 거부한다.
- 채팅 메시지는 `messageId`를 Firestore 문서 ID로 사용해 중복 요청을 멱등 처리한다.
- 메모리는 `pending_confirmation → confirmed/rejected` 상태 전이를 거친다.
- 저장 실패는 blocking error다. 실패 후 시뮬레이션 시작/완료를 성공으로 표현하지 않는다.

## 4. Skill 추출 결과

저장소에 독립 Skill 파일은 없으므로, 아래는 코드와 문서에서 확인되는 Agent capability를 Skill 단위로 정리한 것이다.

### Skill A — Conversation Session & Memory

역할:

- Copilot 대화와 RE:DAY 시뮬레이션을 연결한다.
- 세션을 생성/재사용하고 최근 메시지와 confirmed memory를 Agent context로 제공한다.
- 최종 메시지, 요약, 메모리 후보를 Firestore에 저장한다.

API:

| 작업 | API |
|---|---|
| 세션 생성/재사용 | `POST /chat/sessions` |
| context 조회 | `GET /chat/sessions/{conversationId}/context` |
| 메시지 저장 | `POST /chat/sessions/{conversationId}/messages` |
| 메시지 목록 | `GET /chat/sessions/{conversationId}/messages` |
| 요약 저장 | `PUT /chat/sessions/{conversationId}/summary` |
| memory 후보 생성 | `POST /users/me/memories` |
| memory 확인/거부 | `POST /users/me/memories/{memoryId}/{confirm|reject}` |

저장 구조:

```text
users/{userId}/
  chatSessions/{conversationId}
    messages/{messageId}
  memories/{memoryId}
```

### Skill B — Job Discovery & Grounding

역할:

- 온보딩 입력을 사용자 preferences로 저장한다.
- 직무 profile의 tasks, skills, knowledge를 기준으로 후보를 계산한다.
- 외부 직무 데이터를 `JobGrounding` 계약으로 정규화한다.
- 외부 결과는 24시간 캐시한다.

API/구현:

- `POST /users/{requestedUserId}/preferences`
- `GET /jobs`
- `GET /jobs/{jobId}/variants`
- `McpGateway.getJobGrounding(jobId)`
- `JobGroundingService` + `FixtureJobDataProvider`

현재 fixture는 `job-ux` / `UX 디자이너`이며, 사용자 입력과 직무 tasks·skills·knowledge의 문자열 포함 여부를 이용해 단순 점수를 계산한다.

### Skill C — Simulation Session

역할:

- 직무 variant를 선택하고 시뮬레이션 session을 만든다.
- 현재 slot, current scene, elapsed time, difficulty, owner, stateVersion을 관리한다.
- 장면 저장 시 optimistic concurrency를 적용한다.
- checkpoint rollback과 retry branch를 지원할 수 있는 Repository 계약이 있다.

상태:

```text
SimulationState {
  sessionId, ownerId, jobId, variantId, worldTitle,
  status, currentSlotId, currentSceneId,
  elapsedMinutes, difficulty, stateVersion,
  parentSessionId, branchFromSceneId,
  startedAt, updatedAt, completedAt
}
```

구현 위치:

- HTTP API: `backend/src/index.ts`
- Gateway 계약: `backend/src/mcp/gateway.ts`
- 저장소 계약/인메모리 구현: `backend/src/repositories/session-repository.ts`
- Firestore 구현: `backend/src/repositories/firestore-session-repository.ts`

### Skill D — Scene Response Analysis & Consequence

장면은 다음 네 묶음으로 구성된다.

```text
incident
  title, visibleSituation, availableInformation, timePressure

userResponse
  rawText, submittedAt

analysis
  behaviorTags, immediateEffect, delayedEffect,
  relationshipChange, taskChange, evidence

consequence
  characterReaction, timeConsumedMinutes,
  carryOverIssueIds, slotComplete
```

프론트엔드는 현재 `/simulations/{sessionId}/scenes`에 `pending-agent-analysis`와 “Agent 분석 대기” placeholder를 보낸다. 즉, Agent 분석은 설계상 존재하지만 현재 커밋의 frontend가 실제 Copilot 결과를 생성·전달하는 연결은 완성되지 않았다.

### Skill E — Review & Achievement

역할:

- 장면별 `analysis.evidence`를 행동 근거로 보존한다.
- 장면별 achievement를 생성한다.
- behavior summary, 만족도, 한 줄 회고, 재도전 후보 scene을 저장한다.

구현:

- `ReviewService.complete(...)`
- `SimulationSummary`
- `Achievement`
- Firestore: `simulations/{sessionId}/summaries` 및 `achievements`

### Skill F — Copilot Studio Backend Action Bridge

문서상 두 개의 Copilot action이 계획돼 있다.

#### `RE_DAY_StartDay`

1. `POST https://re-day-api.onrender.com/chat/sessions`
2. `GET https://re-day-api.onrender.com/chat/sessions/{conversationId}/context`
3. 결과를 `sessionResult`, `contextResult` 변수로 보관

#### `RE_DAY_CompleteDay`

1. 최종 Agent 메시지 `POST /chat/sessions/{conversationId}/messages`
2. 구조화 요약 `PUT /chat/sessions/{conversationId}/summary`
3. memory 후보 `POST /users/me/memories`

저장소 문서는 HTTP + Swagger 방식을 선호하고, generic HTTP connector가 계약을 404로 불러오지 못했기 때문에 불완전한 Tool을 사용하지 말라고 명시한다. 또한 조사 당시 실제 `RE_DAY_StartDay`/`RE_DAY_CompleteDay` action이 성공적으로 생성됐다고 보고할 수 없는 상태였다.

## 5. 백엔드 서비스 아키텍처

### 5.1 실행 형태

- 언어: TypeScript, ESM, Node.js 22 계열 설정
- 웹 프레임워크: Express 5
- 보안 미들웨어: Helmet, CORS
- 데이터 접근: Firebase Admin SDK / Firestore
- 서버 실행: Render Web Service 또는 Firebase Functions v2 HTTP
- Firebase Function 리전: `asia-northeast3`
- 기본 로컬 포트: `4000`

주요 파일:

```text
backend/src/index.ts       HTTP 라우팅과 middleware
backend/src/firebase.ts    Firebase Admin 초기화
backend/src/function.ts    Firebase Functions v2 export
backend/src/contracts/     도메인/Agent/MCP 데이터 계약
backend/src/mcp/           Gateway Tool 경계
backend/src/repositories/  Firestore 및 in-memory 저장소
backend/src/security/      세션 소유권 검증
backend/src/external/      외부 직무 데이터 정규화와 24시간 캐시
backend/src/services/      회고/업적 도메인 서비스
```

### 5.2 요청 인증 흐름

```text
요청
  ├─ production이 아니면 통과
  └─ production이면
       ├─ Authorization: Bearer <Firebase ID token>
       │    └─ Firebase Auth verifyIdToken → x-authenticated-user-id
       └─ Bearer가 없으면
            └─ x-api-key == COPILOT_API_KEY일 때 통과
```

그 뒤 `userId(request)`는 다음 우선순위를 사용한다.

1. `x-authenticated-user-id`
2. `x-user-id`
3. 개발용 `anonymous-development-user`

### 5.3 HTTP API 목록

| Method | Path | 기능 |
|---|---|---|
| `GET` | `/health` | 백엔드 liveness |
| `GET` | `/health/firebase` | Firestore 연결 확인 |
| `POST` | `/chat/sessions` | 채팅 세션 생성/재사용 |
| `GET` | `/chat/sessions/:conversationId/context` | 세션·confirmed memories·메시지 context |
| `POST` | `/chat/sessions/:conversationId/messages` | 메시지 추가, messageId 멱등 |
| `GET` | `/chat/sessions/:conversationId/messages` | 최근 메시지 조회 |
| `PUT` | `/chat/sessions/:conversationId/summary` | 대화 요약 저장 |
| `POST` | `/users/me/memories` | pending memory 생성 |
| `POST` | `/users/me/memories/:memoryId/:action` | confirm/reject |
| `GET` | `/jobs` | 직무 profile 목록 |
| `GET` | `/jobs/:jobId/variants` | 직무 variant 목록 |
| `POST` | `/users/:requestedUserId/preferences` | preferences 저장 및 후보 계산 |
| `POST` | `/simulations` | 시뮬레이션 생성 |
| `GET` | `/simulations/:sessionId` | 시뮬레이션·variant·최신 scene·summary |
| `POST` | `/simulations/:sessionId/scenes` | 응답 장면 저장 및 stateVersion 증가 |
| `POST` | `/simulations/:sessionId/summary` | 시뮬레이션 요약/업적 저장 |
| `GET` | `/history` | 사용자 시뮬레이션 목록 |

### 5.4 상태 버전 및 복구

- `saveScene`은 `expectedStateVersion`을 요구한다.
- 현재 값과 예상 값이 다르면 `CONFLICT`를 발생시킨다.
- 장면은 먼저 immutable 문서로 저장되고, session 상태는 다음 버전으로 증가한다.
- Firestore 구현은 이 과정을 transaction으로 처리한다.
- checkpoint는 상태 버전이 일치할 때만 생성된다.
- rollback은 장면을 삭제하지 않고 current scene/slot을 checkpoint로 되돌린 뒤 상태 버전을 증가시킨다.
- branch는 원본 session을 보존하고 `parentSessionId`, `branchFromSceneId`를 가진 새 session을 만든다.

## 6. Firestore 데이터 모델

```text
users/{userId}
  preferences/current
  jobMatches/{matchId}
  chatSessions/{conversationId}
    messages/{messageId}
  memories/{memoryId}

jobProfiles/{jobId}
  variants/{variantId}

simulations/{sessionId}
  scenes/{sceneId}
  checkpoints/{checkpointId}
  summaries/{summaryId}
  achievements/{achievementId}
```

주요 도메인 계약:

- `JobProfile`: 직무명, Work24/NCS 코드, tasks, knowledge, skills, attitudes, tools, sourceRefs, cache 정보
- `JobMatch`: 입력 snapshot, 후보 점수, 이유, matching logic version, source refs
- `ChatSession`: conversationId, userId, channel, simulation 연결, summary, message count, 상태
- `ChatMessage`: messageId, role, content, sequence, source
- `UserMemory`: type, key/value, confidence, source, confirmation status
- `SimulationState`: 소유자, 직무, 진행 위치, 상태 버전, 부모/분기 정보
- `Scene`: incident, 사용자 응답, Agent 분석, consequence, source refs, prompt version
- `SimulationSummary`: 행동 요약, 만족도, 사용자 회고, achievement IDs, retry 후보

## 7. 프론트엔드 아키텍처

- Next.js 15 App Router
- React 18
- `output: "export"`로 정적 산출물 생성
- GitHub Pages용 `basePath` 기본값: `/RE-DAY`
- 이미지 최적화 비활성화
- API 기본값: `http://localhost:4000`
- 사용자 식별자: Firebase Auth가 아니라 브라우저 `localStorage`의 `reday-user-id`

라우트:

| Route | 역할 |
|---|---|
| `/` | 서비스 소개 및 직무 상황 예시 |
| `/onboarding` | 관심 활동 입력 |
| `/jobs` | Firestore 직무 profile 조회 및 하루 시작 |
| `/simulation/[sessionId]` | incident 표시 및 응답 저장 |
| `/review/[sessionId]` | 저장된 scene 분석/결과 표시 |
| `/history` | 사용자 시뮬레이션 이력 |
| `/copilot` | Copilot Studio Web Chat iframe |

프론트엔드 API 호출은 `frontend/lib/api.ts`에서 공통 처리한다.

- `content-type: application/json`
- `x-user-id: currentUserId()`
- HTTP 오류면 JSON `error`를 예외로 변환

## 8. 배포 및 로컬 실행

### 프론트엔드

- GitHub Actions에서 `npm ci` 후 `npm run build`
- `frontend/out`을 GitHub Pages로 업로드
- [`frontend/next.config.mjs`](https://github.com/options0179/RE-DAY/blob/main/frontend/next.config.mjs)의 static export 사용

### 백엔드

- Render: [`render.yaml`](https://github.com/options0179/RE-DAY/blob/main/render.yaml)
- Render health check: `/health`
- Firebase Functions: [`backend/src/function.ts`](https://github.com/options0179/RE-DAY/blob/main/backend/src/function.ts)
- Firebase emulator: [`docker-compose.yml`](https://github.com/options0179/RE-DAY/blob/main/docker-compose.yml)

### 로컬 명령

```powershell
Set-Location .\backend
npm install
npm run build
npm test

Set-Location .\frontend
npm install
npm run build
npm run dev
```

또는 저장소 루트에서 `run-dev.sh`로 backend/frontend 개발 서버를 함께 실행한다.

## 9. 보안 및 운영상 확인 사항

### 현재 안전장치

- Helmet 사용
- 운영 환경의 Firebase Bearer/API key 인증
- session owner 검사
- Firestore transaction을 이용한 상태/장면 원자성
- Firestore 및 Storage rules의 기본값이 전부 deny
- `.env`, service account 파일, Firebase 로컬 데이터가 `.gitignore`에 포함
- `COPILOT_API_KEY`는 Render secret 생성 대상으로 선언

### 현재 코드에서 확인되는 위험 또는 미완성 연결

1. `firestore.rules`와 `storage.rules`가 전부 `allow ... if false`이므로, Firebase 클라이언트 직접 접근은 허용되지 않는다. 백엔드 Admin SDK 경로만 사용하는 배포 전제인지 확인이 필요하다.
2. frontend는 `x-user-id`를 localStorage에서 생성한다. Firebase Auth 연결 전 개발용 식별자이며, 운영 사용자 인증으로 간주하면 안 된다.
3. README가 언급하는 `docs/architecture.md`, `docs/evaluation.md`는 현재 `main` 파일 트리에서 확인되지 않는다.
4. GitHub Pages workflow가 [`deploy.yml`](https://github.com/options0179/RE-DAY/blob/main/.github/workflows/deploy.yml)과 [`nextjs.yml`](https://github.com/options0179/RE-DAY/blob/main/.github/workflows/nextjs.yml)로 중복된다. Node 18/20, Pages action v4/v5, trigger branch가 서로 다르다.
5. backend dependency에는 MCP SDK가 있지만 현재 `McpGateway`는 SDK transport/server를 열지 않고 TypeScript 클래스 계약으로만 존재한다.
6. Copilot Studio action은 문서상 계획/매핑 상태이며, 저장소만으로 실제 action이 배포·연결됐다고 확인할 수 없다.
7. `/simulations/:sessionId/scenes`의 현재 frontend payload는 실제 Agent 분석이 아니라 placeholder를 저장한다.
8. `/simulations/:sessionId/summary`와 review 경로는 설계상 존재하지만, Copilot 완료 flow와의 실제 end-to-end 연결은 저장소 코드에서 확인되지 않는다.
9. `POST /users/:requestedUserId/preferences`는 요청 경로의 user ID와 인증 주체가 같은지 별도 검사하지 않는다. 운영 인증 연결 시 IDOR 방어를 추가 검토해야 한다.
10. `POST /chat/sessions/:conversationId/messages`는 동일 `messageId`를 재사용하면 기존 메시지를 반환하지만, 동일 ID와 다른 payload를 보낸 경우 payload 불일치 검증은 없다.

## 10. 코드/문서 인벤토리

### 루트·배포

- `README.md`
- `docker-compose.yml`
- `firebase.json`
- `firestore.indexes.json`
- `firestore.rules`
- `storage.rules`
- `render.yaml`
- `run-dev.sh`
- `setup-ubuntu.sh`
- `.github/workflows/deploy.yml`
- `.github/workflows/nextjs.yml`

### 백엔드

- `backend/src/index.ts`
- `backend/src/function.ts`
- `backend/src/firebase.ts`
- `backend/src/contracts/*`
- `backend/src/mcp/gateway.ts`
- `backend/src/repositories/*`
- `backend/src/security/*`
- `backend/src/external/*`
- `backend/src/services/*`
- `backend/src/errors/*`

### 프론트엔드

- `frontend/app/page.tsx`
- `frontend/app/onboarding/page.tsx`
- `frontend/app/jobs/page.tsx`
- `frontend/app/simulation/[sessionId]/*`
- `frontend/app/review/[sessionId]/*`
- `frontend/app/history/page.tsx`
- `frontend/app/copilot/page.tsx`
- `frontend/lib/api.ts`
- `frontend/next.config.mjs`

## 11. 최종 판정

이 저장소에서 “포함된 Agent”는 소스 내부에 프롬프트 파일로 들어 있는 Agent가 아니라, Copilot Studio 외부에 존재하고 frontend가 iframe으로 연결하는 Agent다.

따라서 현재 저장소만으로 정확히 추출 가능한 범위는 다음까지다.

- Agent의 역할과 MVP 오케스트레이션 방향
- Agent가 호출해야 하는 REST API와 실패 규칙
- MCP Gateway의 명시적 데이터 경계
- 직무 선택 → 시뮬레이션 → 장면 분석 → 회고의 데이터 계약
- 채팅 memory의 confirmation 정책
- 외부 Copilot Studio 연결 계획

반대로 다음은 저장소에 없으므로 원문 추출이 불가능하다.

- Copilot Studio의 실제 system prompt 전문
- Copilot Studio 내부 Skill/Topic 정의 전문
- trigger phrase 및 orchestration 설정
- 실제로 생성된 `RE_DAY_StartDay`/`RE_DAY_CompleteDay` action의 export

정확한 원문까지 보존하려면 Copilot Studio에서 해당 Agent의 instructions, topics/actions, knowledge sources, variables, connection references를 export하거나 설정 화면을 별도로 제공해야 한다.
