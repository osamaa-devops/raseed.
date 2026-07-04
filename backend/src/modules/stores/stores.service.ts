import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { CreateStoreDto } from "./dto/create-store.dto";
import { UpdateStoreStatusDto } from "./dto/update-store-status.dto";
import { UpdateStoreDto } from "./dto/update-store.dto";

@Injectable()
export class StoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async me(user: AuthenticatedUser) {
    if (!user.storeId) throw new ForbiddenException("Missing store context.");
    return this.prisma.store.findUniqueOrThrow({ where: { id: user.storeId } });
  }

  async updateMe(user: AuthenticatedUser, dto: UpdateStoreDto) {
    if (!user.storeId) throw new ForbiddenException("Missing store context.");
    return this.prisma.store.update({
      where: { id: user.storeId },
      data: { ...dto, email: dto.email?.toLowerCase() },
    });
  }

  listAdmin() {
    return this.prisma.store.findMany({ orderBy: { createdAt: "desc" } });
  }

  async getAdmin(id: string) {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) throw new NotFoundException("Store not found.");
    return store;
  }

  createAdmin(dto: CreateStoreDto) {
    return this.prisma.store.create({
      data: {
        name: dto.name,
        ownerName: dto.ownerName,
        phone: dto.phone,
        email: dto.email?.toLowerCase(),
        status: "TRIAL",
      },
    });
  }

  async updateStatusAdmin(actor: AuthenticatedUser, id: string, dto: UpdateStoreStatusDto) {
    const store = await this.prisma.store.update({ where: { id }, data: { status: dto.status } });
    await this.activityLogs.log({
      storeId: id,
      userId: actor.id,
      action: "store.status_changed",
      entityType: "Store",
      entityId: id,
      metadata: { status: dto.status },
    });
    return store;
  }
}
