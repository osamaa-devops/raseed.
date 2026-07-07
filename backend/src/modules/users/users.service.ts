import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { assertStoreAccess } from "../../common/utils/tenant-context";
import { serializeUser } from "../../common/utils/serializers";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto";

const userInclude = { store: true, branch: true, role: true, permissions: { include: { permission: true } } } as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async list(currentUser: AuthenticatedUser) {
    const users = await this.prisma.user.findMany({
      where: currentUser.isSuperAdmin ? {} : { storeId: currentUser.storeId },
      include: userInclude,
      orderBy: { createdAt: "desc" },
    });
    return users.map(serializeUser);
  }

  async getById(currentUser: AuthenticatedUser, id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, include: userInclude });
    if (!user) throw new NotFoundException("User not found.");
    if (user.storeId) assertStoreAccess(currentUser, user.storeId);
    if (!user.storeId && !currentUser.isSuperAdmin) throw new ForbiddenException();
    return serializeUser(user);
  }

  async create(currentUser: AuthenticatedUser, dto: CreateUserDto) {
    if (!currentUser.storeId && !currentUser.isSuperAdmin) throw new ForbiddenException("Missing store context.");
    const role = await this.prisma.role.findUniqueOrThrow({ where: { id: dto.roleId } });
    if (role.storeId) assertStoreAccess(currentUser, role.storeId);
    await this.assertAllowedRoleAssignment(currentUser, role.id);

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const created = await this.prisma.user.create({
      data: {
        storeId: role.storeId ?? currentUser.storeId,
        branchId: dto.branchId,
        roleId: role.id,
        name: dto.name,
        email: dto.email?.toLowerCase(),
        phone: dto.phone,
        passwordHash,
        status: dto.status ?? "ACTIVE",
      },
      include: userInclude,
    });

    await this.activityLogs.log({
      storeId: created.storeId,
      branchId: created.branchId,
      userId: currentUser.id,
      action: "user.created",
      entityType: "User",
      entityId: created.id,
      metadata: { name: created.name },
    });

    return serializeUser(created);
  }

  async update(currentUser: AuthenticatedUser, id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { id }, include: { role: true } });
    if (!existing) throw new NotFoundException("User not found.");
    if (existing.storeId) assertStoreAccess(currentUser, existing.storeId);
    await this.assertAllowedUserMutation(currentUser, existing.id, existing.role?.name ?? null);
    if (dto.roleId) {
      await this.assertAllowedRoleAssignment(currentUser, dto.roleId);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email?.toLowerCase(),
        phone: dto.phone,
        roleId: dto.roleId,
        branchId: dto.branchId,
        status: dto.status,
        passwordHash: dto.password ? await bcrypt.hash(dto.password, 12) : undefined,
      },
      include: userInclude,
    });

    return serializeUser(updated);
  }

  async updateStatus(currentUser: AuthenticatedUser, id: string, dto: UpdateUserStatusDto) {
    const existing = await this.prisma.user.findUnique({ where: { id }, include: { role: true } });
    if (!existing) throw new NotFoundException("User not found.");
    if (existing.storeId) assertStoreAccess(currentUser, existing.storeId);
    await this.assertAllowedUserMutation(currentUser, existing.id, existing.role?.name ?? null);

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
      include: userInclude,
    });

    await this.activityLogs.log({
      storeId: updated.storeId,
      branchId: updated.branchId,
      userId: currentUser.id,
      action: "user.status_changed",
      entityType: "User",
      entityId: updated.id,
      metadata: { status: dto.status },
    });

    return serializeUser(updated);
  }

  async permissions(currentUser: AuthenticatedUser, id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: { include: { permissions: { include: { permission: true } } } }, permissions: { include: { permission: true } } },
    });
    if (!user) throw new NotFoundException("User not found.");
    if (user.storeId) assertStoreAccess(currentUser, user.storeId);
    await this.assertAllowedUserMutation(currentUser, user.id, user.role?.name ?? null);

    const rolePermissions = user.role?.permissions.map((item) => item.permission.key) ?? [];
    const directPermissions = user.permissions.map((item) => item.permission.key);
    return Array.from(new Set([...rolePermissions, ...directPermissions]));
  }

  private async assertAllowedRoleAssignment(currentUser: AuthenticatedUser, roleId: string) {
    if (currentUser.isSuperAdmin || currentUser.roleName === "owner") return;
    if (currentUser.roleName !== "manager") return;

    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) throw new NotFoundException("Role not found.");

    const permissionKeys = role.permissions.map((item) => item.permission.key);
    if (role.name === "owner" || role.name === "super_admin" || permissionKeys.includes("backup.manage") || permissionKeys.includes("license.manage")) {
      throw new ForbiddenException("لا يمكن للمدير إدارة حساب المالك أو صلاحيات الترخيص.");
    }
  }

  private async assertAllowedUserMutation(currentUser: AuthenticatedUser, targetUserId: string, targetRoleName: string | null) {
    if (currentUser.isSuperAdmin || currentUser.roleName === "owner") return;
    if (currentUser.roleName !== "manager") return;
    if (targetUserId === currentUser.id) return;
    if (targetRoleName === "owner" || targetRoleName === "super_admin") {
      throw new ForbiddenException("لا يمكن للمدير التحكم في حساب المالك.");
    }
  }
}
