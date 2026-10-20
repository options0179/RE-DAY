import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { AgentPromptCatalog } from "./prompt-catalog.ts";

test("loads the extracted main instructions and nine skills", async () => {
  const prompts = await new AgentPromptCatalog(resolve(process.cwd(), "../docs/agent")).load();
  assert.match(prompts.mainInstructions, /RE:DAY/);
  assert.deepEqual(prompts.skills.map((skill) => skill.name), [
    "consequencesimulator", "crisisgenerator", "dayreviewcomposer", "jobientresolver",
    "narrativehumanizer", "realityvalidator", "responseanalyzer", "scenegeneerator", "worldbuilder",
  ]);
});

test("fails clearly when the extracted prompt directory is missing", async () => {
  await assert.rejects(new AgentPromptCatalog(resolve(process.cwd(), "../missing-agent-docs")).load(), /Agent prompt directory not found/);
});
