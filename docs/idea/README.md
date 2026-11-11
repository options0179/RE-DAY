# docs/idea/ 운용 규칙

아이디어가 GitHub Issue가 되기 전까지의 단계. 이 폴더는 코드·브랜치와 아직 연결되지 않은 자유 형식 기획 공간이다.

## 상태 전이

- `docs/idea/plans/<slug>.md`는 frontmatter에 `status: unconfirmed` 또는 `status: confirmed`를 가진다.
- `unconfirmed → confirmed`는 **사람이 직접 전환**한다. 체크리스트 자동 검사나 Discord 자동 멘션 같은 게이트는 없다.
- `confirmed`가 되면 GitHub Issue를 만들고(도메인 tag 부여), 이후 작업은 `docs/dev/ADH/<issue-id>-<slug>/`와 `docs/dev/NRF/<issue-id>-<slug>/`로 넘어간다 — 자세한 흐름은 [`docs/dev/README.md`](../dev/README.md) 참조.

## 향후 자동화 (미구현)

- `write-plans` skill: [`options0179/automation-bot`](https://github.com/options0179/automation-bot)의 `automations/draft-idea`(Discord Idea Planner — `/idea → /select → /edit → /test-plan → /finalize`) 파이프라인을 Discord 없이 세션 내에서 재현해, 아이디어를 수용 조건·Given/When/Then 시나리오가 갖춰진 기능 계획으로 구체화하고 이 폴더에 쓰는 것을 목표로 한다. 지금은 사람이 직접 작성한다.

## 과거 기록

`2026-10-19-ai-agent-workflow.md`는 이 규칙이 생기기 전에 작성·실행 완료된 설계 문서다(구 `docs/superpowers/plans/`에서 이전). 이미 구현이 끝났으므로 `status` 필드 없이 역사적 기록으로 둔다.
