import assert from "node:assert/strict";
import test from "node:test";
import type { Scene } from "../contracts/simulation.ts";
import { InMemoryReviewRepository, ReviewService } from "./review-service.ts";

const scene: Scene = {
  sceneId: "scene-review",
  sessionId: "session-review",
  sequence: 1,
  incident: {
    title: "확인할 파일",
    visibleSituation: "파일의 변경 범위를 확인해야 합니다.",
    availableInformation: ["파일명"],
    timePressure: "30분 뒤 회의",
  },
  userResponse: {
    rawText: "팀장에게 먼저 상황을 공유하겠습니다.",
    submittedAt: "2026-09-11T00:00:00.000Z",
  },
  analysis: {
    behaviorTags: ["보고"],
    immediateEffect: "상황 공유가 시작됩니다.",
    delayedEffect: null,
    relationshipChange: 1,
    taskChange: 0,
    evidence: "팀장에게 먼저 공유하겠다고 말했습니다.",
  },
  consequence: {
    characterReaction: "확인할 범위를 요청합니다.",
    timeConsumedMinutes: 10,
    carryOverIssueIds: [],
    slotComplete: true,
  },
  sourceRefs: ["fixture:job-ux"],
  promptVersion: "scene-1.0.0",
  immutable: true,
  createdAt: "2026-09-11T00:00:00.000Z",
};

test("completes a session with evidence-based achievements and summary", async () => {
  const repository = new InMemoryReviewRepository();
  const summary = await new ReviewService(repository).complete(
    "session-review",
    "job-ux",
    [scene],
    4,
    "먼저 사실을 확인하는 게 도움이 됐다.",
  );

  assert.deepEqual(summary.behaviorSummary, ["상황 공유가 시작됩니다."]);
  assert.equal(summary.satisfactionScore, 4);
  assert.equal(repository.achievements[0].behaviorEvidence, scene.analysis.evidence);
});
