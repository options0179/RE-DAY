# 기존 코드와 Agent 사이의 미연결·문제 목록

이 문서는 추출한 Copilot Agent와 현재 저장소를 비교해, 실제 동작에 영향을 주는 문제만 별도로 모은 것이다.

## 현재 전환 상태

- `frontend/app/copilot/page.tsx`는 Copilot Studio iframe 대신 `/ai/chat`을 호출하는 Gemini Agent 화면으로 교체했다.
- 시뮬레이션 응답은 `/simulations/:sessionId/scenes`에서 서버가 추출된 메인 안내와 Skill prompt를 사용해 분석한 뒤 저장한다. `/ai/analyze`는 독립 분석용 경계로 남아 있다.
- `backend/src/mcp/http-client.ts`는 MCP JSON-RPC HTTP 호출과 서버-side tool allowlist를 제공한다. 실제 HRDKorea-MCP URL과 자격증명은 환경변수에 남겨야 한다.

## P0: Agent 기능의 운영 연결이 아직 완료되지 않음

- Gemini API key/model 환경변수와 실제 HRDKorea-MCP endpoint가 배포 환경에 설정되지 않으면 `/ai/chat`, `/ai/analyze`, `/mcp/tools/:toolName`은 동작하지 않는다.
- 시뮬레이션 저장 route는 이제 클라이언트의 `analysis`, `consequence`, `sourceRefs`, `promptVersion`를 사용하지 않고 서버 생성 결과를 저장한다. summary·achievements와 인증 ownership 검증은 여전히 보강 대상이다.
- 대화 응답은 아직 Firestore chat session/message에 저장하지 않는다. 사용자가 지정한 후속 작업으로 남긴다.

## P0: Agent 설정과 코드의 계약이 다름

- Agent 출력은 장면·결과·회고에 대한 텍스트 형식을 지시하지만 백엔드 `Scene` 계약은 구조화된 `incident`, `analysis`, `consequence`를 요구한다.
- `scenegeneerator` 결과는 현재 `analysis`·`consequence` 계약으로 검증하지만, 전체 장면 생성 JSON 7개 필드와 `realityvalidator` 상태 전이는 아직 별도 구현되지 않았다.
- `realityvalidator`의 `PASS/REVISE/FAIL` 결과를 저장하거나 재생성에 사용하는 상태 전이가 없다.
- 메인 안내에 적힌 `Achievement Composer`와 실제 Skill 목록이 불일치한다.

## P1: 보안·신뢰 경계

- production middleware가 `x-api-key`가 맞으면 `x-user-id`를 신뢰한다.
- `/users/:requestedUserId/preferences`는 인증된 사용자와 path user ID가 같은지 확인하지 않아 IDOR 위험이 있다.
- summary와 achievements는 여전히 클라이언트 입력 구조를 충분히 검증하지 않고 저장한다.
- summary와 achievements도 구조 검증 없이 저장된다.

## P1: 데이터·배포 미연결

- `firestore.rules`와 `storage.rules`가 전부 deny라 Firebase 클라이언트 직접 접근은 동작하지 않는다. 서버 Admin SDK 경로만 의도한 것인지 명확히 해야 한다.
- `frontend/next.config.mjs`가 static export인데 동적 session route의 `generateStaticParams()`는 `demo`만 반환한다. 임의 session ID의 새로고침·직접 접근이 404가 될 수 있다.
- `.github/workflows/deploy.yml`과 `.github/workflows/nextjs.yml`는 중복 배포 흐름이며 Node/action 버전과 트리거가 다르다.
- `Invoke an HTTP request` 도구는 Copilot Studio 화면에서 `Not connected`이고 method/URL이 AI 채우기 상태다. 저장소의 OpenAPI 문서가 있어도 실제 연결이 완료됐다고 볼 수 없다.

## P2: 의존성·구조

- `zod`는 현재 소스 import가 없지만 경계 검증 도입 시 재사용할 수 있다. 사용하지 않던 `@modelcontextprotocol/sdk`는 manifest·lock·설치 스크립트에서 제거했다. 현재 MCP adapter는 native `fetch` 기반이다.
- `backend/src/mcp/gateway.ts`는 MCP protocol transport가 아니라 내부 Gateway class다. 이름만으로 실제 MCP 서버가 연결됐다고 오해할 수 있다.
- Gemini 전환 시 frontend에서 provider를 호출하면 key가 노출된다. 호출은 backend adapter 하나로 제한해야 한다.

## 권장 작업 순서

1. JSON schema와 `realityvalidator` 결과를 백엔드 trust boundary에서 검증한다.
2. 클라이언트가 분석·결과를 제출하지 않고, 백엔드가 생성한 결과만 저장하도록 바꾼다.
3. auth ownership 검사를 단일 middleware/helper로 통일한다.
4. 대화 세션·메시지 저장을 Gemini chat 경로에 연결한다.
5. 정적 배포와 동적 simulation route 전략을 결정한다.

이번 전환 단계에서는 Copilot Studio 설정을 수정하지 않았고, 기존 데이터 계약을 유지한 채 Gemini 호출 경계를 추가했다. 장면 분석 결과는 서버 생성·저장 경계로 이동했다.
