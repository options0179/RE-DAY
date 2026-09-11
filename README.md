# RE:DAY

RE:DAY는 사용자가 관심 있는 직무의 하루를 안전하게 미리 경험하고, 자신의
판단과 소통 방식을 행동 근거 중심으로 돌아보도록 돕는 커리어 시뮬레이션
서비스입니다.

## 서비스 목적과 방향성

- 정답이나 취업 가능성을 판정하지 않고, 여러 직무를 탐색할 기회를 제공합니다.
- Microsoft Copilot Agent는 대화 흐름과 Skill 오케스트레이션을 담당합니다.
- 백엔드는 세션 상태, 권한, 버전 충돌, 회귀를 단일 기준으로 관리합니다.
- MCP Gateway는 직무 데이터와 저장 도구를 명시적인 계약으로 노출합니다.
- MVP에서는 하나의 Orchestrator Agent만 사용하며, Multi-Agent Team은 상태 모델이
  안정된 이후의 확장 대상으로 남깁니다.
- 공공 데이터는 시나리오 원문이 아니라 직무 사실과 현실 조건을 뒷받침하는
  근거로만 사용합니다.

## 현재 구현 범위

- 온보딩 → 직무 선택 → 시뮬레이션 장면 → 응답 분석 → 회고 흐름
- Simulation/Scene/ResponseAnalysis/Consequence 데이터 계약
- 세션 소유권 검증과 optimistic `stateVersion` 충돌 방지
- 체크포인트, 롤백, 부모 세션을 보존하는 재도전 브랜치
- 행동 근거 기반 업적과 회고 요약
- 외부 직무 데이터 정규화 및 24시간 캐시
- 직무·시뮬레이션·회고·히스토리 웹 화면

현재 Firebase Admin, 실제 Copilot Studio 환경, Work24/NCS 운영 API 자격증명은
연결 전입니다. 개발 환경에서는 Fixture Provider와 인메모리 Repository로 핵심
흐름을 검증합니다.

## 디렉터리 구조

```text
RE-DAY/
├─ backend/
│  ├─ src/contracts/       # Agent, MCP, 세션, 회고 데이터 계약
│  ├─ src/security/        # 인증 사용자와 세션 소유권 검증
│  ├─ src/repositories/    # 저장소 추상화와 상태 버전 제어
│  ├─ src/mcp/             # Copilot이 호출하는 명시적 Gateway Tool
│  ├─ src/services/        # 업적·회고 등 도메인 서비스
│  ├─ src/external/        # 외부 직무 데이터 정규화와 캐시
│  └─ .env.example         # 서버 환경변수 예시
├─ frontend/
│  ├─ app/                 # Next.js App Router 화면과 라우트
│  ├─ app/jobs/            # 직무 후보 선택
│  ├─ app/simulation/      # 장면 표시와 사용자 응답
│  ├─ app/review/          # 하루 회고와 재도전 진입
│  └─ app/history/         # 이전 세션 목록
├─ docs/
│  ├─ architecture.md     # 런타임 경계와 MVP 흐름
│  └─ evaluation.md       # 회귀 평가와 출시 점검표
└─ README.md
```

## 로컬 테스트 방법

PowerShell 기준입니다. 각 명령은 해당 디렉터리에서 실행합니다.

### 백엔드 빌드와 테스트

```powershell
Set-Location .\backend
npm install
npm run build
npm test
```

백엔드 테스트는 권한 검증, 상태 버전 충돌, 체크포인트 롤백, 재도전 브랜치,
회고 요약, 외부 데이터 캐시를 검증합니다.

### 프론트엔드 빌드

```powershell
Set-Location .\frontend
npm install
npm run build
```

개발 서버를 실행하려면 다음 명령을 사용합니다.

```powershell
npm run dev
```

브라우저에서 `http://localhost:3000`을 열고 다음 흐름을 확인합니다.

```text
/ → /onboarding → /jobs → /simulation/job-ux → /review/scene-1
```

### 환경변수

실제 연동 전까지는 환경변수가 없어도 Fixture 기반 테스트가 실행됩니다. 외부
연동을 준비할 때 `backend/.env.example`을 복사해 로컬 `.env`를 만들고, 비밀키는
커밋하지 않습니다.

## 브랜치와 PHASE 진행 상태

- `main`: 공통 모노레포 골격
- `backend`: 서버 계약, 저장소, MCP, 회고, 외부 데이터
- `frontend`: 사용자 화면과 수직 슬라이스

PHASE 0~8의 설계와 초기 구현을 완료했습니다. 실제 Firebase/Copilot/공공 API
운영 연결은 별도의 배포 자격증명과 환경 설정이 필요한 다음 통합 작업입니다.

## 안전 원칙

- 브라우저에 Firebase Admin credential과 외부 API 키를 노출하지 않습니다.
- MCP 호출마다 인증 사용자와 세션 소유권을 확인합니다.
- 기존 장면은 immutable로 취급하고 재도전은 새 세션으로 저장합니다.
- Agent 응답은 저장 전에 스키마 검증을 거칩니다.
- 외부 데이터 장애를 조용한 성공으로 처리하지 않고 오류를 드러냅니다.
