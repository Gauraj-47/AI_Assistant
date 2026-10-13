import type { DashboardStats, Farmer } from "../types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new Error("Could not reach the dashboard API. Make sure the backend is running.");
  }

  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | T
    | null;
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? payload.error
        : undefined;
    throw new Error(message || `Request failed (${response.status}).`);
  }
  if (payload === null) throw new Error("The server returned an empty response.");
  return payload as T;
}

export async function getFarmers(): Promise<Farmer[]> {
  const result = await request<{ farmers: Farmer[] }>("/api/farmers");
  return result.farmers;
}

export function getDashboardStats(): Promise<DashboardStats> {
  return request<DashboardStats>("/api/dashboard/stats");
}

export async function askSanjivani(question: string): Promise<string> {
  const result = await request<{ answer: string }>("/api/ai/ask", {
    method: "POST",
    body: JSON.stringify({ question }),
  });
  return result.answer;
}
