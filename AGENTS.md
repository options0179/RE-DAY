# AGENTS.md

이 문서는 RE:DAY 저장소에서 작업하는 모든 Agent와 개발자가 따라야 하는 기본 작업 규칙이다.

## 1. 작업 시작 전: 저장소와 규칙 탐색

작업을 시작하기 전에 현재 디렉터리와 Git 상태를 먼저 확인한다.

```bash
pwd
git status --short --branch
git remote -v
git branch --show-current
git branch --all --verbose --no-abbrev
```

그 다음, 아래 순서로 작업 규칙과 브랜치 정책을 탐색한다.

1. 현재 디렉터리부터 저장소 루트까지의 `AGENTS.md`
2. 현재 디렉터리부터 저장소 루트까지의 `CLAUDE.md`, `GEMINI.md`, `INSTRUCTIONS.md`
3. `README.md`, `CONTRIBUTING.md`, `DEVELOPMENT.md`, `BRANCHING.md`
4. `docs/` 안의 Git, 브랜치, 릴리스, 개발 문서
5. `.github/CONTRIBUTING.md`, `.github/BRANCHING.md`, `CODEOWNERS`, Issue/PR 템플릿
6. GitHub Actions workflow와 보호 브랜치에 영향을 주는 설정

탐색 명령:

```bash
rg --files -g 'AGENTS.md' -g 'CLAUDE.md' -g 'GEMINI.md' \
  -g 'INSTRUCTIONS.md' -g 'README*' -g 'CONTRIBUTING*' \
  -g 'DEVELOPMENT*' -g 'BRANCHING*' -g 'CODEOWNERS' \
  -g '.github/**' -g 'docs/**' | sort

rg -n -i "branch|branching|commit|pull request|merge|release|workflow|codeowners" \
  AGENTS.md README* CONTRIBUTING* DEVELOPMENT* BRANCHING* .github docs 2>/dev/null
```

규칙 충돌 시 우선순위는 다음과 같다.

1. 사용자의 현재 작업 지시
2. 현재 파일에 가장 가까운 디렉터리의 `AGENTS.md`
3. 저장소 루트의 `AGENTS.md`
4. 저장소의 명시적인 개발/브랜치 문서
5. 일반적인 Git 관례

중첩 디렉터리에 더 구체적인 `AGENTS.md`가 있으면 해당 범위에서는 상위 문서보다 우선한다. 읽지 않은 규칙 문서가 있으면 코드 수정 전에 읽는다.

## 2. 브랜치 탐색과 선택

작업 전에 기본 브랜치와 현재 브랜치가 무엇인지 확인한다.

```bash
git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null || true
git remote show origin 2>/dev/null | rg "HEAD branch|Remote branches"
git branch --all --sort=-committerdate
git log --oneline --decorate --graph --all -20
```

네트워크와 인증이 준비되어 있으면 원격 상태를 갱신한다.

```bash
git fetch --prune origin
```

브랜치를 선택할 때는 다음을 확인한다.

- 기본 브랜치가 `main`, `master`, `develop` 중 무엇인지 추측하지 않는다.
- 기존에 같은 작업을 진행 중인 브랜치가 있는지 원격 브랜치까지 확인한다.
- 관련 Issue/PR 번호와 기존 브랜치 이름이 있으면 재사용 여부를 먼저 판단한다.
- 오래된 브랜치는 기본 브랜치와의 차이, 최근 커밋일, 미병합 여부를 확인한 뒤 사용한다.
- 사용자 변경이 있는 dirty worktree에서는 브랜치를 바꾸거나 파일을 덮어쓰지 않는다.

새 작업은 기본 브랜치의 최신 상태에서 시작한다.

```bash
git switch <default-branch>
git pull --ff-only origin <default-branch>
git switch -c <work-branch>
```

`pull --ff-only`가 실패하면 자동으로 merge/rebase하지 말고 원인과 선택지를 확인한다.

## 3. 브랜치 이름 규칙

브랜치 이름은 목적이 드러나도록 다음 형식을 사용한다.

```text
<type>/<short-kebab-description>
<type>/<issue-id>-<short-kebab-description>
```

허용하는 기본 type:

| Type | 용도 |
|---|---|
| `feat` | 사용자 기능 추가 |
| `fix` | 버그 수정 |
| `refactor` | 동작 변경 없는 구조 개선 |
| `docs` | 문서 변경 |
| `test` | 테스트 추가/수정 |
| `chore` | 의존성·도구·설정 유지보수 |
| `hotfix` | 운영 긴급 수정 |

규칙:

- 소문자와 숫자, 하이픈만 사용한다.
- 공백, 한글, 대문자, `@`, `#`, 슬래시는 type 구분 외에는 사용하지 않는다.
- `main`, `master`, `develop`, `release/*`에서 직접 작업하지 않는다.
- 브랜치 하나에는 하나의 목적만 둔다.
- 관련 없는 리팩터링, 포맷팅, 의존성 업그레이드를 같은 브랜치에 섞지 않는다.
- 기존 저장소의 명명 규칙이 더 구체적으로 정의되어 있으면 기존 규칙을 따른다.

예시:

```text
feat/copilot-session-memory
fix/session-version-conflict
docs/agent-workflow
chore/update-firestore-index
```

## 4. 액션 단위 커밋 규칙

작업은 의미 있는 액션 단위로 나누고, 각 액션이 끝날 때마다 독립적인 커밋을 만든다.

여기서 액션은 사용자가 검토하거나 되돌릴 수 있는 하나의 완결된 변경이다. 파일 한 줄을 바꿀 때마다 커밋하는 것이 아니라, 하나의 목적을 달성한 뒤 커밋한다.

권장 순서:

```bash
git status --short
git diff -- <files>
git diff --check

git add <only-related-files>
git diff --cached --stat
git diff --cached

# 필요한 검증 실행
git commit -m "<type>: <completed action>"
git status --short --branch
```

커밋 규칙:

- 한 커밋에는 한 액션만 포함한다.
- 커밋 전에 staged diff를 반드시 확인한다.
- 작업하지 않은 사용자 변경을 `add`, 수정, 삭제, reset하지 않는다.
- 관련 없는 포맷팅이나 자동 생성 파일을 섞지 않는다.
- 커밋 메시지는 명령형·현재형으로 짧게 쓴다.
- 기본 형식은 `<type>: <action>`이다.
- 문서만 변경하면 `docs: ...`, 브랜치 정책 문서 추가는 `docs: add agent workflow rules`처럼 쓴다.
- 같은 액션을 고치기 위한 후속 커밋은 허용한다. 기존 커밋을 임의로 amend하거나 squash하지 않는다.
- 사용자가 요청하지 않은 force push, remote branch 삭제, 커밋 재작성은 하지 않는다.

예시:

```text
docs: add agent workflow rules
feat: persist copilot conversation context
test: cover stale simulation writes
fix: reject cross-user session access
```

### 액션 분할 예시

큰 작업은 다음처럼 분리한다.

```text
1. docs: document current architecture
2. docs: add agent workflow rules
3. feat: add session persistence endpoint
4. test: cover session ownership and version conflicts
5. fix: handle failed completion persistence
```

각 커밋은 가능하면 독립적으로 빌드·검토·되돌릴 수 있어야 한다. 단, 동작을 완성하기 위해 소스와 테스트가 반드시 함께 바뀌어야 하면 하나의 액션 커밋에 함께 포함한다.

## 5. 변경 전 범위 확인

수정 전에 다음을 확인한다.

- 변경 대상 함수의 모든 caller
- 관련 테스트, fixture, schema, config, export
- API 계약과 frontend 호출부
- 배포 workflow와 환경변수
- 사용자 데이터, 권한, 인증, 저장 데이터에 미칠 영향
- 문서와 코드가 서로 주장하는 범위가 다른지

버그 수정은 호출자를 먼저 검색하고 공유된 원인을 한 곳에서 고친다.

```bash
rg -n "functionName|route-name|type-name" .
```

새로운 분기, 반복문, parser, 금전 계산, 보안 로직, 또는 별도 스크립트를 추가하면 최소 하나의 작은 테스트나 assert를 함께 추가한다.

## 6. 검증과 완료 기준

각 액션 커밋 전에 변경 위험도에 맞는 검증을 실행한다.

```bash
# 문서/설정
git diff --check

# JavaScript/TypeScript 예시
npm run build
npm test

# Python 예시
pytest
```

완료 전에 다음을 확인한다.

- `git status --short`로 의도하지 않은 변경이 없는가
- 모든 액션 단위 변경이 커밋되었는가
- 마지막 커밋의 staged/unstaged 상태가 깨끗한가
- 테스트 또는 검증 결과를 기록했는가
- 남은 위험, 미검증 범위, 수동 확인 사항을 사용자에게 알렸는가

## 7. 금지 사항

다음 명령은 사용자 요청이나 명시적인 승인 없이 실행하지 않는다.

```bash
git reset --hard
git clean -fd
git checkout -- <path>
git restore <path>
git push --force
git branch -D <branch>
```

특히 broad path, 저장소 루트, 작업 디렉터리 전체를 대상으로 하는 삭제·복구 명령을 사용하지 않는다. 사용자 변경을 발견하면 보존하고, 충돌 때문에 진행할 수 없을 때만 상황을 설명하고 방향을 요청한다.

## 8. Git 문서 구성 규칙

Git 관련 문서는 다음 구조를 따른다.

```markdown
# 문서 제목

## 목적과 적용 범위

## 규칙 문서 탐색 순서

## 기본 브랜치 확인

## 브랜치 생성·선택 규칙

## 커밋 단위와 메시지 규칙

## PR·리뷰·머지 규칙

## 검증과 완료 기준

## 예외·위험·수동 확인
```

문서는 다음 원칙을 지킨다.

- 명령어와 규칙을 실제로 실행 가능한 형태로 작성한다.
- 저장소에 존재하지 않는 브랜치 보호, CI, 배포 규칙을 사실처럼 쓰지 않는다.
- 일반 규칙과 저장소별 예외를 분리한다.
- 규칙을 바꾸면 변경 이유와 적용 범위를 함께 기록한다.
- 문서 변경도 액션 단위 커밋으로 남긴다.

## 9. 이 문서의 적용 범위

이 파일은 저장소 루트의 기본 규칙이다. 하위 디렉터리에 더 구체적인 `AGENTS.md`가 있으면 해당 하위 범위에서는 하위 문서가 우선한다. 저장소의 실제 `CONTRIBUTING.md`, `BRANCHING.md`, `CODEOWNERS`, 보호 브랜치 설정이 이 문서와 다르면 더 구체적인 저장소 규칙을 따르고, 차이를 작업 결과에 기록한다.

