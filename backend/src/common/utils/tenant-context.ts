import { ForbiddenException } from "@nestjs/common";
import type { AuthenticatedUser } from "./auth.types";

export type TenantContext = {
  storeId: string;
  branchId?: string;
};

export function getTenantContext(user: AuthenticatedUser): TenantContext {
  if (!user.storeId && !user.isSuperAdmin) {
    throw new ForbiddenException("Authenticated store users must have a storeId.");
  }

  return {
    storeId: user.storeId ?? "",
    branchId: user.branchId ?? undefined,
  };
}

export function assertStoreAccess(user: AuthenticatedUser, storeId: string) {
  if (!user.isSuperAdmin && user.storeId !== storeId) {
    throw new ForbiddenException("You cannot access another store.");
  }
}
