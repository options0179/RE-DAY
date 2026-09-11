import test from "node:test";
import assert from "node:assert/strict";
import { authorizeSession } from "./authorization.ts";

test("authorizes a session owned by the authenticated user", () => {
  assert.doesNotThrow(() =>
    authorizeSession(
      { userId: "user-1", tokenIssuedAt: 1 },
      { sessionId: "session-1", ownerId: "user-1" },
    ),
  );
});

test("rejects a session owned by another user", () => {
  assert.throws(
    () =>
      authorizeSession(
        { userId: "user-1", tokenIssuedAt: 1 },
        { sessionId: "session-1", ownerId: "user-2" },
      ),
    /FORBIDDEN/,
  );
});
