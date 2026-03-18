const KEY = "pt-ai:mvp:attempts";

export type AttemptIndexItem = {
  attemptId: string;
  region: string;
  createdAt: number;
};

export function loadAttemptIndex(): AttemptIndexItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AttemptIndexItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAttemptIndex(items: AttemptIndexItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, 50)));
}

export function addAttemptToIndex(item: AttemptIndexItem) {
  const items = loadAttemptIndex();
  const next = [item, ...items.filter((x) => x.attemptId !== item.attemptId)];
  saveAttemptIndex(next);
}

