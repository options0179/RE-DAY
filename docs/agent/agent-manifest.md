# Agent Manifest

## 화면에서 확인한 구성

| 항목 | 값 |
| --- | --- |
| 이름 | RE:DAY |
| 게시 상태 | Published |
| 모델 | GPT-5.5 Chat |
| 채널 | 데모 웹사이트 |
| 지식 | 모든 웹 사이트 검색 |
| 연결된 Agent | 없음 |
| 메모리 | 비활성화된 미리 보기 토글 |
| 일반 도구 | Invoke an HTTP request |
| MCP 도구 | HRDKorea-MCP |
| Skill 수 | 9 |

## 실제 설정된 Skill

1. `narrativehumanizer`
2. `jobientresolver`
3. `dayreviewcomposer`
4. `responseanalyzer`
5. `consequencesimulator`
6. `realityvalidator`
7. `worldbuilder`
8. `crisisgenerator`
9. `scenegeneerator`

## 메인 안내와 구성의 차이

메인 안내의 `6. Skill 구조`에는 다음 8개가 적혀 있다.

- Job Intent Resolver
- World Builder
- Crisis Generator
- Response Analyzer
- Consequence Simulator
- Achievement Composer
- Day Review Composer
- Humanizer

하지만 실제 화면의 Skill 목록에는 `realityvalidator`와 `scenegeneerator`가 있으며 `Achievement Composer`가 별도 구성으로 보이지 않는다. 따라서 Gemini 전환 시에는 화면 설정을 기준으로 9개를 이식하고, Achievement Composer는 회고/기록 단계의 책임으로 별도 결정해야 한다.

## Copilot Studio와 저장소 연결

- 초기 프런트엔드는 `frontend/app/copilot/page.tsx`에서 Copilot Studio webchat iframe을 직접 렌더링했으나, 현재는 Gemini `/ai/chat` 화면으로 교체했다.
- iframe의 bot 경로는 Agent 편집 URL의 Agent ID와 다르고, `bots/cr9fa_reday_4T-Zrr/webchat`를 사용한다.
- 저장소에는 Agent의 메인 안내나 Skill 원문 파일이 없었다. 이 폴더의 문서는 외부 편집 화면에서 추출한 기준 문서다.
- 저장소의 `backend/src/mcp/gateway.ts`는 MCP SDK transport/server가 아니라 애플리케이션 내부 Gateway 추상화다.
- `@modelcontextprotocol/sdk`는 소스 import가 없어 backend manifest와 lock에서 제거했다. 현재 `McpGateway`는 내부 추상화로만 남아 있다.
