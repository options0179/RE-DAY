# 활성 Agent 프롬프트

이 디렉터리에는 현재 백엔드가 런타임에 읽는 Agent 프롬프트만 둔다.

- `main-instructions.md`: 기본 시스템 지침
- `skills/*.md`: 코드가 탐색해 로드하는 Skill 지침

`AgentPromptCatalog`는 `REDAY_AGENT_DOCS_DIR` 경로에서 `main-instructions.md`와 `skills/*.md`를 읽는다. 기본 경로는 `../docs/dev/agent`이며, 이 실행 경로를 바꿀 때는 설정, 코드, 관련 테스트와 SAD를 함께 갱신한다.

이 파일들은 실행에 사용되는 프롬프트다. 제품 의도와 사용자 대면 원칙은 [`docs/agent/behavior.md`](../../agent/behavior.md), 기능 범위는 [`docs/product/requirements.md`](../../product/requirements.md)에서 관리한다. 두 문서는 런타임에서 자동으로 읽히지 않으므로 프롬프트 변경 시 명세와의 일치 여부를 검토한다.

과거 Agent 추출·마이그레이션·연결 시도 기록은 [`docs/dev/archive/agent/`](../archive/agent/)에 보존한다. 아카이브 문서는 현행 구현 설명이나 런타임 입력으로 사용하지 않는다.
