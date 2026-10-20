import { AgentOrchestrator } from "./agent-orchestrator.ts";
import { AgentChatService } from "./chat-service.ts";
import { GeminiClient } from "./gemini-client.ts";
import { AgentPromptCatalog } from "./prompt-catalog.ts";
import { McpHttpClient } from "../mcp/http-client.ts";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export function parseAllowedTools(value: string | undefined): string[] {
  return [...new Set((value ?? "").split(",").map((tool) => tool.trim()).filter(Boolean))];
}

function envValue(env: NodeJS.ProcessEnv, upper: string, lower: string) { return env[upper] ?? env[lower] ?? ""; }

export function createAgentRuntime(env: NodeJS.ProcessEnv = process.env, fetcher: typeof fetch = fetch) {
  const client = new GeminiClient({ apiKey: envValue(env, "GEMINI_API_KEY", "gemini_api_key"), model: envValue(env, "GEMINI_MODEL", "gemini_model") || DEFAULT_GEMINI_MODEL, fetch: fetcher });
  return new AgentOrchestrator({ generate: (request) => client.generate(request) });
}

export function createChatRuntime(env: NodeJS.ProcessEnv = process.env, fetcher: typeof fetch = fetch) {
  const client = new GeminiClient({ apiKey: envValue(env, "GEMINI_API_KEY", "gemini_api_key"), model: envValue(env, "GEMINI_MODEL", "gemini_model") || DEFAULT_GEMINI_MODEL, fetch: fetcher });
  return new AgentChatService({ promptCatalog: new AgentPromptCatalog(), generate: (request) => client.generate(request) });
}

export function createMcpRuntime(env: NodeJS.ProcessEnv = process.env, fetcher: typeof fetch = fetch) {
  return new McpHttpClient({
    endpoint: env.HRDKOREA_MCP_URL ?? env.COPILOT_MCP_URL ?? "",
    apiKey: env.HRDKOREA_MCP_API_KEY,
    allowedTools: parseAllowedTools(env.HRDKOREA_MCP_ALLOWED_TOOLS),
    fetch: fetcher,
  });
}
