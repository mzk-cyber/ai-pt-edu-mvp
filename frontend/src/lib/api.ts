import type {
  Attempt,
  AttemptCreateIn,
  FinalAnswerIn,
  HypothesisItem,
  TestCatalogItem,
} from "@/lib/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "") ||
  "http://127.0.0.1:8000";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return (await res.json()) as T;
}

export const api = {
  createAttempt(payload: AttemptCreateIn) {
    return requestJson<Attempt>("/attempts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  getAttempt(attemptId: string) {
    return requestJson<Attempt>(`/attempts/${encodeURIComponent(attemptId)}`);
  },
  askQuestion(attemptId: string, payload: { topic: string; question_cn: string }) {
    return requestJson<Attempt>(`/attempts/${encodeURIComponent(attemptId)}/questions`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  submitHypotheses(attemptId: string, items: HypothesisItem[]) {
    return requestJson<Attempt>(`/attempts/${encodeURIComponent(attemptId)}/hypotheses`, {
      method: "POST",
      body: JSON.stringify({ items }),
    });
  },
  submitTests(attemptId: string, tests: string[]) {
    return requestJson<Attempt>(`/attempts/${encodeURIComponent(attemptId)}/tests`, {
      method: "POST",
      body: JSON.stringify({ tests }),
    });
  },
  submitFinal(attemptId: string, final: FinalAnswerIn) {
    return requestJson<Attempt>(`/attempts/${encodeURIComponent(attemptId)}/final`, {
      method: "POST",
      body: JSON.stringify(final),
    });
  },
  generateFeedback(attemptId: string) {
    return requestJson<Attempt>(`/attempts/${encodeURIComponent(attemptId)}/feedback`, {
      method: "POST",
    });
  },
  getTestCatalog(region?: string) {
    const q = region ? `?region=${encodeURIComponent(region)}` : "";
    return requestJson<TestCatalogItem[]>(`/catalog/tests${q}`);
  },
};

