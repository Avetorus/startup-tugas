// Mock mode flag - set to true to use mock data instead of backend API
export const MOCK_MODE = true;

// Mock authentication state for demo mode
import { 
  mockUsers, 
  mockCompanies, 
  mockRoles, 
  mockUserCompanyRoles,
  DEMO_CREDENTIALS 
} from "@/lib/mockData";

export interface MockAuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string | null;
  } | null;
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
}

// Simulate login with mock credentials
export function mockLogin(username: string, password: string): MockAuthState | null {
  // Accept demo credentials or any valid mock user
  if (username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
    const user = mockUsers[0]; // Admin user
    const company = mockCompanies[0]; // Holding company
    const role = mockRoles[0]; // Super Admin

    return {
      isAuthenticated: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
      },
      activeCompany: {
        id: company.id,
        code: company.code,
        name: company.name,
        companyType: company.companyType,
        level: company.level,
      },
      role: {
        id: role.id,
        name: role.name,
        permissions: role.permissions,
      },
      allowedCompanyIds: mockCompanies.map(c => c.id),
      companyLevel: 1,
      canConsolidate: true,
    };
  }

  // Try to find matching mock user by username
  const user = mockUsers.find(u => u.username === username);
  if (user) {
    const userRole = mockUserCompanyRoles.find(ucr => ucr.userId === user.id && ucr.isDefault);
    const company = mockCompanies.find(c => c.id === (userRole?.companyId || user.defaultCompanyId));
    const role = mockRoles.find(r => r.id === userRole?.roleId);

    if (company && role) {
      const userCompanyIds = mockUserCompanyRoles
        .filter(ucr => ucr.userId === user.id && ucr.isActive)
        .map(ucr => ucr.companyId);

      return {
        isAuthenticated: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
        },
        activeCompany: {
          id: company.id,
          code: company.code,
          name: company.name,
          companyType: company.companyType,
          level: company.level,
        },
        role: {
          id: role.id,
          name: role.name,
          permissions: role.permissions,
        },
        allowedCompanyIds: userCompanyIds,
        companyLevel: company.level,
        canConsolidate: company.level === 1,
      };
    }
  }

  return null;
}

// Switch to a different company in mock mode
export function mockSwitchCompany(companyId: string, currentUser: MockAuthState): MockAuthState | null {
  if (!currentUser.user) return null;

  const company = mockCompanies.find(c => c.id === companyId);
  if (!company) return null;

  const userRole = mockUserCompanyRoles.find(
    ucr => ucr.userId === currentUser.user!.id && ucr.companyId === companyId
  );
  const role = userRole ? mockRoles.find(r => r.id === userRole.roleId) : mockRoles[3]; // Default to USER role

  return {
    ...currentUser,
    activeCompany: {
      id: company.id,
      code: company.code,
      name: company.name,
      companyType: company.companyType,
      level: company.level,
    },
    role: role ? {
      id: role.id,
      name: role.name,
      permissions: role.permissions,
    } : currentUser.role,
    companyLevel: company.level,
    canConsolidate: company.level === 1,
  };
}

// Get initial mock state (auto-login for demo)
export function getInitialMockState(): MockAuthState {
  // Auto-login as admin for demo mode
  const result = mockLogin(DEMO_CREDENTIALS.username, DEMO_CREDENTIALS.password);
  if (result) return result;

  // Fallback to unauthenticated
  return {
    isAuthenticated: false,
    user: null,
    activeCompany: null,
    role: null,
    allowedCompanyIds: [],
    companyLevel: 3,
    canConsolidate: false,
  };
}
