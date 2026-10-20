# DB-free AI Agent workflow plan

## Goal

Restore the extracted RE:DAY Copilot workflow with Gemini and the allowlisted HRDKorea MCP bridge, without restoring persistence, Firebase, Firestore, repositories, or database routes.

## Runtime boundary

```text
frontend chat (optional UI)
        |
        v
backend /ai/chat or /ai/analyze
        |
        +--> extracted main instructions + nine skills
        +--> Gemini generateContent
        +--> MCP tools/call (explicit allowlist only)
```

All requests are stateless. The runtime must not import or call database, repository, Firebase, session, or memory code.

## Actions

1. Define backend package/config and tests for Gemini, prompt loading, orchestration, and MCP allowlisting.
2. Implement the Gemini client and extracted prompt catalog.
3. Implement structured Agent orchestration and chat response flow.
4. Implement the HTTP JSON-RPC MCP bridge and runtime configuration.
5. Add DB-free API routes and a minimal Agent chat entrypoint if the existing frontend contract needs it.
6. Update only the current runtime documentation; retain database documents as historical summaries without wiring them into code.

## Verification

- Run backend native tests and TypeScript checks when the local toolchain is available.
- Search backend/frontend sources for Firebase, Firestore, repository, session, memory, and database imports.
- Check `git diff --check` and keep each action in its own commit.

## Known limits

- MCP protocol support is the extracted HTTP JSON-RPC `tools/call` bridge; server discovery and OAuth are not added without a concrete server contract.
- No Gemini live request is made during implementation, so quota, model availability, and the supplied key remain a manual check.
