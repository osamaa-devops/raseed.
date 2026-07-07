import { Suspense } from "react";
import { useRoutes } from "react-router";
import { routeConfig } from "./routeConfig";

export function AppRoutes() {
  const routes = useRoutes(routeConfig);
  return <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">جار تحميل الصفحة...</div>}>{routes}</Suspense>;
}
