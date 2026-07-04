import { useRoutes } from "react-router";
import { routeConfig } from "./routeConfig";

export function AppRoutes() {
  return useRoutes(routeConfig);
}
