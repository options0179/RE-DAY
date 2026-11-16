# 프로젝트 문서 안내서

이 문서는 저장소 문서의 역할을 구분하고, 작업에 맞는 문서를 찾아 읽기 위한 색인이다. 문서의 제목이나 파일 목록만 훑는 것으로 내용을 확인했다고 간주하지 않는다. 프로젝트 문서 탐색 요청 또는 `docs/` 작업을 받으면 이 문서를 먼저 읽고, 아래에서 관련성이 있는 문서만 연다.

## 빠른 탐색

| 알고 싶은 것 | 먼저 읽을 문서 |
|---|---|
| 저장소에서 문서를 어디서 찾아야 하는가 | 이 문서, 그다음 해당 영역의 `README.md` |
| 제품이 풀려는 문제와 검증 가설은 무엇인가 | [`docs/product/discovery.md`](docs/product/discovery.md) |
| 제품이 제공하려는 기능과 범위는 무엇인가 | [`docs/product/requirements.md`](docs/product/requirements.md) |
| Agent가 사용자에게 어떻게 행동해야 하는가 | [`docs/agent/behavior.md`](docs/agent/behavior.md) |
| 현재 프로그램의 구조와 실행 경로는 무엇인가 | [`docs/dev/SAD.md`](docs/dev/SAD.md) |
| 프런트엔드와 백엔드의 실제 API 계약은 무엇인가 | [`docs/dev/frontend-backend-contract.md`](docs/dev/frontend-backend-contract.md) |
| 환경 설정과 로컬 실행은 어떻게 하는가 | [`docs/dev/env.md`](docs/dev/env.md), [`README.md`](README.md) |
| Issue 이후 ADR/NRF 문서는 어떻게 관리하는가 | [`docs/dev/README.md`](docs/dev/README.md), 저장소 루트 [`AGENTS.md`](AGENTS.md) |
| Issue 이전 아이디어 계획은 어떻게 관리하는가 | [`docs/idea/README.md`](docs/idea/README.md) |
| Agent의 활성 프롬프트 원문은 어디에 있는가 | [`docs/dev/agent/README.md`](docs/dev/agent/README.md) |
| 과거 구조·전환 결정은 어디에 있는가 | [`docs/dev/archive/README.md`](docs/dev/archive/README.md) |

## 문서의 책임 경계

- **제품 발견**은 사용자·문제·시장에 관한 가설과 검증 방법을 기록한다. 가설은 사용자 조사 전까지 사실이나 확정 요구가 아니다.
- **제품 요구사항**은 사용자에게 제공할 경험과 기능 범위 후보를 기록한다. 구현 완료 여부는 설명하지 않는다.
- **Agent 행동 명세**는 제품에서 사용자에게 보여야 할 Agent의 역할과 금지 행동을 기록한다. 실행 프롬프트는 이 명세를 반영하는 구현물이며, 명세 파일을 런타임에서 자동으로 읽지는 않는다.
- **SAD**는 현재 코드에서 확인되는 시스템 구성과 데이터·호출 경계를 요약한다. 제품 방향이나 검증 가설을 복제하지 않는다.
- **API 계약**은 화면과 서버 사이의 상세 요청·응답 형식을 관리한다. 환경 문서는 설정 이름과 실행 방법을 관리한다.
- **개발 파이프라인**은 Idea, Issue, ADR, NRF, 코드와 검증 결과의 작업 단계를 관리한다. 각 단계의 세부 규칙은 `docs/idea/README.md`와 `docs/dev/README.md`가 맡는다.
- **아카이브**는 과거에 유효했던 기록을 보존한다. 과거 구현 설명은 현재 시스템 사실로 인용하지 않는다.

제품 문서, Agent 행동 명세, SAD는 서로 다른 질문에 답한다. 같은 내용을 문서마다 복사하지 말고 해당 주제의 문서에만 상세 내용을 둔다. 다른 문서에서는 필요한 경우 링크와 짧은 맥락만 제공한다.

## 프로젝트 문서를 탐색하는 순서

```bash
cat PROJECT-DOCUMENTS.md
cat docs/<관련-영역>/README.md  # 해당 영역에 README가 있을 때
rg --files docs | sort
```

그다음 요청과 직접 관련된 문서의 내용을 읽는다. 모든 ADR, NRF 결과, 아카이브를 한꺼번에 읽지 않는다. 코드가 동작하는지 확인할 때는 문서 설명만으로 판단하지 말고 실제 코드와 테스트를 함께 확인한다.
