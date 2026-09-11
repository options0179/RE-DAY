import type { Firestore } from "firebase-admin/firestore";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { JobMatch, JobProfile, UserPreferences, UserProfile } from "../contracts/schema.ts";
import type { Scene, SimulationState } from "../contracts/simulation.ts";
import type { Achievement, SimulationSummary } from "../contracts/review.ts";
import { NotFoundError } from "../errors/domain-errors.ts";

const iso = (value: unknown) =>
  value instanceof Timestamp ? value.toDate().toISOString() : String(value);

export class FirestoreDomainRepository {
  constructor(private readonly db: Firestore) {}

  async getUser(userId: string): Promise<UserProfile> {
    const snapshot = await this.db.collection("users").doc(userId).get();
    if (!snapshot.exists) throw new NotFoundError(`User not found: ${userId}`);
    const data = snapshot.data()!;
    return { ...data, userId, createdAt: iso(data.createdAt), lastActiveAt: iso(data.lastActiveAt) } as UserProfile;
  }

  async upsertPreferences(
    userId: string,
    input: Omit<UserPreferences, "preferenceId" | "updatedAt">,
  ): Promise<UserPreferences> {
    const userRef = this.db.collection("users").doc(userId);
    await userRef.set({
      displayName: userId,
      email: null,
      onboardingCompleted: true,
      consentVersion: "2026-09",
      preferredDifficulty: 2,
      createdAt: FieldValue.serverTimestamp(),
      lastActiveAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    const ref = this.db.collection("users").doc(userId).collection("preferences").doc("current");
    await ref.set({ ...input, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return { ...input, preferenceId: ref.id, updatedAt: new Date().toISOString() };
  }

  async listJobs(): Promise<JobProfile[]> {
    const snapshots = await this.db.collection("jobProfiles").get();
    return snapshots.docs.map((doc) => {
      const data = doc.data();
      return { ...data, jobId: doc.id, sourceUpdatedAt: iso(data.sourceUpdatedAt), cacheExpiresAt: iso(data.cacheExpiresAt) } as JobProfile;
    });
  }

  async saveJobMatch(userId: string, match: Omit<JobMatch, "createdAt">): Promise<JobMatch> {
    const ref = this.db.collection("users").doc(userId).collection("jobMatches").doc(match.matchId);
    await ref.set({ ...match, createdAt: FieldValue.serverTimestamp() });
    return { ...match, createdAt: new Date().toISOString() };
  }

  async getJob(jobId: string): Promise<JobProfile> {
    const snapshot = await this.db.collection("jobProfiles").doc(jobId).get();
    if (!snapshot.exists) throw new NotFoundError(`Job profile not found: ${jobId}`);
    const data = snapshot.data()!;
    return { ...data, jobId, sourceUpdatedAt: iso(data.sourceUpdatedAt), cacheExpiresAt: iso(data.cacheExpiresAt) } as JobProfile;
  }

  async listVariants(jobId: string): Promise<Array<Record<string, unknown>>> {
    const snapshots = await this.db.collection("jobProfiles").doc(jobId).collection("variants").get();
    return snapshots.docs.map((doc) => ({ variantId: doc.id, ...doc.data() }));
  }

  async getVariant(jobId: string, variantId: string): Promise<Record<string, unknown>> {
    const snapshot = await this.db.collection("jobProfiles").doc(jobId).collection("variants").doc(variantId).get();
    if (!snapshot.exists) throw new NotFoundError(`Variant not found: ${variantId}`);
    return { variantId, ...snapshot.data() };
  }

  async createSimulation(state: SimulationState): Promise<SimulationState> {
    await this.db.collection("simulations").doc(state.sessionId).create({
      ...state,
      startedAt: Timestamp.fromDate(new Date(state.startedAt ?? new Date().toISOString())),
      updatedAt: Timestamp.fromDate(new Date(state.updatedAt)),
    });
    return state;
  }

  async getSimulation(sessionId: string): Promise<SimulationState> {
    const snapshot = await this.db.collection("simulations").doc(sessionId).get();
    if (!snapshot.exists) throw new NotFoundError(`Simulation not found: ${sessionId}`);
    const data = snapshot.data()!;
    return { ...data, sessionId, startedAt: iso(data.startedAt), updatedAt: iso(data.updatedAt), completedAt: data.completedAt ? iso(data.completedAt) : null } as SimulationState;
  }

  async listSimulations(ownerId: string): Promise<SimulationState[]> {
    const snapshots = await this.db.collection("simulations").where("ownerId", "==", ownerId).orderBy("updatedAt", "desc").get();
    return snapshots.docs.map((doc) => {
      const data = doc.data();
      return { ...data, sessionId: doc.id, startedAt: iso(data.startedAt), updatedAt: iso(data.updatedAt), completedAt: data.completedAt ? iso(data.completedAt) : null } as SimulationState;
    });
  }

  async getLatestScene(sessionId: string): Promise<Scene | null> {
    const snapshots = await this.db.collection("simulations").doc(sessionId).collection("scenes").orderBy("sequence", "desc").limit(1).get();
    if (snapshots.empty) return null;
    const data = snapshots.docs[0].data();
    return { ...data, sceneId: snapshots.docs[0].id, createdAt: iso(data.createdAt), userResponse: { ...data.userResponse, submittedAt: iso(data.userResponse.submittedAt) } } as Scene;
  }

  async saveScene(sessionId: string, scene: Scene, nextState: SimulationState): Promise<SimulationState> {
    const sessionRef = this.db.collection("simulations").doc(sessionId);
    const sceneRef = sessionRef.collection("scenes").doc(scene.sceneId);
    await this.db.runTransaction(async (transaction) => {
      const currentSnapshot = await transaction.get(sessionRef);
      if (!currentSnapshot.exists) throw new NotFoundError(`Simulation not found: ${sessionId}`);
      const current = currentSnapshot.data() as SimulationState;
      if (current.stateVersion + 1 !== nextState.stateVersion) throw new Error("CONFLICT: stateVersion mismatch");
      transaction.create(sceneRef, { ...scene, createdAt: Timestamp.fromDate(new Date(scene.createdAt)), userResponse: { ...scene.userResponse, submittedAt: Timestamp.fromDate(new Date(scene.userResponse.submittedAt)) } });
      transaction.set(sessionRef, { ...nextState, updatedAt: Timestamp.fromDate(new Date(nextState.updatedAt)) });
    });
    return nextState;
  }

  async saveSummary(sessionId: string, summary: SimulationSummary, achievements: Achievement[]): Promise<SimulationSummary> {
    const sessionRef = this.db.collection("simulations").doc(sessionId);
    const batch = this.db.batch();
    batch.set(sessionRef.collection("summaries").doc(summary.summaryId), { ...summary, createdAt: Timestamp.fromDate(new Date(summary.createdAt)) });
    for (const achievement of achievements) batch.set(sessionRef.collection("achievements").doc(achievement.achievementId), { ...achievement, earnedAt: Timestamp.fromDate(new Date(achievement.earnedAt)) });
    await batch.commit();
    return summary;
  }

  async getSummary(sessionId: string): Promise<SimulationSummary | null> {
    const snapshots = await this.db.collection("simulations").doc(sessionId).collection("summaries").orderBy("createdAt", "desc").limit(1).get();
    if (snapshots.empty) return null;
    const data = snapshots.docs[0].data();
    return { ...data, summaryId: snapshots.docs[0].id, createdAt: iso(data.createdAt) } as SimulationSummary;
  }
}
