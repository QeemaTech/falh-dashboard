import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { AuthUser, LoginPayload } from "../types/auth";
import { loginApi } from "../services/auth-api";
import { clearAuthSession, getStoredUser, saveAuthSession } from "../services/auth-storage";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "ADMIN",
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
      },
      logout() {
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
