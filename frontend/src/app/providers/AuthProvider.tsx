import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AUTH_STORAGE_KEY } from "../../services/apiClient";
import { authService, type AuthResponse } from "../../services/authService";

type AuthContextValue = {
  auth: AuthResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identity: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthResponse) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthResponse | null>(readStoredAuth);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (identity: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login(identity, password);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response));
      setAuth(response);
      return response;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuth(null);
  }, []);

  const refreshMe = useCallback(async () => {
    if (!auth?.accessToken) return;
    setIsLoading(true);
    try {
      const response = await authService.me();
      const nextAuth = { ...response, accessToken: auth.accessToken };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
      setAuth(nextAuth);
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [auth?.accessToken, logout]);

  const value = useMemo<AuthContextValue>(() => ({
    auth,
    isAuthenticated: Boolean(auth?.accessToken),
    isLoading,
    login,
    logout,
    refreshMe,
    hasPermission: (permission: string) => Boolean(auth?.permissions.includes(permission)),
  }), [auth, isLoading, login, logout, refreshMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
