import { refreshTokenApi } from "./auth-api";
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken } from "./auth-storage";
import { notifySessionExpired } from "./auth-session";

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

function decodeTokenExpiry(token: string): number | null {
  try {
    const segment = token.split(".")[1];
    if (!segment) return null;
    const payload = JSON.parse(atob(segment.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function clearRefreshSchedule() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

export async function refreshAccessTokenNow(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const result = await refreshTokenApi(refreshToken);
    setAccessToken(result.accessToken);
    setRefreshToken(result.refreshToken);
    scheduleTokenRefresh();
    return true;
  } catch {
    return false;
  }
}

export function scheduleTokenRefresh() {
  clearRefreshSchedule();

  const accessToken = getAccessToken();
  if (!accessToken) return;

  const expiresAt = decodeTokenExpiry(accessToken);
  const delay = expiresAt ? Math.max(5_000, expiresAt - Date.now() - 60_000) : 13 * 60_000;

  refreshTimer = setTimeout(async () => {
    const ok = await refreshAccessTokenNow();
    if (!ok) {
      notifySessionExpired("انتهت الجلسة. سجّل الدخول مرة أخرى.");
    }
  }, delay);
}
