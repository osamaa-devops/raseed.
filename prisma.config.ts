import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

config({ path: "backend/.env" });
config({ path: "backend/.env.example", override: false });

export default defineConfig({
  schema: "backend/prisma/schema.prisma",
  migrations: {
    path: "backend/prisma/migrations",
    seed: "node backend/prisma/seed-runner.cjs",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
