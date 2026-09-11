import assert from "node:assert/strict";
import test from "node:test";
import type { Checkpoint, SimulationState } from "../contracts/simulation.ts";
import { InMemorySessionRepository } from "./session-repository.ts";

const state: SimulationState = {
  sessionId: "session-recovery",
  ownerId: "user-1",
  jobId: "job-ux",
  status: "active",
  currentSlotId: "slot-2",
  currentSceneId: "scene-2",
  stateVersion: 2,
  parentSessionId: null,
  branchFromSceneId: null,
  updatedAt: "2026-09-11T00:00:00.000Z",
};

test("rolls a session back to a checkpoint without overwriting scenes", async () => {
  const repository = new InMemorySessionRepository();
  await repository.create(state);
  const checkpoint: Checkpoint = {
    checkpointId: "checkpoint-1",
    sessionId: state.sessionId,
    sceneId: "scene-1",
    stateVersion: 2,
    currentSlotId: "slot-1",
    elapsedMinutes: 30,
    createdAt: "2026-09-11T00:02:00.000Z",
  };

  await repository.createCheckpoint(checkpoint);
  const restored = await repository.rollback(state.sessionId, checkpoint.checkpointId);

  assert.equal(restored.currentSceneId, "scene-1");
  assert.equal(restored.currentSlotId, "slot-1");
  assert.equal(restored.stateVersion, 3);
});

test("creates a traceable child session for retry", async () => {
  const repository = new InMemorySessionRepository();
  await repository.create(state);
  const branch = await repository.branch(state.sessionId, "scene-1", "user-1");

  assert.equal(branch.parentSessionId, state.sessionId);
  assert.equal(branch.branchFromSceneId, "scene-1");
  assert.equal(branch.stateVersion, 1);
});
