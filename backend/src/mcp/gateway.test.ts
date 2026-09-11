import assert from "node:assert/strict";
import test from "node:test";
import { InMemorySessionRepository } from "../repositories/session-repository.ts";
import { McpGateway } from "./gateway.ts";

test("creates and loads a session only for its owner", async () => {
  const gateway = new McpGateway(new InMemorySessionRepository());
  const user = { userId: "user-1", tokenIssuedAt: 1 };
  const created = await gateway.createSimulationSession(user, {
    ownerId: "user-1",
    jobId: "job-ux",
    variantId: "variant-1",
    difficulty: 2,
  });

  const loaded = await gateway.loadSimulationState(user, created.sessionId);
  assert.equal(loaded.ownerId, "user-1");
  await assert.rejects(
    gateway.loadSimulationState(
      { userId: "user-2", tokenIssuedAt: 1 },
      created.sessionId,
    ),
    /FORBIDDEN/,
  );
});

test("returns grounded job data through an explicit tool", async () => {
  const gateway = new McpGateway(new InMemorySessionRepository());
  const grounding = await gateway.getJobGrounding("job-ux");

  assert.equal(grounding.name, "UX 디자이너");
  assert.deepEqual(grounding.sourceRefs, ["fixture:job-ux"]);
});
