import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createTestApp } from "./utils/test-app";
import { authHeader, createTestCategory, createTestProduct, createTestStock, createTestStore, login } from "./utils/factories";
import { prisma } from "./utils/test-db";

describe("inventory and POS transaction safety", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("creates movements for add, remove, and adjust stock", async () => {
    const ctx = await createTestStore();
    const category = await createTestCategory(ctx.store.id);
    const product = await createTestProduct(ctx.store.id, category.id);
    const token = await login(app, ctx.owner.email!, ctx.ownerPassword);

    await request(app.getHttpServer())
      .post("/api/inventory/add-stock")
      .set(await authHeader(token))
      .send({ branchId: ctx.branch.id, productId: product.id, quantity: 10, reason: "opening" })
      .expect(201);

    await request(app.getHttpServer())
      .post("/api/inventory/remove-stock")
      .set(await authHeader(token))
      .send({ branchId: ctx.branch.id, productId: product.id, quantity: 3, type: "REMOVE_STOCK", reason: "test remove" })
      .expect(201);

    await request(app.getHttpServer())
      .post("/api/inventory/adjust")
      .set(await authHeader(token))
      .send({ branchId: ctx.branch.id, productId: product.id, newQuantity: 4, reason: "count" })
      .expect(201);

    const stock = await prisma.inventoryStock.findUniqueOrThrow({ where: { storeId_branchId_productId: { storeId: ctx.store.id, branchId: ctx.branch.id, productId: product.id } } });
    expect(Number(stock.quantity)).toBe(4);
    const movements = await prisma.inventoryMovement.findMany({ where: { productId: product.id }, orderBy: { createdAt: "asc" } });
    expect(movements.map((movement) => movement.type)).toEqual(["ADD_STOCK", "REMOVE_STOCK", "ADJUSTMENT_OUT"]);
  });

  it("does not reduce stock or create invoices when a sale fails", async () => {
    const ctx = await createTestStore();
    const category = await createTestCategory(ctx.store.id);
    const product = await createTestProduct(ctx.store.id, category.id, { sellingPrice: 10 });
    await createTestStock(ctx.store.id, ctx.branch.id, product.id, 2);
    const token = await login(app, ctx.cashier.email!, ctx.cashierPassword);

    await request(app.getHttpServer())
      .post("/api/pos/sale")
      .set(await authHeader(token))
      .send({ branchId: ctx.branch.id, items: [{ productId: product.id, quantity: 3 }], payments: [{ method: "CASH", amount: 30 }] })
      .expect(400);

    expect(await prisma.invoice.count({ where: { storeId: ctx.store.id } })).toBe(0);
    const stock = await prisma.inventoryStock.findUniqueOrThrow({ where: { storeId_branchId_productId: { storeId: ctx.store.id, branchId: ctx.branch.id, productId: product.id } } });
    expect(Number(stock.quantity)).toBe(2);
    expect(await prisma.inventoryMovement.count({ where: { productId: product.id, type: "SALE" } })).toBe(0);
  });

  it("creates invoice, item snapshots, payments, stock decrement, and SALE movement for a successful sale", async () => {
    const ctx = await createTestStore();
    const category = await createTestCategory(ctx.store.id);
    const product = await createTestProduct(ctx.store.id, category.id, { name: "Snapshot Product", barcode: "POS-SNAPSHOT", purchasePrice: 4, sellingPrice: 10 });
    await createTestStock(ctx.store.id, ctx.branch.id, product.id, 5);
    const token = await login(app, ctx.cashier.email!, ctx.cashierPassword);

    const response = await request(app.getHttpServer())
      .post("/api/pos/sale")
      .set(await authHeader(token))
      .send({
        branchId: ctx.branch.id,
        items: [{ productId: product.id, quantity: 2 }],
        payments: [{ method: "CASH", amount: 12 }, { method: "CARD", amount: 8 }],
      })
      .expect(201);

    expect(response.body.invoiceNumber).toEqual(expect.stringMatching(/^INV-/));
    expect(response.body.items[0].productName).toBe("Snapshot Product");
    expect(response.body.payments).toHaveLength(2);

    const stock = await prisma.inventoryStock.findUniqueOrThrow({ where: { storeId_branchId_productId: { storeId: ctx.store.id, branchId: ctx.branch.id, productId: product.id } } });
    expect(Number(stock.quantity)).toBe(3);
    expect(await prisma.inventoryMovement.count({ where: { productId: product.id, type: "SALE", referenceId: response.body.id } })).toBe(1);
    expect(await prisma.activityLog.count({ where: { action: "sale.completed", entityId: response.body.id } })).toBe(1);
  });

  it("fails when payment total is below invoice total", async () => {
    const ctx = await createTestStore();
    const category = await createTestCategory(ctx.store.id);
    const product = await createTestProduct(ctx.store.id, category.id, { sellingPrice: 10 });
    await createTestStock(ctx.store.id, ctx.branch.id, product.id, 5);
    const token = await login(app, ctx.cashier.email!, ctx.cashierPassword);

    await request(app.getHttpServer())
      .post("/api/pos/sale")
      .set(await authHeader(token))
      .send({ branchId: ctx.branch.id, items: [{ productId: product.id, quantity: 2 }], payments: [{ method: "CASH", amount: 19 }] })
      .expect(400);

    expect(await prisma.invoice.count()).toBe(0);
  });
});
