# RE:DAY 아키텍처

## 실행 경계

브라우저에는 Firebase Admin 자격증명이나 외부 API 키를 전달하지 않습니다.
요청은 서버 경계로 들어오며, 서버에서 인증·세션 소유권·스키마·상태 버전을
확인한 뒤 저장합니다.

Copilot Agent는 대화 흐름과 Skill 선택을 조정하고, 백엔드는 상태 전이를
소유합니다. MCP Gateway는 외부 직무 데이터와 저장 도구를 작고 명시적인
Tool로 제공합니다.

## MVP 흐름

`온보딩 → 직무 추천 → 세계관 선택 → 장면 진행 → 회고`

첫 수직 슬라이스는 Fixture 직무 데이터로 저장·새로고침 복구·immutable 장면·
재도전 분기를 검증한 뒤 실제 공공 데이터 연동으로 확장합니다.

## 계층별 책임

| 계층 | 책임 |
| --- | --- |
| `frontend/app` | URL, 화면 진입점, 사용자 입력 |
| `backend/contracts` | 웹·Agent·MCP가 공유하는 데이터 형태 |
| `backend/security` | 인증 사용자와 세션 소유권 검증 |
| `backend/repositories` | Firestore로 교체 가능한 저장소 경계 |
| `backend/mcp` | Agent가 호출할 수 있는 명시적 도구 |
| `backend/services` | 업적·회고 같은 도메인 규칙 |
| `backend/external` | 외부 응답 정규화, 출처, 캐시 만료 |

Firebase를 연결할 때도 화면에서 컬렉션 경로를 직접 사용하지 않고 Repository
구현만 교체합니다. 실제 상태 변경은 항상 서버에서 `stateVersion`을 확인합니다.
