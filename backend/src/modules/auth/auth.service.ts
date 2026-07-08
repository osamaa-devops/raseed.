import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Request, Response } from "express";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../../prisma/prisma.service";
import { serializeUser } from "../../common/utils/serializers";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { LoginDto } from "./dto/login.dto";
import {
  clearRefreshTokenCookie,
  createRefreshToken,
  getRefreshTokenFromRequest,
  hashRefreshToken,
  setRefreshTokenCookie,
} from "./auth-session.utils";

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
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto, request: Request, response: Response) {
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

    const isValidPassword = await bcrypt.compare(dto.password.trim(), user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    const refreshToken = createRefreshToken();
    const expiresAt = this.refreshTokenExpiresAt();
    const tokenHash = hashRefreshToken(refreshToken);

    const authSession = await this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
        include: authInclude,
      });

      const session = await tx.userSession.create({
        data: {
          userId: updatedUser.id,
          tokenHash,
          userAgent: this.cleanNullable(request.headers["user-agent"]),
          ipAddress: this.resolveIpAddress(request),
          expiresAt,
        },
      });

      await tx.activityLog.create({
        data: {
          storeId: updatedUser.storeId,
          branchId: updatedUser.branchId,
          userId: updatedUser.id,
          action: "auth.login",
          entityType: "User",
          entityId: updatedUser.id,
        },
      });

      return { user: updatedUser, sessionId: session.id };
    });

    setRefreshTokenCookie(response, this.config, refreshToken, expiresAt);
    return this.createAuthResponse(authSession.user, authSession.sessionId);
  }

  async me(currentUser: AuthenticatedUser) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: currentUser.id },
      include: authInclude,
    });

    return this.createAuthResponse(user);
  }

  async logout(request: Request, response: Response) {
    const refreshToken = getRefreshTokenFromRequest(request, this.config);
    if (refreshToken) {
      await this.revokeSessionByToken(refreshToken);
    }
    clearRefreshTokenCookie(response, this.config);
    return { success: true, message: "تم تسجيل الخروج بنجاح." };
  }

  async refresh(request: Request, response: Response) {
    const refreshToken = getRefreshTokenFromRequest(request, this.config);
    if (!refreshToken) {
      clearRefreshTokenCookie(response, this.config);
      throw new UnauthorizedException("Refresh token is missing.");
    }

    const existingSession = await this.prisma.userSession.findUnique({
      where: { tokenHash: hashRefreshToken(refreshToken) },
      include: {
        user: {
          include: authInclude,
        },
      },
    });

    if (!existingSession || existingSession.revokedAt || existingSession.expiresAt.getTime() <= Date.now()) {
      clearRefreshTokenCookie(response, this.config);
      throw new UnauthorizedException("Refresh token is invalid or expired.");
    }

    if (!existingSession.user.passwordHash || existingSession.user.status !== "ACTIVE") {
      await this.revokeSessionById(existingSession.id);
      clearRefreshTokenCookie(response, this.config);
      throw new UnauthorizedException("Invalid or inactive user.");
    }

    const nextRefreshToken = createRefreshToken();
    const nextExpiresAt = this.refreshTokenExpiresAt();
    const nextTokenHash = hashRefreshToken(nextRefreshToken);

    const refreshedAuth = await this.prisma.$transaction(async (tx) => {
      await tx.userSession.update({
        where: { id: existingSession.id },
        data: { revokedAt: new Date() },
      });

      const nextSession = await tx.userSession.create({
        data: {
          userId: existingSession.userId,
          tokenHash: nextTokenHash,
          userAgent: this.cleanNullable(request.headers["user-agent"]),
          ipAddress: this.resolveIpAddress(request),
          expiresAt: nextExpiresAt,
        },
      });

      await tx.activityLog.create({
        data: {
          storeId: existingSession.user.storeId,
          branchId: existingSession.user.branchId,
          userId: existingSession.user.id,
          action: "auth.refresh",
          entityType: "UserSession",
          entityId: existingSession.id,
        },
      });

      const user = await tx.user.findUniqueOrThrow({
        where: { id: existingSession.userId },
        include: authInclude,
      });
      return { user, sessionId: nextSession.id };
    });

    setRefreshTokenCookie(response, this.config, nextRefreshToken, nextExpiresAt);
    return this.createAuthResponse(refreshedAuth.user, refreshedAuth.sessionId);
  }

  private createAuthResponse(user: Awaited<ReturnType<typeof this.findIncludedUserShape>>, sessionId?: string | null) {
    const permissions = this.getPermissions(user);
    const roleName = user.role?.name ?? null;
    const accessToken = this.jwtService.sign({
      sub: user.id,
      sid: sessionId ?? undefined,
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

  private refreshTokenExpiresAt() {
    const days = this.config.get<number>("REFRESH_TOKEN_EXPIRES_DAYS", 30);
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  private async revokeSessionByToken(refreshToken: string) {
    const tokenHash = hashRefreshToken(refreshToken);
    const session = await this.prisma.userSession.findUnique({ where: { tokenHash } });
    if (!session || session.revokedAt) return;
    await this.revokeSessionById(session.id);
  }

  private revokeSessionById(id: string) {
    return this.prisma.userSession.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  private resolveIpAddress(request: Request) {
    const forwardedFor = request.headers["x-forwarded-for"];
    if (typeof forwardedFor === "string" && forwardedFor.trim()) {
      return forwardedFor.split(",")[0]?.trim() || null;
    }
    return request.ip || null;
  }

  private cleanNullable(value: string | string[] | undefined) {
    if (Array.isArray(value)) {
      const first = value[0]?.trim();
      return first || null;
    }
    const cleaned = value?.trim();
    return cleaned || null;
  }

  private findIncludedUserShape() {
    return this.prisma.user.findFirstOrThrow({ include: authInclude });
  }
}
