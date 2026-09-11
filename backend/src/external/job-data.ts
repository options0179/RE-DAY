import type { JobGrounding } from "../contracts/mcp.ts";

export interface ExternalJobRecord {
  externalId: string;
  title: string;
  tasks: string[];
  skills: string[];
  source: string;
  updatedAt: string;
}

export interface JobDataProvider {
  findJob(externalId: string): Promise<ExternalJobRecord | null>;
}

export interface CachedJob {
  grounding: JobGrounding;
  expiresAt: number;
}

export class JobGroundingService {
  private readonly cache = new Map<string, CachedJob>();
  private readonly provider: JobDataProvider;

  constructor(provider: JobDataProvider) {
    this.provider = provider;
  }

  async get(jobId: string, now = Date.now()): Promise<JobGrounding> {
    const cached = this.cache.get(jobId);
    if (cached && cached.expiresAt > now) {
      return { ...cached.grounding };
    }

    const record = await this.provider.findJob(jobId);
    if (!record) {
      throw new Error(`NOT_FOUND: external job not found: ${jobId}`);
    }

    const expiresAt = now + 24 * 60 * 60 * 1000;
    const grounding: JobGrounding = {
      jobId: record.externalId,
      name: record.title,
      standardTasks: [...record.tasks],
      knowledge: [],
      skills: [...record.skills],
      sourceRefs: [`${record.source}:${record.externalId}`],
      sourceUpdatedAt: record.updatedAt,
      cacheExpiresAt: new Date(expiresAt).toISOString(),
    };
    this.cache.set(jobId, { grounding, expiresAt });
    return { ...grounding };
  }
}

export class FixtureJobDataProvider implements JobDataProvider {
  async findJob(externalId: string): Promise<ExternalJobRecord | null> {
    if (externalId !== "job-ux") return null;
    return {
      externalId,
      title: "UX 디자이너",
      tasks: ["사용자 조사", "요구사항 정리", "프로토타입 검토"],
      skills: ["정보 구조화", "협업 커뮤니케이션"],
      source: "fixture",
      updatedAt: "2026-09-11T00:00:00.000Z",
    };
  }
}
