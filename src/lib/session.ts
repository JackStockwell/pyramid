const SESSION_KEY = "pyramid:sessionId";
const NAME_KEY = "pyramid:name";

// Cached at module scope so the id stays stable for this tab's lifetime,
// even if another tab in the same browser overwrites localStorage.
let cachedSessionId: string | null = null;

export function getSessionId(): string {
  if (cachedSessionId) return cachedSessionId;
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  cachedSessionId = id;
  return id;
}

export function getSavedName(): string {
  return localStorage.getItem(NAME_KEY) ?? "";
}

export function saveName(name: string) {
  localStorage.setItem(NAME_KEY, name);
}
