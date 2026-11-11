# RE:DAY 프론트엔드 ↔ 백엔드 계약 (완전 재설계)

> 이 문서는 과거 구현(`docs/dev/database-summary.md`, `docs/dev/SAD.md`에 기록된 Copilot Studio 시대 설계)을 승계하지 않고, 2026-10-26 Figma 와이어프레임(`jMF6hjDz1fidi66pkx9ZIP`)을 기준으로 완전히 새로 설계한 계약이다. 이름·컬렉션 구조·엔드포인트가 과거 문서와 다른 것은 의도된 것이다.

## 0. 설계 원칙

- **화면이 먼저, API는 화면이 요구하는 만큼만.** 9개 와이어프레임 화면 + 이번에 해결한 플로우 문제(가변 진행 단계, 생성 중/재시도/충돌, 체크포인트 되돌리기, 이어하기 분기)를 만족하는 API만 정의한다.
- **범용 AI 비서 대화(과거 `chatSessions`/`memories`)는 가져오지 않는다.** 이 서비스엔 범용 챗봇이 없고, 시뮬레이션 안에서만 캐릭터와 대화한다. 대화 기록은 `ExperienceStep`에 귀속된다.
- **진행 단계 수(N)는 상수가 아니라 세션 생성 시점에 확정되는 값이다.** 직업/variant/세션마다 다르다.
- **결과(07)는 별도 화면이 아니라 같은 턴의 응답이다.** `POST /sessions/:id/steps` 한 번의 호출이 분석과 결과를 함께 반환한다.
- **모든 쓰기는 낙관적 동시성(`stateVersion`)을 검사한다.** 충돌은 `409`로 명시하고, 프론트는 반드시 충돌 UI(Figma `06b` 패턴 5)로 처리한다.

## 1. 화면 인벤토리 (재설계 반영)

| 라우트 | 화면 | 비고 |
|---|---|---|
| `/` | 랜딩 | |
| `/signup`, `/login` | 회원가입(이메일 인증) / 로그인 | 약관 동의 포함 |
| `/home` | 홈 | 진행 중 세션 있으면 "이어하기/새로 시작" 모달(Figma `06b`-7) |
| `/jobs` | 직업 선택 | 자유 입력 + 추천 칩 |
| `/simulation/[sessionId]` | 하루 시작 → 상황 대응 → 결과(인라인) → 회고 전환까지 전부 | 단일 상태기계, 라우트 분리 안 함 |
| `/review/[sessionId]` | 하루 회고 (타임라인 요약, 업적, 한 줄 회고) | |
| `/history` | 체험 기록 (전체/직업별/최근순 필터) | |

`/simulation/[sessionId]`의 내부 phase: `briefing → situation(i) → generating → outcome(i) → situation(i+1) | review`. 실패/충돌은 phase가 아니라 situation/outcome 위에 얹히는 오버레이 상태(`idle|generating|retry|conflict`)로 별도 관리한다.

## 2. 데이터 모델

```
User
  id, email, displayName, emailVerifiedAt, consentVersion, consentedAt, createdAt, lastActiveAt

JobCatalogEntry
  id, name, aliases[], category, summary
  variants: JobVariant[]

JobVariant
  id, jobId, worldTitle, roleDescription
  taskTimeline: { time, label }[]        # "하루 시작" 브리핑용
  situationTemplateCount: int            # 이 variant의 기본 단계 수 (세션 생성 시 totalSteps의 출발값)

ExperienceSession
  id, ownerId, jobId, variantId
  status: briefing | in_progress | completed | abandoned
  currentStepIndex: int
  totalSteps: int                        # 세션 생성 시 확정, 이후 불변
  draftResponse: string | null           # 미제출 입력 자동저장
  stateVersion: int
  parentSessionId: string | null         # 되돌리기로 분기된 세션
  branchFromStepId: string | null
  startedAt, updatedAt, completedAt

ExperienceStep (immutable)
  id, sessionId, index
  situation: { title, narrative, timePressure }
  response: { text, submittedAt }
  analysis: { behaviorTags[], evidence }
  outcome: { counterpartReaction, consequence, carryOverIssueIds[], isFinalStep }
  createdAt

ExperienceCheckpoint
  id, sessionId, stepIndex, stateVersion, createdAt

ExperienceSummary
  sessionId, timelineSummary, strengths[], tryNext[], userReflection, achievementIds[], savedAt

Achievement
  id, sessionId, title, evidenceStepId
```

## 3. REST API 계약

### Auth

| Method | Path | Body | 응답 |
|---|---|---|---|
| POST | `/auth/signup` | `{email, password}` | `202` 인증 메일 발송 |
| POST | `/auth/verify-email` | `{token}` | `200` |
| POST | `/auth/login` | `{email, password}` | `{accessToken, user}` |
| POST | `/auth/consent` | `{version}` | `200` |

### Home

| Method | Path | 응답 |
|---|---|---|
| GET | `/home/summary` | `{ activeSession: {id, jobName, variantTitle, currentStepIndex, totalSteps} \| null, recentRecords: HistoryItem[≤3] }` |

### Jobs

| Method | Path | 비고 |
|---|---|---|
| GET | `/jobs?query=` | 자유 입력 검색, 칩 추천은 `/jobs/popular` |
| GET | `/jobs/popular` | |
| GET | `/jobs/:jobId/variants` | |

### Experience Session

| Method | Path | Body | 응답 |
|---|---|---|---|
| POST | `/sessions` | `{jobId, variantId}` | `201` `ExperienceSession(status=briefing)`, `totalSteps` 확정 |
| GET | `/sessions/:id` | | 세션 + 현재 상황 |
| GET | `/sessions/:id/steps` | | 지금까지 제출된 step 전체 (대화 타임라인 렌더링용, 구현 중 추가) |
| PATCH | `/sessions/:id/draft` | `{text}` | `204`, idempotent, debounce 저장용 |
| POST | `/sessions/:id/steps` | `{stepIndex, expectedStateVersion, responseText}` | `201 ExperienceStep`(분석+결과 포함) \| `409 {currentStateVersion, latestStep}` |
| POST | `/sessions/:id/steps/:stepIndex/retry` | `{expectedStateVersion}` | 동일 입력 재생성, 실패 시 입력 유지하고 `502` |
| POST | `/sessions/:id/rollback` | `{toStepIndex}` | `201` 새 `ExperienceSession`(`parentSessionId`, `branchFromStepId`) |
| POST | `/sessions/:id/complete` | | `ExperienceSummary` 생성 트리거 |
| GET | `/sessions/:id/summary` | | 저장된 `ExperienceSummary` 조회 (회고 화면 새로고침/재방문용, 구현 중 추가) |
| PUT | `/sessions/:id/summary` | `{userReflection}` | `ExperienceSummary` |

### History

| Method | Path | 비고 |
|---|---|---|
| GET | `/history?filter=all\|byJob\|recent&cursor=` | 와이어프레임 필터 칩과 1:1 대응 |

## 4. 화면 ↔ API 커버리지

| 화면 요소 | API |
|---|---|
| 로그인/회원가입 | `/auth/*` |
| 홈 대시보드(진행중/최근) | `/home/summary` |
| 이어하기/새로 시작 모달 | `/home/summary.activeSession` 존재 여부로 분기 |
| 직업 선택(자유 입력+추천) | `/jobs`, `/jobs/popular`, `/jobs/:id/variants` |
| 하루 시작 브리핑 | `/sessions` 응답의 variant 브리핑 필드 |
| 상황 대응 제출 | `POST /sessions/:id/steps` |
| 생성 중/재시도 | 동일 엔드포인트의 pending/502 상태 |
| 상태 충돌 배너 | `409` 응답 |
| 결과(인라인) | `steps` 응답의 `outcome` |
| 체크포인트 되돌리기 | `POST /sessions/:id/rollback` |
| 하루 회고 저장 | `POST /sessions/:id/complete`, `PUT /sessions/:id/summary` |
| 체험 기록 필터 | `GET /history` |

## 5. 플로우 문제 해결 요약

| 문제 | 해결 |
|---|---|
| 진행 N/4 고정 | `totalSteps`는 세션 생성 시 확정되는 가변값. Figma `06b`-1에 1/3, 4/6 등 가변 예시 추가 |
| 내 메시지 버블 없음 | Figma `06b`-2에 우측 정렬 "나" 버블 추가 |
| 생성 중/실패 UI 없음 | Figma `06b`-3,4 + `steps` 엔드포인트의 pending/502 계약 |
| 상태 충돌 UI 없음 | Figma `06b`-5 + `409` 계약 |
| 체크포인트 되돌리기 진입점 없음 | Figma `06b`-6 "이 상황부터 다시 선택하기" + `/rollback` |
| 결과 화면 디자인 불일치(07만 구형 레이아웃) | 결과를 별도 화면에서 제거하고 상황 대응 턴에 흡수 — 07 라우트 자체가 사라짐 |
| 이어하기/새로 시작 분기 없음 | Figma `06b`-7 모달 + `/home/summary.activeSession` |
| 임시 저장 시점 불명 | `draftResponse` 필드 + `PATCH /sessions/:id/draft` debounce 저장, 제출 시에만 `ExperienceStep`으로 불변화 |

## 6. 의도적으로 보류한 것

- 소셜 로그인 여부: MVP는 이메일/비밀번호만.
- 생성 중 상태를 SSE/스트리밍으로 업그레이드할지: MVP는 동기 HTTP 요청 + 클라이언트 로딩 상태. 생성 시간이 길어지면 스트리밍으로 전환 (`ponytail: 지금은 필요 없음, 응답 지연이 실측으로 문제될 때 추가`).
- 모바일 반응형: 데스크톱 우선 유지, 별도 브레이크포인트 설계는 후속 작업.
