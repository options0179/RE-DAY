const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function currentUserId() {
  if (typeof window === "undefined") return "anonymous-development-user";
  const key = "reday-user-id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const id = `user-${crypto.randomUUID()}`;
  window.localStorage.setItem(key, id);
  return id;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-user-id": currentUserId(),
      ...init?.headers,
    },
  });
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? `Request failed: ${response.status}`);
  return body;
}
