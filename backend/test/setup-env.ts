import { config } from "dotenv";

process.env.NODE_ENV = "test";
config({ path: ".env.test" });

const defaultTestDatabaseUrl = "postgresql://raseed:raseed_password@localhost:5432/raseed_test?schema=public";
process.env.TEST_DATABASE_URL ??= process.env.DATABASE_URL?.includes("test") ? process.env.DATABASE_URL : defaultTestDatabaseUrl;
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.JWT_SECRET ??= "raseed-test-secret-change-outside-local";
process.env.JWT_EXPIRES_IN ??= "1d";
process.env.FRONTEND_URL ??= "http://localhost:5173";
