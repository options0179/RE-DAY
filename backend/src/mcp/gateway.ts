import { randomUUID } from "node:crypto";
import type {
  CreateSimulationSessionRequest,
  JobGrounding,
} from "../contracts/mcp.ts";
import type {
  SaveSceneRequest,
  Scene,
  SimulationState,
} from "../contracts/simulation.ts";
import {
  authorizeSession,
  type AuthenticatedUser,
} from "../security/authorization.ts";
import type { SessionRepository } from "../repositories/session-repository.ts";

const fixtureGrounding: JobGrounding = {
  jobId: "job-ux",
  name: "UX 디자이너",
  standardTasks: ["사용자 조사", "요구사항 정리", "프로토타입 검토"],
  knowledge: ["사용자 문제를 관찰하고 근거를 정리합니다."],
  skills: ["정보 구조화", "협업 커뮤니케이션"],
  sourceRefs: ["fixture:job-ux"],
  sourceUpdatedAt: "2026-09-11T00:00:00.000Z",
  cacheExpiresAt: "2026-09-18T00:00:00.000Z",
};

export class McpGateway {
  private readonly sessions: SessionRepository;

  constructor(sessions: SessionRepository) {
    this.sessions = sessions;
  }

  async createSimulationSession(
    user: AuthenticatedUser,
    request: CreateSimulationSessionRequest,
  ): Promise<SimulationState> {
    if (request.ownerId !== user.userId) {
      throw new Error("FORBIDDEN: owner does not match authenticated user");
    }

    const now = new Date().toISOString();
    return this.sessions.create({
      sessionId: randomUUID(),
      ownerId: user.userId,
      jobId: request.jobId,
      status: "active",
      currentSlotId: "slot-1",
      currentSceneId: null,
      stateVersion: 1,
      parentSessionId: null,
      branchFromSceneId: null,
      updatedAt: now,
    });
  }

  async loadSimulationState(
    user: AuthenticatedUser,
    sessionId: string,
  ): Promise<SimulationState> {
    const state = await this.sessions.get(sessionId);
    authorizeSession(user, state);
    return state;
  }

  async getJobGrounding(jobId: string): Promise<JobGrounding> {
    if (jobId !== fixtureGrounding.jobId) {
      throw new Error(`NOT_FOUND: job grounding not found: ${jobId}`);
    }
    return { ...fixtureGrounding };
  }

  async saveSceneResult(
    user: AuthenticatedUser,
    request: SaveSceneRequest,
    scene: Scene,
    nextState: SimulationState,
  ): Promise<SimulationState> {
    const state = await this.sessions.get(request.sessionId);
    authorizeSession(user, state);
    return this.sessions.saveScene(request, scene, nextState);
  }
}
