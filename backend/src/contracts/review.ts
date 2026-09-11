export interface Achievement {
  achievementId: string;
  sessionId: string;
  title: string;
  description: string;
  behaviorEvidence: string;
  sceneId: string;
  earnedAt: string;
}

export interface SimulationSummary {
  summaryId: string;
  sessionId: string;
  jobId: string;
  behaviorSummary: string[];
  satisfactionScore: number | null;
  userOneLineReview: string | null;
  achievementIds: string[];
  retryCandidateSceneId: string | null;
  createdAt: string;
}
