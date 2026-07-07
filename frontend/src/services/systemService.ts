import { apiRequest } from "./apiClient";

export type LicenseStatus = {
  developmentBypass: boolean;
  activated: boolean;
  valid: boolean;
  fingerprint: string;
  activatedAt?: string | null;
  storeName?: string | null;
  message: string;
};

export type BackupStatus = {
  backupDir: string;
  lastBackupAt: string | null;
  lastBackupPath: string | null;
};

export const systemService = {
  getLicenseStatus: () => apiRequest<LicenseStatus>("/system/license", { skipAuthRetry: true }),
  activateLicense: (key: string) =>
    apiRequest<{ activated: boolean; fingerprint?: string; developmentBypass?: boolean }>("/system/license/activate", {
      method: "POST",
      body: JSON.stringify({ key }),
      skipAuthRetry: true,
    }),
  getBackupStatus: () => apiRequest<BackupStatus>("/system/backup"),
  updateBackupSettings: (backupDir: string) =>
    apiRequest<BackupStatus>("/system/backup", { method: "PATCH", body: JSON.stringify({ backupDir }) }),
  createBackup: () => apiRequest<{ outputPath: string; createdAt: string }>("/system/backup", { method: "POST" }),
  restoreBackup: (backupPath: string) =>
    apiRequest<{ restored: boolean }>("/system/backup/restore", {
      method: "POST",
      body: JSON.stringify({ backupPath }),
    }),
};
