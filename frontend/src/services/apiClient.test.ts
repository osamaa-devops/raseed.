import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest, AUTH_STORAGE_KEY } from "./apiClient";

describe("apiRequest", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("attaches the stored bearer token", async () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ accessToken: "token-123", permissions: [] }));
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } }));

    await apiRequest("/products");

    const headers = fetchMock.mock.calls[0][1]?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer token-123");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("clears stored auth on 401", async () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ accessToken: "expired", permissions: [] }));
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401, headers: { "content-type": "application/json" } }));

    await expect(apiRequest("/products")).rejects.toThrow("Unauthorized");
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });
});
