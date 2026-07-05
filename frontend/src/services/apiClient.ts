const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
export const AUTH_STORAGE_KEY = "raseed-auth";

type RequestOptions = RequestInit & {
  token?: string;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const storedToken = getStoredToken();
  const token = options.token ?? storedToken;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path.startsWith("/") ? path : `/${path}`}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.error?.message ?? errorBody?.message ?? `API request failed: ${response.status}`;
    if (response.status === 403 && typeof message === "string" && message.includes("انتهى اشتراك المتجر أو تم إيقافه")) {
      window.dispatchEvent(new CustomEvent("raseed:subscription-blocked", { detail: { message } }));
      if (!window.location.pathname.startsWith("/super-admin") && window.location.pathname !== "/subscription-billing") {
        window.location.assign("/subscription-billing");
      }
    }
    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  return response.json() as Promise<T>;
}

export function getApiBaseUrl() {
  return API_URL;
}

function getStoredToken() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw).accessToken as string | null;
  } catch {
    return null;
  }
}
