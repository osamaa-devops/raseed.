import { Prisma, PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { rolePermissions, seedCoreReferenceData } from "../src/bootstrap/bootstrap-core";

const prisma = new PrismaClient();

const DEMO_STORE_ID = "demo-store-raseed-clothing";
const DEMO_SUBSCRIPTION_ID = "demo-subscription-raseed-clothing";
const DEMO_ADMIN_EMAIL = "admin@raseed.local";
const DEMO_OWNER_EMAIL = "owner@raseed.local";
const DEMO_CASHIER_EMAIL = "cashier@raseed.local";
const DEMO_OWNER_PASSWORD = "hello2026";
const DEMO_CASHIER_PASSWORD = "hello2026";

const demoCategories = [
  { name: "تيشيرتات", color: "#0f766e", icon: "shirt" },
  { name: "بناطيل", color: "#1d4ed8", icon: "stretch-horizontal" },
  { name: "فساتين", color: "#be185d", icon: "sparkles" },
  { name: "جاكيتات", color: "#92400e", icon: "shield" },
  { name: "إكسسوارات", color: "#6d28d9", icon: "gem" },
];

const demoProducts = [
  {
    name: "تيشيرت أساسي قطن",
    barcode: "6291001000011",
    category: "تيشيرتات",
    brand: "Raseed Wear",
    gender: "UNISEX",
    season: "SUMMER",
    purchasePrice: 180,
    sellingPrice: 280,
    minStock: 4,
    unitType: "قطعة",
    variants: [
      { size: "M", color: "أبيض", sku: "TSHIRT-BASIC-WHT-M", barcode: "6291001000011", purchasePrice: 180, sellingPrice: 280, minStock: 2, stockQuantity: 7 },
      { size: "L", color: "أبيض", sku: "TSHIRT-BASIC-WHT-L", barcode: "6291001000012", purchasePrice: 180, sellingPrice: 280, minStock: 2, stockQuantity: 5 },
      { size: "XL", color: "أسود", sku: "TSHIRT-BASIC-BLK-XL", barcode: "6291001000013", purchasePrice: 185, sellingPrice: 295, minStock: 2, stockQuantity: 4 },
    ],
  },
  {
    name: "جينز Slim Fit",
    barcode: "6291001000021",
    category: "بناطيل",
    brand: "Denim House",
    gender: "MEN",
    season: "ALL_SEASON",
    purchasePrice: 320,
    sellingPrice: 490,
    minStock: 3,
    unitType: "قطعة",
    variants: [
      { size: "32", color: "أزرق", sku: "JEANS-SLIM-BLU-32", barcode: "6291001000021", purchasePrice: 320, sellingPrice: 490, minStock: 1, stockQuantity: 6 },
      { size: "34", color: "أزرق", sku: "JEANS-SLIM-BLU-34", barcode: "6291001000022", purchasePrice: 320, sellingPrice: 490, minStock: 1, stockQuantity: 5 },
      { size: "36", color: "أسود", sku: "JEANS-SLIM-BLK-36", barcode: "6291001000023", purchasePrice: 330, sellingPrice: 510, minStock: 1, stockQuantity: 3 },
    ],
  },
  {
    name: "فستان صيفي مورد",
    barcode: "6291001000031",
    category: "فساتين",
    brand: "Bloom",
    gender: "WOMEN",
    season: "SUMMER",
    purchasePrice: 420,
    sellingPrice: 650,
    minStock: 2,
    unitType: "قطعة",
    variants: [
      { size: "S", color: "وردي", sku: "DRESS-FLORAL-PNK-S", barcode: "6291001000031", purchasePrice: 420, sellingPrice: 650, minStock: 1, stockQuantity: 4 },
      { size: "M", color: "وردي", sku: "DRESS-FLORAL-PNK-M", barcode: "6291001000032", purchasePrice: 420, sellingPrice: 650, minStock: 1, stockQuantity: 3 },
      { size: "L", color: "أزرق سماوي", sku: "DRESS-FLORAL-SKY-L", barcode: "6291001000033", purchasePrice: 430, sellingPrice: 670, minStock: 1, stockQuantity: 2 },
    ],
  },
  {
    name: "جاكيت جينز",
    barcode: "6291001000041",
    category: "جاكيتات",
    brand: "Layer",
    gender: "UNISEX",
    season: "WINTER",
    purchasePrice: 540,
    sellingPrice: 820,
    minStock: 2,
    unitType: "قطعة",
    variants: [
      { size: "M", color: "أزرق داكن", sku: "JACKET-DENIM-DBL-M", barcode: "6291001000041", purchasePrice: 540, sellingPrice: 820, minStock: 1, stockQuantity: 3 },
      { size: "L", color: "أزرق داكن", sku: "JACKET-DENIM-DBL-L", barcode: "6291001000042", purchasePrice: 540, sellingPrice: 820, minStock: 1, stockQuantity: 2 },
    ],
  },
  {
    name: "حزام جلد كلاسيك",
    barcode: "6291001000051",
    category: "إكسسوارات",
    brand: "Urban Line",
    gender: "MEN",
    season: "ALL_SEASON",
    purchasePrice: 90,
    sellingPrice: 160,
    minStock: 5,
    unitType: "قطعة",
    variants: [
      { size: "110", color: "بني", sku: "BELT-CLASSIC-BRN-110", barcode: "6291001000051", purchasePrice: 90, sellingPrice: 160, minStock: 2, stockQuantity: 8 },
      { size: "120", color: "أسود", sku: "BELT-CLASSIC-BLK-120", barcode: "6291001000052", purchasePrice: 90, sellingPrice: 160, minStock: 2, stockQuantity: 6 },
    ],
  },
];

const demoInventory: Record<string, { quantity: number; batchNumber?: string; expiryDays?: number; purchasePrice?: number }> = {
  "تيشيرت أساسي قطن": { quantity: 16, batchNumber: "TSHIRT-2026-01", purchasePrice: 180 },
  "جينز Slim Fit": { quantity: 14, batchNumber: "JEANS-2026-01", purchasePrice: 320 },
  "فستان صيفي مورد": { quantity: 9, batchNumber: "DRESS-2026-01", purchasePrice: 420 },
  "جاكيت جينز": { quantity: 5, batchNumber: "JACKET-2026-01", purchasePrice: 540 },
  "حزام جلد كلاسيك": { quantity: 14, batchNumber: "BELT-2026-01", purchasePrice: 90 },
};

const demoCustomers = [
  { name: "محمد علي", phone: "01010000001", address: "شارع النصر", currentDebt: 250, creditLimit: 1000, notes: "عميل دائم" },
  { name: "أحمد حسن", phone: "01010000002", address: "مدينة نصر", currentDebt: 120, creditLimit: 750 },
  { name: "مصطفى السيد", phone: "01010000003", address: "المعادي", currentDebt: 0, creditLimit: 500 },
  { name: "كريم محمود", phone: "01010000004", address: "شبرا", currentDebt: 80, creditLimit: 400 },
  { name: "سارة أحمد", phone: "01010000005", address: "الزمالك", currentDebt: 0, creditLimit: 1200 },
];

const demoSuppliers = [
  { name: "شركة النور للتوريدات", phone: "01020000001", contactPerson: "أ. وليد", address: "القاهرة", currentBalance: 0 },
  { name: "مورد المدينة", phone: "01020000002", contactPerson: "أ. سامي", address: "الجيزة", currentBalance: 250 },
  { name: "شركة الأمل للمواد الغذائية", phone: "01020000003", contactPerson: "أ. عمرو", address: "القليوبية", currentBalance: 0 },
  { name: "المتحدة للمنظفات", phone: "01020000004", contactPerson: "أ. حسن", address: "القاهرة", currentBalance: 120 },
  { name: "شركة المشروبات الحديثة", phone: "01020000005", contactPerson: "أ. مينا", address: "الإسكندرية", currentBalance: 0 },
];

const demoInvoicesSeed = [
  {
    invoiceNumber: "INV-DEMO-1001",
    createdAt: minutesAgo(3),
    customerPhone: "01010000001",
    paymentMethod: "CASH" as const,
    items: [
      { barcode: "6291001000011", quantity: 1, discount: 0 },
      { barcode: "6291001000051", quantity: 1, discount: 10 },
      { barcode: "6291001000022", quantity: 1, discount: 20 },
    ],
    notes: "فاتورة عرض سريعة لعميل متجر الملابس",
  },
  {
    invoiceNumber: "INV-DEMO-1002",
    createdAt: minutesAgo(6),
    customerPhone: null,
    paymentMethod: "CARD" as const,
    items: [
      { barcode: "6291001000032", quantity: 1, discount: 25 },
      { barcode: "6291001000041", quantity: 1, discount: 0 },
    ],
    notes: "فاتورة تجريبية لبيع مباشر من الكاشير",
  },
  {
    invoiceNumber: "INV-DEMO-0999",
    createdAt: hoursAgo(28),
    customerPhone: "01010000002",
    paymentMethod: "WALLET" as const,
    items: [
      { barcode: "6291001000012", quantity: 1, discount: 0 },
      { barcode: "6291001000031", quantity: 1, discount: 30 },
      { barcode: "6291001000052", quantity: 2, discount: 0 },
    ],
    notes: "فاتورة يوم أمس للمقارنة في لوحة التقارير",
  },
];

const demoReturnSeed = {
  invoiceNumber: "INV-DEMO-1001",
  returnNumber: "RT-DEMO-0001",
  createdAt: minutesAgo(1),
  reason: "العميل استبدل مقاسًا بعد الشراء",
  refundMethod: "CASH" as const,
  itemBarcode: "6291001000051",
  quantity: 1,
  restocked: true,
  notes: "مرتجع تجريبي يعيد القطعة إلى المخزون",
};

const demoExpensesSeed = [
  { title: "مصاريف توصيل طلبيات", category: "DELIVERY" as const, amount: 95, expenseDate: minutesAgo(2), notes: "تحميل وتنزيل وشحن داخلي" },
  { title: "مستلزمات نظافة للفرع", category: "SUPPLIES" as const, amount: 140, expenseDate: minutesAgo(5), notes: "أكياس قمامة ومناديل ومنظفات" },
  { title: "وجبات فريق العمل", category: "OTHER" as const, amount: 75, expenseDate: hoursAgo(26), notes: "مصروف يوم سابق للمقارنة" },
];

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000);
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
  const rolePermissionRows = await prisma.permission.findMany({ where: { key: { in: keys } } });
  const permissionIds = rolePermissionRows.map((permission) => permission.id);
  const foundKeys = new Set(rolePermissionRows.map((permission) => permission.key));
  const missingKeys = keys.filter((key) => !foundKeys.has(key));
  if (missingKeys.length) throw new Error(`Missing permissions: ${missingKeys.join(", ")}`);

  await prisma.rolePermission.deleteMany({
    where: {
      roleId,
      permissionId: { notIn: permissionIds },
    },
  });

  for (const permission of rolePermissionRows) {
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

async function resetDemoOperationalData(storeId: string, branchId: string) {
  const demoInvoiceNumbers = demoInvoicesSeed.map((invoice) => invoice.invoiceNumber);
  const invoiceIds = (
    await prisma.invoice.findMany({
      where: { storeId, branchId, invoiceNumber: { in: demoInvoiceNumbers } },
      select: { id: true },
    })
  ).map((invoice) => invoice.id);

  if (invoiceIds.length > 0) {
    await prisma.returnItem.deleteMany({ where: { storeId, branchId, return: { invoiceId: { in: invoiceIds } } } });
    await prisma.return.deleteMany({ where: { storeId, branchId, invoiceId: { in: invoiceIds } } });
    await prisma.payment.deleteMany({ where: { storeId, branchId, invoiceId: { in: invoiceIds } } });
    await prisma.invoiceItem.deleteMany({ where: { storeId, branchId, invoiceId: { in: invoiceIds } } });
    await prisma.invoice.deleteMany({ where: { id: { in: invoiceIds } } });
  }

  await prisma.return.deleteMany({ where: { storeId, branchId, returnNumber: demoReturnSeed.returnNumber } });
  await prisma.expense.deleteMany({ where: { storeId, branchId, notes: { startsWith: "[DEMO]" } } });
  await prisma.inventoryMovement.deleteMany({
    where: {
      storeId,
      branchId,
      OR: [{ reason: "Seeded demo sale" }, { reason: "Seeded demo return restock" }],
    },
  });
}

async function seedDemoOperationalData({
  storeId,
  branchId,
  ownerUserId,
  cashierUserId,
  shiftId,
  productByBarcode,
  customerByPhone,
}: {
  storeId: string;
  branchId: string;
  ownerUserId: string;
  cashierUserId: string;
  shiftId: string | null;
  productByBarcode: Map<string, { id: string; name: string; barcode: string | null; variantId: string; variantSku: string | null; variantBarcode: string | null; variantSize: string; variantColor: string; purchasePrice: Prisma.Decimal; sellingPrice: Prisma.Decimal }>;
  customerByPhone: Map<string, { id: string }>;
}) {
  for (const invoiceSeed of demoInvoicesSeed) {
    const lines = invoiceSeed.items.map((item) => {
      const product = productByBarcode.get(item.barcode);
      if (!product) throw new Error(`Missing seeded product ${item.barcode}`);
      const unitPrice = Number(product.sellingPrice);
      const purchasePrice = Number(product.purchasePrice);
      const lineTotal = unitPrice * item.quantity - item.discount;
      return { ...item, product, unitPrice, purchasePrice, lineTotal };
    });

    const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    const discountTotal = lines.reduce((sum, line) => sum + line.discount, 0);
    const total = subtotal - discountTotal;

    const invoice = await prisma.invoice.create({
      data: {
        storeId,
        branchId,
        cashierId: cashierUserId,
        shiftId,
        customerId: invoiceSeed.customerPhone ? customerByPhone.get(invoiceSeed.customerPhone)?.id ?? null : null,
        invoiceNumber: invoiceSeed.invoiceNumber,
        status: "PAID",
        subtotal,
        discountTotal,
        taxTotal: 0,
        total,
        paidAmount: total,
        changeAmount: 0,
        notes: invoiceSeed.notes,
        createdAt: invoiceSeed.createdAt,
        updatedAt: invoiceSeed.createdAt,
        items: {
          create: lines.map((line) => ({
            storeId,
            branchId,
            productId: line.product.id,
            variantId: line.product.variantId,
            productName: line.product.name,
            productBarcode: line.product.barcode,
            variantSku: line.product.variantSku,
            variantBarcode: line.product.variantBarcode,
            variantSize: line.product.variantSize,
            variantColor: line.product.variantColor,
            quantity: line.quantity,
            purchasePriceSnapshot: line.purchasePrice,
            unitPrice: line.unitPrice,
            discount: line.discount,
            lineTotal: line.lineTotal,
            createdAt: invoiceSeed.createdAt,
          })),
        },
        payments: {
          create: {
            storeId,
            branchId,
            method: invoiceSeed.paymentMethod,
            amount: total,
            createdAt: invoiceSeed.createdAt,
          },
        },
      },
      include: { items: true },
    });

    for (const item of invoice.items) {
      const stock = await prisma.inventoryStock.findUniqueOrThrow({
        where: { storeId_branchId_productId: { storeId, branchId, productId: item.productId } },
      });
      const quantityAfter = Number(stock.quantity) - Number(item.quantity);

      await prisma.inventoryStock.update({
        where: { id: stock.id },
        data: { quantity: quantityAfter },
      });

      await prisma.inventoryMovement.create({
        data: {
          storeId,
          branchId,
          productId: item.productId,
          userId: cashierUserId,
          type: "SALE",
          quantity: item.quantity,
          quantityBefore: stock.quantity,
          quantityAfter,
          reason: "Seeded demo sale",
          notes: invoiceSeed.invoiceNumber,
          referenceId: invoice.id,
          createdAt: invoiceSeed.createdAt,
        },
      });
    }
  }

  const returnInvoice = await prisma.invoice.findUniqueOrThrow({
    where: { storeId_branchId_invoiceNumber: { storeId, branchId, invoiceNumber: demoReturnSeed.invoiceNumber } },
    include: { items: true },
  });
  const returnItem = returnInvoice.items.find((item) => item.productBarcode === demoReturnSeed.itemBarcode);
  if (!returnItem) throw new Error("Missing seeded return invoice item.");

  const refundAmount = Number(returnItem.unitPrice) * demoReturnSeed.quantity;
  const createdReturn = await prisma.return.create({
    data: {
      storeId,
      branchId,
      invoiceId: returnInvoice.id,
      cashierId: cashierUserId,
      shiftId,
      returnNumber: demoReturnSeed.returnNumber,
      reason: demoReturnSeed.reason,
      status: "COMPLETED",
      refundTotal: refundAmount,
      refundMethod: demoReturnSeed.refundMethod,
      notes: demoReturnSeed.notes,
      createdAt: demoReturnSeed.createdAt,
      updatedAt: demoReturnSeed.createdAt,
      items: {
        create: {
          storeId,
          branchId,
          invoiceItemId: returnItem.id,
          productId: returnItem.productId,
          productName: returnItem.productName,
          productBarcode: returnItem.productBarcode,
          quantity: demoReturnSeed.quantity,
          unitPrice: returnItem.unitPrice,
          refundAmount,
          restocked: demoReturnSeed.restocked,
          createdAt: demoReturnSeed.createdAt,
        },
      },
    },
  });

  await prisma.invoice.update({
    where: { id: returnInvoice.id },
    data: { status: "PARTIALLY_REFUNDED", updatedAt: demoReturnSeed.createdAt },
  });

  await prisma.invoiceItem.update({
    where: { id: returnItem.id },
    data: { returnedQuantity: demoReturnSeed.quantity },
  });

  if (demoReturnSeed.restocked) {
    const stock = await prisma.inventoryStock.findUniqueOrThrow({
      where: { storeId_branchId_productId: { storeId, branchId, productId: returnItem.productId } },
    });
    const quantityAfter = Number(stock.quantity) + demoReturnSeed.quantity;

    await prisma.inventoryStock.update({
      where: { id: stock.id },
      data: { quantity: quantityAfter },
    });

    await prisma.inventoryMovement.create({
      data: {
        storeId,
        branchId,
        productId: returnItem.productId,
        userId: cashierUserId,
        type: "RETURN",
        quantity: demoReturnSeed.quantity,
        quantityBefore: stock.quantity,
        quantityAfter,
        reason: "Seeded demo return restock",
        notes: demoReturnSeed.returnNumber,
        referenceId: createdReturn.id,
        createdAt: demoReturnSeed.createdAt,
      },
    });
  }

  for (const expenseSeed of demoExpensesSeed) {
    await prisma.expense.create({
      data: {
        storeId,
        branchId,
        userId: ownerUserId,
        title: expenseSeed.title,
        category: expenseSeed.category,
        amount: expenseSeed.amount,
        expenseDate: expenseSeed.expenseDate,
        notes: `[DEMO] ${expenseSeed.notes}`,
        createdAt: expenseSeed.expenseDate,
        updatedAt: expenseSeed.expenseDate,
      },
    });
  }
}

export async function main() {
  await seedCoreReferenceData(prisma);

  const legacyStarterPlan = await prisma.subscriptionPlan.findUnique({
    where: { code: "starter" },
    include: { _count: { select: { subscriptions: true } } },
  });
  if (legacyStarterPlan && legacyStarterPlan._count.subscriptions === 0 && legacyStarterPlan.status !== "INACTIVE") {
    await prisma.subscriptionPlan.update({
      where: { id: legacyStarterPlan.id },
      data: {
        status: "INACTIVE",
        description: legacyStarterPlan.description ?? "خطة قديمة تم إيقافها من الباقات القياسية الحالية.",
      },
    });
  }

  const proPlan = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { code: "pro" } });

  if (process.env.RASEED_SEED_PROFILE === "core") {
    await prisma.$disconnect();
    return;
  }

  const demoMode = process.env.RASEED_SEED_PROFILE === "demo" || (process.env.NODE_ENV !== "production" && process.env.RASEED_SEED_PROFILE !== "core");
  if (!demoMode) {
    await prisma.$disconnect();
    return;
  }

  await prisma.store.deleteMany({ where: { id: { not: DEMO_STORE_ID } } });
  await prisma.user.deleteMany({
    where: {
      storeId: null,
      email: { not: DEMO_ADMIN_EMAIL },
    },
  });

  const store = await prisma.store.upsert({
    where: { id: DEMO_STORE_ID },
    update: {
      name: "محل رصيد التجريبي",
      ownerName: "مالك الديمو",
      phone: "01000000000",
      email: DEMO_OWNER_EMAIL,
      status: "ACTIVE",
    },
    create: {
      id: DEMO_STORE_ID,
      name: "محل رصيد التجريبي",
      ownerName: "مالك الديمو",
      phone: "01000000000",
      email: DEMO_OWNER_EMAIL,
      status: "ACTIVE",
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

  const existingReceiptSettings = await prisma.receiptSettings.findFirst({ where: { storeId: store.id, branchId: null } });
  if (existingReceiptSettings) {
    await prisma.receiptSettings.update({
      where: { id: existingReceiptSettings.id },
      data: {
        storeName: "محل رصيد التجريبي",
        storePhone: store.phone,
        storeAddress: "القاهرة - محل ملابس",
        receiptFooter: "شكراً لزيارتكم محل رصيد التجريبي",
        paperSize: "MM_80",
      },
    });
  } else {
    await prisma.receiptSettings.create({
      data: {
        storeId: store.id,
        storeName: "محل رصيد التجريبي",
        storePhone: store.phone,
        storeAddress: "القاهرة - محل ملابس",
        receiptFooter: "شكراً لزيارتكم محل رصيد التجريبي",
        paperSize: "MM_80",
      },
    });
  }

  await prisma.barcodeLabelSettings.upsert({
    where: { storeId: store.id },
    update: {
      labelSize: "MEDIUM",
      showProductName: true,
      showPrice: true,
      showBarcodeText: true,
      columns: 3,
    },
    create: {
      storeId: store.id,
      labelSize: "MEDIUM",
      showProductName: true,
      showPrice: true,
      showBarcodeText: true,
      columns: 3,
    },
  });

  await prisma.subscription.upsert({
    where: { id: DEMO_SUBSCRIPTION_ID },
    update: {
      status: "ACTIVE",
      planId: proPlan.id,
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      endDate: new Date("2026-08-01T00:00:00.000Z"),
      trialEndsAt: null,
      billingCycle: "MONTHLY",
      amount: 900,
      notes: "Seeded active Pro subscription",
    },
    create: {
      id: DEMO_SUBSCRIPTION_ID,
      storeId: store.id,
      planId: proPlan.id,
      status: "ACTIVE",
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      endDate: new Date("2026-08-01T00:00:00.000Z"),
      trialEndsAt: null,
      billingCycle: "MONTHLY",
      amount: 900,
      notes: "Seeded active Pro subscription",
    },
  });

  const demoSubscription = await prisma.subscription.findUniqueOrThrow({ where: { id: DEMO_SUBSCRIPTION_ID } });
  const existingPayment = await prisma.subscriptionPayment.findFirst({
    where: { subscriptionId: demoSubscription.id, reference: "SEED-PRO-2026-07" },
  });
  if (!existingPayment) {
    await prisma.subscriptionPayment.create({
      data: {
        storeId: store.id,
        subscriptionId: demoSubscription.id,
        amount: 900,
        method: "MANUAL",
        status: "PAID",
        paidAt: new Date("2026-07-01T09:00:00.000Z"),
        reference: "SEED-PRO-2026-07",
        notes: "دفعة اشتراك تجريبية للخطة Pro",
      },
    });
  }

  const superAdminRole = await findOrCreateRole("super_admin", null);
  await syncRolePermissions(superAdminRole.id, rolePermissions.super_admin);

  const roles: Record<string, { id: string }> = { super_admin: superAdminRole };
  for (const name of ["owner", "cashier"]) {
    const role = await findOrCreateRole(name, store.id);
    await syncRolePermissions(role.id, rolePermissions[name]);
    roles[name] = role;
  }

  await findOrCreateUser({
    storeId: null,
    roleId: roles.super_admin.id,
    name: "أدمن رصيد",
    email: DEMO_ADMIN_EMAIL,
    phone: "01000000999",
    password: "RaseedAdmin!2026",
  });

  const ownerUser = await findOrCreateUser({
    storeId: store.id,
    branchId: branch.id,
    roleId: roles.owner.id,
    name: "مالك الديمو",
    email: DEMO_OWNER_EMAIL,
    phone: "01000000010",
    password: DEMO_OWNER_PASSWORD,
  });

  const cashierUser = await findOrCreateUser({
    storeId: store.id,
    branchId: branch.id,
    roleId: roles.cashier.id,
    name: "كاشير الديمو",
    email: DEMO_CASHIER_EMAIL,
    phone: "01000000030",
    password: DEMO_CASHIER_PASSWORD,
  });

  const customerByPhone = new Map<string, { id: string }>();
  for (const customer of demoCustomers) {
    const savedCustomer = await prisma.customer.upsert({
      where: { storeId_phone: { storeId: store.id, phone: customer.phone } },
      update: {
        name: customer.name,
        address: customer.address,
        notes: customer.notes,
        creditLimit: customer.creditLimit,
        currentDebt: customer.currentDebt,
        status: "ACTIVE",
        deletedAt: null,
      },
      create: {
        storeId: store.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        notes: customer.notes,
        creditLimit: customer.creditLimit,
        currentDebt: customer.currentDebt,
        status: "ACTIVE",
      },
    });

    if (customer.currentDebt > 0) {
      const existingSeedDebt = await prisma.customerDebtTransaction.findFirst({
        where: { storeId: store.id, customerId: savedCustomer.id, reason: "Seeded opening customer debt" },
      });
      if (!existingSeedDebt) {
        await prisma.customerDebtTransaction.create({
          data: {
            storeId: store.id,
            branchId: branch.id,
            customerId: savedCustomer.id,
            userId: ownerUser.id,
            type: "DEBT_ADDED",
            amount: customer.currentDebt,
            balanceBefore: 0,
            balanceAfter: customer.currentDebt,
            reason: "Seeded opening customer debt",
            notes: "رصيد افتتاحي للعرض التجريبي",
          },
        });
      }
    }

    customerByPhone.set(customer.phone, savedCustomer);
  }

  const supplierByName = new Map<string, { id: string; currentBalance: unknown }>();
  for (const supplier of demoSuppliers) {
    const savedSupplier = await prisma.supplier.upsert({
      where: { storeId_phone: { storeId: store.id, phone: supplier.phone } },
      update: {
        name: supplier.name,
        contactPerson: supplier.contactPerson,
        address: supplier.address,
        currentBalance: supplier.currentBalance,
        status: "ACTIVE",
        deletedAt: null,
      },
      create: {
        storeId: store.id,
        name: supplier.name,
        phone: supplier.phone,
        contactPerson: supplier.contactPerson,
        address: supplier.address,
        currentBalance: supplier.currentBalance,
        status: "ACTIVE",
      },
    });
    supplierByName.set(supplier.name, savedSupplier);
    if (supplier.currentBalance > 0) {
      const existingSeedBalance = await prisma.supplierTransaction.findFirst({
        where: { storeId: store.id, supplierId: savedSupplier.id, reason: "Seeded opening supplier balance" },
      });
      if (!existingSeedBalance) {
        await prisma.supplierTransaction.create({
          data: {
            storeId: store.id,
            branchId: branch.id,
            supplierId: savedSupplier.id,
            userId: ownerUser.id,
            type: "BALANCE_ADDED",
            amount: supplier.currentBalance,
            balanceBefore: 0,
            balanceAfter: supplier.currentBalance,
            reason: "Seeded opening supplier balance",
            notes: "رصيد افتتاحي للعرض التجريبي",
          },
        });
      }
    }
  }

  let openShift = await prisma.cashierShift.findFirst({
    where: { storeId: store.id, branchId: branch.id, cashierId: cashierUser.id, status: "OPEN" },
  });
  if (!openShift) {
    openShift = await prisma.cashierShift.create({
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
  const productByBarcode = new Map<string, { id: string; name: string; barcode: string | null; variantId: string; variantSku: string | null; variantBarcode: string | null; variantSize: string; variantColor: string; purchasePrice: Prisma.Decimal; sellingPrice: Prisma.Decimal }>();
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
    const savedVariants = [];
    for (const variant of product.variants) {
      const savedVariant = await prisma.productVariant.upsert({
        where: { storeId_barcode: { storeId: store.id, barcode: variant.barcode } },
        update: {
          productId: savedProduct.id,
          size: variant.size,
          color: variant.color,
          sku: variant.sku,
          costPrice: variant.purchasePrice,
          sellingPrice: variant.sellingPrice,
          minStock: variant.minStock,
          stockQuantity: variant.stockQuantity,
          status: "ACTIVE",
        },
        create: {
          storeId: store.id,
          productId: savedProduct.id,
          size: variant.size,
          color: variant.color,
          sku: variant.sku,
          barcode: variant.barcode,
          costPrice: variant.purchasePrice,
          sellingPrice: variant.sellingPrice,
          minStock: variant.minStock,
          stockQuantity: variant.stockQuantity,
          status: "ACTIVE",
        },
      });
      savedVariants.push(savedVariant);
      productByBarcode.set(savedVariant.barcode ?? variant.barcode, {
        id: savedProduct.id,
        name: savedProduct.name,
        barcode: savedProduct.barcode,
        variantId: savedVariant.id,
        variantSku: savedVariant.sku,
        variantBarcode: savedVariant.barcode,
        variantSize: savedVariant.size,
        variantColor: savedVariant.color,
        purchasePrice: savedVariant.costPrice,
        sellingPrice: savedVariant.sellingPrice,
      });
    }
    const primaryVariant = savedVariants[0];
    if (!primaryVariant) throw new Error(`Missing seeded variant for ${product.name}`);
    productByBarcode.set(product.barcode, {
      id: savedProduct.id,
      name: savedProduct.name,
      barcode: savedProduct.barcode,
      variantId: primaryVariant.id,
      variantSku: primaryVariant.sku,
      variantBarcode: primaryVariant.barcode,
      variantSize: primaryVariant.size,
      variantColor: primaryVariant.color,
      purchasePrice: primaryVariant.costPrice,
      sellingPrice: primaryVariant.sellingPrice,
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

  await resetDemoOperationalData(store.id, branch.id);
  await prisma.user.deleteMany({
    where: {
      storeId: store.id,
      email: { notIn: [DEMO_OWNER_EMAIL, DEMO_CASHIER_EMAIL] },
    },
  });
  await seedDemoOperationalData({
    storeId: store.id,
    branchId: branch.id,
    ownerUserId: ownerUser.id,
    cashierUserId: cashierUser.id,
    shiftId: openShift?.id ?? null,
    productByBarcode,
    customerByPhone,
  });

  const draftSupplier = supplierByName.get("شركة الأمل للمواد الغذائية");
  const draftProducts = await prisma.product.findMany({
    where: { storeId: store.id, barcode: { in: ["6223001234568", "6223001234578"] } },
    orderBy: { name: "asc" },
    take: 2,
  });
  if (draftSupplier && draftProducts.length > 0) {
    const existingDraftOrder = await prisma.purchaseOrder.findFirst({
      where: { storeId: store.id, branchId: branch.id, orderNumber: "PO-SEED-0001" },
    });
    if (!existingDraftOrder) {
      const items = draftProducts.map((product) => {
        const quantity = product.barcode === "6223001234568" ? 20 : 24;
        const purchasePrice = Number(product.purchasePrice);
        return { product, quantity, purchasePrice, lineTotal: quantity * purchasePrice };
      });
      const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
      await prisma.purchaseOrder.create({
        data: {
          storeId: store.id,
          branchId: branch.id,
          supplierId: draftSupplier.id,
          createdById: ownerUser.id,
          orderNumber: "PO-SEED-0001",
          status: "DRAFT",
          subtotal,
          discountTotal: 0,
          taxTotal: 0,
          total: subtotal,
          remainingAmount: subtotal,
          notes: "أمر شراء تجريبي غير مستلم",
          items: {
            create: items.map((item) => ({
              storeId: store.id,
              branchId: branch.id,
              productId: item.product.id,
              productName: item.product.name,
              productBarcode: item.product.barcode,
              quantity: item.quantity,
              purchasePrice: item.purchasePrice,
              lineTotal: item.lineTotal,
            })),
          },
        },
      });
    }
  }
}
