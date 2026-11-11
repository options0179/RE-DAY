import type {
  HistoryItemView,
  HomeSummaryView,
  JobSummary,
  JobVariantSummary,
  LoginResponse,
  SessionView,
  StepView,
  SummaryView,
  UserView,
} from "./types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
const TOKEN_KEY = "reday-token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  // Keep token injection and API error parsing in one place so route components handle domain data only.
  const token = getToken();
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, { ...init, headers: { ...headers, ...init.headers } });
  const hasBody = response.status !== 204;
  const body = hasBody ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message = (body && typeof body === "object" && "error" in body ? String((body as { error: unknown }).error) : null) ?? `request failed (${response.status})`;
    throw new ApiError(response.status, message, body);
  }
  return body as T;
}

export const api = {
  auth: {
    signup: (input: { email: string; password: string; displayName: string }) =>
      request<{ userId: number; devVerificationToken: string }>("/auth/signup", { method: "POST", body: JSON.stringify(input) }),
    verifyEmail: (token: string) => request<void>("/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) }),
    login: (input: { email: string; password: string }) =>
      request<LoginResponse>("/auth/login", { method: "POST", body: JSON.stringify(input) }),
    consent: (version: string) => request<void>("/auth/consent", { method: "POST", body: JSON.stringify({ version }) }),
  },
  home: {
    summary: () => request<HomeSummaryView>("/home/summary"),
  },
  jobs: {
    search: (query: string) => request<JobSummary[]>(`/jobs?query=${encodeURIComponent(query)}`),
    popular: () => request<JobSummary[]>("/jobs/popular"),
    variants: (jobId: string) => request<JobVariantSummary[]>(`/jobs/${jobId}/variants`),
  },
  sessions: {
    create: (input: { jobId: string; variantId: string }) =>
      request<SessionView>("/sessions", { method: "POST", body: JSON.stringify(input) }),
    get: (sessionId: string) => request<SessionView>(`/sessions/${sessionId}`),
    listSteps: (sessionId: string) => request<StepView[]>(`/sessions/${sessionId}/steps`),
    saveDraft: (sessionId: string, text: string) =>
      request<void>(`/sessions/${sessionId}/draft`, { method: "PATCH", body: JSON.stringify({ text }) }),
    submitStep: (sessionId: string, input: { stepIndex: number; expectedStateVersion: number; responseText: string }) =>
      request<StepView>(`/sessions/${sessionId}/steps`, { method: "POST", body: JSON.stringify(input) }),
    retryStep: (sessionId: string, stepIndex: number, input: { expectedStateVersion: number; responseText: string }) =>
      request<StepView>(`/sessions/${sessionId}/steps/${stepIndex}/retry`, { method: "POST", body: JSON.stringify(input) }),
    rollback: (sessionId: string, toStepIndex: number) =>
      request<SessionView>(`/sessions/${sessionId}/rollback`, { method: "POST", body: JSON.stringify({ toStepIndex }) }),
    complete: (sessionId: string) => request<SummaryView>(`/sessions/${sessionId}/complete`, { method: "POST" }),
    getSummary: (sessionId: string) => request<SummaryView>(`/sessions/${sessionId}/summary`),
    updateSummary: (sessionId: string, userReflection: string) =>
      request<SummaryView>(`/sessions/${sessionId}/summary`, { method: "PUT", body: JSON.stringify({ userReflection }) }),
  },
  history: {
    list: (filter: "all" | "byJob" | "recent") => request<HistoryItemView[]>(`/history?filter=${filter}`),
  },
};

export type { UserView };
