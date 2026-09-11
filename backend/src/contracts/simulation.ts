export type SimulationStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "failed"
  | "archived";

export interface SimulationState {
  sessionId: string;
  ownerId: string;
  relatedConversationId?: string;
  jobId: string;
  variantId?: string;
  worldTitle?: string;
  status: SimulationStatus;
  currentSlotId: string;
  currentSceneId: string | null;
  elapsedMinutes?: number;
  difficulty?: number;
  stateVersion: number;
  parentSessionId: string | null;
  branchFromSceneId: string | null;
  startedAt?: string;
  completedAt?: string | null;
  updatedAt: string;
}

export interface Scene {
  sceneId: string;
  sessionId: string;
  slotId?: string;
  sequence: number;
  incident: {
    title: string;
    visibleSituation: string;
    availableInformation: string[];
    timePressure: string;
  };
  userResponse: {
    rawText: string;
    submittedAt: string;
  };
  analysis: ResponseAnalysis;
  consequence: Consequence;
  sourceRefs: string[];
  promptVersion: string;
  immutable: true;
  createdAt: string;
}

export interface ResponseAnalysis {
  behaviorTags: string[];
  immediateEffect: string;
  delayedEffect: string | null;
  relationshipChange: number;
  taskChange: number;
  evidence: string;
}

export interface Consequence {
  characterReaction: string;
  timeConsumedMinutes: number;
  carryOverIssueIds: string[];
  slotComplete: boolean;
}

export interface SaveSceneRequest {
  sessionId: string;
  expectedStateVersion: number;
  responseText: string;
}

export interface Checkpoint {
  checkpointId: string;
  sessionId: string;
  sceneId: string | null;
  stateVersion: number;
  currentSlotId: string;
  elapsedMinutes: number;
  openIssueIds?: string[];
  characterStateRefs?: Record<string, number>;
  achievementIds?: string[];
  createdAt: string;
}

export interface BranchSimulationRequest {
  sessionId: string;
  sceneId: string;
  ownerId: string;
}
