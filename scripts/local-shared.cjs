const { execFileSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");
const { config } = require("dotenv");

const root = path.resolve(__dirname, "..");
const isWin = process.platform === "win32";

function loadEnv() {
  const backendEnv = path.join(root, "backend", ".env");
  const backendExample = path.join(root, "backend", ".env.example");
  const frontendEnv = path.join(root, "frontend", ".env");
  const frontendExample = path.join(root, "frontend", ".env.example");

  config({ path: fs.existsSync(backendEnv) ? backendEnv : backendExample });
  config({ path: fs.existsSync(frontendEnv) ? frontendEnv : frontendExample, override: false });
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL غير مضبوط. راجع backend/.env");
  }
  return databaseUrl;
}

function getDatabaseInfo() {
  const databaseUrl = getDatabaseUrl();
  const url = new URL(databaseUrl);
  const databaseName = url.pathname.replace(/^\//, "");
  if (!databaseName) {
    throw new Error("DATABASE_URL لا يحتوي على اسم قاعدة بيانات صالح.");
  }

  return {
    databaseUrl,
    url,
    host: url.hostname || "localhost",
    port: Number(url.port || "5432"),
    databaseName,
    user: decodeURIComponent(url.username || ""),
    password: decodeURIComponent(url.password || ""),
  };
}

function checkPostgresReady(info) {
  const pgIsReady = spawnSync(isWin ? "pg_isready.exe" : "pg_isready", ["-h", info.host, "-p", String(info.port)], {
    stdio: "pipe",
    encoding: "utf8",
  });

  if (pgIsReady.status === 0) {
    return true;
  }

  return new Promise((resolve) => {
    const socket = net.createConnection({ host: info.host, port: info.port });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => {
      resolve(false);
    });
    socket.setTimeout(2000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function ensureDatabaseExists(info) {
  const result = spawnSync(isWin ? "createdb.exe" : "createdb", [info.databaseName], {
    stdio: "pipe",
    encoding: "utf8",
    env: {
      ...process.env,
      PGHOST: info.host,
      PGPORT: String(info.port),
      PGUSER: info.user,
      PGPASSWORD: info.password,
    },
  });

  if (result.error) {
    throw new Error("أداة createdb غير موجودة. ثبّت PostgreSQL client tools ثم أعد المحاولة.");
  }

  if (result.status === 0) {
    return { created: true };
  }

  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  if (/already exists/i.test(output)) {
    return { created: false };
  }

  throw new Error(`تعذر إنشاء قاعدة البيانات ${info.databaseName}.\n${output.trim()}`);
}

function run(command, args, extraEnv = {}) {
  execFileSync(command, args, {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      ...extraEnv,
    },
  });
}

async function countExistingOwners() {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  try {
    return await prisma.user.count({
      where: {
        status: "ACTIVE",
        role: { name: { in: ["owner", "super_admin"] } },
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = {
  root,
  isWin,
  loadEnv,
  getDatabaseInfo,
  checkPostgresReady,
  ensureDatabaseExists,
  run,
  countExistingOwners,
};
