const { loadEnv, getDatabaseInfo, checkPostgresReady, ensureDatabaseExists, run, countExistingOwners } = require("./local-shared.cjs");

async function main() {
  loadEnv();
  const info = getDatabaseInfo();
  const ready = await checkPostgresReady(info);

  if (!ready) {
    console.error(`PostgreSQL غير شغال على ${info.host}:${info.port}. شغّل الخدمة أولاً ثم أعد المحاولة.`);
    process.exit(1);
  }

  const result = ensureDatabaseExists(info);
  console.log(result.created ? `تم إنشاء قاعدة البيانات ${info.databaseName}` : `قاعدة البيانات ${info.databaseName} موجودة بالفعل`);

  run(process.platform === "win32" ? "npx.cmd" : "npx", ["prisma", "validate", "--schema", "backend/prisma/schema.prisma"]);
  run(process.platform === "win32" ? "npx.cmd" : "npx", ["prisma", "migrate", "deploy", "--schema", "backend/prisma/schema.prisma"]);

  const ownerCount = await countExistingOwners();
  if (ownerCount === 0) {
    console.log("لا يوجد Owner/Admin حتى الآن. سيتم تشغيل demo seed المحلي.");
    run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "db:seed"], { RASEED_SEED_PROFILE: "demo" });
  } else {
    console.log("تم تخطي الـ seed لأن هناك بيانات مستخدمين فعلية موجودة.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
