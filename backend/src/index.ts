import "dotenv/config";
import cors from "cors";
import express, { type Request } from "express";
import helmet from "helmet";
import { randomUUID } from "node:crypto";
import { getDatabase, getFirebaseAuth } from "./firebase.ts";
import { FirestoreDomainRepository } from "./repositories/firestore-domain-repository.ts";
import { FirestoreChatRepository } from "./repositories/firestore-chat-repository.ts";
import type { JobMatch } from "./contracts/schema.ts";
import type { Scene, SimulationState } from "./contracts/simulation.ts";
import type { ChatMessageRole, MemoryType } from "./contracts/chat.ts";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const defaultUserId = "anonymous-development-user";

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:3000" }));
app.use(express.json());
app.use(async (request, response, next) => {
  if (process.env.NODE_ENV !== "production") {
    next();
    return;
  }
  const authorization = request.header("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    response.status(401).json({ error: "Firebase Auth bearer token is required" });
    return;
  }
  try {
    const decoded = await getFirebaseAuth().verifyIdToken(authorization.slice("Bearer ".length));
    request.headers["x-authenticated-user-id"] = decoded.uid;
    next();
  } catch (error) {
    response.status(401).json({ error: errorMessage(error) });
  }
});

function userId(request: Request) {
  return request.header("x-authenticated-user-id")?.trim() || request.header("x-user-id")?.trim() || defaultUserId;
}

function repository() {
  return new FirestoreDomainRepository(getDatabase());
}

function chatRepository() {
  return new FirestoreChatRepository(getDatabase());
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error";
}

app.get("/health", (_request, response) => response.json({ ok: true, service: "re-day-backend" }));

app.get("/health/firebase", async (_request, response) => {
  try {
    await getDatabase().listCollections();
    response.json({ ok: true, service: "firestore" });
  } catch (error) {
    response.status(503).json({ ok: false, service: "firestore", error: errorMessage(error) });
  }
});

app.post("/chat/sessions", async (request, response) => {
  try {
    const conversationId = String(request.body.conversationId ?? "").trim();
    const channel = String(request.body.channel ?? "copilot-web").trim();
    const relatedSimulationId =
      typeof request.body.relatedSimulationId === "string"
        ? request.body.relatedSimulationId
        : null;
    if (!conversationId || !channel) {
      response.status(400).json({ error: "conversationId and channel are required" });
      return;
    }
    const session = await chatRepository().getOrCreateSession(
      userId(request),
      conversationId,
      channel,
      relatedSimulationId,
    );
    response.status(200).json({ session });
  } catch (error) {
    response.status(503).json({ error: errorMessage(error) });
  }
});

app.get("/chat/sessions/:conversationId/context", async (request, response) => {
  try {
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(String(request.query.limit ?? "20"), 10)),
    );
    response.json({
      context: await chatRepository().getContext(
        userId(request),
        request.params.conversationId,
        Number.isNaN(limit) ? 20 : limit,
      ),
    });
  } catch (error) {
    response.status(404).json({ error: errorMessage(error) });
  }
});

app.post("/chat/sessions/:conversationId/messages", async (request, response) => {
  try {
    const messageId = String(request.body.messageId ?? "").trim();
    const content = String(request.body.content ?? "").trim();
    const role = request.body.role as ChatMessageRole;
    const source = String(request.body.source ?? "copilot").trim();
    const sequence = Number(request.body.sequence);
    if (
      !messageId ||
      !content ||
      !["user", "assistant", "system"].includes(role) ||
      !source ||
      !Number.isInteger(sequence) ||
      sequence < 1
    ) {
      response.status(400).json({
        error: "messageId, content, valid role, source, and positive integer sequence are required",
      });
      return;
    }
    const message = await chatRepository().appendMessage(
      userId(request),
      request.params.conversationId,
      { messageId, content, role, source, sequence },
    );
    response.status(201).json({ message });
  } catch (error) {
    response.status(409).json({ error: errorMessage(error) });
  }
});

app.get("/chat/sessions/:conversationId/messages", async (request, response) => {
  try {
    const parsedLimit = Number.parseInt(String(request.query.limit ?? "20"), 10);
    const limit = Number.isNaN(parsedLimit)
      ? 20
      : Math.min(100, Math.max(1, parsedLimit));
    const messages = await chatRepository().listMessages(
      userId(request),
      request.params.conversationId,
      limit,
    );
    response.json({ messages });
  } catch (error) {
    response.status(404).json({ error: errorMessage(error) });
  }
});

app.put("/chat/sessions/:conversationId/summary", async (request, response) => {
  try {
    const summary = String(request.body.summary ?? "").trim();
    const title =
      typeof request.body.title === "string" ? request.body.title.trim() : null;
    if (!summary) {
      response.status(400).json({ error: "summary is required" });
      return;
    }
    const session = await chatRepository().updateSummary(
      userId(request),
      request.params.conversationId,
      summary,
      title,
    );
    response.json({ session });
  } catch (error) {
    response.status(404).json({ error: errorMessage(error) });
  }
});

app.post("/users/me/memories", async (request, response) => {
  try {
    const type = request.body.type as MemoryType;
    const key = String(request.body.key ?? "").trim();
    const value = String(request.body.value ?? "").trim();
    const sourceConversationId = String(
      request.body.sourceConversationId ?? "",
    ).trim();
    const confidence = Number(request.body.confidence);
    if (
      !["preference", "skill", "goal", "avoidance", "experience", "reflection", "fact"].includes(type) ||
      !key ||
      !value ||
      !sourceConversationId ||
      !Number.isFinite(confidence) ||
      confidence < 0 ||
      confidence > 1
    ) {
      response.status(400).json({
        error: "type, key, value, sourceConversationId, and confidence between 0 and 1 are required",
      });
      return;
    }
    const memory = await chatRepository().createMemory(userId(request), {
      type,
      key,
      value,
      confidence,
      sourceConversationId,
      sourceMessageId:
        typeof request.body.sourceMessageId === "string"
          ? request.body.sourceMessageId
          : null,
      status: "pending_confirmation",
    });
    response.status(201).json({ memory });
  } catch (error) {
    response.status(409).json({ error: errorMessage(error) });
  }
});

app.post("/users/me/memories/:memoryId/:action", async (request, response) => {
  try {
    const action = request.params.action;
    if (action !== "confirm" && action !== "reject") {
      response.status(400).json({ error: "action must be confirm or reject" });
      return;
    }
    const memory = await chatRepository().updateMemoryStatus(
      userId(request),
      request.params.memoryId,
      action === "confirm" ? "confirmed" : "rejected",
    );
    response.json({ memory });
  } catch (error) {
    response.status(404).json({ error: errorMessage(error) });
  }
});

app.get("/jobs", async (_request, response) => {
  try {
    const jobs = await repository().listJobs();
    response.json({ jobs });
  } catch (error) {
    response.status(503).json({ error: errorMessage(error) });
  }
});

app.get("/jobs/:jobId/variants", async (request, response) => {
  try {
    response.json({ variants: await repository().listVariants(request.params.jobId) });
  } catch (error) {
    response.status(404).json({ error: errorMessage(error) });
  }
});

app.post("/users/:requestedUserId/preferences", async (request, response) => {
  try {
    const { rawText = "", interestActivities = [], preferredEnvironments = [], avoidConditions = [], existingSkills = [], desiredSkills = [] } = request.body as Record<string, unknown>;
    const repo = repository();
    const preferences = await repo.upsertPreferences(request.params.requestedUserId, { interestActivities: Array.isArray(interestActivities) ? interestActivities.map(String) : [], preferredEnvironments: Array.isArray(preferredEnvironments) ? preferredEnvironments.map(String) : [], avoidConditions: Array.isArray(avoidConditions) ? avoidConditions.map(String) : [], existingSkills: Array.isArray(existingSkills) ? existingSkills.map(String) : [], desiredSkills: Array.isArray(desiredSkills) ? desiredSkills.map(String) : [] });
    const jobs = await repo.listJobs();
    const text = String(rawText).toLowerCase();
    const candidates = jobs.map((job) => {
      const matches = [...job.standardTasks, ...job.skills, ...job.knowledge].filter((value) => text.includes(value.toLowerCase()));
      return { jobId: job.jobId, score: Math.min(100, 50 + matches.length * 10), reasons: matches.length ? matches.map((value) => `${value} 연관`) : ["직무 프로필 기반 탐색"] };
    }).sort((left, right) => right.score - left.score);
    const match: JobMatch = { matchId: randomUUID(), inputSnapshot: { rawText: String(rawText), interestActivities: preferences.interestActivities }, candidates, matchingLogicVersion: "1.0.0", sourceRefs: jobs.flatMap((job) => job.sourceRefs), createdAt: new Date().toISOString() };
    response.status(201).json({ preferences, match: await repo.saveJobMatch(request.params.requestedUserId, match) });
  } catch (error) {
    response.status(503).json({ error: errorMessage(error) });
  }
});

app.post("/simulations", async (request, response) => {
  try {
    const { jobId, variantId, worldTitle, difficulty = 2 } = request.body as Record<string, unknown>;
    if (typeof jobId !== "string" || typeof variantId !== "string" || typeof worldTitle !== "string") {
      response.status(400).json({ error: "jobId, variantId, and worldTitle are required" });
      return;
    }
    const now = new Date().toISOString();
    const state: SimulationState = { sessionId: randomUUID(), ownerId: userId(request), jobId, variantId, worldTitle, status: "active", currentSlotId: "SLOT_01", currentSceneId: null, elapsedMinutes: 0, difficulty: Number(difficulty), stateVersion: 1, parentSessionId: null, branchFromSceneId: null, startedAt: now, updatedAt: now, completedAt: null };
    response.status(201).json({ simulation: await repository().createSimulation(state) });
  } catch (error) {
    response.status(503).json({ error: errorMessage(error) });
  }
});

app.get("/simulations/:sessionId", async (request, response) => {
  try {
    const repo = repository();
    const simulation = await repo.getSimulation(request.params.sessionId);
    if (simulation.ownerId !== userId(request)) return response.status(403).json({ error: "Forbidden" });
    const variant = simulation.variantId ? await repo.getVariant(simulation.jobId, simulation.variantId) : null;
    response.json({ simulation, variant, scene: await repo.getLatestScene(request.params.sessionId), summary: await repo.getSummary(request.params.sessionId) });
  } catch (error) {
    response.status(404).json({ error: errorMessage(error) });
  }
});

app.post("/simulations/:sessionId/scenes", async (request, response) => {
  try {
    const repo = repository();
    const current = await repo.getSimulation(request.params.sessionId);
    if (current.ownerId !== userId(request)) return response.status(403).json({ error: "Forbidden" });
    const responseText = String(request.body.responseText ?? "").trim();
    if (!responseText) return response.status(400).json({ error: "responseText is required" });
    const now = new Date().toISOString();
    const scene: Scene = { sceneId: randomUUID(), sessionId: current.sessionId, slotId: current.currentSlotId, sequence: (current.stateVersion ?? 1), incident: request.body.incident, userResponse: { rawText: responseText, submittedAt: now }, analysis: request.body.analysis, consequence: request.body.consequence, sourceRefs: Array.isArray(request.body.sourceRefs) ? request.body.sourceRefs : [], promptVersion: String(request.body.promptVersion ?? "pending-agent-analysis"), immutable: true, createdAt: now };
    const nextState = { ...current, currentSceneId: scene.sceneId, stateVersion: (current.stateVersion ?? 1) + 1, updatedAt: now };
    response.status(201).json({ simulation: await repo.saveScene(current.sessionId, scene, nextState), scene });
  } catch (error) {
    response.status(409).json({ error: errorMessage(error) });
  }
});

app.post("/simulations/:sessionId/summary", async (request, response) => {
  try {
    const repo = repository();
    const simulation = await repo.getSimulation(request.params.sessionId);
    if (simulation.ownerId !== userId(request)) return response.status(403).json({ error: "Forbidden" });
    const now = new Date().toISOString();
    const summary = { ...request.body.summary, summaryId: String(request.body.summary?.summaryId ?? randomUUID()), sessionId: simulation.sessionId, jobId: simulation.jobId, createdAt: now };
    const achievements = Array.isArray(request.body.achievements) ? request.body.achievements : [];
    response.status(201).json({ summary: await repo.saveSummary(simulation.sessionId, summary, achievements) });
  } catch (error) {
    response.status(409).json({ error: errorMessage(error) });
  }
});

app.get("/history", async (request, response) => {
  try {
    response.json({ simulations: await repository().listSimulations(userId(request)) });
  } catch (error) {
    response.status(503).json({ error: errorMessage(error) });
  }
});

app.listen(port, () => console.log(`RE:DAY backend listening on port ${port}`));
