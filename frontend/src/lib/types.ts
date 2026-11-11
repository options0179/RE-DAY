// Mirrors backend/src/main/java/com/reday/**/dto — see docs/dev/frontend-backend-contract.md.

export interface UserView {
  id: number;
  email: string;
  displayName: string | null;
  emailVerified: boolean;
  consentVersion: string | null;
}

export interface LoginResponse {
  accessToken: string;
  user: UserView;
}

export interface JobSummary {
  id: string;
  name: string;
  category: string;
  summary: string;
}

export interface TaskTimelineItem {
  time: string;
  label: string;
}

export interface JobVariantSummary {
  id: string;
  jobId: string;
  worldTitle: string;
  roleDescription: string;
  taskTimeline: TaskTimelineItem[];
  totalSteps: number;
}

export interface SituationView {
  title: string;
  narrative: string;
  timePressure: string;
}

export type SessionStatus = "BRIEFING" | "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

export interface SessionView {
  id: string;
  status: SessionStatus;
  jobId: string;
  jobName: string;
  variantId: string;
  variantTitle: string;
  roleDescription: string;
  draftResponse: string | null;
  currentStepIndex: number;
  totalSteps: number;
  stateVersion: number;
  parentSessionId: string | null;
  currentSituation: SituationView | null;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface AnalysisView {
  behaviorTags: string[];
  immediateEffect: string;
  delayedEffect: string | null;
  relationshipChange: number;
  taskChange: number;
  evidence: string;
}

export interface OutcomeView {
  characterReaction: string;
  timeConsumedMinutes: number;
  carryOverIssueIds: string[];
  slotComplete: boolean;
  isFinalStep: boolean;
}

export interface StepView {
  id: string;
  sessionId: string;
  stepIndex: number;
  situation: SituationView;
  responseText: string;
  submittedAt: string;
  analysis: AnalysisView;
  outcome: OutcomeView;
  session: SessionView;
}

export interface ConflictView {
  currentStateVersion: number;
  latestStep: StepView | null;
}

export interface SummaryView {
  sessionId: string;
  timelineSummary: string;
  strengths: string[];
  tryNext: string[];
  userReflection: string | null;
  achievementTitles: string[];
  savedAt: string;
}

export interface HistoryItemView {
  sessionId: string;
  jobId: string;
  jobName: string;
  variantTitle: string;
  status: SessionStatus;
  currentStepIndex: number;
  totalSteps: number;
  updatedAt: string;
  completedAt: string | null;
  summaryAvailable: boolean;
}

export interface ActiveSessionView {
  sessionId: string;
  jobName: string;
  variantTitle: string;
  currentStepIndex: number;
  totalSteps: number;
}

export interface HomeSummaryView {
  activeSession: ActiveSessionView | null;
  recentRecords: HistoryItemView[];
}

/** Shape of the 409 body on a stateVersion mismatch. */
export interface ApiConflictError {
  error: string;
  details: ConflictView;
}
