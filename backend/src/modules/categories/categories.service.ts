import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { assertStoreAccess } from "../../common/utils/tenant-context";
import { UpdateCatalogStatusDto } from "../../common/dto/update-catalog-status.dto";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  list(user: AuthenticatedUser) {
    const storeId = this.requireStore(user);
    return this.prisma.category.findMany({
      where: { storeId },
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
  }

  async getById(user: AuthenticatedUser, id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!category) throw new NotFoundException("Category not found.");
    assertStoreAccess(user, category.storeId);
    return category;
  }

  async create(user: AuthenticatedUser, dto: CreateCategoryDto) {
    const storeId = this.requireStore(user);
    const name = dto.name.trim();
    await this.ensureNameAvailable(storeId, name);
    const category = await this.prisma.category.create({
      data: {
        storeId,
        name,
        description: dto.description?.trim(),
        color: dto.color?.trim(),
        icon: dto.icon?.trim(),
      },
    });
    await this.log(user, "category.created", category.id, { name: category.name });
    return category;
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateCategoryDto) {
    const category = await this.getById(user, id);
    if (dto.name?.trim() && dto.name.trim() !== category.name) {
      await this.ensureNameAvailable(category.storeId, dto.name.trim(), id);
    }
    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        description: dto.description === null ? null : dto.description?.trim(),
        color: dto.color === null ? null : dto.color?.trim(),
        icon: dto.icon === null ? null : dto.icon?.trim(),
      },
    });
    await this.log(user, "category.updated", updated.id, { name: updated.name });
    return updated;
  }

  async updateStatus(user: AuthenticatedUser, id: string, dto: UpdateCatalogStatusDto) {
    await this.getById(user, id);
    const updated = await this.prisma.category.update({ where: { id }, data: { status: dto.status } });
    await this.log(user, "category.status_changed", updated.id, { status: updated.status });
    return updated;
  }

  async delete(user: AuthenticatedUser, id: string) {
    const category = await this.getById(user, id);
    if (category._count.products > 0) {
      throw new BadRequestException("Cannot delete a category that has products. Disable it instead.");
    }
    await this.prisma.category.delete({ where: { id } });
    await this.log(user, "category.deleted", id, { name: category.name });
    return { success: true };
  }

  private requireStore(user: AuthenticatedUser) {
    if (user.isSuperAdmin || !user.storeId) {
      throw new ForbiddenException("Store category CRUD requires a store user context.");
    }
    return user.storeId;
  }

  private async ensureNameAvailable(storeId: string, name: string, excludeId?: string) {
    const existing = await this.prisma.category.findFirst({
      where: { storeId, name, id: excludeId ? { not: excludeId } : undefined },
    });
    if (existing) throw new ConflictException("Category name already exists in this store.");
  }

  private log(user: AuthenticatedUser, action: string, entityId: string, metadata: Record<string, unknown>) {
    return this.activityLogs.log({
      storeId: user.storeId,
      branchId: user.branchId,
      userId: user.id,
      action,
      entityType: "Category",
      entityId,
      metadata: metadata as Prisma.InputJsonObject,
    });
  }
}
