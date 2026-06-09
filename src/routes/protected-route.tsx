import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ROUTE_PERMISSIONS, permissionForPath } from "../config/route-permissions";
import { useAuth } from "../store/auth-store";
import { usePermission } from "../store/permission-context";

function firstAllowedPath(hasPermission: (code: string) => boolean) {
  const entry = Object.entries(ROUTE_PERMISSIONS).find(([, code]) => hasPermission(code));
  return entry?.[0] || "/";
}

export function ProtectedRoute() {
  const { isAuthenticated, isAdmin } = useAuth();
  const { hasPermission } = usePermission();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/company/products" replace />;
  }

  const required = permissionForPath(location.pathname);
  if (required && !hasPermission(required)) {
    const fallback = firstAllowedPath(hasPermission);
    if (fallback !== location.pathname) {
      return <Navigate to={fallback} replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
