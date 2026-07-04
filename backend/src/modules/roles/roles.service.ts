import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedUser } from "../../common/utils/auth.types";

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  list(user: AuthenticatedUser) {
    return this.prisma.role.findMany({
      where: user.isSuperAdmin ? {} : { OR: [{ storeId: user.storeId }, { storeId: null }] },
      include: { permissions: { include: { permission: true } } },
      orderBy: { name: "asc" },
    });
  }
}
