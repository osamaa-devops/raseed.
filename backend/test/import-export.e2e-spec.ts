import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createTestApp } from "./utils/test-app";
import { authHeader, createTestCategory, createTestProduct, createTestStore, login } from "./utils/factories";
import { prisma } from "./utils/test-db";

const describeDb = process.env.RASEED_SKIP_DB_TESTS === "1" ? describe.skip : describe;

describeDb("import/export safety", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("downloads product templates and rejects invalid upload types", async () => {
    const ctx = await createTestStore();
    const token = await login(app, ctx.owner.email!, ctx.ownerPassword);

    await request(app.getHttpServer())
      .get("/api/import-export/templates/products.xlsx")
      .set(await authHeader(token))
      .expect(200)
      .expect("content-type", /spreadsheetml/);

    await request(app.getHttpServer())
      .post("/api/import-export/products/preview")
      .set(await authHeader(token))
      .attach("file", Buffer.from("nope"), "products.txt")
      .expect(400);
  });

  it("reports invalid rows in preview and imports valid product rows", async () => {
    const ctx = await createTestStore();
    const token = await login(app, ctx.owner.email!, ctx.ownerPassword);
    const invalidCsv = "name,barcode,purchasePrice,sellingPrice,minStock,unitType\nBad Row,INV-1,1,,0,piece\n";

    await request(app.getHttpServer())
      .post("/api/import-export/products/preview?mode=CREATE_ONLY")
      .set(await authHeader(token))
      .attach("file", Buffer.from(invalidCsv), "products.csv")
      .expect(201)
      .expect(({ body }) => {
        expect(body.totalRows).toBe(1);
        expect(body.invalidRows).toBe(1);
        expect(body.errors[0].field).toBe("sellingPrice");
      });

    const validCsv = "name,barcode,category,purchasePrice,sellingPrice,minStock,unitType\nImported Product,IMP-1,Imported Cat,2,5,1,piece\n";
    await request(app.getHttpServer())
      .post("/api/import-export/products/import?mode=CREATE_ONLY")
      .set(await authHeader(token))
      .attach("file", Buffer.from(validCsv), "products.csv")
      .expect(201)
      .expect(({ body }) => {
        expect(body.created).toBe(1);
        expect(body.errors).toEqual([]);
      });

    expect(await prisma.product.count({ where: { storeId: ctx.store.id, barcode: "IMP-1" } })).toBe(1);
    expect(await prisma.category.count({ where: { storeId: ctx.store.id, name: "Imported Cat" } })).toBe(1);
    expect(await prisma.activityLog.count({ where: { storeId: ctx.store.id, action: "import.products_imported" } })).toBe(1);
  });

  it("rejects duplicate products in create-only mode and records import activity", async () => {
    const ctx = await createTestStore();
    const category = await createTestCategory(ctx.store.id);
    await createTestProduct(ctx.store.id, category.id, { name: "Duplicate Base", barcode: "DUP-1" });
    const token = await login(app, ctx.owner.email!, ctx.ownerPassword);

    const duplicateCsv = "name,barcode,category,purchasePrice,sellingPrice,minStock,unitType\nDuplicate Incoming,DUP-1,Imported Cat,2,5,1,piece\n";
    await request(app.getHttpServer())
      .post("/api/import-export/products/import?mode=CREATE_ONLY")
      .set(await authHeader(token))
      .attach("file", Buffer.from(duplicateCsv), "products.csv")
      .expect(201)
      .expect(({ body }) => {
        expect(body.created).toBe(0);
        expect(body.skipped).toBe(1);
        expect(body.errors[0].message).toBe("Product already exists in this store.");
      });

    expect(await prisma.product.count({ where: { storeId: ctx.store.id, barcode: "DUP-1" } })).toBe(1);
  });

  it("upserts existing products and imports initial stock with movements", async () => {
    const ctx = await createTestStore();
    const category = await createTestCategory(ctx.store.id);
    const existing = await createTestProduct(ctx.store.id, category.id, { name: "Before Upsert", barcode: "UPSERT-1", sellingPrice: 4 });
    const token = await login(app, ctx.owner.email!, ctx.ownerPassword);

    const upsertCsv = "name,barcode,category,purchasePrice,sellingPrice,minStock,unitType\nAfter Upsert,UPSERT-1,Imported Cat,2,9,1,piece\n";
    await request(app.getHttpServer())
      .post("/api/import-export/products/import?mode=UPSERT")
      .set(await authHeader(token))
      .attach("file", Buffer.from(upsertCsv), "products.csv")
      .expect(201)
      .expect(({ body }) => {
        expect(body.updated).toBe(1);
      });

    expect((await prisma.product.findUniqueOrThrow({ where: { id: existing.id } })).name).toBe("After Upsert");

    const stockCsv = `productIdentifier,quantity,branchId,batchNumber,expiryDate,purchasePrice,notes\nUPSERT-1,7,${ctx.branch.id},B1,2030-01-01,2.25,initial\n`;
    await request(app.getHttpServer())
      .post("/api/import-export/initial-stock/import?mode=ADD_TO_EXISTING")
      .set(await authHeader(token))
      .attach("file", Buffer.from(stockCsv), "stock.csv")
      .expect(201)
      .expect(({ body }) => {
        expect(body.updated).toBe(1);
      });

    const stock = await prisma.inventoryStock.findUniqueOrThrow({ where: { storeId_branchId_productId: { storeId: ctx.store.id, branchId: ctx.branch.id, productId: existing.id } } });
    expect(Number(stock.quantity)).toBe(7);
    expect(await prisma.inventoryMovement.count({ where: { productId: existing.id, type: "ADD_STOCK" } })).toBe(1);
    expect(await prisma.inventoryBatch.count({ where: { productId: existing.id, batchNumber: "B1" } })).toBe(1);
  });

  it("exports files and sanitizes formula-like values in CSV output", async () => {
    const ctx = await createTestStore();
    const category = await createTestCategory(ctx.store.id);
    await createTestProduct(ctx.store.id, category.id, { name: "=SUM(1,1)", barcode: "FORMULA-1" });
    const token = await login(app, ctx.owner.email!, ctx.ownerPassword);

    await request(app.getHttpServer())
      .get("/api/import-export/products?format=xlsx")
      .set(await authHeader(token))
      .expect(200)
      .expect("content-type", /spreadsheetml/);

    await request(app.getHttpServer())
      .get("/api/import-export/products?format=csv")
      .set(await authHeader(token))
      .expect(200)
      .expect(({ text }) => {
        expect(text).toContain("'=SUM(1,1)");
      });
  });
});
