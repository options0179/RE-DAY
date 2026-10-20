import assert from "node:assert/strict";
import assertStrict from "node:assert/strict";
import test from "node:test";
import type { AgentPrompts } from "./prompt-catalog.ts";
import { AgentChatService } from "./chat-service.ts";

const prompts: AgentPrompts = { mainInstructions: "main chat instructions", skills: [{ name: "narrativehumanizer", content: "human response" }] };

test("uses extracted instructions for a stateless chat response", async () => {
  let captured = "";
  const service = new AgentChatService({
    promptCatalog: { load: async () => prompts },
    generate: async ({ systemInstruction, userPrompt }) => { captured = `${systemInstruction}\n${userPrompt}`; return "답변"; },
  });
  assertStrict.equal(await service.respond("어떤 직무가 나에게 맞을까?"), "답변");
  assert.match(captured, /main chat instructions/);
  assert.match(captured, /어떤 직무가 나에게 맞을까/);
});

test("rejects an empty chat message", async () => {
  const service = new AgentChatService({ promptCatalog: { load: async () => prompts }, generate: async () => "answer" });
  await assert.rejects(service.respond("  "), /message is required/);
});
