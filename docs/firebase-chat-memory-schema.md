# Firebase 채팅·사용자 기억 설계

이 문서는 Copilot Studio에서 사용하는 실제 대화 데이터를 RE:DAY 백엔드와
Firestore에 누적하기 위한 데이터베이스 계약이다. 개발·운영 모두 Firebase
Admin SDK를 통해 Firestore에 기록하며, fixture/in-memory/mock 저장소를 사용하지
않는다.

## 데이터 흐름

```text
Copilot Studio Action
  -> RE:DAY Backend
  -> Firebase Admin SDK
  -> Firestore
```

Copilot Studio가 Firestore에 직접 접근하지 않는 이유는 서비스 계정 키와
사용자별 권한 검증을 브라우저/에이전트에 노출하지 않기 위해서다.

## 컬렉션 구조

```text
users/{userId}
  /chatSessions/{conversationId}
    /messages/{messageId}
  /memories/{memoryId}
  /preferences/current
  /jobMatches/{matchId}

simulations/{sessionId}
  /scenes/{sceneId}
  /summaries/{summaryId}
  /achievements/{achievementId}
```

## chatSessions 문서

경로: `users/{userId}/chatSessions/{conversationId}`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `conversationId` | string | Copilot 대화 ID. 같은 대화의 모든 요청에서 유지 |
| `userId` | string | Firebase Auth UID |
| `channel` | string | `copilot-web` 등 호출 채널 |
| `relatedSimulationId` | string/null | 연결된 시뮬레이션 |
| `title` | string/null | 대화 제목 |
| `summary` | string/null | 최근 대화 요약 |
| `messageCount` | number | 저장된 메시지 수 |
| `status` | `active`/`closed` | 대화 상태 |
| `startedAt` | timestamp | 최초 생성 시각 |
| `lastMessageAt` | timestamp | 마지막 메시지 시각 |
| `summaryUpdatedAt` | timestamp/null | 요약 갱신 시각 |

## messages 문서

경로: `users/{userId}/chatSessions/{conversationId}/messages/{messageId}`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `messageId` | string | Copilot 메시지 ID. 없으면 호출자가 idempotency key로 생성 |
| `conversationId` | string | 상위 대화 ID |
| `userId` | string | 소유자 UID |
| `role` | `user`/`assistant`/`system` | 메시지 발화자 |
| `content` | string | 원문 메시지 |
| `sequence` | number | 대화 내 순서 |
| `source` | string | `copilot` 등 |
| `createdAt` | timestamp | 서버 기록 시각 |

메시지는 append-only로 저장한다. 동일 `messageId`가 재전송되면 기존 문서를
반환하여 Copilot 재시도에 의한 중복을 방지한다.

## memories 문서

경로: `users/{userId}/memories/{memoryId}`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `type` | enum | `preference`, `skill`, `goal`, `avoidance`, `experience`, `reflection`, `fact` |
| `key` | string | 정규화된 기억 키 |
| `value` | string | 사용자에 대한 기억 내용 |
| `confidence` | number | 0~1 추출 신뢰도 |
| `sourceConversationId` | string | 기억이 나온 대화 |
| `sourceMessageId` | string/null | 기억이 나온 메시지 |
| `status` | enum | `pending_confirmation`, `confirmed`, `rejected`, `expired` |
| `createdAt` | timestamp | 생성 시각 |
| `updatedAt` | timestamp | 상태/내용 갱신 시각 |
| `lastUsedAt` | timestamp/null | Copilot 컨텍스트에 사용된 시각 |

장기 기억은 원문 메시지와 분리한다. Copilot은 `confirmed` 기억만 사실처럼
사용하고, `pending_confirmation`은 사용자 확인 전까지 제안으로만 취급한다.

## API 계약

| Method | Path | 용도 |
| --- | --- | --- |
| POST | `/chat/sessions` | 대화 생성 또는 기존 대화 복구 |
| GET | `/chat/sessions/:conversationId/context` | 요약·확정 기억·최근 메시지 조회 |
| POST | `/chat/sessions/:conversationId/messages` | 사용자/assistant 메시지 누적 |
| GET | `/chat/sessions/:conversationId/messages` | 최근 메시지 조회 |
| PUT | `/chat/sessions/:conversationId/summary` | 대화 요약 갱신 |
| POST | `/users/me/memories` | 기억 후보 저장 |
| POST | `/users/me/memories/:memoryId/:action` | 기억 confirm/reject |

운영 환경에서는 Firebase ID token의 `uid`를 `userId`로 사용한다. 개발 환경의
`x-user-id` fallback은 로컬 검증용이며 운영 배포에서는 허용하지 않는다.

## 기존 RE:DAY 데이터와 연결

- 대화 세션은 `relatedSimulationId`로 시뮬레이션과 연결한다.
- 대화에서 추출한 직무 관심은 기존 `users/{userId}/jobMatches`에
  `sourceConversationId`를 추가해 연결한다.
- 시뮬레이션 장면과 회고는 기존 `simulations/{sessionId}` 하위 구조를
  유지하며, 원본 대화 ID를 메타데이터로 보존한다.

## 삭제·보존

사용자 데이터 삭제 요청 시 `chatSessions`, `messages`, `memories`,
`preferences`, `jobMatches`, `simulations`를 사용자 소유 범위에서 함께
삭제할 수 있는 서버 작업을 제공해야 한다. 원문 메시지를 기억 문서에
복사하지 않고 source ID만 보존하여 정정·삭제의 기준을 하나로 유지한다.
