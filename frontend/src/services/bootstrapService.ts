import { apiRequest } from "./apiClient";

export type BootstrapStatus = {
  postgresConfigured: boolean;
  needsSetup: boolean;
  ownerCount: number;
  storeCount: number;
  ready: boolean;
};

export type BootstrapSetupPayload = {
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  receiptFooter: string;
  ownerName: string;
  ownerEmail?: string;
  ownerPhone: string;
  ownerPassword: string;
};

export const bootstrapService = {
  getStatus: () => apiRequest<BootstrapStatus>("/bootstrap/status", { skipAuthRetry: true }),
  setup: (payload: BootstrapSetupPayload) =>
    apiRequest<{ store: { id: string; name: string }; branch: { id: string; name: string }; ownerUser: { id: string; name: string } }>("/bootstrap/setup", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuthRetry: true,
    }),
};
