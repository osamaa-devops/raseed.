type EnvShape = Record<string, string | undefined>;

const nodeEnvironments = new Set(["development", "test", "production"]);

export function validateEnv(config: EnvShape) {
  const env = {
    NODE_ENV: config.NODE_ENV ?? "development",
    PORT: config.PORT ?? "4000",
    DATABASE_URL: config.DATABASE_URL,
    JWT_SECRET: config.JWT_SECRET,
    ACCESS_TOKEN_EXPIRES_IN: config.ACCESS_TOKEN_EXPIRES_IN ?? config.JWT_EXPIRES_IN ?? "15m",
    REFRESH_TOKEN_EXPIRES_DAYS: config.REFRESH_TOKEN_EXPIRES_DAYS ?? "30",
    AUTH_COOKIE_NAME: config.AUTH_COOKIE_NAME ?? "raseed_refresh_token",
    AUTH_COOKIE_SECURE: config.AUTH_COOKIE_SECURE ?? (config.NODE_ENV === "production" ? "true" : "false"),
    AUTH_COOKIE_SAME_SITE: config.AUTH_COOKIE_SAME_SITE ?? "lax",
    AUTH_COOKIE_DOMAIN: config.AUTH_COOKIE_DOMAIN,
    FRONTEND_URL: config.FRONTEND_URL ?? config.FRONTEND_ORIGIN,
    FRONTEND_ORIGIN: config.FRONTEND_ORIGIN ?? config.FRONTEND_URL,
    UPLOAD_MAX_MB: config.UPLOAD_MAX_MB ?? "10",
    THROTTLE_TTL_SECONDS: config.THROTTLE_TTL_SECONDS ?? "60",
    THROTTLE_LIMIT: config.THROTTLE_LIMIT ?? "120",
    LOG_LEVEL: config.LOG_LEVEL ?? (config.NODE_ENV === "production" ? "log,warn,error" : "log,debug,warn,error"),
    HEALTHCHECK_TOKEN: config.HEALTHCHECK_TOKEN,
    LICENSE_SECRET: config.LICENSE_SECRET,
  };

  const errors: string[] = [];

  if (!nodeEnvironments.has(env.NODE_ENV)) {
    errors.push(`NODE_ENV must be one of: ${Array.from(nodeEnvironments).join(", ")}`);
  }

  if (!env.DATABASE_URL) {
    errors.push("DATABASE_URL is required.");
  }

  if (!env.JWT_SECRET) {
    errors.push("JWT_SECRET is required.");
  } else if (env.NODE_ENV === "production" && env.JWT_SECRET.length < 32) {
    errors.push("JWT_SECRET must be at least 32 characters in production.");
  }

  if (env.NODE_ENV === "production" && (!env.LICENSE_SECRET || env.LICENSE_SECRET.length < 32)) {
    errors.push("LICENSE_SECRET must be at least 32 characters in production.");
  }

  if (!env.FRONTEND_URL) {
    errors.push("FRONTEND_URL is required.");
  }

  if (!isPositiveInteger(env.PORT)) {
    errors.push("PORT must be a positive integer.");
  }

  if (!isPositiveInteger(env.THROTTLE_TTL_SECONDS)) {
    errors.push("THROTTLE_TTL_SECONDS must be a positive integer.");
  }

  if (!isPositiveInteger(env.THROTTLE_LIMIT)) {
    errors.push("THROTTLE_LIMIT must be a positive integer.");
  }

  if (!isPositiveInteger(env.UPLOAD_MAX_MB)) {
    errors.push("UPLOAD_MAX_MB must be a positive integer.");
  }

  if (!isPositiveInteger(env.REFRESH_TOKEN_EXPIRES_DAYS)) {
    errors.push("REFRESH_TOKEN_EXPIRES_DAYS must be a positive integer.");
  }

  if (!["true", "false"].includes(env.AUTH_COOKIE_SECURE)) {
    errors.push("AUTH_COOKIE_SECURE must be either 'true' or 'false'.");
  }

  if (!["lax", "strict", "none"].includes(env.AUTH_COOKIE_SAME_SITE.toLowerCase())) {
    errors.push("AUTH_COOKIE_SAME_SITE must be one of: lax, strict, none.");
  }

  if (env.AUTH_COOKIE_SAME_SITE.toLowerCase() === "none" && env.AUTH_COOKIE_SECURE !== "true") {
    errors.push("AUTH_COOKIE_SAME_SITE=none requires AUTH_COOKIE_SECURE=true.");
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n- ${errors.join("\n- ")}`);
  }

  return env;
}

function isPositiveInteger(value: string) {
  return /^\d+$/.test(value) && Number(value) > 0;
}
