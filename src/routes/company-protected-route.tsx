import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../store/auth-store";

export function CompanyProtectedRoute() {
  const { isAuthenticated, isCompany } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!isCompany) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
