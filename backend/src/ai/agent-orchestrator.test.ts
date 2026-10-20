import assert from "node:assert/strict";
import test from "node:test";
import type { AgentPrompts } from "./prompt-catalog.ts";
import { AgentOrchestrator } from "./agent-orchestrator.ts";

const prompts: AgentPrompts = {
  mainInstructions: "main instructions",
  skills: [
    { name: "responseanalyzer", content: "response analyzer" },
    { name: "consequencesimulator", content: "consequence simulator" },
  ],
};

test("orchestrates extracted prompts into a validated scene result", async () => {
  let captured = "";
  const orchestrator = new AgentOrchestrator({
    promptCatalog: { load: async () => prompts },
    generate: async ({ systemInstruction, userPrompt }) => {
      captured = `${systemInstruction}\n${userPrompt}`;
      return JSON.stringify({
        skillCalls: ["responseanalyzer", "consequencesimulator"],
        analysis: { behaviorTags: ["질문으로 확인"], immediateEffect: "정보가 명확해진다", delayedEffect: null, relationshipChange: 1, taskChange: 0, evidence: "확인 질문" },
        consequence: { characterReaction: "상대가 설명한다", timeConsumedMinutes: 5, carryOverIssueIds: [], slotComplete: false },
      });
    },
  });

  const result = await orchestrator.analyzeResponse({ jobName: "UX 디자이너", incident: "일정 충돌", responseText: "우선순위를 확인하겠습니다." });
  assert.deepEqual(result.skillCalls, ["responseanalyzer", "consequencesimulator"]);
  assert.equal(result.consequence.timeConsumedMinutes, 5);
  assert.match(captured, /main instructions/);
  assert.match(captured, /UX 디자이너/);
});

test("rejects a skill that was not loaded from the extracted catalog", async () => {
  const orchestrator = new AgentOrchestrator({
    promptCatalog: { load: async () => prompts },
    generate: async () => JSON.stringify({ skillCalls: ["unknown"], analysis: {}, consequence: {} }),
  });
  await assert.rejects(orchestrator.analyzeResponse({ jobName: "직무", incident: "상황", responseText: "응답" }), /unknown skill|invalid Agent result/);
});
