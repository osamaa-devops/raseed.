import { apiRequest } from "./apiClient";

export type HealthResponse = {
  status: string;
  service: string;
  timestamp: string;
};

export function checkBackendHealth() {
  return apiRequest<HealthResponse>("/health");
}
