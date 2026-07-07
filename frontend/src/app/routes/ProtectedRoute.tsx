import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "../providers/AuthProvider";
import { canAccessPath } from "./accessControl";

export function ProtectedRoute({
  superAdminOnly = false,
  path,
  children,
}: {
  superAdminOnly?: boolean;
  path?: string;
  children?: ReactNode;
}) {
  const { auth, isAuthenticated, isReady } = useAuth();

  if (!isReady) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (superAdminOnly && !auth?.permissions.includes("admin.platform_access")) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!superAdminOnly && auth?.role?.name === "super_admin") {
    return <Navigate to="/super-admin" replace />;
  }

  if (path && !canAccessPath(auth, path)) {
    return <Navigate to={canAccessPath(auth, "/pos") ? "/pos" : "/dashboard"} replace />;
  }

  return children ?? <Outlet />;
}
