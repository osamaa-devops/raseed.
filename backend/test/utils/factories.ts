import { Prisma, type Branch, type Category, type Product, type Role, type Store, type User } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { prisma } from "./test-db";

export const ownerPermissions = [
  "dashboard.view",
  "products.view",
  "products.create",
  "products.update",
  "categories.view",
  "categories.create",
  "inventory.view",
  "inventory.add_stock",
  "inventory.remove_stock",
  "inventory.adjust",
  "inventory.view_movements",
  "inventory.view_alerts",
  "pos.access",
  "pos.sell",
  "pos.view_recent_invoices",
  "invoices.view",
  "returns.view",
  "returns.create",
  "expenses.view",
  "expenses.create",
  "expenses.update",
  "expenses.delete",
  "reports.view",
  "reports.export",
  "closing.view",
  "closing.create",
  "customers.view",
  "customers.create",
  "customers.update",
  "debts.view",
  "debts.add",
  "debts.pay",
  "debts.adjust",
  "suppliers.view",
  "suppliers.create",
  "suppliers.pay",
  "purchase_orders.view",
  "purchase_orders.create",
  "purchase_orders.update",
  "purchase_orders.receive",
  "settings.receipt.view",
  "settings.receipt.update",
  "printing.receipts",
  "printing.barcodes",
  "products.generate_barcode",
  "subscription.view",
  "data.import",
  "data.export",
  "products.import",
  "products.export",
  "inventory.import",
  "inventory.export",
];

export const cashierPermissions = [
  "dashboard.view",
  "categories.view",
  "pos.access",
  "pos.catalog.view",
  "pos.sell",
  "pos.hold_order",
  "pos.view_recent_invoices",
  "sales.view",
  "invoices.view",
  "invoices.print",
  "printing.receipts",
  "shifts.open",
  "shifts.close",
  "shifts.view",
  "returns.view",
  "returns.create",
];

export type TestStoreContext = {
  store: Store;
  branch: Branch;
  ownerRole: Role;
  cashierRole: Role;
  owner: User;
  cashier: User;
  ownerPassword: string;
  cashierPassword: string;
};

type TestProductOverrides = Omit<Partial<Product>, "purchasePrice" | "sellingPrice"> & {
  purchasePrice?: string | number | Prisma.Decimal;
  sellingPrice?: string | number | Prisma.Decimal;
};

let uniqueCounter = 0;
let loginCounter = 0;

export function unique(prefix: string) {
  uniqueCounter += 1;
  return `${prefix}-${Date.now()}-${uniqueCounter}`;
}

export async function createTestStore(overrides: { status?: "ACTIVE" | "TRIAL" | "SUSPENDED" | "EXPIRED"; ownerPermissionsOverride?: string[]; cashierPermissionsOverride?: string[] } = {}): Promise<TestStoreContext> {
  const suffix = unique("store");
  const store = await prisma.store.create({
    data: {
      name: `Test Store ${suffix}`,
      ownerName: "Test Owner",
      email: `${suffix}@store.test`,
      phone: suffix.slice(-14),
      status: overrides.status ?? "ACTIVE",
    },
  });
  const branch = await prisma.branch.create({
    data: { storeId: store.id, name: "Main Branch", isMain: true, isDefault: true, status: "ACTIVE" },
  });
  const plan = await prisma.subscriptionPlan.create({
    data: {
      name: `Plan ${suffix}`,
      code: `plan-${suffix}`,
      priceMonthly: 100,
      priceYearly: 1000,
      maxUsers: 50,
      maxBranches: 10,
      maxProducts: 10000,
      maxInvoicesPerMonth: 10000,
      status: "ACTIVE",
    },
  });
  await prisma.subscription.create({
    data: {
      storeId: store.id,
      planId: plan.id,
      status: overrides.status === "SUSPENDED" ? "SUSPENDED" : overrides.status === "EXPIRED" ? "EXPIRED" : "ACTIVE",
      billingCycle: "MONTHLY",
      amount: 100,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const ownerRole = await createRole(store.id, `owner-${suffix}`, overrides.ownerPermissionsOverride ?? ownerPermissions);
  const cashierRole = await createRole(store.id, `cashier-${suffix}`, overrides.cashierPermissionsOverride ?? cashierPermissions);
  const ownerPassword = "OwnerPass!2026";
  const cashierPassword = "CashierPass!2026";
  const owner = await createUser(store.id, branch.id, ownerRole.id, `owner-${suffix}@raseed.test`, ownerPassword, "Owner");
  const cashier = await createUser(store.id, branch.id, cashierRole.id, `cashier-${suffix}@raseed.test`, cashierPassword, "Cashier");
  return { store, branch, ownerRole, cashierRole, owner, cashier, ownerPassword, cashierPassword };
}

export async function createPlatformAdmin() {
  const suffix = unique("admin");
  const role = await createRole(null, `super_admin-${suffix}`, [
    "admin.platform_access",
    "admin.stores.view",
    "admin.usage.view",
    "admin.roles.view",
    "admin.permissions.view",
  ]);
  const password = "AdminPass!2026";
  const user = await createUser(null, null, role.id, `admin-${suffix}@raseed.test`, password, "Super Admin");
  return { role, user, password };
}

export async function createRole(storeId: string | null, name: string, permissionKeys: string[]) {
  await ensurePermissions(permissionKeys);
  const role = await prisma.role.create({ data: { storeId, name, isSystem: false } });
  const permissions = await prisma.permission.findMany({ where: { key: { in: permissionKeys } } });
  await prisma.rolePermission.createMany({
    data: permissions.map((permission) => ({ roleId: role.id, permissionId: permission.id })),
    skipDuplicates: true,
  });
  return role;
}

export async function ensurePermissions(keys: string[]) {
  for (const key of keys) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, label: key, description: `Test permission: ${key}` },
    });
  }
}

export async function createUser(storeId: string | null, branchId: string | null, roleId: string, email: string, password: string, name: string) {
  return prisma.user.create({
    data: {
      storeId,
      branchId,
      roleId,
      email: email.toLowerCase(),
      name,
      status: "ACTIVE",
      passwordHash: await bcrypt.hash(password, 10),
    },
  });
}

export async function login(app: INestApplication, email: string, password: string) {
  loginCounter += 1;
  const forwardedFor = `10.0.${Math.floor(loginCounter / 250) % 250}.${(loginCounter % 250) + 1}`;
  const response = await request(app.getHttpServer())
    .post("/api/auth/login")
    .set("X-Forwarded-For", forwardedFor)
    .send({ identity: email, password })
    .expect(201);
  return response.body.accessToken as string;
}

export async function createTestCategory(storeId: string, data: Partial<Category> = {}) {
  return prisma.category.create({
    data: {
      storeId,
      name: data.name ?? unique("Category"),
      color: data.color ?? "#2563eb",
      icon: data.icon ?? "package",
    },
  });
}

export async function createTestProduct(storeId: string, categoryId?: string | null, data: TestProductOverrides = {}) {
  return prisma.product.create({
    data: {
      storeId,
      categoryId,
      name: data.name ?? unique("Product"),
      barcode: data.barcode ?? unique("BC"),
      sku: data.sku ?? unique("SKU"),
      purchasePrice: new Prisma.Decimal(data.purchasePrice?.toString() ?? "5"),
      sellingPrice: new Prisma.Decimal(data.sellingPrice?.toString() ?? "10"),
      minStock: data.minStock ?? 2,
      unitType: data.unitType ?? "piece",
      status: data.status ?? "ACTIVE",
    },
  });
}

export async function createTestStock(storeId: string, branchId: string, productId: string, quantity: number) {
  return prisma.inventoryStock.upsert({
    where: { storeId_branchId_productId: { storeId, branchId, productId } },
    update: { quantity },
    create: { storeId, branchId, productId, quantity },
  });
}

export async function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
