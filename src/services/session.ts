const SESSION_KEY = "gastrolink.session.v1";

export interface SessionRecord {
  userId: string;
  idToken: string | null;
  refreshToken: string | null;
}

export function readSession(): SessionRecord | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionRecord;
    if (!parsed?.userId) return null;
    return {
      userId: parsed.userId,
      idToken: parsed.idToken ?? null,
      refreshToken: parsed.refreshToken ?? null,
    };
  } catch {
    return null;
  }
}

export function writeSession(session: SessionRecord) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
