import { QueryClient, QueryFunction } from "@tanstack/react-query";

const STORAGE_KEY_COMPANY = "unanza_active_company";
const STORAGE_KEY_USER = "unanza_user_id";
const DEFAULT_USER_ID = "user-admin";
const DEFAULT_COMPANY_ID = "comp-holding";

function getCompanyHeaders(): Record<string, string> {
  const userId = localStorage.getItem(STORAGE_KEY_USER) || DEFAULT_USER_ID;
  const companyId = localStorage.getItem(STORAGE_KEY_COMPANY) || DEFAULT_COMPANY_ID;
  return {
    "x-user-id": userId,
    "x-company-id": companyId,
  };
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {
    ...getCompanyHeaders(),
  };
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey, meta }) => {
    // Use custom headers from meta if provided, otherwise use company headers
    const headers: Record<string, string> = meta?.headers as Record<string, string> || getCompanyHeaders();
    
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
