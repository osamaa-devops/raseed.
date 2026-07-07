const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? "/api" : "http://localhost:4000/api");
export const SUBSCRIPTION_BLOCKED_MESSAGE_KEY = "raseed-subscription-blocked-message";

type RequestOptions = RequestInit & {
  token?: string | null;
  skipAuthRetry?: boolean;
};

type AuthChangeListener<TAuth = unknown> = (auth: TAuth | null) => void;

let accessToken: string | null = null;
let authChangeListener: AuthChangeListener | null = null;
let refreshPromise: Promise<unknown> | null = null;
let authSnapshot: { permissions: string[] } | null = null;

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = options.token ?? accessToken;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && !options.skipAuthRetry && !isRefreshPath(path)) {
    try {
      await refreshAccessToken();
      return apiRequest<T>(path, { ...options, skipAuthRetry: true });
    } catch {
      clearAccessToken();
      notifyAuthChanged(null);
    }
  }

  if (!response.ok) {
    const errorBody = await readJsonBody(response);
    const message = extractErrorMessage(errorBody) ?? `API request failed: ${response.status}`;
    if (response.status === 401) {
      clearAccessToken();
      notifyAuthChanged(null);
    }
    if (response.status === 403 && typeof message === "string" && message.includes("انتهى اشتراك المتجر أو تم إيقافه")) {
      sessionStorage.setItem(SUBSCRIPTION_BLOCKED_MESSAGE_KEY, message);
      window.dispatchEvent(new CustomEvent("raseed:subscription-blocked", { detail: { message } }));
      const currentAuth = getCurrentAuthSnapshot();
      const canViewSubscription = Boolean(currentAuth?.permissions.includes("subscription.view"));
      const targetPath = canViewSubscription ? "/subscription-billing" : "/subscription-blocked";
      if (!window.location.pathname.startsWith("/super-admin") && window.location.pathname !== "/subscription-billing" && window.location.pathname !== "/subscription-blocked") {
        window.location.assign(targetPath);
      }
    }
    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  return (await readJsonBody(response)) as T;
}

export function getApiBaseUrl() {
  return API_URL;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

export function getAccessToken() {
  return accessToken;
}

export function registerAuthChangeListener<TAuth>(listener: AuthChangeListener<TAuth>) {
  authChangeListener = listener as AuthChangeListener;
  return () => {
    if (authChangeListener === listener) {
      authChangeListener = null;
    }
  };
}

export function setAuthSnapshot(nextAuth: { permissions: string[] } | null) {
  authSnapshot = nextAuth;
}

export async function refreshAccessToken<TAuth extends { accessToken: string; permissions: string[] }>() {
  if (!refreshPromise) {
    refreshPromise = fetch(buildUrl("/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorBody = await readJsonBody(response);
          throw new Error(extractErrorMessage(errorBody) ?? "Unauthorized");
        }
        const auth = await readJsonBody(response) as TAuth;
        setAccessToken(auth.accessToken);
        notifyAuthChanged(auth);
        return auth;
      })
      .catch((error) => {
        clearAccessToken();
        notifyAuthChanged(null);
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise as Promise<TAuth>;
}

function notifyAuthChanged(auth: unknown | null) {
  authChangeListener?.(auth);
}

function buildUrl(path: string) {
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function isRefreshPath(path: string) {
  return path === "/auth/refresh" || path === "auth/refresh";
}

function getCurrentAuthSnapshot() {
  return authSnapshot;
}

async function readJsonBody(response: Response) {
  const raw = await response.text();
  if (!raw.trim()) return null;

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return { message: raw };
  }
}

function extractErrorMessage(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const error = body as { message?: unknown; error?: { message?: unknown } };
  const nestedMessage = typeof error.error?.message === "string" ? error.error.message : null;
  if (nestedMessage) return nestedMessage;
  return typeof error.message === "string" ? error.message : null;
}
