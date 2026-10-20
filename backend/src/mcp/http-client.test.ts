import assert from "node:assert/strict";
import test from "node:test";
import { McpHttpClient } from "./http-client.ts";

test("calls an allowlisted MCP tool over JSON-RPC", async () => {
  let request: { url: string; init: RequestInit } | undefined;
  const client = new McpHttpClient({
    endpoint: "https://mcp.example.test", apiKey: "mcp-key", allowedTools: ["Search qualification"],
    fetch: async (url, init) => { request = { url: String(url), init: init ?? {} }; return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: { content: [{ type: "text", text: "ok" }] } }), { status: 200 }); },
  });
  assert.deepEqual(await client.callTool("Search qualification", { query: "UX" }), { content: [{ type: "text", text: "ok" }] });
  assert.equal(request?.url, "https://mcp.example.test");
  assert.equal((request?.init.headers as Record<string, string>) ["x-api-key"], "mcp-key");
});

test("does not call an unallowlisted tool or an unconfigured endpoint", async () => {
  let called = false;
  const client = new McpHttpClient({ endpoint: "https://mcp.example.test", allowedTools: ["Search qualification"], fetch: async () => { called = true; return new Response("{}", { status: 200 }); } });
  await assert.rejects(client.callTool("Get exam fee", {}), /not allowlisted/);
  assert.equal(called, false);
  await assert.rejects(new McpHttpClient({ endpoint: "", allowedTools: [], fetch }).callTool("Search qualification", {}), /not configured/);
});
