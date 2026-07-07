import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  clearAccessToken,
  refreshAccessToken,
  registerAuthChangeListener,
  setAccessToken,
  setAuthSnapshot,
} from "../../services/apiClient";
import { authService, type AuthResponse } from "../../services/authService";

type AuthContextValue = {
  auth: AuthResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isReady: boolean;
  login: (identity: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const unregister = registerAuthChangeListener<AuthResponse>((nextAuth) => {
      setAuth(nextAuth);
      setAuthSnapshot(nextAuth);
    });

    setIsLoading(true);
    refreshAccessToken<AuthResponse>()
      .then((response) => {
        setAuth(response);
        setAuthSnapshot(response);
      })
      .catch(() => {
        clearAccessToken();
        setAuth(null);
        setAuthSnapshot(null);
      })
      .finally(() => {
        setIsLoading(false);
        setIsReady(true);
      });

    return unregister;
  }, []);

  const login = useCallback(async (identity: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login(identity, password);
      setAccessToken(response.accessToken);
      setAuth(response);
      setAuthSnapshot(response);
      setIsReady(true);
      return response;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      clearAccessToken();
      setAuth(null);
      setAuthSnapshot(null);
      setIsLoading(false);
      setIsReady(true);
    }
  }, []);

  const refreshMe = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await refreshAccessToken<AuthResponse>();
      setAuth(response);
      setAuthSnapshot(response);
    } catch {
      clearAccessToken();
      setAuth(null);
      setAuthSnapshot(null);
    } finally {
      setIsLoading(false);
      setIsReady(true);
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    auth,
    isAuthenticated: Boolean(auth?.accessToken),
    isLoading,
    isReady,
    login,
    logout,
    refreshMe,
    hasPermission: (permission: string) => Boolean(auth?.permissions.includes(permission)),
  }), [auth, isLoading, isReady, login, logout, refreshMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
