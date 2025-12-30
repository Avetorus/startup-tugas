import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Company, Role } from "@shared/schema";

interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  activeCompany: {
    id: string;
    code: string;
    name: string;
    companyType: string;
    level: number;
  } | null;
  role: {
    id: string;
    name: string;
    permissions: string[];
  } | null;
  allowedCompanyIds: string[];
  companyLevel: number;
  canConsolidate: boolean;
  error: string | null;
}

interface AuthActions {
  login: (username: string, password: string, companyId?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  switchCompany: (companyId: string) => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
  canAccessCompany: (companyId: string) => boolean;
  getAuthHeaders: () => Record<string, string>;
}

type AuthContextValue = AuthState & AuthActions;

type LoginRequest = {
  username : string,
  password: string,
  companyId?: string
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_STORAGE_KEY = "unanza_access_token";
const TOKEN_EXPIRY_KEY = "unanza_token_expiry";

interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
  activeCompany: AuthState["activeCompany"];
  role: AuthState["role"];
  allowedCompanyIds: string[];
  companyLevel: number;
  canConsolidate: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  
  const [state, setState] = useState<AuthState>(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    const isExpired = storedExpiry ? Date.now() > parseInt(storedExpiry) : true;
    
    return {
      isAuthenticated: !!(storedToken && !isExpired),
      isLoading: !!(storedToken && !isExpired),
      user: null,
      accessToken: storedToken && !isExpired ? storedToken : null,
      activeCompany: null,
      role: null,
      allowedCompanyIds: [],
      companyLevel: 3,
      canConsolidate: false,
      error: null,
    };
  });

  const storeTokens = useCallback((accessToken: string, expiresIn: number) => {
    const expiryTime = Date.now() + expiresIn * 1000;
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  }, []);

  const clearTokens = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }, []);

  const updateStateFromResponse = useCallback((response: LoginResponse) => {
    storeTokens(response.accessToken, response.expiresIn);
    
    setState(prev => ({
      ...prev,
      isAuthenticated: true,
      isLoading: false,
      user: response.user,
      accessToken: response.accessToken,
      activeCompany: response.activeCompany,
      role: response.role,
      allowedCompanyIds: response.allowedCompanyIds,
      companyLevel: response.companyLevel,
      canConsolidate: response.canConsolidate,
      error: null,
    }));
  }, [storeTokens]);

  const loginMutation = useMutation({
    mutationFn: async (body: LoginRequest) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Login failed");
      }
      
      return response.json() as Promise<LoginResponse>;
    },
    onSuccess: (data: LoginResponse) => {
      updateStateFromResponse(data);
      queryClient.invalidateQueries(); // user login, invalidate all cache, auto refetch
    },
    onError: (error: Error) => {
      clearTokens();
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        accessToken: null,
        activeCompany: null,
        role: null,
        allowedCompanyIds: [],
        error: error.message,
      }));
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    },
    onSettled: () => {
      clearTokens();
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        accessToken: null,
        activeCompany: null,
        role: null,
        allowedCompanyIds: [],
        companyLevel: 3,
        canConsolidate: false,
        error: null,
      });
      queryClient.clear(); //user logout clear everything
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Token refresh failed");
      }
      
      return response.json() as Promise<LoginResponse>;
    },
    onSuccess: (data) => {
      updateStateFromResponse(data);
    },
    onError: () => {
      clearTokens();
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        accessToken: null,
        error: "Session expired",
      }));
    },
  });

  // ! switch company ! 
  const switchCompanyMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const response = await fetch("/api/auth/switch-company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${state.accessToken}`,
        },
        credentials: "include",
        body: JSON.stringify({ companyId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Company switch failed");
      }
      
      return response.json() as Promise<LoginResponse>;
    },
    onSuccess: (data) => {
      updateStateFromResponse(data);
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => {
      setState(prev => ({ ...prev, error: error.message }));
    },
  });

  // refresh access token
  const fetchMe = useCallback(async () => {
    if (!state.accessToken) return;
    
    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${state.accessToken}`,
        },
        credentials: "include",
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          await refreshMutation.mutateAsync();
        }
        return;
      }
      
      const data = await response.json();
      setState(prev => ({
        ...prev,
        isLoading: false,
        user: data.user,
        activeCompany: data.activeCompany,
        role: data.role,
        allowedCompanyIds: data.allowedCompanyIds,
        companyLevel: data.companyLevel,
        canConsolidate: data.canConsolidate,
      }));
    } catch (error) {
      await refreshMutation.mutateAsync();
    }
  }, [state.accessToken, refreshMutation]);

  useEffect(() => {
    if (state.accessToken && !state.user) {
      fetchMe();
    }
  }, [state.accessToken, state.user, fetchMe]);

  useEffect(() => {
    const checkTokenExpiry = () => {
      const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
      if (expiry) {
        const expiryTime = parseInt(expiry);
        const timeUntilExpiry = expiryTime - Date.now();
        
        if (timeUntilExpiry < 60000) {
          refreshMutation.mutate();
        }
      }
    };

    const interval = setInterval(checkTokenExpiry, 30 );
    return () => clearInterval(interval);
  }, [refreshMutation]);

  const login = useCallback(async (username: string, password: string, companyId?: string): Promise<boolean> => {
    try {
      await loginMutation.mutateAsync({ username, password, companyId });
      return true;
    } catch {
      return false;
    }
  }, [loginMutation]);

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      await refreshMutation.mutateAsync();
      return true;
    } catch {
      return false;
    }
  }, [refreshMutation]);

  const switchCompany = useCallback(async (companyId: string): Promise<boolean> => {
    try {
      await switchCompanyMutation.mutateAsync(companyId);
      return true;
    } catch {
      return false; 
    }
  }, [switchCompanyMutation]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!state.role?.permissions) return false;
    if (state.role.permissions.includes("*")) return true;
    if (state.role.permissions.includes(permission)) return true;
    const [action] = permission.split(":");
    if (state.role.permissions.includes(`${action}:*`)) return true;
    return false;
  }, [state.role?.permissions]);

  const canAccessCompany = useCallback((companyId: string): boolean => {
    return state.allowedCompanyIds.includes(companyId);
  }, [state.allowedCompanyIds]);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    if (!state.accessToken) return {};
    return {
      "Authorization": `Bearer ${state.accessToken}`,
    };
  }, [state.accessToken]);

  const value: AuthContextValue = {
    ...state,
    isLoading: state.isLoading || loginMutation.isPending || logoutMutation.isPending || switchCompanyMutation.isPending,
    login,
    logout,
    refreshToken,
    switchCompany,
    hasPermission,
    canAccessCompany,
    getAuthHeaders,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useIsAuthenticated() {
  const { isAuthenticated, isLoading } = useAuth();
  return { isAuthenticated, isLoading };
}

export function useAuthUser() {
  const { user, isAuthenticated } = useAuth();
  return isAuthenticated ? user : null;
}
