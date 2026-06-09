import { createContext, useCallback, useContext, useMemo, type PropsWithChildren } from "react";
import { useAuth } from "./auth-store";

type PermissionContextValue = {
  permissions: string[];
  isSuperAdmin: boolean;
  hasPermission: (code: string | string[]) => boolean;
  hasEveryPermission: (codes: string[]) => boolean;
};

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({ children }: PropsWithChildren) {
  const { user, isAdmin } = useAuth();

  const permissions = useMemo(() => {
    if (!isAdmin) return [];
    return user?.permissions || [];
  }, [isAdmin, user?.permissions]);

  const isSuperAdmin = Boolean(isAdmin && user?.isSuperAdmin);

  const hasPermission = useCallback(
    (code: string | string[]) => {
      if (!isAdmin) return false;
      if (isSuperAdmin) return true;
      const codes = Array.isArray(code) ? code : [code];
      return codes.some((c) => permissions.includes(c));
    },
    [isAdmin, isSuperAdmin, permissions]
  );

  const hasEveryPermission = useCallback(
    (codes: string[]) => {
      if (!isAdmin) return false;
      if (isSuperAdmin) return true;
      return codes.every((c) => permissions.includes(c));
    },
    [isAdmin, isSuperAdmin, permissions]
  );

  const value = useMemo(
    () => ({
      permissions,
      isSuperAdmin,
      hasPermission,
      hasEveryPermission,
    }),
    [permissions, isSuperAdmin, hasPermission, hasEveryPermission]
  );

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermission() {
  const ctx = useContext(PermissionContext);
  if (!ctx) throw new Error("usePermission must be used within PermissionProvider");
  return ctx;
}

export function useOptionalPermission() {
  return useContext(PermissionContext);
}
