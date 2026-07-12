import { BadRequestException, ForbiddenException, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { getAppDataDir, getBackupsDir, getLicensePath, getRuntimeConfigPath } from "../../common/runtime/runtime-paths";

type RuntimeConfig = {
  backupDir?: string;
  lastBackupAt?: string | null;
};

type LicenseFile = {
  keyHash: string;
  fingerprint: string;
  activatedAt: string;
  storeName?: string | null;
};

type BackupStatus = {
  backupDir: string;
  lastBackupAt: string | null;
  lastBackupPath: string | null;
};

@Injectable()
export class SystemService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SystemService.name);
  private autoBackupTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === "test") return;
    this.autoBackupTimer = setInterval(() => {
      void this.runAutoBackupCheck().catch((error) => {
        this.logger.warn(`Auto backup check failed: ${error instanceof Error ? error.message : String(error)}`);
      });
    }, 60 * 60 * 1000);

    setTimeout(() => {
      void this.runAutoBackupCheck().catch((error) => {
        this.logger.warn(`Initial auto backup check failed: ${error instanceof Error ? error.message : String(error)}`);
      });
    }, 10_000);
  }

  async onModuleDestroy() {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer);
      this.autoBackupTimer = null;
    }
  }

  async getLicenseStatus() {
    if (this.isDevelopmentBypass()) {
      return {
        developmentBypass: true,
        activated: true,
        valid: true,
        fingerprint: this.machineFingerprint(),
        message: "Development mode is not blocked.",
      };
    }

    const fingerprint = this.machineFingerprint();
    const file = await this.readLicenseFile();
    if (!file) {
      return {
        developmentBypass: false,
        activated: false,
        valid: false,
        fingerprint,
        message: "لم يتم تفعيل الترخيص بعد.",
      };
    }

    const expectedKeyHash = this.licenseHash(this.generateLicenseKey(fingerprint));
    const valid = file.fingerprint === fingerprint && file.keyHash === expectedKeyHash;

    return {
      developmentBypass: false,
      activated: true,
      valid,
      fingerprint,
      activatedAt: file.activatedAt,
      storeName: file.storeName ?? null,
      message: valid ? "الترخيص مفعل لهذا الجهاز." : "الترخيص غير صالح على هذا الجهاز.",
    };
  }

  async activateLicense(dto: { key: string }) {
    if (this.isDevelopmentBypass()) {
      return { activated: true, developmentBypass: true };
    }

    const fingerprint = this.machineFingerprint();
    const key = dto.key.trim();
    const expectedKey = this.generateLicenseKey(fingerprint);
    if (key !== expectedKey) {
      throw new BadRequestException("مفتاح الترخيص غير صحيح.");
    }

    const storeName = await this.prisma.store.findFirst({
      select: { name: true },
      orderBy: { createdAt: "asc" },
    });
    const payload: LicenseFile = {
      keyHash: this.licenseHash(key),
      fingerprint,
      activatedAt: new Date().toISOString(),
      storeName: storeName?.name ?? null,
    };

    await this.writeEncryptedJson(getLicensePath(), payload, this.encryptionKey(fingerprint));
    return { activated: true, fingerprint };
  }

  async getBackupStatus() {
    const config = await this.readRuntimeConfig();
    const backupDir = config.backupDir ?? getBackupsDir();
    return {
      backupDir,
      lastBackupAt: config.lastBackupAt ?? null,
      lastBackupPath: await this.findLatestBackupPath(backupDir),
    } satisfies BackupStatus;
  }

  async updateBackupSettings(user: AuthenticatedUser, dto: { backupDir?: string }) {
    this.requireOwner(user);
    const backupDir = dto.backupDir?.trim();
    if (!backupDir) {
      throw new BadRequestException("مجلد النسخ الاحتياطي مطلوب.");
    }

    await fs.mkdir(backupDir, { recursive: true });
    const config = await this.readRuntimeConfig();
    config.backupDir = backupDir;
    await this.writeRuntimeConfig(config);
    return this.getBackupStatus();
  }

  async createBackup(user: AuthenticatedUser) {
    this.requireOwner(user);
    const backupDir = (await this.readRuntimeConfig()).backupDir ?? getBackupsDir();
    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = toFileStamp(new Date());
    const outputPath = path.join(backupDir, `raseed-backup-${timestamp}.json.enc`);
    const dump = await this.createPlainDump();
    const payload = {
      createdAt: new Date().toISOString(),
      fingerprint: this.machineFingerprint(),
      dump: dump.toString("base64"),
    };

    await this.writeEncryptedJson(outputPath, payload, this.backupKey());
    const currentConfig = await this.readRuntimeConfig();
    await this.writeRuntimeConfig({
      ...currentConfig,
      backupDir,
      lastBackupAt: new Date().toISOString(),
    });

    await this.activityLogs.log({
      storeId: user.storeId,
      branchId: user.branchId,
      userId: user.id,
      action: "backup.created",
      entityType: "System",
      entityId: outputPath,
      metadata: { outputPath } as Prisma.InputJsonObject,
    });

    return { outputPath, createdAt: new Date().toISOString() };
  }

  async restoreBackup(user: AuthenticatedUser, backupPath: string) {
    this.requireOwner(user);
    const encrypted = await fs.readFile(backupPath);
    const payload = await this.decryptJson<{ dump: string; fingerprint: string }>(encrypted, this.backupKey());
    if (payload.fingerprint !== this.machineFingerprint()) {
      throw new BadRequestException("هذا النسخ الاحتياطي لا يخص هذا الجهاز.");
    }

    const dump = Buffer.from(payload.dump, "base64");
    await this.restorePlainDump(dump);
    await this.activityLogs.log({
      storeId: user.storeId,
      branchId: user.branchId,
      userId: user.id,
      action: "backup.restored",
      entityType: "System",
      entityId: backupPath,
      metadata: { backupPath } as Prisma.InputJsonObject,
    });

    return { restored: true };
  }

  private async runAutoBackupCheck() {
    if (this.isDevelopmentBypass()) return null;
    const owner = await this.findAutoBackupActor();
    if (!owner) return null;

    const status = await this.getBackupStatus();
    const today = new Date().toISOString().slice(0, 10);
    const last = status.lastBackupAt ? new Date(status.lastBackupAt).toISOString().slice(0, 10) : null;
    if (last === today) return null;

    return this.createBackup(owner);
  }

  private requireOwner(user: AuthenticatedUser) {
    if (user.roleName !== "owner" && !user.permissions.includes("backup.manage") && !user.permissions.includes("license.manage")) {
      throw new ForbiddenException("Owner access required.");
    }
  }

  private isDevelopmentBypass() {
    return process.env.NODE_ENV !== "production" || process.env.RASEED_DESKTOP !== "true";
  }

  private machineFingerprint() {
    const interfaces = os.networkInterfaces();
    const macs = Object.values(interfaces)
      .flat()
      .filter((item): item is NonNullable<(typeof item)> => Boolean(item && !item.internal && item.mac))
      .map((item) => item.mac)
      .sort();

    return createHash("sha256")
      .update([os.hostname(), os.platform(), os.arch(), ...macs].join("|"))
      .digest("hex");
  }

  private generateLicenseKey(fingerprint: string) {
    const secret = this.licenseSecret();
    const hash = createHash("sha256").update(`${secret}|${fingerprint}`).digest("hex").toUpperCase();
    return `RASEED-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}`;
  }

  private licenseHash(key: string) {
    return createHash("sha256").update(`license|${key}`).digest("hex");
  }

  private backupKey() {
    return createHash("sha256")
      .update(`backup|${this.licenseSecret()}|${this.machineFingerprint()}`)
      .digest();
  }

  private encryptionKey(fingerprint: string) {
    return createHash("sha256")
      .update(`license-file|${fingerprint}|${this.licenseSecret()}`)
      .digest();
  }

  private licenseSecret() {
    const secret = process.env.LICENSE_SECRET?.trim();
    if (secret) return secret;
    if (process.env.NODE_ENV === "production") {
      throw new Error("LICENSE_SECRET is required in production.");
    }
    return "raseed-development-license-secret";
  }

  private async createPlainDump() {
    const command = process.platform === "win32" ? "pg_dump.exe" : "pg_dump";
    const result = await runCommand(command, ["--clean", "--if-exists", "--no-owner", "--no-privileges", "--format=plain", process.env.DATABASE_URL ?? ""], {
      DATABASE_URL: process.env.DATABASE_URL ?? "",
    });
    return Buffer.from(result.stdout, "utf8");
  }

  private async restorePlainDump(dump: Buffer) {
    const command = process.platform === "win32" ? "psql.exe" : "psql";
    await runCommand(command, ["--set", "ON_ERROR_STOP=on", process.env.DATABASE_URL ?? ""], {
      DATABASE_URL: process.env.DATABASE_URL ?? "",
      input: dump.toString("utf8"),
    });
  }

  private async writeEncryptedJson(filePath: string, value: unknown, key: Buffer) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const plaintext = Buffer.from(JSON.stringify(value), "utf8");
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    const envelope = {
      iv: iv.toString("base64"),
      tag: tag.toString("base64"),
      data: encrypted.toString("base64"),
    };

    await fs.writeFile(filePath, JSON.stringify(envelope, null, 2), "utf8");
  }

  private async decryptJson<T>(encrypted: Buffer, key: Buffer) {
    const envelope = JSON.parse(encrypted.toString("utf8")) as { iv: string; tag: string; data: string };
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(envelope.iv, "base64"));
    decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(envelope.data, "base64")), decipher.final()]);
    return JSON.parse(decrypted.toString("utf8")) as T;
  }

  private async readJson<T>(filePath: string) {
    try {
      const raw = await fs.readFile(filePath, "utf8");
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private async readLicenseFile() {
    try {
      const encrypted = await fs.readFile(getLicensePath());
      return await this.decryptJson<LicenseFile>(encrypted, this.encryptionKey(this.machineFingerprint()));
    } catch {
      return null;
    }
  }

  private async readRuntimeConfig() {
    return (await this.readJson<RuntimeConfig>(getRuntimeConfigPath())) ?? {};
  }

  private async writeRuntimeConfig(config: RuntimeConfig) {
    await fs.mkdir(getAppDataDir(), { recursive: true });
    await fs.writeFile(getRuntimeConfigPath(), JSON.stringify(config, null, 2), "utf8");
  }

  private async findLatestBackupPath(backupDir: string) {
    try {
      const files = await fs.readdir(backupDir);
      const candidates = files.filter((file) => file.endsWith(".json.enc")).sort().reverse();
      return candidates.length ? path.join(backupDir, candidates[0]!) : null;
    } catch {
      return null;
    }
  }

  private async findAutoBackupActor() {
    const owner = await this.prisma.user.findFirst({
      where: {
        status: "ACTIVE",
        role: { name: "owner" },
      },
      orderBy: [{ createdAt: "asc" }],
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!owner) return null;

    const permissions = Array.from(
      new Set([
        ...(owner.role?.permissions.map((item) => item.permission.key) ?? []),
        ...(owner.permissions.map((item) => item.permission.key) ?? []),
        "backup.manage",
        "license.manage",
      ]),
    );

    return {
      id: owner.id,
      storeId: owner.storeId,
      branchId: owner.branchId,
      roleId: owner.roleId,
      roleName: owner.role?.name ?? "owner",
      permissions,
      isSuperAdmin: owner.role?.name === "super_admin",
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
    } satisfies AuthenticatedUser;
  }
}

async function runCommand(command: string, args: string[], env: Record<string, string>) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, {
      env: { ...process.env, ...env },
      shell: false,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => reject(error));
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || stdout || `${command} failed with exit code ${code}`));
    });
    if (env.input) {
      child.stdin.end(env.input);
    }
  });
}

function toFileStamp(date: Date) {
  return date.toISOString().replace(/[:.]/g, "-");
}
