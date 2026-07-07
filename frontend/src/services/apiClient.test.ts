import { afterEach, describe, expect, it, vi } from "vitest";
import {
  apiRequest,
  clearAccessToken,
  getAccessToken,
  registerAuthChangeListener,
  setAccessToken,
  setAuthSnapshot,
} from "./apiClient";

describe("apiRequest", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearAccessToken();
    setAuthSnapshot(null);
    sessionStorage.clear();
    registerAuthChangeListener(() => undefined)();
  });

  it("attaches the in-memory bearer token", async () => {
    setAccessToken("token-123");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } }));

    await apiRequest("/products");

    const headers = fetchMock.mock.calls[0][1]?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer token-123");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("retries once after refresh and updates the access token", async () => {
    setAccessToken("expired-token");
    const authListener = vi.fn();
    registerAuthChangeListener(authListener);

    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401, headers: { "content-type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        accessToken: "fresh-token",
        user: { id: "u1" },
        store: null,
        branch: null,
        role: null,
        permissions: [],
      }), { status: 201, headers: { "content-type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } }));

    const result = await apiRequest<{ ok: boolean }>("/products");

    expect(result.ok).toBe(true);
    expect(getAccessToken()).toBe("fresh-token");
    expect(authListener).toHaveBeenCalledWith(expect.objectContaining({ accessToken: "fresh-token" }));

    const retryHeaders = fetchMock.mock.calls[2][1]?.headers as Headers;
    expect(retryHeaders.get("Authorization")).toBe("Bearer fresh-token");
  });

  it("clears in-memory auth when refresh fails after a 401", async () => {
    setAccessToken("expired");
    const authListener = vi.fn();
    registerAuthChangeListener(authListener);

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401, headers: { "content-type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401, headers: { "content-type": "application/json" } }));

    await expect(apiRequest("/products")).rejects.toThrow("Unauthorized");
    expect(getAccessToken()).toBeNull();
    expect(authListener).toHaveBeenCalledWith(null);
  });

  it("handles empty successful responses without throwing a JSON parse error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));

    await expect(apiRequest("/health")).resolves.toBeNull();
  });
});
