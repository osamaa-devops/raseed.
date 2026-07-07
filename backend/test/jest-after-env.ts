import { prisma, resetTestDatabase } from "./utils/test-db";

const skipDbTests = process.env.RASEED_SKIP_DB_TESTS === "1";

if (skipDbTests) {
  beforeAll(() => {
    // Keep the suite green on machines without PostgreSQL while still printing a useful message.
    // Integration coverage is restored automatically once TEST_DATABASE_URL is available.
    // eslint-disable-next-line no-console
    console.warn("اختبارات الباك إند التكاملية متخطية لأن قاعدة بيانات الاختبار غير متاحة.");
  });
} else {
  beforeEach(async () => {
    await resetTestDatabase();
  });
}

afterAll(async () => {
  await prisma.$disconnect();
});
