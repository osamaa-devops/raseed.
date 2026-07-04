import type { Branch, Permission, Role, Store, User } from "@prisma/client";

export type UserWithRelations = User & {
  store?: Store | null;
  branch?: Branch | null;
  role?: Role | null;
  permissions?: Array<{ permission: Permission }>;
};

export function serializeUser(user: UserWithRelations) {
  return {
    id: user.id,
    storeId: user.storeId,
    branchId: user.branchId,
    roleId: user.roleId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function collectPermissions(user: UserWithRelations) {
  const rolePermissions = "role" in user && user.role && "permissions" in user.role
    ? []
    : [];
  const directPermissions = user.permissions?.map((item) => item.permission.key) ?? [];
  return Array.from(new Set([...rolePermissions, ...directPermissions]));
}
