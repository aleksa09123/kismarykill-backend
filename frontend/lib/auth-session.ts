import type { AuthResponse, AuthUser } from "@/lib/types";

export const AUTH_STORAGE_KEY = "kmk_auth_session";

const PLACEHOLDER_TOKENS = ["placeholder", "default-avatar", "/default-avatar", "avatar-default"];
let sessionMemoryCache: AuthResponse | null | undefined;

function parseStoredSession(raw: string): AuthResponse | null {
  try {
    const parsed = JSON.parse(raw) as AuthResponse;
    if (!parsed.access_token || !parsed.user) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function readSession(): AuthResponse | null {
  if (sessionMemoryCache !== undefined) {
    return sessionMemoryCache;
  }

  if (typeof window === "undefined") {
    sessionMemoryCache = null;
    return sessionMemoryCache;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    sessionMemoryCache = null;
    return null;
  }

  const parsed = parseStoredSession(raw);
  if (!parsed) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionMemoryCache = null;
    return null;
  }

  sessionMemoryCache = parsed;
  return parsed;
}

export function writeSession(session: AuthResponse): void {
  sessionMemoryCache = session;
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  sessionMemoryCache = null;
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function patchSessionUser(nextUser: AuthUser): AuthResponse | null {
  const current = readSession();
  if (!current) {
    return null;
  }

  const updated: AuthResponse = {
    ...current,
    user: nextUser
  };
  writeSession(updated);
  return updated;
}

export function refreshSessionFromStorage(): AuthResponse | null {
  sessionMemoryCache = undefined;
  return readSession();
}

export function hasUnlockedProfilePhoto(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }

  const cleaned = url.trim().toLowerCase();
  if (!cleaned) {
    return false;
  }

  return !PLACEHOLDER_TOKENS.some((token) => cleaned.includes(token));
}
