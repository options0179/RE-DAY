# RE:DAY 평가 및 출시 점검표

## 자동 회귀 범위

- 인증 사용자와 다른 세션을 조회할 수 없는지 확인
- 오래된 `stateVersion`으로 장면을 덮어쓸 수 없는지 확인
- 체크포인트 롤백이 기존 장면을 삭제하지 않는지 확인
- 재도전 세션에 `parentSessionId`, `branchFromSceneId`가 남는지 확인
- 회고 요약에 사용자 행동 근거가 포함되는지 확인
- 외부 직무 데이터가 정규화되고 캐시 만료 후 갱신되는지 확인

## Copilot/MCP 통합 전 확인

1. Agent가 직접 Firestore Admin 권한을 사용하지 않는지 확인합니다.
2. MCP Tool 요청에 사용자 식별자와 세션 식별자가 포함되는지 확인합니다.
3. Tool 오류가 `UNAUTHENTICATED`, `FORBIDDEN`, `CONFLICT`,
   `UPSTREAM_UNAVAILABLE` 등 명시적인 오류로 전달되는지 확인합니다.
4. `sourceRefs`, `sourceUpdatedAt`, `promptVersion`을 결과에 보존합니다.
5. 사용자 발화에 없는 행동을 분석 근거로 생성하지 않는지 평가합니다.

## 출시 전 점검

- Firebase Rules Emulator와 서버 권한 검증을 함께 실행
- 로그의 이메일·토큰·사용자 원문 마스킹
- Copilot Prompt와 스키마 버전 고정
- 외부 API 호출량·비용·timeout 제한
- 캐시 만료와 장애 시 사용자 안내 확인
- 세션 삭제·보관 정책과 개인정보 동의 버전 확인
