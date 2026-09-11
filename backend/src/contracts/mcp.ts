export interface McpError {
  code:
    | "UNAUTHENTICATED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "CONFLICT"
    | "INVALID_INPUT"
    | "UPSTREAM_UNAVAILABLE";
  message: string;
  retryable: boolean;
}

export interface CreateSimulationSessionRequest {
  ownerId: string;
  jobId: string;
  variantId: string;
  difficulty: number;
}

export interface JobGrounding {
  jobId: string;
  name: string;
  standardTasks: string[];
  knowledge: string[];
  skills: string[];
  sourceRefs: string[];
  sourceUpdatedAt: string;
  cacheExpiresAt: string;
}

export interface FailureSeed {
  seedId: string;
  jobId: string;
  title: string;
  tags: string[];
  sourceRefs: string[];
}
