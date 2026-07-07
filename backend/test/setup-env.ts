import { config } from "dotenv";

process.env.NODE_ENV = "test";
config({ path: ".env.test" });

const defaultTestDatabaseUrl = "postgresql://raseed:raseed_password@localhost:5432/raseed_test?schema=public";
process.env.TEST_DATABASE_URL ??= process.env.DATABASE_URL?.includes("test") ? process.env.DATABASE_URL : defaultTestDatabaseUrl;
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.JWT_SECRET ??= "raseed-test-secret-change-outside-local";
process.env.ACCESS_TOKEN_EXPIRES_IN ??= "15m";
process.env.REFRESH_TOKEN_EXPIRES_DAYS ??= "30";
process.env.AUTH_COOKIE_NAME ??= "raseed_refresh_token";
process.env.AUTH_COOKIE_SECURE ??= "false";
process.env.AUTH_COOKIE_SAME_SITE ??= "lax";
process.env.FRONTEND_URL ??= "http://localhost:5173";
process.env.THROTTLE_TTL_SECONDS ??= "60";
process.env.THROTTLE_LIMIT ??= "1000";
