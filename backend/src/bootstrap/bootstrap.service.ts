import { BadRequestException, ConflictException, Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { Prisma, StoreStatus } from "@prisma/client";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { PrismaService } from "../prisma/prisma.service";
import { rolePermissions, seedCoreReferenceData, syncSystemRolePermissions } from "./bootstrap-core";
import { BootstrapSetupDto } from "./bootstrap.dto";
import * as bcrypt from "bcryptjs";
import { getLogsDir } from "../common/runtime/runtime-paths";

type BootstrapStatus = {
  postgresConfigured: boolean;
  needsSetup: boolean;
  ownerCount: number;
  storeCount: number;
  ready: boolean;
};

@Injectable()
export class BootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BootstrapService.name);
  private readonly logsDir = getLogsDir();

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    if (process.env.NODE_ENV === "test") return;
    await this.ensureLogsDir();
    await this.writeLog("bootstrap.start", "Starting local bootstrap checks.");
    await this.prisma.$queryRaw`SELECT 1`;
    await seedCoreReferenceData(this.prisma);
    await syncSystemRolePermissions(this.prisma);
    const status = await this.getStatus();
    if (status.ownerCount === 0) {
      await this.writeLog("bootstrap.setup.required", "No owner/admin exists. Setup wizard required.");
    } else {
      await this.writeLog("bootstrap.ready", "Owner/admin detected. Application ready.");
    }
  }

  async getStatus(): Promise<BootstrapStatus> {
    const [ownerCount, storeCount] = await Promise.all([
      this.prisma.user.count({
        where: {
          status: "ACTIVE",
          role: { name: { in: ["owner", "super_admin"] } },
        },
      }),
      this.prisma.store.count(),
    ]);

    return {
      postgresConfigured: true,
      needsSetup: ownerCount === 0,
      ownerCount,
      storeCount,
      ready: true,
    };
  }

  async setup(dto: BootstrapSetupDto) {
    const status = await this.getStatus();
    if (!status.needsSetup) {
      throw new ConflictException("Setup has already been completed.");
    }

    const normalizedEmail = dto.ownerEmail?.trim().toLowerCase() || null;
    const normalizedPhone = dto.ownerPhone.trim();
    const normalizedPassword = dto.ownerPassword.trim();
    const storeName = dto.shopName.trim();
    const ownerName = dto.ownerName.trim();

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          normalizedEmail ? { email: normalizedEmail } : undefined,
          { phone: normalizedPhone },
        ].filter(Boolean) as Prisma.UserWhereInput[],
      },
    });
    if (existing) {
      throw new ConflictException("An account with this email or phone already exists.");
    }

    await seedCoreReferenceData(this.prisma);

    const result = await this.prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: {
          name: storeName,
          ownerName,
          phone: normalizedPhone,
          email: normalizedEmail,
          status: StoreStatus.ACTIVE,
        },
      });

      const branch = await tx.branch.create({
        data: {
          storeId: store.id,
          name: "الفرع الرئيسي",
          address: dto.shopAddress.trim(),
          phone: normalizedPhone,
          isMain: true,
          isDefault: true,
          status: "ACTIVE",
        },
      });

      const ownerRole = await tx.role.create({
        data: {
          storeId: store.id,
          name: "owner",
          description: "Default store owner role",
          isSystem: true,
        },
      });

      const managerRole = await tx.role.create({
        data: {
          storeId: store.id,
          name: "manager",
          description: "Default store manager role",
          isSystem: true,
        },
      });

      const cashierRole = await tx.role.create({
        data: {
          storeId: store.id,
          name: "cashier",
          description: "Default cashier role",
          isSystem: true,
        },
      });

      const inventoryRole = await tx.role.create({
        data: {
          storeId: store.id,
          name: "inventory",
          description: "Default inventory role",
          isSystem: true,
        },
      });

      const permissions = await tx.permission.findMany({
        where: { key: { in: rolePermissions.owner } },
      });
      if (permissions.length === 0) {
        throw new BadRequestException("Permissions are not ready yet. Please retry setup.");
      }

      for (const permission of permissions) {
        await tx.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: ownerRole.id, permissionId: permission.id } },
          update: {},
          create: { roleId: ownerRole.id, permissionId: permission.id },
        });
      }

      for (const [role, keys] of [
        [managerRole, rolePermissions.manager],
        [cashierRole, rolePermissions.cashier],
        [inventoryRole, rolePermissions.inventory],
      ] as const) {
        const rolePermissionsRows = await tx.permission.findMany({ where: { key: { in: keys } } });
        for (const permission of rolePermissionsRows) {
          await tx.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
            update: {},
            create: { roleId: role.id, permissionId: permission.id },
          });
        }
      }

      const ownerUser = await tx.user.create({
        data: {
          storeId: store.id,
          branchId: branch.id,
          roleId: ownerRole.id,
          name: ownerName,
          email: normalizedEmail,
          phone: normalizedPhone,
          passwordHash: await bcrypt.hash(normalizedPassword, 12),
          status: "ACTIVE",
        },
      });

      await tx.store.update({
        where: { id: store.id },
        data: {
          status: StoreStatus.ACTIVE,
        },
      });

      await tx.receiptSettings.create({
        data: {
          storeId: store.id,
          branchId: branch.id,
          storeName,
          storePhone: normalizedPhone,
          storeAddress: dto.shopAddress.trim(),
          receiptFooter: dto.receiptFooter.trim(),
          paperSize: "MM_80",
        },
      });

      await tx.activityLog.create({
        data: {
          storeId: store.id,
          branchId: branch.id,
          userId: ownerUser.id,
          action: "bootstrap.setup_completed",
          entityType: "Store",
          entityId: store.id,
          metadata: {
            storeName,
            ownerName,
            fingerprint: this.fingerprint(storeName, normalizedPhone),
          },
        },
      });

      return { store, branch, ownerUser };
    });

    await this.writeLog("bootstrap.setup.completed", `Created store ${result.store.id} and owner ${result.ownerUser.id}.`);
    return result;
  }

  private async ensureLogsDir() {
    await fs.mkdir(this.logsDir, { recursive: true });
  }

  private async writeLog(event: string, message: string) {
    await this.ensureLogsDir();
    const line = `${new Date().toISOString()} [${event}] ${message}\n`;
    await fs.appendFile(path.join(this.logsDir, "bootstrap.log"), line, "utf8");
    this.logger.log(message);
  }

  private fingerprint(...parts: string[]) {
    return createHash("sha256").update(parts.join("|")).digest("hex");
  }
}
