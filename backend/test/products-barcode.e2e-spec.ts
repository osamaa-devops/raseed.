import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createTestApp } from "./utils/test-app";
import { authHeader, createTestCategory, createTestStore, login } from "./utils/factories";
import { prisma } from "./utils/test-db";

describe("barcode generation", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("keeps an existing barcode unless force is requested and generates unique values for the same store", async () => {
    const ctx = await createTestStore();
    const token = await login(app, ctx.owner.email!, ctx.ownerPassword);
    const category = await createTestCategory(ctx.store.id);

    const productResponse = await request(app.getHttpServer())
      .post("/api/products")
      .set(await authHeader(token))
      .send({
        name: "Barcode Test Product",
        categoryId: category.id,
        barcode: "",
        purchasePrice: 5,
        sellingPrice: 10,
        unitType: "piece",
        minStock: 0,
      })
      .expect(201);

    const productId = productResponse.body.id as string;

    const firstGenerate = await request(app.getHttpServer())
      .post(`/api/products/${productId}/generate-barcode`)
      .set(await authHeader(token))
      .send({})
      .expect(201);

    expect(firstGenerate.body.barcode).toMatch(/^[0-9]+$/);
    expect(firstGenerate.body.barcode).toHaveLength(13);
    expect(await prisma.activityLog.count({ where: { storeId: ctx.store.id, action: "product.barcode_generated", entityId: productId } })).toBe(1);

    const secondGenerate = await request(app.getHttpServer())
      .post(`/api/products/${productId}/generate-barcode`)
      .set(await authHeader(token))
      .send({})
      .expect(201);

    expect(secondGenerate.body.barcode).toBe(firstGenerate.body.barcode);

    const forcedGenerate = await request(app.getHttpServer())
      .post(`/api/products/${productId}/generate-barcode`)
      .set(await authHeader(token))
      .send({ force: true })
      .expect(201);

    expect(forcedGenerate.body.barcode).toMatch(/^[0-9]+$/);
    expect(forcedGenerate.body.barcode).toHaveLength(13);
    expect(forcedGenerate.body.barcode).not.toBe(firstGenerate.body.barcode);

    const secondProductResponse = await request(app.getHttpServer())
      .post("/api/products")
      .set(await authHeader(token))
      .send({
        name: "Barcode Test Product 2",
        categoryId: category.id,
        barcode: "",
        purchasePrice: 5,
        sellingPrice: 10,
        unitType: "piece",
        minStock: 0,
      })
      .expect(201);

    const secondProductGenerate = await request(app.getHttpServer())
      .post(`/api/products/${secondProductResponse.body.id as string}/generate-barcode`)
      .set(await authHeader(token))
      .send({})
      .expect(201);

    expect(secondProductGenerate.body.barcode).not.toBe(forcedGenerate.body.barcode);
    expect(secondProductGenerate.body.barcode).not.toBe(firstGenerate.body.barcode);
  });
});
