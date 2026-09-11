# RE:DAY delivery architecture

## Runtime boundary

The browser never receives Firebase Admin credentials or external API keys.
User requests enter the application service boundary, where authentication,
session ownership, schema validation, and optimistic state-version checks are
performed before persistence.

The Copilot Agent orchestrates the conversation and Skills. The backend owns
state transitions. The MCP gateway normalizes external job data and exposes
small, explicit tools rather than direct database access.

## MVP flow

`onboarding -> job match -> world selection -> scene loop -> review`

The first vertical slice uses one grounded job and a small fixture dataset. It
must prove persistence, refresh recovery, immutable scenes, and retry branches
before external public-data integrations are added.
