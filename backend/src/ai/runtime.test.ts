import assert from "node:assert/strict";
import test from "node:test";
import { createAgentRuntime, createChatRuntime, createMcpRuntime, parseAllowedTools } from "./runtime.ts";

test("parses a unique MCP allowlist", () => {
  assert.deepEqual(parseAllowedTools("Search qualification, Get exam fee, ,Search qualification"), ["Search qualification", "Get exam fee"]);
});

test("accepts the filled lowercase Gemini key and default model", () => {
  const fakeFetch = async () => new Response("{}", { status: 200 });
  assert.ok(createAgentRuntime({ gemini_api_key: "key" }, fakeFetch));
  assert.ok(createChatRuntime({ GEMINI_API_KEY: "key", GEMINI_MODEL: "model" }, fakeFetch));
  assert.ok(createMcpRuntime({ HRDKOREA_MCP_URL: "https://mcp.test", HRDKOREA_MCP_ALLOWED_TOOLS: "Search qualification" }, fakeFetch));
});
