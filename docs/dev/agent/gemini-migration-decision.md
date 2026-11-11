# Gemini 전환 결정

## 결정

Copilot Studio Agent를 제거하고 Gemini Developer API의 무료 사용 구간을 이용하는 방향으로 결정한다.

- Provider: Google Gemini Developer API
- API key: 무료 Google AI Studio API key
- 선택 모델: 환경 변수로 설정하며 기본값을 고정하지 않는다. 모델의 무료 제공 여부와 quota는 Google AI Studio에서 확인한다.
- 호출 방식: 백엔드에서 표준 `fetch`로 Gemini REST `generateContent` API 호출
- 프런트엔드: API key를 절대 보관하지 않고 RE-DAY 백엔드만 호출
- 현재 문서 상태: 실제 key 값은 저장하지 않음

무료 사용은 무제한·무보장 서비스가 아니다. Google의 무료 tier는 모델별로 제한되며 quota와 데이터 사용 조건은 변경될 수 있으므로 배포 전 공식 가격·rate limits 페이지를 다시 확인한다.

공식 문서:

- <https://ai.google.dev/gemini-api/docs/generate-content>
- <https://ai.google.dev/gemini-api/docs/models>
- <https://ai.google.dev/gemini-api/docs/pricing>
- <https://ai.google.dev/gemini-api/docs/rate-limits>

## 보안 결정

사용자가 기존 key가 코드에 하드코딩되어 있다고 확인했지만, 새 구현의 기준은 다음과 같다.

```text
GEMINI_API_KEY=<Google AI Studio에서 발급한 무료 key>
GEMINI_MODEL=<무료 사용을 확인한 모델 ID>

백엔드 `.env.example`에는 빈 placeholder만 추가했다. 실제 key는 로컬 secret store 또는 배포 환경변수에만 넣는다.
```

키는 `backend/.env` 또는 배포 플랫폼 secret에만 둔다. 프런트엔드 번들, Git, Markdown, 로그, 오류 응답에는 넣지 않는다. 기존에 노출된 key가 있다면 교체(revoke/rotate)해야 한다.

## 구현된 범위

- `backend/src/ai/gemini-client.ts`: native `fetch` 기반 Gemini REST 호출
- `backend/src/ai/prompt-catalog.ts`: 추출된 메인 안내와 Skill 9개 로딩
- `backend/src/ai/agent-orchestrator.ts`: 구조화된 분석·결과 생성과 Skill 호출 검증
- `backend/src/ai/chat-service.ts`: Copilot webchat 대체용 Gemini 대화 응답
- `backend/src/mcp/http-client.ts`: allowlist 기반 MCP JSON-RPC HTTP 호출
- `frontend/app/copilot/page.tsx`: Gemini Agent 대화 화면

## 의존성 최소화

새 Gemini SDK를 추가하지 않고 Node의 내장 `fetch`를 사용한다. 이 저장소의 백엔드에 이미 `zod`가 있으므로 요청·응답 경계 검증에 재사용한다.

사용하지 않던 MCP SDK는 제거했다. 다만 HRDKorea-MCP를 Gemini tool calling으로 연결하는 작업은 별도의 adapter와 권한 정책이 필요하며, 이번 추출 문서만으로 자동 이식하지 않는다.

## 이식 우선순위

1. 메인 안내의 서비스 목적·금지 규칙·장면/결과/회고 출력 형식을 system instruction으로 이식한다.
2. 실제 설정된 9개 Skill을 서버 측 prompt module로 분리한다.
3. JSON 출력이 필요한 `scenegeneerator`, `realityvalidator`부터 schema 검증을 적용한다.
4. Firestore 저장 전 백엔드가 분석·결과를 생성하도록 하여 현재의 `Agent 분석 대기` placeholder를 제거한다. 이 단계는 `SimulationAgentService`로 구현했다.
5. HRDKorea-MCP는 전체 도구를 한 번에 공개하지 말고, RE:DAY의 직무 탐색에 필요한 도구만 allowlist로 연결한다.

## 선택지 조사 결론

무료·낮은 의존성·구조화된 JSON 응답이 우선이므로 Gemini Developer API가 현재 목표에 가장 적합하다. OpenAI/Anthropic은 품질과 tool-use 선택지가 좋지만 무료 운영이라는 결정과 맞지 않고, Ollama는 key 비용이 없지만 서버 운영·모델 다운로드·하드웨어 비용이 추가된다. 이 판단은 무료 운영과 기존 백엔드의 단순성을 우선한 것이다.
