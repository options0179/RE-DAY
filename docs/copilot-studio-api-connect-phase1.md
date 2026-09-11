# Copilot Studio API connection plan

This branch adds the Copilot Studio integration plan on top of
`firebase-db-connect`.

## Phase 1 - conversation entry

The first action runs once when a new RE:DAY day starts, before the first
simulation response.

1. Create or reuse a stable `conversationId` for the Copilot conversation.
2. Call `POST https://re-day-api.onrender.com/chat/sessions`.
3. Pass the Copilot user identifier as `x-user-id` until Firebase Auth UID is
   available.
4. Call `GET /chat/sessions/{conversationId}/context` and expose returned
   memories and summary to the orchestrator.
5. Do not continue the day if session or context persistence fails.

### Session request

`POST /chat/sessions`

`x-api-key` must be configured as a secret in the Copilot action:

```json
{
  "conversationId": "<conversationId>",
  "channel": "copilot-studio",
  "title": "RE:DAY daily simulation"
}
```

## Phase 2 - daily completion

The second action runs only after the user has completed the day and the final
summary is ready.

1. Save the final Copilot answer with
   `POST /chat/sessions/{conversationId}/messages`.
2. Save the structured day summary with
   `PUT /chat/sessions/{conversationId}/summary`.
3. Save only explicitly detected long-term facts as memory candidates with
   `POST /users/me/memories`.
4. Never mark a memory as confirmed without user confirmation.

### Summary request

`PUT /chat/sessions/{conversationId}/summary`

```json
{
  "summary": "<final day summary>",
  "keyPoints": ["<point>"],
  "nextActions": ["<action>"],
  "completedAt": "<ISO-8601>"
}
```

## Required action headers

- `x-api-key`: Render secret `COPILOT_API_KEY`
- `x-user-id`: temporary stable user ID, replaced by Firebase Auth UID later
- `Content-Type: application/json`

## Failure policy

The Agent must surface a persistence failure and stop the affected flow. It
must not claim that the day started or completed when an API call failed.

## Copilot Studio UI verification

The Agent Build screen exposes external tools through **Add a tool**. The
available options observed for this environment are:

- **HTTP** connector action
- **HTTP + Swagger** connector action
- **HTTP Webhook**
- Workflows that use the `When an agent calls the workflow` trigger

No eligible workflow was available in the environment during verification.
The generic HTTP connector was added for inspection, but Copilot Studio could
not load its contract and returned a 404. Do not use that incomplete tool.
Prefer **HTTP + Swagger** with a reviewed OpenAPI contract for the RE:DAY
endpoints. Configure `x-api-key` as a Copilot secret and never place its value
in the OpenAPI document, source code, or a chat response.

The upload-ready contract is `docs/copilot-studio-openapi.json`. Its operation
IDs include `RE_DAY_StartDay` and `RE_DAY_CompleteDay`; the context, summary,
and memory operations are separate connector operations that must be composed
after the authenticated action editor or an eligible agent-call workflow is
available.

The action editor and topic orchestration still require an authenticated
Copilot Studio session with the connector contract loaded. Until that editor
is available, no `RE_DAY_StartDay` or `RE_DAY_CompleteDay` action should be
reported as successfully created.
