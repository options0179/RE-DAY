import type { Firestore } from "firebase-admin/firestore";
import type {
  Checkpoint,
  SaveSceneRequest,
  Scene,
  SimulationState,
} from "../contracts/simulation.ts";
import { ConflictError, NotFoundError } from "../errors/domain-errors.ts";
import type { SessionRepository } from "./session-repository.ts";

export class FirestoreSessionRepository implements SessionRepository {
  constructor(private readonly db: Firestore) {}

  private sessionRef(sessionId: string) {
    return this.db.collection("simulations").doc(sessionId);
  }

  async create(state: SimulationState): Promise<SimulationState> {
    const ref = this.sessionRef(state.sessionId);
    await this.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (snapshot.exists) {
        throw new ConflictError(`Session already exists: ${state.sessionId}`);
      }
      transaction.create(ref, state);
    });
    return { ...state };
  }

  async get(sessionId: string): Promise<SimulationState> {
    const snapshot = await this.sessionRef(sessionId).get();
    if (!snapshot.exists) {
      throw new NotFoundError(`Session not found: ${sessionId}`);
    }
    return snapshot.data() as SimulationState;
  }

  async saveScene(
    request: SaveSceneRequest,
    scene: Scene,
    nextState: SimulationState,
  ): Promise<SimulationState> {
    const sessionRef = this.sessionRef(request.sessionId);
    const sceneRef = sessionRef.collection("scenes").doc(scene.sceneId);

    await this.db.runTransaction(async (transaction) => {
      const sessionSnapshot = await transaction.get(sessionRef);
      if (!sessionSnapshot.exists) {
        throw new NotFoundError(`Session not found: ${request.sessionId}`);
      }
      const current = sessionSnapshot.data() as SimulationState;
      if (current.stateVersion !== request.expectedStateVersion) {
        throw new ConflictError(
          `Stale state version: expected ${request.expectedStateVersion}, current ${current.stateVersion}`,
        );
      }
      if (nextState.stateVersion !== current.stateVersion + 1) {
        throw new ConflictError("Next state version must increment by one");
      }
      const existingScene = await transaction.get(sceneRef);
      if (existingScene.exists) {
        throw new ConflictError(`Scene already exists: ${scene.sceneId}`);
      }
      transaction.create(sceneRef, scene);
      transaction.set(sessionRef, nextState);
    });

    return { ...nextState };
  }

  async createCheckpoint(checkpoint: Checkpoint): Promise<Checkpoint> {
    const session = await this.get(checkpoint.sessionId);
    if (session.stateVersion !== checkpoint.stateVersion) {
      throw new ConflictError("Checkpoint state version does not match session");
    }
    await this.sessionRef(checkpoint.sessionId)
      .collection("checkpoints")
      .doc(checkpoint.checkpointId)
      .create(checkpoint);
    return { ...checkpoint };
  }

  async rollback(sessionId: string, checkpointId: string): Promise<SimulationState> {
    const sessionRef = this.sessionRef(sessionId);
    const checkpointRef = sessionRef.collection("checkpoints").doc(checkpointId);
    const result = await this.db.runTransaction(async (transaction) => {
      const [sessionSnapshot, checkpointSnapshot] = await Promise.all([
        transaction.get(sessionRef),
        transaction.get(checkpointRef),
      ]);
      if (!sessionSnapshot.exists) {
        throw new NotFoundError(`Session not found: ${sessionId}`);
      }
      if (!checkpointSnapshot.exists) {
        throw new NotFoundError(`Checkpoint not found: ${checkpointId}`);
      }
      const state = sessionSnapshot.data() as SimulationState;
      const checkpoint = checkpointSnapshot.data() as Checkpoint;
      if (checkpoint.sessionId !== sessionId) {
        throw new NotFoundError(`Checkpoint not found: ${checkpointId}`);
      }
      const rolledBack = {
        ...state,
        currentSceneId: checkpoint.sceneId,
        currentSlotId: checkpoint.currentSlotId,
        stateVersion: state.stateVersion + 1,
        updatedAt: new Date().toISOString(),
      };
      transaction.set(sessionRef, rolledBack);
      return rolledBack;
    });
    return result;
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
