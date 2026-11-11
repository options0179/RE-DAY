# RE:DAY 외부 Agent 추출 문서

> `feat/ai-agent`는 아래 추출본을 실제 Gemini·MCP runtime에 연결하는 DB 없는 브랜치다. 세션·메모리·Firebase 저장은 의도적으로 포함하지 않는다.

이 폴더는 Microsoft Copilot Studio의 RE:DAY Agent 설정을 읽기 전용으로 추출해 보존한 문서다.

## 추출 원본

- Agent: `RE:DAY`
- 환경: `Default-a5a060c4-00b2-4343-b6c9-23625439a0c0`
- Agent ID: `bd5e39f6-7a24-470d-975b-205cc4d18e8c`
- 확인 URL: <https://copilotstudio.microsoft.com/environments/Default-a5a060c4-00b2-4343-b6c9-23625439a0c0/agents/bd5e39f6-7a24-470d-975b-205cc4d18e8c>
- 추출일: 2026-10-19 (Asia/Seoul)
- 상태: Published
- 모델: `GPT-5.5 Chat` (Copilot Studio 화면 표시값)

## 문서 구성

- [agent-manifest.md](./agent-manifest.md): 화면에서 확인한 Agent 구성 요약과 불일치
- [main-instructions.md](./main-instructions.md): 메인 안내 원문과 버전 경계
- `skills/`: 구성된 Skill 9개의 이름·설명·단계별 안내
- [mcp.md](./mcp.md): HTTP 도구와 HRDKorea-MCP 연결, 활성 도구 목록
- [gemini-migration-decision.md](./gemini-migration-decision.md): 무료 Gemini API key 사용 결정
- [implementation-gaps.md](./implementation-gaps.md): 기존 코드와 Agent 사이의 미연결·품질 문제
- [process-improvement.md](./process-improvement.md): 이번 작업이 지연된 원인과 변경한 진행 방식
- [migration-progress.md](./migration-progress.md): 요청한 10개 전환 작업의 완료·보류 상태
- [copilot-studio-api-connect-phase1.md](./copilot-studio-api-connect-phase1.md), [phase2](./copilot-studio-api-connect-phase2.md): Copilot Studio에서 백엔드 HTTP action을 연결하려던 계획 (과거 기록)

## 현재 Gemini 전환 구현

- `/ai/chat`: Copilot webchat을 대체하는 Gemini 대화 경로
- `/ai/analyze`: 시뮬레이션 응답을 Skill 기반 구조화 결과로 변환하는 경로
- `/mcp/tools/:toolName`: 환경변수 allowlist를 적용한 MCP JSON-RPC proxy
- `backend/src/ai/prompt-catalog.ts`: `main-instructions.md`와 `skills/*.md`를 런타임에 로드
- `backend/src/ai/agent-orchestrator.ts`: 모델의 Skill 호출명과 구조화 결과를 allowlist/shape 검증
- 실제 API key와 MCP endpoint는 `.env`에서만 주입하며, 대화·시뮬레이션 영구 저장은 연결하지 않는다.

## 보존 원칙

화면에서 보이는 지침과 설명은 의미를 바꾸지 않고 Markdown으로 옮겼다. 실제 API key, 연결 자격 증명, 사용자 인증 토큰은 추출하거나 저장하지 않았다.

현재 Copilot Studio의 메인 안내에는 구버전 안내와 최신 안내가 한 편집 영역 안에 이어붙어 있다. 이를 임의로 삭제하지 않고 `main-instructions.md`에 `legacy`와 `current`로 나눠 보존했다.

또한 화면의 실제 Skill 구성은 메인 안내에 적힌 8개와 다르다. 실제 구성에는 `realityvalidator`와 `scenegeneerator`가 추가되어 있고, `Achievement Composer`는 별도 Skill로 존재하지 않는다. 이 차이는 Agent 마이그레이션 전에 확인해야 하는 요구사항이다.
