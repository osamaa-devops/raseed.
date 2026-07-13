import type { AuthResponse } from "../../services/authService";

type AccessRule = {
  anyPermissions?: string[];
  allPermissions?: string[];
};

const routeRules: Record<string, AccessRule> = {
  "/dashboard": { anyPermissions: ["dashboard.view"] },
  "/pos": { anyPermissions: ["pos.access"] },
  "/shifts": { anyPermissions: ["shifts.view"] },
  "/closing": { anyPermissions: ["closing.view"] },
  "/products": { allPermissions: ["products.view"] },
  "/categories": { allPermissions: ["products.view"] },
  "/inventory": { anyPermissions: ["inventory.view"] },
  "/import-export": { anyPermissions: ["data.import", "data.export", "products.import", "products.export", "inventory.import", "inventory.export"] },
  "/sales": { anyPermissions: ["sales.view", "invoices.view"] },
  "/returns": { anyPermissions: ["returns.view"] },
  "/expenses": { anyPermissions: ["expenses.view"] },
  "/reports": { anyPermissions: ["reports.view"] },
  "/suppliers": { anyPermissions: ["suppliers.view"] },
  "/purchase-orders": { anyPermissions: ["purchase_orders.view"] },
  "/customers-debts": { anyPermissions: ["customers.view", "debts.view"] },
  "/branches": { anyPermissions: ["settings.manage"] },
  "/users-permissions": { anyPermissions: ["users.manage"] },
  "/activity-logs": { anyPermissions: ["activity_logs.view"] },
  "/subscription-billing": { anyPermissions: ["subscription.view"] },
  "/settings": { anyPermissions: ["settings.receipt.view", "backup.manage", "license.manage"] },
};

export function canAccessPath(auth: AuthResponse | null, path: string) {
  if (!auth) return false;
  if (auth.role?.name === "super_admin") {
    return path.startsWith("/super-admin");
  }

  const rule = routeRules[path];
  if (!rule) return true;

  const permissions = new Set(auth.permissions);
  const anyAllowed = rule.anyPermissions ? rule.anyPermissions.some((permission) => permissions.has(permission)) : true;
  const allAllowed = rule.allPermissions ? rule.allPermissions.every((permission) => permissions.has(permission)) : true;
  return anyAllowed && allAllowed;
}
