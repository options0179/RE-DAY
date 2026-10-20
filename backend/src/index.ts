import cors from "cors";
import dotenv from "dotenv";
import express, { type Request } from "express";
import helmet from "helmet";
import { resolve } from "node:path";
import { createAgentRuntime, createChatRuntime, createMcpRuntime } from "./ai/runtime.ts";

dotenv.config({ path: resolve(process.cwd(), ".env") });
if (!process.env.GEMINI_API_KEY && !process.env.gemini_api_key) dotenv.config({ path: resolve(process.cwd(), "../.env") });

export const app = express();
const port = Number(process.env.PORT ?? 4000);
const agentRuntime = createAgentRuntime();
const chatRuntime = createChatRuntime();
const mcpRuntime = createMcpRuntime();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:3000" }));
app.use(express.json({ limit: "256kb" }));

function errorMessage(error: unknown) { return error instanceof Error ? error.message : "Unexpected server error"; }
function requiredText(value: unknown) { return typeof value === "string" ? value.trim() : ""; }

app.get("/health", (_request, response) => response.json({ ok: true, service: "re-day-ai" }));

app.post("/ai/chat", async (request, response) => {
  try {
    const message = requiredText(request.body?.message);
    if (!message) { response.status(400).json({ error: "message is required" }); return; }
    response.json({ message: await chatRuntime.respond(message), source: "gemini-agent" });
  } catch (error) { response.status(502).json({ error: errorMessage(error) }); }
});

app.post("/ai/analyze", async (request, response) => {
  try {
    const jobName = requiredText(request.body?.jobName);
    const incident = requiredText(request.body?.incident);
    const responseText = requiredText(request.body?.responseText);
    if (!jobName || !incident || !responseText) { response.status(400).json({ error: "jobName, incident, and responseText are required" }); return; }
    response.json(await agentRuntime.analyzeResponse({ jobName, incident, responseText }));
  } catch (error) { response.status(502).json({ error: errorMessage(error) }); }
});

app.post("/mcp/tools/:toolName", async (request: Request, response) => {
  try {
    const args = request.body?.args ?? {};
    if (typeof args !== "object" || args === null || Array.isArray(args)) { response.status(400).json({ error: "args must be an object" }); return; }
    const toolName = decodeURIComponent(request.params.toolName);
    response.json({ toolName, result: await mcpRuntime.callTool(toolName, args as Record<string, unknown>) });
  } catch (error) { response.status(502).json({ error: errorMessage(error) }); }
});

app.listen(port, () => console.log(`RE:DAY AI listening on ${port}`));
