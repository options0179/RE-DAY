# RE:DAY 데이터베이스 요약

이 문서는 삭제 예정인 frontend/backend 코드에서 확인한 DB 계약만 보존한다.
실제 데이터, Firebase 서비스 계정, API key, 사용자 식별자는 포함하지 않는다.

## 저장소와 접근 방식

- 저장소: Firebase Firestore
- 서버 접근: Firebase Admin SDK
- 주요 경로: `users/{userId}`, `jobProfiles/{jobId}`, `simulations/{sessionId}`
- 브라우저/Agent가 Firestore에 직접 접근하지 않고, 서버가 사용자 소유권과 입력을 검증한 뒤 접근한다.
- `firestore.rules`는 현재 전체 read/write를 거부한다. 따라서 운영 데이터 접근은 서버 Admin SDK 경로를 전제로 한다.

## 컬렉션 구조

```text
users/{userId}
  /chatSessions/{conversationId}
    /messages/{messageId}
  /memories/{memoryId}
  /preferences/current
  /jobMatches/{matchId}

jobProfiles/{jobId}
  /variants/{variantId}

simulations/{sessionId}
  /scenes/{sceneId}
  /checkpoints/{checkpointId}
  /summaries/{summaryId}
  /achievements/{achievementId}
```

## 핵심 문서 요약

### 사용자와 직무

- `users/{userId}`: 표시 이름, 이메일, 온보딩 완료 여부, 동의 버전, 선호 난이도, 생성/최근 활동 시각
- `preferences/current`: 관심 활동, 선호 환경, 회피 조건, 보유/희망 스킬, 수정 시각
- `jobProfiles/{jobId}`: 직무명, Work24/NCS 코드, 표준 업무, 지식·스킬·태도·도구, 원천 참조와 캐시 만료 시각
- `users/{userId}/jobMatches/{matchId}`: 입력 스냅샷, 후보 직무 점수, 추천 근거, 로직 버전, 원천 참조

### 채팅과 장기 기억

- `chatSessions/{conversationId}`: 소유자, 채널, 연결된 시뮬레이션, 제목·요약, 메시지 수, 상태, 시작/최근 메시지 시각
- `messages/{messageId}`: 역할(`user`/`assistant`/`system`), 원문, sequence, source, 생성 시각
- 메시지는 append-only이며 `messageId`를 재사용하면 중복 저장을 막는 idempotency 기준으로 사용한다.
- `memories/{memoryId}`: 유형, 정규화 key, 값, 신뢰도, 원천 대화/메시지, 상태, 생성·수정·최근 사용 시각
- 기억 상태는 `pending_confirmation`, `confirmed`, `rejected`, `expired`를 사용하며 `confirmed`만 사실 컨텍스트로 취급한다.

### 시뮬레이션

- `simulations/{sessionId}`: 소유자, 직무/variant, 현재 slot·scene, 상태, 경과 시간, 난이도, state version, 분기 정보, 시작/완료/수정 시각
- `scenes/{sceneId}`: incident, 사용자 응답, 분석, consequence, 원천 참조, prompt version, 생성 시각
- 장면 저장은 state version을 비교하는 transaction으로 처리하며, 기존 장면은 immutable로 취급한다.
- `checkpoints/{checkpointId}`: 장면 ID, state version, slot, 경과 시간, 열린 이슈/캐릭터 상태/achievement 참조
- `summaries/{summaryId}`: 시뮬레이션 회고 요약
- `achievements/{achievementId}`: 시뮬레이션에서 확인된 성취

## 데이터 흐름

```text
Agent 또는 frontend
  -> RE:DAY 서버
  -> 인증·소유권·입력 검증
  -> Firebase Admin SDK
  -> Firestore
```

채팅은 `relatedSimulationId`로 시뮬레이션과 연결할 수 있고, 시뮬레이션은
`relatedConversationId`로 시작 대화와 역방향 연결할 수 있다. 원문을 기억 문서에
복사하지 않고 원천 conversation/message ID만 저장해 정정·삭제 기준을 하나로 둔다.

## 인덱스와 보안 상태

- `simulations`에서 `ownerId ASC` + `updatedAt DESC` 조회를 위한 composite index가 정의되어 있다.
- Firestore와 Storage rules는 현재 모두 deny 상태다.
- 개발용 `x-user-id` fallback은 운영 인증으로 사용할 수 없으며, 운영에서는 Firebase ID token의 `uid`를 사용해야 한다.
- 사용자 데이터 삭제 요청에는 chatSessions, messages, memories, preferences, jobMatches, simulations를 소유 범위에서 함께 삭제하는 서버 작업이 필요하다.

## 삭제 후 남는 것

이 브랜치에서는 실행 코드와 설정을 보존하지 않고, 이 문서와 기존 Agent/아키텍처 문서만 보존한다.
DB를 실제로 연결하거나 마이그레이션하지 않으며, 다음 구현은 별도 작업으로 남긴다.

- Gemini 대화 응답의 chat session/message 영구 저장
- 인증된 사용자와 모든 path/resource 소유권 일치 검증
- summary·achievement 구조 검증
- 실제 Firebase 프로젝트, rules, index 배포 검증
- 실제 HRDKorea MCP endpoint와 DB 데이터 연결
