import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { AuthUser, LoginPayload } from "../types/auth";
import { fetchMeApi, loginApi } from "../services/auth-api";
import { clearRefreshSchedule, scheduleTokenRefresh } from "../services/auth-refresh";
import { subscribeSessionExpired } from "../services/auth-session";
import {
  clearAuthSession,
  getAccessToken,
  getRememberMeFlag,
  getStoredUser,
  saveAuthSession,
} from "../services/auth-storage";
import { toast } from "../components/ui/sonner";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCompany: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readInitialUser(): AuthUser | null {
  const stored = getStoredUser();
  if (!stored) return null;
  if (!getAccessToken()) {
    clearAuthSession();
    return null;
  }
  return stored;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(() => readInitialUser());

  useEffect(() => {
    if (user && getAccessToken()) {
      scheduleTokenRefresh();
    } else {
      clearRefreshSchedule();
    }
    return () => clearRefreshSchedule();
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== "ADMIN" || user.permissions !== undefined || !getAccessToken()) return;
    fetchMeApi()
      .then((profile) => {
        const storage = getRememberMeFlag() ? localStorage : sessionStorage;
        const merged = { ...user, ...profile };
        storage.setItem("auth.user", JSON.stringify(merged));
        setUser(merged);
      })
      .catch(() => {
        /* ignore — session may be stale */
      });
  }, [user]);

  useEffect(() => {
    return subscribeSessionExpired((message) => {
      clearAuthSession();
      clearRefreshSchedule();
      setUser(null);
      toast.error(message);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user && getAccessToken()),
      isAdmin: user?.role === "ADMIN",
      isCompany: user?.role === "COMPANY",
      async login(payload) {
        const result = await loginApi(payload);
        saveAuthSession(
          {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            rememberMe: payload.rememberMe,
          },
          result.user
        );
        setUser(result.user);
        scheduleTokenRefresh();
      },
      logout() {
        clearRefreshSchedule();
        clearAuthSession();
        setUser(null);
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
