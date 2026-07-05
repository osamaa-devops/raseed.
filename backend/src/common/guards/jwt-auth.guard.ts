import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { SubscriptionStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import type { AuthenticatedUser } from "../utils/auth.types";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; url?: string; originalUrl?: string; user?: AuthenticatedUser }>();
    const header = request.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      throw new UnauthorizedException("Missing bearer token.");
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          store: {
            include: {
              subscriptions: {
                orderBy: [{ endDate: "desc" }, { createdAt: "desc" }],
                take: 1,
              },
            },
          },
          role: { include: { permissions: { include: { permission: true } } } },
          permissions: { include: { permission: true } },
        },
      });

      if (!user || user.status !== "ACTIVE") {
        throw new UnauthorizedException("Invalid or inactive user.");
      }

      const rolePermissions = user.role?.permissions.map((item) => item.permission.key) ?? [];
      const userPermissions = user.permissions.map((item) => item.permission.key);
      const roleName = user.role?.name ?? null;
      request.user = {
        id: user.id,
        storeId: user.storeId,
        branchId: user.branchId,
        roleId: user.roleId,
        roleName,
        permissions: Array.from(new Set([...rolePermissions, ...userPermissions])),
        isSuperAdmin: roleName === "super_admin",
        name: user.name,
        email: user.email,
        phone: user.phone,
      };
      this.assertSubscriptionAccess(request.originalUrl ?? request.url ?? "", request.user, user.store);

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      if (error instanceof ForbiddenException) throw error;
      throw new UnauthorizedException("Invalid bearer token.");
    }
  }

  private assertSubscriptionAccess(path: string, currentUser: AuthenticatedUser, store: { status: string; subscriptions: Array<{ status: SubscriptionStatus; endDate: Date | null; trialEndsAt: Date | null }> } | null) {
    if (currentUser.isSuperAdmin || !currentUser.storeId) return;
    if (isAllowedWhenSubscriptionBlocked(path)) return;
    if (!store) throw new UnauthorizedException("Invalid store context.");

    const subscription = store.subscriptions[0] ?? null;
    const now = new Date();
    const isBlockedStore = ["SUSPENDED", "EXPIRED"].includes(store.status);
    const isBlockedSubscription = !subscription
      || ["EXPIRED", "SUSPENDED", "CANCELLED"].includes(subscription.status)
      || (subscription.endDate ? subscription.endDate.getTime() < now.getTime() : false)
      || (subscription.status === "TRIAL" && subscription.trialEndsAt ? subscription.trialEndsAt.getTime() < now.getTime() : false);

    if (isBlockedStore || isBlockedSubscription) {
      throw new ForbiddenException("انتهى اشتراك المتجر أو تم إيقافه. برجاء التواصل مع الدعم.");
    }
  }
}

function isAllowedWhenSubscriptionBlocked(path: string) {
  const normalized = (path || "").split("?")[0];
  return normalized === "/api/auth/me"
    || normalized === "/api/auth/logout"
    || normalized === "/api/subscription/me"
    || normalized === "/api/subscription/usage"
    || normalized === "/api/health";
}
