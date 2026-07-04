import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const permissions = [
  "dashboard.view",
  "pos.access",
  "products.view",
  "products.create",
  "products.update",
  "products.delete",
  "inventory.view",
  "inventory.adjust",
  "sales.view",
  "invoices.view",
  "returns.create",
  "expenses.manage",
  "reports.view",
  "users.manage",
  "settings.manage",
  "activity_logs.view",
  "admin.platform_access",
];

const rolePermissions: Record<string, string[]> = {
  super_admin: permissions,
  owner: permissions.filter((permission) => permission !== "admin.platform_access"),
  manager: [
    "dashboard.view",
    "pos.access",
    "products.view",
    "products.create",
    "products.update",
    "inventory.view",
    "inventory.adjust",
    "sales.view",
    "invoices.view",
    "returns.create",
    "expenses.manage",
    "reports.view",
    "users.manage",
    "activity_logs.view",
  ],
  cashier: ["pos.access", "sales.view", "invoices.view", "returns.create"],
  inventory: ["products.view", "inventory.view", "inventory.adjust"],
};

async function upsertPermission(key: string) {
  return prisma.permission.upsert({
    where: { key },
    update: {},
    create: {
      key,
      label: key,
      description: `Permission: ${key}`,
    },
  });
}

async function findOrCreateRole(name: string, storeId: string | null) {
  const existing = await prisma.role.findFirst({ where: { name, storeId } });
  if (existing) return existing;

  return prisma.role.create({
    data: {
      name,
      storeId,
      isSystem: true,
      description: `Default ${name} role`,
    },
  });
}

async function syncRolePermissions(roleId: string, keys: string[]) {
  for (const key of keys) {
    const permission = await prisma.permission.findUniqueOrThrow({ where: { key } });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId: permission.id } },
      update: {},
      create: { roleId, permissionId: permission.id },
    });
  }
}

async function findOrCreateUser(data: {
  storeId: string | null;
  branchId?: string | null;
  roleId: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
}) {
  const existing = await prisma.user.findFirst({
    where: { email: data.email.toLowerCase(), storeId: data.storeId },
  });
  const passwordHash = await bcrypt.hash(data.password, 12);

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        phone: data.phone,
        branchId: data.branchId,
        roleId: data.roleId,
        passwordHash,
        status: "ACTIVE",
      },
    });
  }

  return prisma.user.create({
    data: {
      storeId: data.storeId,
      branchId: data.branchId,
      roleId: data.roleId,
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      passwordHash,
      status: "ACTIVE",
    },
  });
}

async function main() {
  for (const key of permissions) {
    await upsertPermission(key);
  }

  const starterPlan = await prisma.subscriptionPlan.upsert({
    where: { code: "starter" },
    update: {},
    create: {
      code: "starter",
      name: "Starter",
      monthlyPrice: 199,
      maxBranches: 1,
      maxUsers: 3,
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { code: "pro" },
    update: {},
    create: {
      code: "pro",
      name: "Pro",
      monthlyPrice: 399,
      maxBranches: 3,
      maxUsers: 10,
    },
  });

  const store = await prisma.store.upsert({
    where: { id: "demo-store-city-market" },
    update: {
      name: "ماركت المدينة",
      ownerName: "محمد ناصر",
      phone: "01000000000",
      email: "owner@raseed.local",
      status: "TRIAL",
    },
    create: {
      id: "demo-store-city-market",
      name: "ماركت المدينة",
      ownerName: "محمد ناصر",
      phone: "01000000000",
      email: "owner@raseed.local",
      status: "TRIAL",
    },
  });

  const branch = await prisma.branch.upsert({
    where: { storeId_name: { storeId: store.id, name: "الفرع الرئيسي" } },
    update: {
      address: "القاهرة",
      phone: "01000000001",
      isMain: true,
      isDefault: true,
      status: "ACTIVE",
    },
    create: {
      storeId: store.id,
      name: "الفرع الرئيسي",
      address: "القاهرة",
      phone: "01000000001",
      isMain: true,
      isDefault: true,
      status: "ACTIVE",
    },
  });

  await prisma.subscription.upsert({
    where: { id: "demo-subscription-city-market" },
    update: { status: "TRIAL", planId: starterPlan.id },
    create: {
      id: "demo-subscription-city-market",
      storeId: store.id,
      planId: starterPlan.id,
      status: "TRIAL",
    },
  });

  const superAdminRole = await findOrCreateRole("super_admin", null);
  await syncRolePermissions(superAdminRole.id, rolePermissions.super_admin);

  const roles: Record<string, { id: string }> = { super_admin: superAdminRole };
  for (const name of ["owner", "manager", "cashier", "inventory"]) {
    const role = await findOrCreateRole(name, store.id);
    await syncRolePermissions(role.id, rolePermissions[name]);
    roles[name] = role;
  }

  await findOrCreateUser({
    storeId: null,
    roleId: roles.super_admin.id,
    name: "أدمن رصيد",
    email: "admin@raseed.local",
    phone: "01000000999",
    password: "RaseedAdmin!2026",
  });

  await findOrCreateUser({
    storeId: store.id,
    branchId: branch.id,
    roleId: roles.owner.id,
    name: "محمد ناصر",
    email: "owner@raseed.local",
    phone: "01000000010",
    password: "RaseedOwner!2026",
  });

  await findOrCreateUser({
    storeId: store.id,
    branchId: branch.id,
    roleId: roles.manager.id,
    name: "سارة خالد",
    email: "manager@raseed.local",
    phone: "01000000020",
    password: "RaseedManager!2026",
  });

  await findOrCreateUser({
    storeId: store.id,
    branchId: branch.id,
    roleId: roles.cashier.id,
    name: "أحمد محمود",
    email: "cashier@raseed.local",
    phone: "01000000030",
    password: "RaseedCashier!2026",
  });

  await findOrCreateUser({
    storeId: store.id,
    branchId: branch.id,
    roleId: roles.inventory.id,
    name: "محمود سامي",
    email: "inventory@raseed.local",
    phone: "01000000040",
    password: "RaseedInventory!2026",
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
