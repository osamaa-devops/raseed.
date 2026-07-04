import { Navigate, Outlet } from "react-router";
import { useAuth } from "../providers/AuthProvider";

export function ProtectedRoute({ superAdminOnly = false }: { superAdminOnly?: boolean }) {
  const { auth, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (superAdminOnly && auth?.role?.name !== "super_admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (!superAdminOnly && auth?.role?.name === "super_admin") {
    return <Navigate to="/super-admin" replace />;
  }

  return <Outlet />;
}
