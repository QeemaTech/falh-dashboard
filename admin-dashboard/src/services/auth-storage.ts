import type { AuthTokens, AuthUser } from "../types/auth";

const ACCESS_TOKEN_KEY = "auth.accessToken";
const REFRESH_TOKEN_KEY = "auth.refreshToken";
const USER_KEY = "auth.user";
const REMEMBER_KEY = "auth.rememberMe";

function getStorage(rememberMe: boolean) {
  return rememberMe ? localStorage : sessionStorage;
}

export function saveAuthSession(tokens: AuthTokens, user: AuthUser) {
  const storage = getStorage(tokens.rememberMe);
  localStorage.setItem(REMEMBER_KEY, String(tokens.rememberMe));
  storage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  storage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  [localStorage, sessionStorage].forEach((s) => {
    s.removeItem(ACCESS_TOKEN_KEY);
    s.removeItem(REFRESH_TOKEN_KEY);
    s.removeItem(USER_KEY);
  });
  localStorage.removeItem(REMEMBER_KEY);
}

export function getRememberMeFlag() {
  return localStorage.getItem(REMEMBER_KEY) === "true";
}

export function getAccessToken() {
  return (getRememberMeFlag() ? localStorage : sessionStorage).getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return (getRememberMeFlag() ? localStorage : sessionStorage).getItem(REFRESH_TOKEN_KEY);
}

export function setAccessToken(accessToken: string) {
  const storage = getRememberMeFlag() ? localStorage : sessionStorage;
  storage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function setRefreshToken(refreshToken: string) {
  const storage = getRememberMeFlag() ? localStorage : sessionStorage;
  storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function getStoredUser(): AuthUser | null {
  const raw = (getRememberMeFlag() ? localStorage : sessionStorage).getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}
