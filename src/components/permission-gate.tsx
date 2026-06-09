import type { PropsWithChildren, ReactNode } from "react";
import { usePermission } from "../store/permission-context";

type PermissionGateProps = PropsWithChildren<{
  permission: string | string[];
  fallback?: ReactNode;
}>;

export function PermissionGate({ permission, fallback = null, children }: PermissionGateProps) {
  const { hasPermission } = usePermission();
  if (!hasPermission(permission)) return <>{fallback}</>;
  return <>{children}</>;
}
