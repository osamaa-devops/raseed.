import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createTestApp } from "./utils/test-app";
import { authHeader, createPlatformAdmin, createTestCategory, createTestProduct, createTestStore, login } from "./utils/factories";
import { prisma } from "./utils/test-db";

const describeDb = process.env.RASEED_SKIP_DB_TESTS === "1" ? describe.skip : describe;

describeDb("auth, permissions, and tenant isolation", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("logs in with valid credentials, sets a refresh cookie, rotates refresh tokens, and serves /auth/me with refreshed access", async () => {
    const ctx = await createTestStore();
    const agent = request.agent(app.getHttpServer());

    const loginResponse = await agent
      .post("/api/auth/login")
      .send({ identity: ctx.owner.email, password: ctx.ownerPassword })
      .expect(201);

    expect(loginResponse.body.accessToken).toEqual(expect.any(String));
    expect(loginResponse.body.permissions).toContain("products.view");
    expect(loginResponse.headers["set-cookie"]).toEqual(expect.arrayContaining([expect.stringContaining("raseed_refresh_token=")]));
    const firstRefreshCookie = extractCookie(loginResponse, "raseed_refresh_token");

    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ identity: ctx.owner.email, password: "wrong-password" })
      .expect(401);

    await request(app.getHttpServer())
      .get("/api/auth/me")
      .set(await authHeader(loginResponse.body.accessToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body.user.email).toBe(ctx.owner.email);
      });

    const refreshResponse = await agent
      .post("/api/auth/refresh")
      .expect(201);

    expect(refreshResponse.body.accessToken).toEqual(expect.any(String));
    expect(refreshResponse.body.user.email).toBe(ctx.owner.email);
    const rotatedRefreshCookie = extractCookie(refreshResponse, "raseed_refresh_token");
    expect(rotatedRefreshCookie).not.toBe(firstRefreshCookie);

    await request(app.getHttpServer())
      .post("/api/auth/refresh")
      .set("Cookie", firstRefreshCookie)
      .expect(401);

    await request(app.getHttpServer())
      .get("/api/auth/me")
      .set(await authHeader(refreshResponse.body.accessToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body.user.email).toBe(ctx.owner.email);
      });

    await prisma.user.update({ where: { id: ctx.owner.id }, data: { status: "DISABLED" } });
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ identity: ctx.owner.email, password: ctx.ownerPassword })
      .expect(401);
  });

  it("revokes the current refresh token on logout and clears the cookie", async () => {
    const ctx = await createTestStore();
    const agent = request.agent(app.getHttpServer());

    await agent
      .post("/api/auth/login")
      .send({ identity: ctx.owner.email, password: ctx.ownerPassword })
      .expect(201);

    const logoutResponse = await agent
      .post("/api/auth/logout")
      .expect(201);

    expect(logoutResponse.body.success).toBe(true);
    expect(logoutResponse.headers["set-cookie"]).toEqual(expect.arrayContaining([expect.stringContaining("raseed_refresh_token=;")]));

    await agent
      .post("/api/auth/refresh")
      .expect(401);
  });

  it("rejects invalid refresh tokens", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/refresh")
      .set("Cookie", "raseed_refresh_token=invalid-token")
      .expect(401);
  });

  it("blocks protected routes without a token and returns 403 when permission is missing", async () => {
    const ctx = await createTestStore();
    const cashierToken = await login(app, ctx.cashier.email!, ctx.cashierPassword);

    await request(app.getHttpServer()).get("/api/products").expect(401);

    await request(app.getHttpServer())
      .post("/api/products")
      .set(await authHeader(cashierToken))
      .send({ name: "Forbidden Product", purchasePrice: 1, sellingPrice: 2, unitType: "piece", minStock: 0 })
      .expect(403);
  });

  it("keeps products scoped to the authenticated user's store", async () => {
    const storeA = await createTestStore();
    const storeB = await createTestStore();
    const categoryA = await createTestCategory(storeA.store.id, { name: "A Category" });
    const categoryB = await createTestCategory(storeB.store.id, { name: "B Category" });
    const productA = await createTestProduct(storeA.store.id, categoryA.id, { name: "Only A", barcode: "TENANT-A" });
    const productB = await createTestProduct(storeB.store.id, categoryB.id, { name: "Only B", barcode: "TENANT-B" });
    const tokenA = await login(app, storeA.owner.email!, storeA.ownerPassword);

    await request(app.getHttpServer())
      .get("/api/products")
      .set(await authHeader(tokenA))
      .expect(200)
      .expect(({ body }) => {
        expect(body.items.map((item: { id: string }) => item.id)).toContain(productA.id);
        expect(body.items.map((item: { id: string }) => item.id)).not.toContain(productB.id);
      });

    await request(app.getHttpServer())
      .get(`/api/products/${productB.id}`)
      .set(await authHeader(tokenA))
      .expect(403);
  });

  it("enforces same-store uniqueness but allows the same barcode in another store", async () => {
    const storeA = await createTestStore();
    const storeB = await createTestStore();
    const categoryA = await createTestCategory(storeA.store.id);
    const categoryB = await createTestCategory(storeB.store.id);
    await createTestProduct(storeA.store.id, categoryA.id, { barcode: "SHARED-BARCODE" });
    const tokenA = await login(app, storeA.owner.email!, storeA.ownerPassword);
    const tokenB = await login(app, storeB.owner.email!, storeB.ownerPassword);

    await request(app.getHttpServer())
      .post("/api/products")
      .set(await authHeader(tokenA))
      .send({ name: "Duplicate", categoryId: categoryA.id, barcode: "SHARED-BARCODE", purchasePrice: 1, sellingPrice: 2, unitType: "piece", minStock: 0 })
      .expect(409);

    await request(app.getHttpServer())
      .post("/api/products")
      .set(await authHeader(tokenB))
      .send({ name: "Allowed", categoryId: categoryB.id, barcode: "SHARED-BARCODE", purchasePrice: 1, sellingPrice: 2, unitType: "piece", minStock: 0 })
      .expect(201);

    await request(app.getHttpServer())
      .post("/api/products")
      .set(await authHeader(tokenA))
      .send({ name: "Wrong Category", categoryId: categoryB.id, barcode: "WRONG-CAT", purchasePrice: 1, sellingPrice: 2, unitType: "piece", minStock: 0 })
      .expect(400);
  });

  it("lets super admin access platform routes but not normal store data without store context", async () => {
    await createTestStore();
    const admin = await createPlatformAdmin();
    const adminToken = await login(app, admin.user.email!, admin.password);

    await request(app.getHttpServer())
      .get("/api/admin/overview")
      .set(await authHeader(adminToken))
      .expect(200);

    await request(app.getHttpServer())
      .get("/api/products")
      .set(await authHeader(adminToken))
      .expect(403);
  });

  it("requires explicit permission for roles and permissions endpoints", async () => {
    const ctx = await createTestStore();
    const ownerToken = await login(app, ctx.owner.email!, ctx.ownerPassword);
    const admin = await createPlatformAdmin();
    const adminToken = await login(app, admin.user.email!, admin.password);

    await request(app.getHttpServer())
      .get("/api/roles")
      .set(await authHeader(ownerToken))
      .expect(403);

    await request(app.getHttpServer())
      .get("/api/permissions")
      .set(await authHeader(ownerToken))
      .expect(403);

    await request(app.getHttpServer())
      .get("/api/roles")
      .set(await authHeader(adminToken))
      .expect(200);

    await request(app.getHttpServer())
      .get("/api/permissions")
      .set(await authHeader(adminToken))
      .expect(200);
  });
});

function extractCookie(response: request.Response, name: string) {
  const rawCookies = response.headers["set-cookie"];
  const cookies = Array.isArray(rawCookies) ? rawCookies : rawCookies ? [rawCookies] : undefined;
  const target = cookies?.find((value) => value.startsWith(`${name}=`));
  expect(target).toBeDefined();
  return target!.split(";")[0];
}
