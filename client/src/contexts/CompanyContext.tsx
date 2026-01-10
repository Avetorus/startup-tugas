import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Company, CompanyContext as CompanyContextType, CompanyHierarchyNode, CompanyLevel } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface CompanyProviderState {
  activeCompanyId: string | null;
  activeCompany: Company | null;
  userCompanies: Company[];
  permissions: string[];
  isLoading: boolean;
  error: string | null;
  // Hierarchy-aware access
  companyLevel: CompanyLevel;
  accessibleCompanyIds: string[];
  canConsolidate: boolean;
  parentCompany: Company | null;
  childCompanies: Company[];
}

interface CompanyProviderActions {
  switchCompany: (companyId: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  refreshContext: () => void;
  canAccessCompanyData: (targetCompanyId: string) => boolean;
}

type CompanyProviderValue = CompanyProviderState & CompanyProviderActions;

const CompanyContext = createContext<CompanyProviderValue | null>(null);

const STORAGE_KEY_COMPANY = "unanza_active_company";
const STORAGE_KEY_USER = "unanza_user_id";

// Default admin user for demo purposes
const DEFAULT_USER_ID = "e776519a-504e-4eee-8b2f-8b40f1d9b2a0";
const DEFAULT_COMPANY_ID = "comp-holding";

interface CompanyProviderProps {
  children: ReactNode;
}

export function CompanyProvider({ children }: CompanyProviderProps) {
  const queryClient = useQueryClient();
  
  // Initialize from localStorage or defaults
  const [userId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_USER) || DEFAULT_USER_ID;
  });
  
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_COMPANY) || DEFAULT_COMPANY_ID;
  });

  // Fetch all companies for the switcher
  const { data: allCompanies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  // Fetch user's accessible companies
  const { data: userCompanies = [] } = useQuery<Company[]>({
    queryKey: ["/api/users", userId, "companies"],
    enabled: !!userId,
  });

  // Fetch company hierarchy
  const { data: companyHierarchy = [] } = useQuery<CompanyHierarchyNode[]>({
    queryKey: ["/api/companies/hierarchy"],
  });

  // Fetch current context - include activeCompanyId in query key so it refetches on switch
  const { 
    data: context, 
    isLoading, 
    error,
    refetch: refreshContext 
  } = useQuery<CompanyContextType>({
    queryKey: ["/api/session/context", activeCompanyId],
    enabled: !!userId && !!activeCompanyId,
    meta: {
      headers: {
        "x-user-id": userId,
        "x-company-id": activeCompanyId || "",
      },
    },
  });

  // Switch company mutation
  const switchCompanyMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const response = await apiRequest("POST", "/api/session/switch-company", {
        userId,
        companyId,
      });
      return response.json();
    },
    onSuccess: (data: CompanyContextType, companyId: string) => {
      setActiveCompanyId(companyId);
      localStorage.setItem(STORAGE_KEY_COMPANY, companyId);
      
      // Update the cache directly with the new context data
      queryClient.setQueryData(["/api/session/context", companyId], data);
      
      // Invalidate companies list and hierarchy
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies/hierarchy"] });
      
      // Invalidate all company-scoped queries to force refetch with new context
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          // Invalidate queries that have company-specific data (but not the new context we just set)
          return Array.isArray(key) && (
            key.some(k => typeof k === "string" && k.includes("/companies/"))
          );
        }
      });
    },
  });

  // Switch company function
  const switchCompany = useCallback(async (companyId: string) => {
    await switchCompanyMutation.mutateAsync(companyId);
  }, [switchCompanyMutation]);

  // Check if user has a specific permission
  const hasPermission = useCallback((permission: string): boolean => {
    if (!context?.permissions) return false;
    // Wildcard permission
    if (context.permissions.includes("*")) return true;
    // Direct match
    if (context.permissions.includes(permission)) return true;
    // Prefix match (e.g., "read:*" matches "read:customers")
    const [action] = permission.split(":");
    if (context.permissions.includes(`${action}:*`)) return true;
    return false;
  }, [context?.permissions]);

  // Check if user can access data for a target company based on hierarchy
  const canAccessCompanyData = useCallback((targetCompanyId: string): boolean => {
    if (!context?.accessibleCompanyIds) return false;
    return context.accessibleCompanyIds.includes(targetCompanyId);
  }, [context?.accessibleCompanyIds]);

  // Get active company from context or find from list
  const activeCompany = context?.activeCompany || 
    (activeCompanyId ? allCompanies.find(c => c.id === activeCompanyId) || null : null);

  const value: CompanyProviderValue = {
    activeCompanyId,
    activeCompany,
    userCompanies: context?.userCompanies || userCompanies,
    permissions: context?.permissions || [],
    isLoading: isLoading || switchCompanyMutation.isPending,
    error: error?.message || switchCompanyMutation.error?.message || null,
    // Hierarchy-aware access
    companyLevel: context?.companyLevel || 3,
    accessibleCompanyIds: context?.accessibleCompanyIds || [],
    canConsolidate: context?.canConsolidate || false,
    parentCompany: context?.parentCompany || null,
    childCompanies: context?.childCompanies || [],
    switchCompany,
    hasPermission,
    refreshContext: () => refreshContext(),
    canAccessCompanyData,
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}

// Hook to get the active company ID for query keys
export function useActiveCompanyId() {
  const { activeCompanyId } = useCompany();
  return activeCompanyId;
}

// Hook to check permissions
export function usePermission(permission: string) {
  const { hasPermission } = useCompany();
  return hasPermission(permission);
}
