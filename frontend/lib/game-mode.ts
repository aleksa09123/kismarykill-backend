export type GameMode = "classic" | "vip";

export const ACTIVE_GAME_MODE_STORAGE_KEY = "kmk_active_mode";

export function normalizeGameMode(value: string | null | undefined): GameMode {
  return value === "vip" ? "vip" : "classic";
}

export function readActiveGameMode(): GameMode {
  if (typeof window === "undefined") {
    return "classic";
  }
  return normalizeGameMode(window.localStorage.getItem(ACTIVE_GAME_MODE_STORAGE_KEY));
}

export function writeActiveGameMode(mode: GameMode): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(ACTIVE_GAME_MODE_STORAGE_KEY, mode);
}

