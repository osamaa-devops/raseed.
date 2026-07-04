import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const permissions = [
  "dashboard.view",
  "pos.access",
  "pos.sell",
  "pos.hold_order",
  "pos.view_recent_invoices",
  "products.view",
  "products.create",
  "products.update",
  "products.delete",
  "categories.view",
  "categories.create",
  "categories.update",
  "categories.delete",
  "inventory.view",
  "inventory.adjust",
  "inventory.add_stock",
  "inventory.remove_stock",
  "inventory.view_movements",
  "inventory.view_alerts",
  "sales.view",
  "invoices.view",
  "invoices.print",
  "invoices.refund",
  "shifts.open",
  "shifts.close",
  "shifts.view",
  "returns.view",
  "returns.create",
  "returns.cancel",
  "returns.approve",
  "expenses.view",
  "expenses.create",
  "expenses.update",
  "expenses.delete",
  "reports.view",
  "reports.export",
  "closing.view",
  "closing.create",
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
    "pos.sell",
    "pos.hold_order",
    "pos.view_recent_invoices",
    "products.view",
    "products.create",
    "products.update",
    "categories.view",
    "categories.create",
    "categories.update",
    "inventory.view",
    "inventory.adjust",
    "inventory.add_stock",
    "inventory.remove_stock",
    "inventory.view_movements",
    "inventory.view_alerts",
    "sales.view",
    "invoices.view",
    "invoices.print",
    "invoices.refund",
    "shifts.open",
    "shifts.close",
    "shifts.view",
    "returns.view",
    "returns.create",
    "returns.cancel",
    "returns.approve",
    "expenses.view",
    "expenses.create",
    "expenses.update",
    "expenses.delete",
    "reports.view",
    "reports.export",
    "closing.view",
    "closing.create",
    "users.manage",
    "activity_logs.view",
  ],
  cashier: ["dashboard.view", "pos.access", "pos.sell", "pos.hold_order", "pos.view_recent_invoices", "products.view", "categories.view", "sales.view", "invoices.view", "invoices.print", "invoices.refund", "shifts.open", "shifts.close", "shifts.view", "returns.view", "returns.create", "closing.view"],
  inventory: [
    "products.view",
    "categories.view",
    "inventory.view",
    "inventory.adjust",
    "inventory.add_stock",
    "inventory.remove_stock",
    "inventory.view_movements",
    "inventory.view_alerts",
  ],
};

const demoCategories = [
  { name: "ألبان", color: "#0f766e", icon: "milk" },
  { name: "بقالة", color: "#d97706", icon: "package" },
  { name: "مشروبات", color: "#2563eb", icon: "cup" },
  { name: "منظفات", color: "#7c3aed", icon: "sparkles" },
  { name: "معلبات", color: "#dc2626", icon: "archive" },
  { name: "مجمدات", color: "#0891b2", icon: "snowflake" },
];

const demoProducts = [
  { name: "لبن جهينة", barcode: "6223001234567", category: "ألبان", purchasePrice: 13, sellingPrice: 18, minStock: 20, unitType: "كرتونة" },
  { name: "سكر أبيض", barcode: "6223001234568", category: "بقالة", purchasePrice: 28, sellingPrice: 35, minStock: 30, unitType: "كيلو" },
  { name: "أرز مصري", barcode: "6223001234569", category: "بقالة", purchasePrice: 35, sellingPrice: 45, minStock: 25, unitType: "كيلو" },
  { name: "زيت خليط", barcode: "6223001234570", category: "بقالة", purchasePrice: 42, sellingPrice: 55, minStock: 15, unitType: "لتر" },
  { name: "شاي العروسة", barcode: "6223001234571", category: "بقالة", purchasePrice: 16, sellingPrice: 22, minStock: 20, unitType: "علبة" },
  { name: "مياه معدنية", barcode: "6223001234572", category: "مشروبات", purchasePrice: 3, sellingPrice: 5, minStock: 50, unitType: "عبوة" },
  { name: "جبنة بيضاء", barcode: "6223001234573", category: "ألبان", purchasePrice: 50, sellingPrice: 65, minStock: 15, unitType: "كيلو" },
  { name: "مكرونة", barcode: "6223001234574", category: "بقالة", purchasePrice: 9, sellingPrice: 12, minStock: 40, unitType: "كيس" },
  { name: "بسكويت", barcode: "6223001234575", category: "بقالة", purchasePrice: 6, sellingPrice: 8, minStock: 30, unitType: "علبة" },
  { name: "مسحوق غسيل", barcode: "6223001234576", category: "منظفات", purchasePrice: 32, sellingPrice: 42, minStock: 10, unitType: "كيلو" },
  { name: "عصير مانجو", barcode: "6223001234577", category: "مشروبات", purchasePrice: 10, sellingPrice: 15, minStock: 20, unitType: "علبة" },
  { name: "بيبسي", barcode: "6223001234578", category: "مشروبات", purchasePrice: 7, sellingPrice: 10, minStock: 48, unitType: "علبة" },
  { name: "زبادي", barcode: "6223001234579", category: "ألبان", purchasePrice: 4, sellingPrice: 6, minStock: 12, unitType: "كوب" },
  { name: "تونة", barcode: "6223001234580", category: "معلبات", purchasePrice: 14, sellingPrice: 20, minStock: 24, unitType: "علبة" },
  { name: "صابون", barcode: "6223001234581", category: "منظفات", purchasePrice: 9, sellingPrice: 14, minStock: 20, unitType: "قطعة" },
];

const demoInventory: Record<string, { quantity: number; batchNumber?: string; expiryDays?: number; purchasePrice?: number }> = {
  "لبن جهينة": { quantity: 12, batchNumber: "MILK-EXP-01", expiryDays: 9, purchasePrice: 13 },
  "سكر أبيض": { quantity: 80 },
  "أرز مصري": { quantity: 50 },
  "زيت خليط": { quantity: 22 },
  "شاي العروسة": { quantity: 18 },
  "مياه معدنية": { quantity: 120 },
  "جبنة بيضاء": { quantity: 14, batchNumber: "CHEESE-01", expiryDays: 18, purchasePrice: 50 },
  "مكرونة": { quantity: 70 },
  "بسكويت": { quantity: 26 },
  "مسحوق غسيل": { quantity: 30 },
  "عصير مانجو": { quantity: 16, batchNumber: "JUICE-01", expiryDays: 24, purchasePrice: 10 },
  "بيبسي": { quantity: 64 },
  "زبادي": { quantity: 8, batchNumber: "YOG-EXP-01", expiryDays: 5, purchasePrice: 4 },
  "تونة": { quantity: 28 },
  "صابون": { quantity: 9 },
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

  const cashierUser = await findOrCreateUser({
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

  const openShift = await prisma.cashierShift.findFirst({
    where: { storeId: store.id, branchId: branch.id, cashierId: cashierUser.id, status: "OPEN" },
  });
  if (!openShift) {
    await prisma.cashierShift.create({
      data: {
        storeId: store.id,
        branchId: branch.id,
        cashierId: cashierUser.id,
        openingCash: 500,
        notes: "Seeded demo open shift",
      },
    });
  }

  const categoryByName = new Map<string, { id: string }>();
  for (const category of demoCategories) {
    const savedCategory = await prisma.category.upsert({
      where: { storeId_name: { storeId: store.id, name: category.name } },
      update: {
        color: category.color,
        icon: category.icon,
        status: "ACTIVE",
      },
      create: {
        storeId: store.id,
        name: category.name,
        color: category.color,
        icon: category.icon,
        status: "ACTIVE",
      },
    });
    categoryByName.set(category.name, savedCategory);
  }

  for (const product of demoProducts) {
    const category = categoryByName.get(product.category);
    const savedProduct = await prisma.product.upsert({
      where: { storeId_barcode: { storeId: store.id, barcode: product.barcode } },
      update: {
        categoryId: category?.id,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        minStock: product.minStock,
        unitType: product.unitType,
        status: "ACTIVE",
      },
      create: {
        storeId: store.id,
        categoryId: category?.id,
        name: product.name,
        barcode: product.barcode,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        minStock: product.minStock,
        unitType: product.unitType,
        status: "ACTIVE",
      },
    });

    const inventory = demoInventory[product.name];
    if (!inventory) continue;

    const stock = await prisma.inventoryStock.upsert({
      where: { storeId_branchId_productId: { storeId: store.id, branchId: branch.id, productId: savedProduct.id } },
      update: { quantity: inventory.quantity },
      create: {
        storeId: store.id,
        branchId: branch.id,
        productId: savedProduct.id,
        quantity: inventory.quantity,
      },
    });

    const existingInitialMovement = await prisma.inventoryMovement.findFirst({
      where: { storeId: store.id, branchId: branch.id, productId: savedProduct.id, type: "INITIAL" },
    });
    if (!existingInitialMovement) {
      await prisma.inventoryMovement.create({
        data: {
          storeId: store.id,
          branchId: branch.id,
          productId: savedProduct.id,
          type: "INITIAL",
          quantity: inventory.quantity,
          quantityBefore: 0,
          quantityAfter: stock.quantity,
          reason: "Seeded opening stock",
        },
      });
    }

    if (inventory.expiryDays || inventory.batchNumber || inventory.purchasePrice) {
      const expiryDate = inventory.expiryDays ? new Date(Date.now() + inventory.expiryDays * 24 * 60 * 60 * 1000) : null;
      const existingBatch = await prisma.inventoryBatch.findFirst({
        where: { storeId: store.id, branchId: branch.id, productId: savedProduct.id, batchNumber: inventory.batchNumber },
      });
      if (existingBatch) {
        await prisma.inventoryBatch.update({
          where: { id: existingBatch.id },
          data: {
            quantity: inventory.quantity,
            remainingQuantity: inventory.quantity,
            purchasePrice: inventory.purchasePrice,
            expiryDate,
          },
        });
      } else {
        await prisma.inventoryBatch.create({
          data: {
            storeId: store.id,
            branchId: branch.id,
            productId: savedProduct.id,
            batchNumber: inventory.batchNumber,
            quantity: inventory.quantity,
            remainingQuantity: inventory.quantity,
            purchasePrice: inventory.purchasePrice,
            expiryDate,
          },
        });
      }
    }
  }
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
