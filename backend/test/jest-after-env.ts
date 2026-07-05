import { prisma, resetTestDatabase } from "./utils/test-db";

beforeEach(async () => {
  await resetTestDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});
