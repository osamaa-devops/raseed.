import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, DemoRequestStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateDemoRequestDto } from "./dto/create-demo-request.dto";
import { DemoRequestsQueryDto } from "./dto/demo-requests-query.dto";
import { UpdateDemoRequestDto } from "./dto/update-demo-request.dto";

@Injectable()
export class DemoRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDemoRequestDto) {
    return this.prisma.demoRequest.create({
      data: {
        storeName: dto.storeName.trim(),
        ownerName: dto.ownerName.trim(),
        phone: dto.phone.trim(),
        email: dto.email?.trim().toLowerCase() || null,
        businessType: dto.businessType.trim(),
        notes: dto.notes?.trim() || null,
      },
    });
  }

  async list(query: DemoRequestsQueryDto) {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const search = query.search?.trim();
      const where: Prisma.DemoRequestWhereInput = {
        status: query.status,
        OR: search
          ? [
              { storeName: { contains: search, mode: "insensitive" } },
              { ownerName: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { businessType: { contains: search, mode: "insensitive" } },
            ]
          : undefined,
      };

      const [items, total] = await this.prisma.$transaction([
        this.prisma.demoRequest.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.demoRequest.count({ where }),
      ]);

      return { items, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
    } catch (error) {
      if (isMissingDemoRequestTable(error)) {
        return { items: [], meta: { page: query.page ?? 1, limit: query.limit ?? 20, total: 0, pages: 0 } };
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateDemoRequestDto, userId?: string | null) {
    const existing = await this.prisma.demoRequest.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Demo request not found.");

    return this.prisma.demoRequest.update({
      where: { id },
      data: {
        status: dto.status,
        notes: dto.notes?.trim(),
        contactedAt:
          dto.status === DemoRequestStatus.CONTACTED && !existing.contactedAt ? new Date() : existing.contactedAt,
        contactedById: dto.status === DemoRequestStatus.CONTACTED ? userId ?? existing.contactedById : existing.contactedById,
      },
    });
  }
}

function isMissingDemoRequestTable(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return message.includes("DemoRequest") || message.includes("demoRequest") || message.includes("relation") || message.includes("doesn't exist");
}
