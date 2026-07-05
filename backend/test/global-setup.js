const { execFileSync } = require("node:child_process");
const { PrismaClient } = require("@prisma/client");
const { config } = require("dotenv");

module.exports = async () => {
  process.env.NODE_ENV = "test";
  config({ path: ".env.test" });

  const defaultTestDatabaseUrl = "postgresql://raseed:raseed_password@localhost:5432/raseed_test?schema=public";
  const testDatabaseUrl = process.env.TEST_DATABASE_URL || (process.env.DATABASE_URL && process.env.DATABASE_URL.includes("test") ? process.env.DATABASE_URL : defaultTestDatabaseUrl);
  assertTestDatabaseUrl(testDatabaseUrl);
  process.env.DATABASE_URL = testDatabaseUrl;

  await ensureDatabaseExists(testDatabaseUrl);
  execFileSync(process.platform === "win32" ? "npx.cmd" : "npx", ["prisma", "migrate", "deploy"], {
    cwd: __dirname + "/..",
    env: { ...process.env, DATABASE_URL: testDatabaseUrl, NODE_ENV: "test" },
    stdio: "inherit",
  });
};

function assertTestDatabaseUrl(url) {
  if (process.env.NODE_ENV !== "test" || !/test/i.test(new URL(url).pathname)) {
    throw new Error("Refusing to prepare a database unless NODE_ENV=test and the database name contains 'test'.");
  }
}

async function ensureDatabaseExists(testDatabaseUrl) {
  const parsed = new URL(testDatabaseUrl);
  const databaseName = parsed.pathname.replace(/^\//, "");
  const adminUrl = new URL(testDatabaseUrl);
  adminUrl.pathname = "/postgres";
  adminUrl.searchParams.delete("schema");

  const prisma = new PrismaClient({ datasources: { db: { url: adminUrl.toString() } } });
  try {
    await prisma.$executeRawUnsafe(`CREATE DATABASE "${databaseName.replace(/"/g, '""')}"`);
  } catch (error) {
    if (!String(error.message || error).includes("already exists")) throw error;
  } finally {
    await prisma.$disconnect();
  }
}
