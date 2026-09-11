# Copilot Studio action mapping

## Entry action

Create one action named `RE_DAY_StartDay` in the existing orchestration path. It runs once at first entry.

- Method: POST
- URL: https://re-day-api.onrender.com/chat/sessions
- Header: x-api-key (secret), Content-Type: application/json
- Body: conversationId, channel, title
- Output variable: sessionResult

Then call the context action:

- Method: GET
- URL: https://re-day-api.onrender.com/chat/sessions/{conversationId}/context
- Header: x-api-key (secret)
- Output variable: contextResult

The orchestrator may use contextResult.memories and contextResult.summary, but must not expose internal IDs or API secrets.

## Daily completion action

Create one action named `RE_DAY_CompleteDay` and call it only after the final day summary has been generated.

1. POST the final assistant message to `/chat/sessions/{conversationId}/messages`.
2. PUT the final structured summary to `/chat/sessions/{conversationId}/summary`.
3. POST explicit memory candidates to `/users/me/memories` with status pending_confirmation.

A failed request is a blocking error. The Agent must tell the user that saving failed and must not report completion.

## Copilot Studio variables

- `conversationId`: stable per conversation and reused for all actions in the day.
- `userId`: stable per signed-in user; use x-user-id temporarily.
- `finalSummary`: structured result produced by the day review flow.
- `memoryCandidates`: facts explicitly identified for later user confirmation.

## Acceptance test

Start a new day, verify one session document and context lookup, complete the day, verify a message and summary document in Firestore, then repeat the same request to confirm message idempotency.
