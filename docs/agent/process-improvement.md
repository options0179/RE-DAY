# 작업 지연 원인과 진행 방식 변경

작성일: 2026-10-19 (Asia/Seoul)

이 문서는 이번 RE:DAY Agent 추출·전환 작업이 오래 걸린 원인과, 이후 같은 유형의 작업을 더 짧고 안전하게 진행하기 위해 바꾼 절차를 기록한다. Copilot Studio 세션 원문을 별도 transcript 파일로 보존한 분석 보고서가 아니라, 현재 저장소에 남은 결과와 재현 가능한 검증 명령을 기준으로 작성한 작업 회고다.

## 1. 지연 원인

### 1.1 저장소 상태를 먼저 고정하지 못함

초기에 원격 저장소를 일반 Git 작업공간으로 가정했지만, 현재 작업 디렉터리에는 `.git` 메타데이터가 없었다. 그 결과 기본 브랜치, 작업 브랜치, 커밋 단위 변경, diff 검증을 바로 수행할 수 없었다. `AGENTS.md`는 원래 작업 시작 시 `git status`, remote, branch를 확인하도록 요구한다(`AGENTS.md:5-15`). 이 사전 조건을 처음에 완료 기준으로 고정했어야 했다.

### 1.2 추출 계약 없이 UI를 반복 탐색함

처음에는 “서비스 아키텍처”, “Agent 설정”, “Skill”, “MCP”, “Gemini 전환”, “코드 리팩터링”이 한 범위로 섞여 있었다. 메인 안내의 두 버전, 실제 Skill 9개, MCP 도구 권한과 연결 상태를 각각 원문·목록·불일치·보안 제외 규칙으로 나누는 기준이 늦게 확정됐다. 현재는 그 결과가 `agent-manifest.md:15-30`, `main-instructions.md`, `mcp.md`로 분리돼 있다.

### 1.3 문서 추출과 코드 전환의 의존 순서가 뒤섞임

초기 코드에는 Copilot iframe만 있고(`frontend/app/copilot/page.tsx:1-12`), 시뮬레이션 제출도 `Agent 분석 대기` placeholder를 보냈다(`frontend/app/simulation/[sessionId]/simulation-scene.tsx:19-24`). 이 계약을 먼저 확정하지 않은 채 Gemini 코드를 바로 넣으면 출력 JSON, 인증, 저장 경계가 추측으로 결정된다. 현재 구현 결과와 남은 미연결 문제는 `implementation-gaps.md:5-17`에 따로 분리했다.

### 1.4 검증 환경 확인이 늦음

백엔드와 프런트엔드 모두 `package.json`의 build script가 각각 `tsc`와 `next` 실행 파일을 요구한다(`backend/package.json:6-10`, `frontend/package.json:5-9`). 의존성이 설치되지 않은 상태에서는 빌드 결과를 얻을 수 없으므로, 설치 여부를 작업 초기에 확인했어야 했다. 네트워크가 제한된 상태에서 임의로 설치를 시도하지 않고 이 사실을 완료 보고에 남긴다.

## 2. 변경한 진행 방식

앞으로는 아래 순서를 기본으로 사용한다.

1. **범위와 산출물 고정**: 원문 추출, 정규화 문서, 코드-설정 불일치, 실제 코드 변경, 검증 결과를 별도 산출물로 먼저 나눈다.
2. **사전 조건 선확인**: `pwd`, Git 메타데이터와 remote/branch, 의존성 설치 여부, 실행 가능한 검증 명령을 가장 먼저 확인한다.
3. **읽기 작업 병렬화**: 저장소 구조·호출부·설정 파일 스캔과 공식 모델/API 문서 조사를 동시에 진행한다. 브라우저 화면은 필요한 원문만 한 번 추출하고 같은 화면을 반복해서 읽지 않는다.
4. **정본 고정**: 화면에서 얻은 원문을 먼저 정본 목록으로 고정한 뒤, 원문 보존 문서와 요약 문서를 분리한다. 이후 검증은 화면이 아니라 정본 파일을 기준으로 한다.
5. **계약 우선 전환**: Gemini adapter를 만들기 전에 입력·출력 JSON, Skill prompt 주입 위치, 인증·소유권, 실패 시 저장 정책을 문서화한다. 현재는 이 계약이 미완성이라 코드 전환을 보류했다.
6. **작은 검증 루프**: 문서 fence/누락/비밀값 검사를 먼저 하고, 의존성이 있을 때만 build/test를 실행한다. 검증 불가 항목은 성공으로 표시하지 않고 원인과 다음 조치를 기록한다.
7. **액션 단위 인계**: Git 저장소가 복구되면 문서 추출, 문제 목록, adapter, trust-boundary 검증을 각각 독립 커밋으로 만든다. 현재는 `.git` 부재로 커밋하지 않았다.

## 3. 이번 작업에 적용한 개선 결과

- Copilot Studio 화면을 다시 읽지 않고, 이미 추출한 메인 안내·9개 Skill·HTTP 도구·45개 HRDKorea-MCP 도구를 정본으로 삼았다.
- 실제 구성과 프롬프트의 불일치를 숨기지 않고 `agent-manifest.md:24-30`에 기록했다.
- Gemini 무료 API key 결정은 `gemini-migration-decision.md`에만 기록하고 실제 키는 저장하지 않았다.
- 코드와 Agent의 미연결·보안·배포 문제는 `implementation-gaps.md:19-37`로 분리해, 문서 추출 완료와 코드 전환 미완료를 혼동하지 않게 했다.
- 다음 코드 변경은 `implementation-gaps.md:39-47`의 순서대로 backend adapter와 schema 계약부터 시작한다.

## 4. 남은 위험과 제한

- 현재 workspace는 Git working tree가 아니므로 브랜치 비교, staged diff, 액션 단위 커밋을 확인할 수 없다.
- `node_modules`가 없어 backend/frontend build를 실행할 수 없다. 의존성 설치와 네트워크 허용 여부가 정해진 뒤 재검증해야 한다.
- Gemini 모델명·무료 quota는 변동될 수 있으므로 실제 adapter 구현 시점에 공식 문서와 계정 quota를 다시 확인해야 한다.
- Copilot Studio 연결을 수정하지 않았고, API key·connection credential·사용자 토큰은 추출하지 않았다.
