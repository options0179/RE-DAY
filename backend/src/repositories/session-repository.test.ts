import assert from "node:assert/strict";
import test from "node:test";
import { ConflictError } from "../errors/domain-errors.ts";
import type { Scene, SimulationState } from "../contracts/simulation.ts";
import { InMemorySessionRepository } from "./session-repository.ts";

const state: SimulationState = {
  sessionId: "session-1",
  ownerId: "user-1",
  jobId: "job-ux",
  status: "active",
  currentSlotId: "slot-1",
  currentSceneId: null,
  stateVersion: 1,
  parentSessionId: null,
  branchFromSceneId: null,
  updatedAt: "2026-09-11T00:00:00.000Z",
};

const scene: Scene = {
  sceneId: "scene-1",
  sessionId: "session-1",
  sequence: 1,
  incident: {
    title: "이전 버전 파일",
    visibleSituation: "잘못된 파일이 공유되었습니다.",
    availableInformation: ["파일명"],
    timePressure: "30분 뒤 회의",
  },
  userResponse: {
    rawText: "먼저 상황을 알리겠습니다.",
    submittedAt: "2026-09-11T00:01:00.000Z",
  },
  analysis: {
    behaviorTags: ["보고"],
    immediateEffect: "상황 공유가 시작됩니다.",
    delayedEffect: null,
    relationshipChange: 1,
    taskChange: 0,
    evidence: "먼저 상황을 알리겠다고 작성했습니다.",
  },
  consequence: {
    characterReaction: "수정 범위를 확인해 달라고 요청합니다.",
    timeConsumedMinutes: 10,
    carryOverIssueIds: [],
    slotComplete: false,
  },
  sourceRefs: ["fixture:job-ux"],
  promptVersion: "scene-1.0.0",
  immutable: true,
  createdAt: "2026-09-11T00:01:00.000Z",
};

test("persists a scene and advances the state version", async () => {
  const repository = new InMemorySessionRepository();
  await repository.create(state);
  const nextState = { ...state, currentSceneId: scene.sceneId, stateVersion: 2 };

  const saved = await repository.saveScene(
    { sessionId: state.sessionId, expectedStateVersion: 1, responseText: "..." },
    scene,
    nextState,
  );

  assert.equal(saved.stateVersion, 2);
  assert.equal((await repository.get(state.sessionId)).currentSceneId, "scene-1");
});

test("rejects a stale write without changing the session", async () => {
  const repository = new InMemorySessionRepository();
  await repository.create(state);

  await assert.rejects(
    repository.saveScene(
      { sessionId: state.sessionId, expectedStateVersion: 0, responseText: "..." },
      scene,
      { ...state, currentSceneId: scene.sceneId, stateVersion: 1 },
    ),
    ConflictError,
  );

  assert.equal((await repository.get(state.sessionId)).stateVersion, 1);
});
