import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export function assertSafeTestDatabase() {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (process.env.NODE_ENV !== "test" || !/test/i.test(new URL(databaseUrl).pathname)) {
    throw new Error("Refusing to clean a non-test database.");
  }
}

export async function resetTestDatabase() {
  assertSafeTestDatabase();
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
  `;
  if (!tables.length) return;
  const tableList = tables.map(({ tablename }) => `"${tablename.replace(/"/g, '""')}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);
}
