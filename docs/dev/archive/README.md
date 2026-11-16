# 과거 개발 기록 보관소

이 디렉터리는 과거 설계와 전환 기록을 내용 보존 목적으로 둔다. 이 문서들은 작성 당시의 근거를 보여 주지만 현행 구조나 실행 방법을 설명하지 않는다. 현재 동작은 코드와 [`../SAD.md`](../SAD.md)를 기준으로 확인한다.

## Agent 전환 기록

[`agent/`](agent/)에는 Copilot Studio 추출 요약, 과거 Gemini/MCP 전환 계획, 당시 구현 격차와 작업 진행 기록을 보관한다. 문서 본문에 기록된 이전 Node/Next.js, Firebase, API 경로와 실행 상태를 현재 코드에 적용하지 않는다.

## 과거 데이터 설계

- [`database-summary.md`](database-summary.md): 이전 Firestore 데이터 계약
- [`firebase-chat-memory-schema.md`](firebase-chat-memory-schema.md): 이전 Firebase 대화·기억 구조
