import type { Achievement, SimulationSummary } from "../contracts/review.ts";
import type { Scene } from "../contracts/simulation.ts";

export interface ReviewRepository {
  saveAchievement(achievement: Achievement): Promise<Achievement>;
  saveSummary(summary: SimulationSummary): Promise<SimulationSummary>;
}

export class InMemoryReviewRepository implements ReviewRepository {
  readonly achievements: Achievement[] = [];
  readonly summaries: SimulationSummary[] = [];

  async saveAchievement(achievement: Achievement): Promise<Achievement> {
    this.achievements.push({ ...achievement });
    return { ...achievement };
  }

  async saveSummary(summary: SimulationSummary): Promise<SimulationSummary> {
    this.summaries.push({ ...summary });
    return { ...summary };
  }
}

export class ReviewService {
  private readonly repository: ReviewRepository;

  constructor(repository: ReviewRepository) {
    this.repository = repository;
  }

  async complete(
    sessionId: string,
    jobId: string,
    scenes: readonly Scene[],
    satisfactionScore: number | null,
    userOneLineReview: string | null,
  ): Promise<SimulationSummary> {
    const achievements = await Promise.all(
      scenes.map((scene, index) =>
        this.repository.saveAchievement({
          achievementId: `${sessionId}-achievement-${index + 1}`,
          sessionId,
          title: "일단 보고는 했다",
          description: "문제를 숨기지 않고 관련된 사람에게 상황을 공유했습니다.",
          behaviorEvidence: scene.analysis.evidence,
          sceneId: scene.sceneId,
          earnedAt: new Date().toISOString(),
        }),
      ),
    );

    return this.repository.saveSummary({
      summaryId: `${sessionId}-summary`,
      sessionId,
      jobId,
      behaviorSummary: scenes.map((scene) => scene.analysis.immediateEffect),
      satisfactionScore,
      userOneLineReview,
      achievementIds: achievements.map((achievement) => achievement.achievementId),
      retryCandidateSceneId: scenes.at(-1)?.sceneId ?? null,
      createdAt: new Date().toISOString(),
    });
  }
}
