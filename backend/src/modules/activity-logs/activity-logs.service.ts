import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { ActivityLogsQueryDto } from "./dto/activity-logs-query.dto";

@Injectable()
export class ActivityLogsService {
  constructor(private readonly prisma: PrismaService) {}

  log(data: Prisma.ActivityLogUncheckedCreateInput) {
    return this.prisma.activityLog.create({ data });
  }

  async list(user: AuthenticatedUser, query: ActivityLogsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ActivityLogWhereInput = {
      storeId: user.isSuperAdmin ? undefined : user.storeId,
      userId: query.userId || undefined,
      action: query.action ? { contains: query.action, mode: "insensitive" } : undefined,
      entityType: query.entityType ? { contains: query.entityType, mode: "insensitive" } : undefined,
      createdAt: query.dateFrom || query.dateTo
        ? {
            gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
            lte: query.dateTo ? new Date(query.dateTo) : undefined,
          }
        : undefined,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.activityLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          branch: { select: { id: true, name: true } },
          store: user.isSuperAdmin ? { select: { id: true, name: true } } : false,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return { items, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }
}
