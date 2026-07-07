import type { INestApplication } from "@nestjs/common";
import { ExpenseCategory, PaymentMethod, PurchaseOrderStatus, SubscriptionPaymentMethod, SupplierPaymentMethod } from "@prisma/client";
import request from "supertest";
import { createTestApp } from "./utils/test-app";
import { authHeader, createRole, createTestCategory, createTestProduct, createTestStore, createTestStock, createUser, login, unique } from "./utils/factories";
import { prisma } from "./utils/test-db";

const describeDb = process.env.RASEED_SKIP_DB_TESTS === "1" ? describe.skip : describe;

describeDb("critical business module coverage", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("covers returns, including partial and full returns, stock restoration, status updates, and rollback on over-return", async () => {
    const ctx = await createTestStore();
    const token = await login(app, ctx.owner.email!, ctx.ownerPassword);
    const category = await createTestCategory(ctx.store.id);
    const product = await createTestProduct(ctx.store.id, category.id, { name: "Milk Return Test", barcode: "RET-1001", sellingPrice: 10 });
    await createTestStock(ctx.store.id, ctx.branch.id, product.id, 10);

    const saleResponse = await request(app.getHttpServer())
      .post("/api/pos/sale")
      .set(await authHeader(token))
      .send({
        branchId: ctx.branch.id,
        items: [{ productId: product.id, quantity: 2, unitPrice: 10 }],
        payments: [{ method: PaymentMethod.CASH, amount: 20 }],
      })
      .expect(201);

    const invoiceId = saleResponse.body.id as string;
    const invoiceItemId = saleResponse.body.items[0].id as string;

    const partialReturn = await request(app.getHttpServer())
      .post("/api/returns")
      .set(await authHeader(token))
      .send({
        branchId: ctx.branch.id,
        invoiceId,
        reason: "Partial return",
        refundMethod: PaymentMethod.CASH,
        items: [{ invoiceItemId, quantity: 1, restocked: true }],
      })
      .expect(201);

    expect(partialReturn.body.status).toBe("COMPLETED");
    expect((await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } })).status).toBe("PARTIALLY_REFUNDED");
    expect(Number((await prisma.invoiceItem.findUniqueOrThrow({ where: { id: invoiceItemId } })).returnedQuantity)).toBe(1);
    expect(Number((await prisma.inventoryStock.findUniqueOrThrow({ where: { storeId_branchId_productId: { storeId: ctx.store.id, branchId: ctx.branch.id, productId: product.id } } })).quantity)).toBe(9);

    const firstReturnLogs = await prisma.activityLog.findMany({ where: { storeId: ctx.store.id, entityType: "Return", entityId: partialReturn.body.id }, orderBy: { createdAt: "asc" } });
    expect(firstReturnLogs.map((item) => item.action)).toEqual(expect.arrayContaining(["return.created", "inventory.stock_returned"]));
    expect(await prisma.activityLog.count({ where: { storeId: ctx.store.id, entityType: "Invoice", entityId: invoiceId, action: "invoice.partially_refunded" } })).toBe(1);

    const fullReturn = await request(app.getHttpServer())
      .post("/api/returns")
      .set(await authHeader(token))
      .send({
        branchId: ctx.branch.id,
        invoiceId,
        reason: "Full return",
        refundMethod: PaymentMethod.CASH,
        items: [{ invoiceItemId, quantity: 1, restocked: true }],
      })
      .expect(201);

    expect((await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } })).status).toBe("REFUNDED");
    expect(Number((await prisma.invoiceItem.findUniqueOrThrow({ where: { id: invoiceItemId } })).returnedQuantity)).toBe(2);
    expect(Number((await prisma.inventoryStock.findUniqueOrThrow({ where: { storeId_branchId_productId: { storeId: ctx.store.id, branchId: ctx.branch.id, productId: product.id } } })).quantity)).toBe(10);
    expect((await prisma.return.count({ where: { storeId: ctx.store.id, invoiceId } }))).toBe(2);

    await request(app.getHttpServer())
      .post("/api/returns")
      .set(await authHeader(token))
      .send({
        branchId: ctx.branch.id,
        invoiceId,
        reason: "Too much",
        refundMethod: PaymentMethod.CASH,
        items: [{ invoiceItemId, quantity: 1, restocked: true }],
      })
      .expect(400);

    expect((await prisma.return.count({ where: { storeId: ctx.store.id, invoiceId } }))).toBe(2);

    const fullReturnLogs = await prisma.activityLog.findMany({ where: { storeId: ctx.store.id, entityType: "Return", entityId: fullReturn.body.id }, orderBy: { createdAt: "asc" } });
    expect(fullReturnLogs.map((item) => item.action)).toEqual(expect.arrayContaining(["return.created", "inventory.stock_returned"]));
    expect(await prisma.activityLog.count({ where: { storeId: ctx.store.id, entityType: "Invoice", entityId: invoiceId, action: "invoice.fully_refunded" } })).toBe(1);
  });

  it("covers supplier payment balance updates, overpayment rejection, and transaction history", async () => {
    const ctx = await createTestStore();
    const token = await login(app, ctx.owner.email!, ctx.ownerPassword);
    const supplier = await prisma.supplier.create({
      data: {
        storeId: ctx.store.id,
        name: unique("Supplier"),
        phone: unique("050"),
        currentBalance: 80,
      },
    });

    const payment = await request(app.getHttpServer())
      .post(`/api/suppliers/${supplier.id}/payment`)
      .set(await authHeader(token))
      .send({ amount: 25, paymentMethod: SupplierPaymentMethod.CASH, branchId: ctx.branch.id })
      .expect(201);

    expect(payment.body.balanceBefore).toBe(80);
    expect(payment.body.balanceAfter).toBe(55);
    expect(Number((await prisma.supplier.findUniqueOrThrow({ where: { id: supplier.id } })).currentBalance)).toBe(55);

    const history = await request(app.getHttpServer())
      .get(`/api/suppliers/${supplier.id}/transactions`)
      .set(await authHeader(token))
      .expect(200);

    expect(history.body.items).toHaveLength(1);
    expect(history.body.items[0].type).toBe("PAYMENT_MADE");

    await request(app.getHttpServer())
      .post(`/api/suppliers/${supplier.id}/payment`)
      .set(await authHeader(token))
      .send({ amount: 100, paymentMethod: SupplierPaymentMethod.CASH, branchId: ctx.branch.id })
      .expect(400);

    const logActions = await prisma.activityLog.findMany({ where: { storeId: ctx.store.id, entityType: "Supplier", entityId: supplier.id } });
    expect(logActions.map((item) => item.action)).toContain("supplier.payment_made");
  });

  it("covers purchase order creation, send, partial and full receive, over-receive rejection, and balance/inventory updates", async () => {
    const ctx = await createTestStore();
    const token = await login(app, ctx.owner.email!, ctx.ownerPassword);
    const category = await createTestCategory(ctx.store.id);
    const product = await createTestProduct(ctx.store.id, category.id, { name: "PO Product", barcode: "PO-1001", purchasePrice: 4, sellingPrice: 7 });
    const supplier = await prisma.supplier.create({
      data: { storeId: ctx.store.id, name: unique("Supplier"), phone: unique("051") },
    });

    const orderResponse = await request(app.getHttpServer())
      .post("/api/purchase-orders")
      .set(await authHeader(token))
      .send({
        branchId: ctx.branch.id,
        supplierId: supplier.id,
        discountTotal: 0,
        taxTotal: 0,
        items: [{ productId: product.id, quantity: 10, purchasePrice: 4 }],
      })
      .expect(201);

    const orderId = orderResponse.body.id as string;
    expect(orderResponse.body.status).toBe("DRAFT");

    await request(app.getHttpServer())
      .patch(`/api/purchase-orders/${orderId}/status`)
      .set(await authHeader(token))
      .send({ status: PurchaseOrderStatus.SENT })
      .expect(200);

    const partialReceive = await request(app.getHttpServer())
      .post(`/api/purchase-orders/${orderId}/receive`)
      .set(await authHeader(token))
      .send({
        items: [{ purchaseOrderItemId: orderResponse.body.items[0].id, receivedQuantity: 4, batchNumber: "B-1" }],
        paidAmount: 0,
        paymentMethod: SupplierPaymentMethod.CASH,
      })
      .expect(201);

    expect(partialReceive.body.status).toBe("PARTIALLY_RECEIVED");
    expect(Number((await prisma.inventoryStock.findUniqueOrThrow({ where: { storeId_branchId_productId: { storeId: ctx.store.id, branchId: ctx.branch.id, productId: product.id } } })).quantity)).toBe(4);
    expect(Number((await prisma.supplier.findUniqueOrThrow({ where: { id: supplier.id } })).currentBalance)).toBe(16);

    const fullReceive = await request(app.getHttpServer())
      .post(`/api/purchase-orders/${orderId}/receive`)
      .set(await authHeader(token))
      .send({
        items: [{ purchaseOrderItemId: orderResponse.body.items[0].id, receivedQuantity: 6, batchNumber: "B-2" }],
        paidAmount: 0,
        paymentMethod: SupplierPaymentMethod.CASH,
      })
      .expect(201);

    expect(fullReceive.body.status).toBe("RECEIVED");
    expect(Number((await prisma.inventoryStock.findUniqueOrThrow({ where: { storeId_branchId_productId: { storeId: ctx.store.id, branchId: ctx.branch.id, productId: product.id } } })).quantity)).toBe(10);
    expect(Number((await prisma.supplier.findUniqueOrThrow({ where: { id: supplier.id } })).currentBalance)).toBe(40);

    await request(app.getHttpServer())
      .post(`/api/purchase-orders/${orderId}/receive`)
      .set(await authHeader(token))
      .send({
        items: [{ purchaseOrderItemId: orderResponse.body.items[0].id, receivedQuantity: 1 }],
        paidAmount: 0,
      })
      .expect(400);

    const supplierTransactions = await prisma.supplierTransaction.findMany({ where: { storeId: ctx.store.id, supplierId: supplier.id }, orderBy: { createdAt: "asc" } });
    expect(supplierTransactions).toHaveLength(2);
    expect(supplierTransactions.map((item) => item.type)).toEqual(expect.arrayContaining(["PURCHASE_ORDER_RECEIVED"]));

    const actions = await prisma.activityLog.findMany({ where: { storeId: ctx.store.id, entityType: "PurchaseOrder", entityId: orderId }, orderBy: { createdAt: "asc" } });
    expect(actions.map((item) => item.action)).toEqual(expect.arrayContaining(["purchase_order.created", "purchase_order.sent", "purchase_order.received"]));
  });

  it("covers closing validation, duplicate rejection, and calculation totals", async () => {
    const ctx = await createTestStore();
    const token = await login(app, ctx.owner.email!, ctx.ownerPassword);
    const category = await createTestCategory(ctx.store.id);
    const product = await createTestProduct(ctx.store.id, category.id, { name: "Closing Product", barcode: "CLS-1001", purchasePrice: 3, sellingPrice: 8 });
    await createTestStock(ctx.store.id, ctx.branch.id, product.id, 10);
    const openShift = await prisma.cashierShift.create({
      data: {
        storeId: ctx.store.id,
        branchId: ctx.branch.id,
        cashierId: ctx.owner.id,
        openingCash: 25,
        status: "OPEN",
      },
    });

    await request(app.getHttpServer())
      .post("/api/closing/close-day")
      .set(await authHeader(token))
      .send({ branchId: ctx.branch.id, date: "2026-07-06", actualCash: 25 })
      .expect(400);

    await prisma.cashierShift.update({ where: { id: openShift.id }, data: { status: "CLOSED", closedAt: new Date(), actualCash: 25, expectedCash: 25, closingCash: 25, difference: 0 } });

    await request(app.getHttpServer())
      .post("/api/pos/sale")
      .set(await authHeader(token))
      .send({
        branchId: ctx.branch.id,
        items: [{ productId: product.id, quantity: 1 }],
        payments: [{ method: PaymentMethod.CASH, amount: 8 }],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post("/api/expenses")
      .set(await authHeader(token))
      .send({
        branchId: ctx.branch.id,
        title: "Milk delivery",
        category: ExpenseCategory.SUPPLIES,
        amount: 3,
        expenseDate: "2026-07-06",
      })
      .expect(201);

    const closeResponse = await request(app.getHttpServer())
      .post("/api/closing/close-day")
      .set(await authHeader(token))
      .send({ branchId: ctx.branch.id, date: "2026-07-06", actualCash: 30, notes: "End of day" })
      .expect(201);

    expect(closeResponse.body.totalSales).toBe(8);
    expect(closeResponse.body.totalExpenses).toBe(3);
    expect(closeResponse.body.openingCash).toBe(25);
    expect(closeResponse.body.expectedCash).toBe(30);
    expect(closeResponse.body.difference).toBe(0);

    await request(app.getHttpServer())
      .post("/api/closing/close-day")
      .set(await authHeader(token))
      .send({ branchId: ctx.branch.id, date: "2026-07-06", actualCash: 30 })
      .expect(409);

    const logActions = await prisma.activityLog.findMany({ where: { storeId: ctx.store.id, entityType: "DailyClosing", entityId: closeResponse.body.id } });
    expect(logActions.map((item) => item.action)).toContain("closing.day_closed");
  });

  it("covers subscription suspension, reactivation, renewal, usage payloads, and access blocking", async () => {
    const ctx = await createTestStore();
    const adminRole = await createRole(null, `platform-admin-${unique("role")}`, [
      "admin.platform_access",
      "admin.stores.view",
      "admin.stores.suspend",
      "admin.stores.activate",
      "admin.subscriptions.view",
      "admin.subscriptions.update",
      "admin.payments.create",
    ]);
    const adminPassword = "PlatformPass!2026";
    const adminUser = await createUser(null, null, adminRole.id, `${unique("admin")}@raseed.test`, adminPassword, "Platform Admin");
    const adminToken = await login(app, adminUser.email!, adminPassword);
    const ownerToken = await login(app, ctx.owner.email!, ctx.ownerPassword);
    const subscription = await prisma.subscription.findFirstOrThrow({ where: { storeId: ctx.store.id }, include: { plan: true } });

    const subscriptionMe = await request(app.getHttpServer())
      .get("/api/subscription/me")
      .set(await authHeader(ownerToken))
      .expect(200);

    expect(subscriptionMe.body.usage.limits.maxProducts).toBeGreaterThan(0);
    expect(subscriptionMe.body.usage.productsCount).toBeGreaterThanOrEqual(0);

    await request(app.getHttpServer())
      .patch(`/api/admin/stores/${ctx.store.id}/status`)
      .set(await authHeader(adminToken))
      .send({ status: "SUSPENDED" })
      .expect(200);

    await request(app.getHttpServer())
      .get("/api/products")
      .set(await authHeader(ownerToken))
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/api/admin/stores/${ctx.store.id}/status`)
      .set(await authHeader(adminToken))
      .send({ status: "ACTIVE" })
      .expect(200);

    await request(app.getHttpServer())
      .get("/api/products")
      .set(await authHeader(ownerToken))
      .expect(200);

    const renewResponse = await request(app.getHttpServer())
      .post(`/api/admin/subscriptions/${subscription.id}/renew`)
      .set(await authHeader(adminToken))
      .send({ months: 1, amount: 100, paymentMethod: SubscriptionPaymentMethod.CASH })
      .expect(201);

    expect(renewResponse.body.status).toBe("ACTIVE");
    expect(renewResponse.body.plan.id).toBe(subscription.plan.id);

    const updatedSubscription = await prisma.subscription.findUniqueOrThrow({ where: { id: subscription.id } });
    expect(updatedSubscription.status).toBe("ACTIVE");
    expect(updatedSubscription.endDate?.getTime()).toBeGreaterThan(subscription.endDate?.getTime() ?? 0);
    expect(await prisma.subscriptionPayment.count({ where: { subscriptionId: subscription.id } })).toBeGreaterThan(0);

    const logActions = await prisma.activityLog.findMany({ where: { storeId: ctx.store.id, entityType: "Subscription", entityId: subscription.id } });
    expect(logActions.map((item) => item.action)).toContain("admin.subscription_renewed");
  });
});
