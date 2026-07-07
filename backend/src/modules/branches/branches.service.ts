import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { assertStoreAccess } from "../../common/utils/tenant-context";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { CreateBranchDto } from "./dto/create-branch.dto";
import { UpdateBranchStatusDto } from "./dto/update-branch-status.dto";
import { UpdateBranchDto } from "./dto/update-branch.dto";

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  list(user: AuthenticatedUser) {
    if (!user.storeId && !user.isSuperAdmin) throw new ForbiddenException("Missing store context.");
    return this.prisma.branch.findMany({
      where: user.isSuperAdmin ? {} : { storeId: user.storeId! },
      orderBy: { createdAt: "asc" },
    });
  }

  async create(user: AuthenticatedUser, dto: CreateBranchDto) {
    if (!user.storeId) throw new ForbiddenException("Missing store context.");
    const branch = await this.prisma.branch.create({
      data: { storeId: user.storeId, name: dto.name, address: dto.address, phone: dto.phone },
    });
    await this.activityLogs.log({
      storeId: user.storeId,
      branchId: branch.id,
      userId: user.id,
      action: "branch.created",
      entityType: "Branch",
      entityId: branch.id,
      metadata: { name: branch.name },
    });
    return branch;
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateBranchDto) {
    const branch = await this.getScopedBranch(user, id);
    const updated = await this.prisma.branch.update({ where: { id: branch.id }, data: dto });
    await this.activityLogs.log({
      storeId: updated.storeId,
      branchId: updated.id,
      userId: user.id,
      action: "branch.updated",
      entityType: "Branch",
      entityId: updated.id,
      metadata: { ...dto },
    });
    return updated;
  }

  async updateStatus(user: AuthenticatedUser, id: string, dto: UpdateBranchStatusDto) {
    const branch = await this.getScopedBranch(user, id);
    const updated = await this.prisma.branch.update({ where: { id: branch.id }, data: { status: dto.status } });
    await this.activityLogs.log({
      storeId: updated.storeId,
      branchId: updated.id,
      userId: user.id,
      action: "branch.status_changed",
      entityType: "Branch",
      entityId: updated.id,
      metadata: { status: dto.status },
    });
    return updated;
  }

  private async getScopedBranch(user: AuthenticatedUser, id: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundException("Branch not found.");
    assertStoreAccess(user, branch.storeId);
    return branch;
  }
}
