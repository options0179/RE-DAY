# RE:DAY

RE:DAY는 사용자가 관심 있는 직무의 하루를 안전하게 미리 경험하고, 자신의 판단과 소통 방식을 행동 근거 중심으로 돌아보도록 돕는 커리어 시뮬레이션 서비스입니다.

> `feat/ai-agent`는 추출한 Agent 설정을 Gemini와 연결하는 DB 없는 실행 브랜치다. 대화·분석·allowlisted MCP 호출만 제공하며, DB 내용은 [`docs/dev/database-summary.md`](docs/dev/database-summary.md)에 요약 기록으로만 보존한다.

---

## 서비스 목적과 방향성

* 정답이나 취업 가능성을 판정하지 않고, 여러 직무를 탐색할 기회를 제공합니다.
* 기존 Microsoft Copilot Agent는 대화 흐름과 Skill 오케스트레이션을 담당했으며, 현재는 무료 Gemini Developer API로 대체하는 방향을 결정했습니다.
* 현재 AI 런타임은 요청을 저장하지 않고 Gemini 응답과 Agent 지침을 연결합니다.
* MCP HTTP bridge는 환경변수 allowlist에 포함된 HRDKorea 도구만 호출합니다.
* MVP에서는 하나의 Orchestrator Agent만 사용하며, Multi-Agent Team은 상태 모델이 안정된 이후의 확장 대상으로 남깁니다.
* 공공 데이터는 시나리오 원문이 아니라 직무 사실과 현실 조건을 뒷받침하는 근거로만 사용합니다.

---

## 기존 구현 범위 기록

* 온보딩 → 직무 선택 → 시뮬레이션 장면 → 응답 분석 → 회고 흐름
* Simulation / Scene / ResponseAnalysis / Consequence 데이터 계약
* 세션 소유권 검증과 optimistic `stateVersion` 충돌 방지
* 체크포인트, 롤백, 부모 세션을 보존하는 재도전 브랜치
* 행동 근거 기반 업적과 회고 요약
* 외부 직무 데이터 정규화 및 24시간 캐시
* 직무·시뮬레이션·회고·히스토리 웹 화면

위 항목은 코드가 존재하던 시점의 서비스 범위를 설명하는 기록이며, 현재 브랜치에서는 DB 없는 AI/MCP 경로만 실행한다.

## Agent 추출·전환 문서

Copilot Studio에서 읽기 전용으로 추출한 메인 안내, 실제 Skill 9개, HTTP 도구, HRDKorea-MCP 및 전환 결정은 [`docs/dev/agent/`](docs/dev/agent/)에 있습니다.

현재 코드와 Agent 사이의 미연결 지점은 [`docs/dev/agent/implementation-gaps.md`](docs/dev/agent/implementation-gaps.md)에 따로 정리했습니다.

> **참고:** 현재 Firebase Admin, 세션 저장, 실제 Copilot Studio 환경은 연결하지 않는다. Gemini는 `GEMINI_API_KEY` 또는 기존 입력 형식인 `gemini_api_key`를 사용하고, MCP는 `HRDKOREA_MCP_URL`과 도구 allowlist를 사용한다.

---

## 문서 구조

```text
RE-DAY/
├─ backend/                     # DB 없는 Gemini Agent·MCP HTTP runtime
├─ frontend/                    # React+Vite 프런트엔드
├─ docs/
│  ├─ idea/plans/               # 아이디어 → status: unconfirmed|confirmed
│  ├─ dev/
│  │  ├─ SAD.md                 # 시스템 아키텍처 (구 RE-DAY-architecture-agent.md)
│  │  ├─ agent/                 # Copilot Agent main instruction·Skill·MCP 추출본
│  │  ├─ database-summary.md    # 삭제된 코드에서 보존한 DB 계약 요약
│  │  ├─ ADH/<issue-id>/ADR/    # 이슈별 Architecture Decision Record
│  │  └─ NRF/<issue-id>/        # TDD 직전 NFR plan·result
│  └─ (기타 계약·환경변수 문서)
├─ AGENTS.md
└─ README.md


실행은 `backend/`에서 `npm install` 후 `npm test`와 `npm start`로 수행한다. 현재 런타임은 DB를 사용하지 않으며, 세션·메모리·Firebase 연결은 별도 작업으로 남긴다.

