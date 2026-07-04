import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../../prisma/prisma.service";
import { serializeUser } from "../../common/utils/serializers";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { LoginDto } from "./dto/login.dto";

const authInclude = {
  store: true,
  branch: true,
  role: { include: { permissions: { include: { permission: true } } } },
  permissions: { include: { permission: true } },
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const identity = dto.identity.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identity }, { phone: dto.identity.trim() }],
      },
      include: authInclude,
    });

    if (!user || !user.passwordHash || user.status !== "ACTIVE") {
      throw new UnauthorizedException("Invalid credentials.");
    }

    const isValidPassword = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.prisma.activityLog.create({
      data: {
        storeId: user.storeId,
        branchId: user.branchId,
        userId: user.id,
        action: "auth.login",
        entityType: "User",
        entityId: user.id,
      },
    });

    return this.createAuthResponse(user);
  }

  async me(currentUser: AuthenticatedUser) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: currentUser.id },
      include: authInclude,
    });

    return this.createAuthResponse(user);
  }

  logout() {
    return { success: true, message: "Logout is handled client-side until refresh tokens are implemented." };
  }

  refresh() {
    return { success: false, message: "Refresh tokens are planned for a later phase." };
  }

  private createAuthResponse(user: Awaited<ReturnType<typeof this.findIncludedUserShape>>) {
    const permissions = this.getPermissions(user);
    const roleName = user.role?.name ?? null;
    const accessToken = this.jwtService.sign({
      sub: user.id,
      storeId: user.storeId,
      branchId: user.branchId,
      role: roleName,
      permissions,
    });

    return {
      accessToken,
      user: serializeUser(user),
      store: user.store,
      branch: user.branch,
      role: user.role ? { id: user.role.id, name: user.role.name, description: user.role.description } : null,
      permissions,
    };
  }

  private getPermissions(user: Awaited<ReturnType<typeof this.findIncludedUserShape>>) {
    const rolePermissions = user.role?.permissions.map((item) => item.permission.key) ?? [];
    const userPermissions = user.permissions.map((item) => item.permission.key);
    return Array.from(new Set([...rolePermissions, ...userPermissions]));
  }

  private findIncludedUserShape() {
    return this.prisma.user.findFirstOrThrow({ include: authInclude });
  }
}
