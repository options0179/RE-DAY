import type {
  Checkpoint,
  SaveSceneRequest,
  Scene,
  SimulationState,
} from "../contracts/simulation.ts";
import { ConflictError, NotFoundError } from "../errors/domain-errors.ts";

export interface SessionRepository {
  create(state: SimulationState): Promise<SimulationState>;
  get(sessionId: string): Promise<SimulationState>;
  saveScene(
    request: SaveSceneRequest,
    scene: Scene,
    nextState: SimulationState,
  ): Promise<SimulationState>;
  createCheckpoint(checkpoint: Checkpoint): Promise<Checkpoint>;
  rollback(sessionId: string, checkpointId: string): Promise<SimulationState>;
  branch(sessionId: string, sceneId: string, ownerId: string): Promise<SimulationState>;
}

export class InMemorySessionRepository implements SessionRepository {
  private readonly states = new Map<string, SimulationState>();
  private readonly scenes = new Map<string, Scene>();
  private readonly checkpoints = new Map<string, Checkpoint>();

  async create(state: SimulationState): Promise<SimulationState> {
    if (this.states.has(state.sessionId)) {
      throw new ConflictError(`Session already exists: ${state.sessionId}`);
    }

    this.states.set(state.sessionId, { ...state });
    return { ...state };
  }

  async get(sessionId: string): Promise<SimulationState> {
    const state = this.states.get(sessionId);
    if (!state) {
      throw new NotFoundError(`Session not found: ${sessionId}`);
    }

    return { ...state };
  }

  async saveScene(
    request: SaveSceneRequest,
    scene: Scene,
    nextState: SimulationState,
  ): Promise<SimulationState> {
    const current = await this.get(request.sessionId);
    if (current.stateVersion !== request.expectedStateVersion) {
      throw new ConflictError(
        `Stale state version: expected ${request.expectedStateVersion}, current ${current.stateVersion}`,
      );
    }
    if (this.scenes.has(scene.sceneId)) {
      throw new ConflictError(`Scene already exists: ${scene.sceneId}`);
    }
    if (nextState.stateVersion !== current.stateVersion + 1) {
      throw new ConflictError("Next state version must increment by one");
    }

    this.scenes.set(scene.sceneId, { ...scene });
    this.states.set(nextState.sessionId, { ...nextState });
    return { ...nextState };
  }

  async createCheckpoint(checkpoint: Checkpoint): Promise<Checkpoint> {
    const state = await this.get(checkpoint.sessionId);
    if (state.stateVersion !== checkpoint.stateVersion) {
      throw new ConflictError("Checkpoint state version does not match session");
    }
    this.checkpoints.set(checkpoint.checkpointId, { ...checkpoint });
    return { ...checkpoint };
  }

  async rollback(sessionId: string, checkpointId: string): Promise<SimulationState> {
    const state = await this.get(sessionId);
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint || checkpoint.sessionId !== sessionId) {
      throw new NotFoundError(`Checkpoint not found: ${checkpointId}`);
    }

    const rolledBack = {
      ...state,
      currentSceneId: checkpoint.sceneId,
      currentSlotId: checkpoint.currentSlotId,
      stateVersion: state.stateVersion + 1,
      updatedAt: new Date().toISOString(),
    };
    this.states.set(sessionId, rolledBack);
    return { ...rolledBack };
  }

  async branch(
    sessionId: string,
    sceneId: string,
    ownerId: string,
  ): Promise<SimulationState> {
    const source = await this.get(sessionId);
    if (source.ownerId !== ownerId) {
      throw new ConflictError("Cannot branch a session owned by another user");
    }

    const branched: SimulationState = {
      ...source,
      sessionId: `branch-${sessionId}-${sceneId}`,
      parentSessionId: sessionId,
      branchFromSceneId: sceneId,
      currentSceneId: sceneId,
      stateVersion: 1,
      updatedAt: new Date().toISOString(),
    };
    return this.create(branched);
  }
}
