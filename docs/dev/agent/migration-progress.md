# Gemini/Copilot 전환 10개 작업 진행표

> 이 표는 실행 코드가 존재했던 시점의 작업 결과를 보존한 기록이다. 현재 `feat/ai-agent`는 문서 전용 브랜치이며, 실행 코드는 제거되었다.

현재 보존 브랜치: `feat/ai-agent` (문서 전용)

| 순서 | 작업 | 상태 | 근거 |
|---:|---|---|---|
| 1 | Aside/Google AI Studio에서 `yiseo0179@gmail.com` 계정 확인 | 완료 | Google AI Studio API key 화면에서 해당 계정 확인 |
| 2 | 무료 Gemini API key 발급 | 보류 | 새 영구 자격증명 생성 전 사용자 확인 필요 |
| 3 | Gemini key 백엔드 환경변수 연결 | 부분 완료 | `backend/.env.example`, `render.yaml`에 placeholder 추가; 실제 key 미저장 |
| 4 | Copilot Agent를 Gemini runtime으로 대체 | 완료 | `/ai/chat`, Gemini Agent 화면, native fetch adapter |
| 5 | 기존 메인 안내·Skill 호출 재현 | 완료 | `AgentPromptCatalog`, 9개 Skill prompt, `AgentOrchestrator` |
| 6 | 기존 AI 분석·결과 로직 재현 | 완료 | 구조화 `analysis`·`consequence` 검증 및 `gemini-agent-v1` |
| 7 | MCP 연결·도구 호출 재현 | 부분 완료 | JSON-RPC HTTP adapter와 allowlist; 실제 HRDKorea endpoint/credential 미설정 |
| 8 | 시뮬레이션 흐름 연결 | 완료 | `SimulationAgentService`가 서버에서 분석 후 Scene 저장 |
| 9 | 테스트·검증 | 부분 완료 | 백엔드 테스트 27개 통과; npm 의존성 미설치로 backend/frontend build 미검증 |
| 10 | 문서화·액션 커밋·GitHub push | 부분 완료 | 문서와 로컬 임시 Git 커밋 완료; GitHub push는 Chrome 파일 URL 권한 대기 |

## 후속 작업으로 남긴 항목

- 로딩 상태와 응답 중 표시 UX 개선
- Gemini chat session/message의 Firebase 영구 저장
- 실제 HRDKorea-MCP endpoint와 최소 권한 allowlist 설정
- Firebase/운영 인증 ownership 검증 강화
