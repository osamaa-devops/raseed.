import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY } from "../decorators/require-permissions.decorator";
import { ANY_PERMISSIONS_KEY } from "../decorators/require-any-permissions.decorator";
import type { AuthenticatedUser } from "../utils/auth.types";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const permissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const anyPermissions = this.reflector.getAllAndOverride<string[]>(ANY_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!permissions?.length && !anyPermissions?.length) return true;

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (user?.isSuperAdmin) return true;

    const allAllowed = permissions?.length ? permissions.every((permission) => user?.permissions.includes(permission)) : true;
    const anyAllowed = anyPermissions?.length ? anyPermissions.some((permission) => user?.permissions.includes(permission)) : true;
    const allowed = allAllowed && anyAllowed;
    if (!allowed) {
      throw new ForbiddenException("Insufficient permissions.");
    }

    return true;
  }
}
