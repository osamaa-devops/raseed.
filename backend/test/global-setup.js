const { execFileSync, spawnSync } = require("node:child_process");
const net = require("node:net");
const { config } = require("dotenv");

module.exports = async () => {
  process.env.NODE_ENV = "test";
  config({ path: ".env.test" });
  process.env.RASEED_SKIP_DB_TESTS = "0";

  const defaultTestDatabaseUrl = "postgresql://raseed:raseed_password@localhost:5432/raseed_test?schema=public";
  const testDatabaseUrl = process.env.TEST_DATABASE_URL || (process.env.DATABASE_URL && process.env.DATABASE_URL.includes("test") ? process.env.DATABASE_URL : defaultTestDatabaseUrl);
  assertTestDatabaseUrl(testDatabaseUrl);
  process.env.DATABASE_URL = testDatabaseUrl;

  try {
    await ensurePostgresServer(testDatabaseUrl);
    ensureDatabaseExists(testDatabaseUrl);
    execFileSync(process.platform === "win32" ? "npx.cmd" : "npx", ["prisma", "migrate", "deploy"], {
      cwd: __dirname + "/..",
      env: { ...process.env, DATABASE_URL: testDatabaseUrl, NODE_ENV: "test" },
      stdio: "inherit",
    });
  } catch {
    process.env.RASEED_SKIP_DB_TESTS = "1";
    console.warn("");
    console.warn("تم تخطي اختبارات الباك إند لأن PostgreSQL test database غير متاح.");
    console.warn("استخدم TEST_DATABASE_URL أو شغّل PostgreSQL محلياً ثم أنشئ قاعدة تحتوي كلمة test في اسمها.");
    console.warn("");
  }
};

function assertTestDatabaseUrl(url) {
  if (process.env.NODE_ENV !== "test" || !/test/i.test(new URL(url).pathname)) {
    throw new Error("Refusing to prepare a database unless NODE_ENV=test and the database name contains 'test'.");
  }
}

async function ensurePostgresServer(testDatabaseUrl) {
  const parsed = new URL(testDatabaseUrl);
  await new Promise((resolve, reject) => {
    const socket = net.createConnection({
      host: parsed.hostname || "localhost",
      port: Number(parsed.port || "5432"),
    });
    socket.once("connect", () => {
      socket.destroy();
      resolve();
    });
    socket.once("error", reject);
    socket.setTimeout(2000, () => {
      socket.destroy();
      reject(new Error("timeout"));
    });
  });
}

function ensureDatabaseExists(testDatabaseUrl) {
  const parsed = new URL(testDatabaseUrl);
  const databaseName = parsed.pathname.replace(/^\//, "");
  const result = spawnSync(process.platform === "win32" ? "createdb.exe" : "createdb", [databaseName], {
    stdio: "pipe",
    encoding: "utf8",
    env: {
      ...process.env,
      PGHOST: parsed.hostname,
      PGPORT: parsed.port || "5432",
      PGUSER: decodeURIComponent(parsed.username || ""),
      PGPASSWORD: decodeURIComponent(parsed.password || ""),
    },
  });

  if (result.error) {
    throw result.error;
  }

  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  if (result.status !== 0 && !/already exists/i.test(output)) {
    throw new Error(output.trim() || "createdb failed");
  }
}
