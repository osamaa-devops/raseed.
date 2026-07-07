import { createHash, randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import type { ConfigService } from "@nestjs/config";

type SameSite = "lax" | "strict" | "none";

export function createRefreshToken() {
  return randomBytes(48).toString("base64url");
}

export function hashRefreshToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getRefreshCookieName(config: ConfigService) {
  return config.get<string>("AUTH_COOKIE_NAME", "raseed_refresh_token");
}

export function getRefreshTokenFromRequest(request: Request, config: ConfigService) {
  const cookieName = getRefreshCookieName(config);
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((part) => part.trim());
  for (const cookie of cookies) {
    const separatorIndex = cookie.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = cookie.slice(0, separatorIndex).trim();
    if (key !== cookieName) continue;
    return decodeURIComponent(cookie.slice(separatorIndex + 1).trim());
  }

  return null;
}

export function setRefreshTokenCookie(response: Response, config: ConfigService, token: string, expiresAt: Date) {
  response.cookie(getRefreshCookieName(config), token, {
    httpOnly: true,
    secure: config.get<string>("AUTH_COOKIE_SECURE", "false") === "true",
    sameSite: config.get<string>("AUTH_COOKIE_SAME_SITE", "lax").toLowerCase() as SameSite,
    domain: config.get<string>("AUTH_COOKIE_DOMAIN") || undefined,
    expires: expiresAt,
    path: "/api/auth",
  });
}

export function clearRefreshTokenCookie(response: Response, config: ConfigService) {
  response.clearCookie(getRefreshCookieName(config), {
    httpOnly: true,
    secure: config.get<string>("AUTH_COOKIE_SECURE", "false") === "true",
    sameSite: config.get<string>("AUTH_COOKIE_SAME_SITE", "lax").toLowerCase() as SameSite,
    domain: config.get<string>("AUTH_COOKIE_DOMAIN") || undefined,
    path: "/api/auth",
  });
}
