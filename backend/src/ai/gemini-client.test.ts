import assert from "node:assert/strict";
import test from "node:test";
import { GeminiClient } from "./gemini-client.ts";

test("sends the extracted Agent instruction to Gemini", async () => {
  let request: { url: string; init: RequestInit } | undefined;
  const client = new GeminiClient({
    apiKey: "test-key",
    model: "test-model",
    fetch: async (url, init) => {
      request = { url: String(url), init: init ?? {} };
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "generated answer" }] } }] }), { status: 200 });
    },
  });

  assert.equal(await client.generate({ systemInstruction: "RE:DAY", userPrompt: "scene" }), "generated answer");
  assert.equal(request?.url, "https://generativelanguage.googleapis.com/v1beta/models/test-model:generateContent?key=test-key");
  assert.deepEqual(JSON.parse(String(request?.init.body)), {
    systemInstruction: { parts: [{ text: "RE:DAY" }] },
    contents: [{ role: "user", parts: [{ text: "scene" }] }],
  });
});

test("rejects missing Gemini configuration and upstream errors", async () => {
  const missingKey = new GeminiClient({ apiKey: "", model: "test-model", fetch });
  await assert.rejects(missingKey.generate({ systemInstruction: "system", userPrompt: "user" }), /GEMINI_API_KEY is required/);

  const failing = new GeminiClient({
    apiKey: "test-key",
    model: "test-model",
    fetch: async () => new Response(JSON.stringify({ error: { message: "quota exceeded" } }), { status: 429 }),
  });
  await assert.rejects(failing.generate({ systemInstruction: "system", userPrompt: "user" }), /Gemini request failed \(429\): quota exceeded/);
});
