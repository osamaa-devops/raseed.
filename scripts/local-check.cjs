const { loadEnv, getDatabaseInfo, checkPostgresReady, run } = require("./local-shared.cjs");

async function main() {
  loadEnv();
  const info = getDatabaseInfo();
  const ready = await checkPostgresReady(info);

  if (!ready) {
    console.error(`PostgreSQL غير شغال على ${info.host}:${info.port}. شغّل الخدمة أولاً ثم أعد المحاولة.`);
    process.exit(1);
  }

  console.log(`PostgreSQL جاهز على ${info.host}:${info.port}`);
  console.log(`DATABASE_URL يستخدم قاعدة البيانات: ${info.databaseName}`);
  run(process.platform === "win32" ? "npx.cmd" : "npx", ["prisma", "validate", "--schema", "backend/prisma/schema.prisma"]);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
