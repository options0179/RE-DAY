export interface UserProfile {
  userId: string;
  displayName: string;
  email: string | null;
  onboardingCompleted: boolean;
  consentVersion: string | null;
  preferredDifficulty: number;
  createdAt: string;
  lastActiveAt: string;
}

export interface UserPreferences {
  preferenceId: string;
  interestActivities: string[];
  preferredEnvironments: string[];
  avoidConditions: string[];
  existingSkills: string[];
  desiredSkills: string[];
  updatedAt: string;
}

export interface JobProfile {
  jobId: string;
  name: string;
  normalizedName: string;
  description: string;
  work24Code: string | null;
  ncsCodes: string[];
  standardTasks: string[];
  knowledge: string[];
  skills: string[];
  attitudes: string[];
  tools: string[];
  sourceRefs: string[];
  sourceUpdatedAt: string;
  cacheExpiresAt: string;
  schemaVersion: number;
}

export interface JobMatch {
  matchId: string;
  sourceConversationId?: string;
  inputSnapshot: {
    rawText: string;
    interestActivities: string[];
  };
  candidates: Array<{ jobId: string; score: number; reasons: string[] }>;
  matchingLogicVersion: string;
  sourceRefs: string[];
  createdAt: string;
}
