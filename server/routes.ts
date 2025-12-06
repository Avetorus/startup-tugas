import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCompanySchema, 
  insertUserCompanyRoleSchema,
  insertAccountSchema,
  insertWarehouseSchema,
  insertProductSchema,
  insertCustomerSchema,
  insertVendorSchema,
  insertTaxSchema,
  insertEmployeeSchema,
  insertJournalEntrySchema,
  insertFiscalPeriodSchema,
  insertSalesOrderSchema,
  insertPurchaseOrderSchema,
  loginSchema,
  type CompanyContext,
  type Account,
  type CompanyHierarchyNode,
} from "@shared/schema";
import { z } from "zod";
import {
  authenticateUser,
  refreshAccessToken,
  logout,
  switchCompany,
  authenticateJWT,
  loadAuthContext,
  AUTH_CONFIG,
} from "./auth";

// Middleware to extract company context from headers
interface CompanyRequest extends Request {
  companyContext?: CompanyContext;
  activeCompanyId?: string;
  userId?: string;
}

// Public routes that don't require authentication
// Note: These paths are relative to the /api mount point
// Only auth endpoints and setup endpoints are truly public - all others require JWT
const publicRoutes = [
  "/auth/login",
  "/auth/refresh",
  "/auth/logout",
  "/setup/status",
  "/setup/company",
  "/setup/admin",
];

async function companyContextMiddleware(
  req: CompanyRequest, 
  res: Response, 
  next: NextFunction
) {
  // Check if this is a public route (allow without auth)
  const isPublicRoute = publicRoutes.some(route => 
    req.path === route || req.path.startsWith(route + "/")
  );

  // Public routes don't require authentication
  if (isPublicRoute) {
    return next();
  }

  // All non-public routes require JWT authentication (via req.auth)
  if (!req.auth) {
    return res.status(401).json({ 
      error: "Authentication required. Please login." 
    });
  }

  // Build company context from JWT claims
  const rolePermissions = req.auth.role?.permissions;
  const permissionsArray = Array.isArray(rolePermissions) ? rolePermissions : [];
  
  req.companyContext = {
    activeCompanyId: req.auth.activeCompanyId,
    activeCompany: req.auth.activeCompany,
    userCompanies: [req.auth.activeCompany],
    permissions: permissionsArray,
    role: req.auth.role,
    companyLevel: req.auth.companyLevel,
    accessibleCompanyIds: req.auth.allowedCompanyIds,
    canConsolidate: req.auth.canConsolidate,
    parentCompany: null,
    childCompanies: [],
  };
  req.activeCompanyId = req.auth.activeCompanyId;
  req.userId = req.auth.user.id;
  next();
}

// Middleware to verify company access for company-scoped routes
// Uses hierarchy-derived accessibleCompanyIds for proper level-based visibility:
// - Branch (level 3): Can only see its own data
// - Subsidiary (level 2): Can see its own data + all its Branches
// - Holding (level 1): Can see all Subsidiaries and their Branches
function verifyCompanyAccess(
  req: CompanyRequest,
  res: Response,
  next: NextFunction
) {
  const urlCompanyId = req.params.companyId;
  
  // If route has companyId param, verify access using hierarchy-derived accessible IDs
  if (urlCompanyId && req.companyContext) {
    // Use accessibleCompanyIds which is computed based on company level
    const hasHierarchyAccess = req.companyContext.accessibleCompanyIds.includes(urlCompanyId);
    // Also check if user is directly assigned to the company (for users at different levels)
    const hasDirectAccess = req.companyContext.userCompanies.some(c => c.id === urlCompanyId);
    
    if (!hasHierarchyAccess && !hasDirectAccess) {
      return res.status(403).json({
        error: "Access denied: You do not have access to this company's data based on your company level"
      });
    }
  }
  next();
}

// JWT middleware wrapper that skips for public routes
function optionalJWT(req: Request, res: Response, next: NextFunction) {
  const isPublicRoute = publicRoutes.some(route => 
    req.path === route || req.path.startsWith(route + "/")
  );
  
  if (isPublicRoute) {
    return next();
  }
  
  // Apply JWT authentication for non-public routes
  authenticateJWT(req, res, (err?: any) => {
    if (err) return next(err);
    loadAuthContext(req, res, next);
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Apply JWT authentication + company context middleware to all /api routes
  app.use("/api", optionalJWT, companyContextMiddleware);

  // ============================================================================
  // AUTHENTICATION (JWT)
  // ============================================================================

  // Login - Get access token + refresh token
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid credentials format", details: parsed.error.errors });
      }

      const { username, password, companyId } = parsed.data;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const deviceInfo = req.headers["user-agent"];

      const result = await authenticateUser(username, password, companyId, ipAddress, deviceInfo);

      if (!result.success) {
        return res.status(401).json({ error: result.error });
      }

      // Set refresh token in httpOnly cookie
      res.cookie(AUTH_CONFIG.REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN * 1000,
        path: "/",
      });

      res.json(result.loginResponse);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Refresh access token
  app.post("/api/auth/refresh", async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies?.[AUTH_CONFIG.REFRESH_TOKEN_COOKIE_NAME] || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ error: "No refresh token provided" });
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const deviceInfo = req.headers["user-agent"];

      const result = await refreshAccessToken(refreshToken, ipAddress, deviceInfo);

      if (!result.success) {
        // Clear invalid cookie
        res.clearCookie(AUTH_CONFIG.REFRESH_TOKEN_COOKIE_NAME);
        return res.status(401).json({ error: result.error });
      }

      // Set new refresh token in cookie (rotation)
      if (result.newRefreshToken) {
        res.cookie(AUTH_CONFIG.REFRESH_TOKEN_COOKIE_NAME, result.newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN * 1000,
          path: "/",
        });
      }

      res.json(result.response);
    } catch (error) {
      console.error("Refresh error:", error);
      res.status(500).json({ error: "Token refresh failed" });
    }
  });

  // Logout - Revoke refresh token
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies?.[AUTH_CONFIG.REFRESH_TOKEN_COOKIE_NAME] || req.body.refreshToken;

      if (refreshToken) {
        const ipAddress = req.ip || req.socket.remoteAddress;
        const deviceInfo = req.headers["user-agent"];
        await logout(refreshToken, ipAddress, deviceInfo);
      }

      // Clear cookie
      res.clearCookie(AUTH_CONFIG.REFRESH_TOKEN_COOKIE_NAME);
      res.json({ success: true });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  // Get current user info (requires valid JWT)
  app.get("/api/auth/me", authenticateJWT, loadAuthContext, async (req: Request, res: Response) => {
    try {
      const auth = req.auth;
      if (!auth) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      res.json({
        user: {
          id: auth.user.id,
          username: auth.user.username,
          email: auth.user.email,
          fullName: auth.user.fullName,
        },
        activeCompany: {
          id: auth.activeCompany.id,
          code: auth.activeCompany.code,
          name: auth.activeCompany.name,
          companyType: auth.activeCompany.companyType,
          level: auth.activeCompany.level,
        },
        role: auth.role ? {
          id: auth.role.id,
          name: auth.role.name,
          permissions: auth.role.permissions,
        } : null,
        allowedCompanyIds: auth.allowedCompanyIds,
        companyLevel: auth.companyLevel,
        canConsolidate: auth.canConsolidate,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user info" });
    }
  });

  // Switch company (requires valid JWT)
  app.post("/api/auth/switch-company", authenticateJWT, loadAuthContext, async (req: Request, res: Response) => {
    try {
      const auth = req.auth;
      if (!auth) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { companyId } = req.body;
      if (!companyId) {
        return res.status(400).json({ error: "Company ID is required" });
      }

      const refreshToken = req.cookies?.[AUTH_CONFIG.REFRESH_TOKEN_COOKIE_NAME];
      if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token required for company switch" });
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const deviceInfo = req.headers["user-agent"];

      const result = await switchCompany(auth.user.id, companyId, refreshToken, ipAddress, deviceInfo);

      if (!result.success) {
        return res.status(403).json({ error: result.error });
      }

      // Set new refresh token
      if (result.refreshToken) {
        res.cookie(AUTH_CONFIG.REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN * 1000,
          path: "/",
        });
      }

      res.json(result.loginResponse);
    } catch (error) {
      console.error("Switch company error:", error);
      res.status(500).json({ error: "Failed to switch company" });
    }
  });

  // ============================================================================
  // FIRST-TIME SETUP (Public - only works when system is uninitialized)
  // ============================================================================

  // Setup status - Check if system needs initial setup
  app.get("/api/setup/status", async (req: Request, res: Response) => {
    try {
      const stats = await storage.getSystemStats();
      const isInitialized = stats.companyCount > 0;
      const needsAdminSetup = stats.companyCount > 0 && stats.userCount === 0;
      
      // If we need admin setup, include the pending company info
      let pendingCompany = null;
      if (needsAdminSetup) {
        const companies = await storage.getCompanies();
        if (companies.length > 0) {
          const company = companies[0];
          pendingCompany = {
            id: company.id,
            code: company.code,
            name: company.name,
          };
        }
      }
      
      res.json({
        isInitialized,
        needsCompanySetup: stats.companyCount === 0,
        needsAdminSetup,
        pendingCompany,
        stats,
      });
    } catch (error) {
      console.error("Setup status error:", error);
      res.status(500).json({ error: "Failed to get setup status" });
    }
  });

  // Setup company - Create the first company (only when no companies exist)
  const setupCompanySchema = z.object({
    code: z.string().min(2).max(20).regex(/^[A-Z0-9-]+$/, "Code must be uppercase alphanumeric with dashes"),
    name: z.string().min(2).max(100),
    legalName: z.string().optional(),
    taxId: z.string().optional(),
    companyType: z.enum(["holding", "subsidiary", "branch"]),
    currency: z.string().length(3).default("USD"),
    timezone: z.string().default("UTC"),
    locale: z.string().default("en-US"),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().length(2).optional(),
    postalCode: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    website: z.string().url().optional(),
  });

  app.post("/api/setup/company", async (req: Request, res: Response) => {
    try {
      // Only allow if no companies exist
      const stats = await storage.getSystemStats();
      if (stats.companyCount > 0) {
        return res.status(400).json({ 
          error: "System is already initialized. Cannot create initial company." 
        });
      }

      const parsed = setupCompanySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid company data", 
          details: parsed.error.errors 
        });
      }

      const data = parsed.data;

      // First company must be a holding company (level 1)
      if (data.companyType !== "holding") {
        return res.status(400).json({ 
          error: "The first company must be a Holding company (top level of hierarchy)" 
        });
      }

      // Create the holding company (level and path are auto-calculated by storage)
      const company = await storage.createCompany({
        code: data.code,
        name: data.name,
        legalName: data.legalName || data.name,
        taxId: data.taxId,
        parentId: null,
        companyType: "holding",
        currency: data.currency,
        locale: data.locale,
        timezone: data.timezone,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode,
        phone: data.phone,
        email: data.email,
        website: data.website,
        consolidationEnabled: true,
        isActive: true,
      });

      // Create default company settings
      await storage.createCompanySettings({
        companyId: company.id,
        fiscalYearStart: 1,
        fiscalYearEnd: 12,
        defaultPaymentTerms: 30,
        inventoryCostingMethod: "fifo",
        multiCurrencyEnabled: false,
        intercompanyEnabled: true,
        autoPostIntercompany: false,
      });

      res.status(201).json({
        success: true,
        company: {
          id: company.id,
          code: company.code,
          name: company.name,
          companyType: company.companyType,
          level: company.level,
        },
        nextStep: "Create the first Super Admin account",
      });
    } catch (error) {
      console.error("Setup company error:", error);
      res.status(500).json({ error: "Failed to create company" });
    }
  });

  // Setup admin - Create the first Super Admin (only when company exists but no users)
  const setupAdminSchema = z.object({
    companyId: z.string().uuid(),
    username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9._-]+$/, "Username must be alphanumeric with ._-"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    email: z.string().email(),
    fullName: z.string().min(2).max(100),
  });

  app.post("/api/setup/admin", async (req: Request, res: Response) => {
    try {
      // Only allow if company exists but no users
      const stats = await storage.getSystemStats();
      if (stats.companyCount === 0) {
        return res.status(400).json({ 
          error: "Create a company first before creating the admin account" 
        });
      }
      if (stats.userCount > 0) {
        return res.status(400).json({ 
          error: "Admin account already exists. Use login instead." 
        });
      }

      const parsed = setupAdminSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid admin data", 
          details: parsed.error.errors 
        });
      }

      const data = parsed.data;

      // Verify company exists
      const company = await storage.getCompany(data.companyId);
      if (!company) {
        return res.status(400).json({ error: "Invalid company ID" });
      }

      // Check if username is taken
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already taken" });
      }

      // Get or create Super Admin role
      let adminRole = await storage.getRoleByCode("SUPER_ADMIN");
      if (!adminRole) {
        adminRole = await storage.getRoleByCode("ADMIN");
      }
      if (!adminRole) {
        // Create SUPER_ADMIN role if it doesn't exist
        adminRole = await storage.createRole({
          code: "SUPER_ADMIN",
          name: "Super Administrator",
          description: "Full system access with all permissions",
          isSystemRole: true,
          permissions: ["*"],
        });
      }

      // Create the admin user (password will be hashed by storage layer)
      const user = await storage.createUser({
        username: data.username,
        password: data.password,
        email: data.email,
        fullName: data.fullName,
      });

      // Set the user's default company
      await storage.updateUser(user.id, { defaultCompanyId: company.id });

      // Assign user to company with admin role
      await storage.assignUserToCompany({
        userId: user.id,
        companyId: company.id,
        roleId: adminRole.id,
        isActive: true,
        isDefault: true,
      });

      // Log the setup event
      await storage.createAuthAuditLog({
        userId: user.id,
        eventType: "setup_complete",
        companyId: company.id,
        ipAddress: req.ip || req.socket.remoteAddress,
        deviceInfo: req.headers["user-agent"],
        success: true,
        metadata: { action: "first_admin_created" },
      });

      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
        },
        company: {
          id: company.id,
          code: company.code,
          name: company.name,
        },
        role: {
          id: adminRole.id,
          name: adminRole.name,
        },
        message: "Setup complete! You can now log in with your credentials.",
      });
    } catch (error) {
      console.error("Setup admin error:", error);
      res.status(500).json({ error: "Failed to create admin account" });
    }
  });

  // ============================================================================
  // COMPANY MANAGEMENT
  // ============================================================================

  // Get all companies (for company switcher)
  app.get("/api/companies", async (req: CompanyRequest, res) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  // Get company hierarchy - PUBLIC (must come before /:id route)
  app.get("/api/companies/hierarchy", async (req: CompanyRequest, res) => {
    try {
      const rootId = req.query.rootId as string | undefined;
      const hierarchy = await storage.getCompanyHierarchy(rootId);
      res.json(hierarchy);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch company hierarchy" });
    }
  });

  // Get single company (must come after /hierarchy)
  app.get("/api/companies/:id", async (req: CompanyRequest, res) => {
    try {
      const company = await storage.getCompany(req.params.id);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch company" });
    }
  });

  // Create company
  app.post("/api/companies", async (req: CompanyRequest, res) => {
    try {
      const parsed = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(parsed);
      res.status(201).json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create company" });
    }
  });

  // Update company
  app.patch("/api/companies/:id", async (req: CompanyRequest, res) => {
    try {
      const company = await storage.updateCompany(req.params.id, req.body);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      res.status(500).json({ error: "Failed to update company" });
    }
  });

  // Get child companies
  app.get("/api/companies/:id/children", async (req: CompanyRequest, res) => {
    try {
      const children = await storage.getChildCompanies(req.params.id);
      res.json(children);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch child companies" });
    }
  });

  // ============================================================================
  // COMPANY CONTEXT & SESSION
  // ============================================================================

  // Get user's companies
  app.get("/api/users/:userId/companies", async (req: CompanyRequest, res) => {
    try {
      const companies = await storage.getUserCompanies(req.params.userId);
      res.json(companies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user companies" });
    }
  });

  // Switch company (get new context)
  app.post("/api/session/switch-company", async (req: CompanyRequest, res) => {
    try {
      const { userId, companyId } = req.body;
      if (!userId || !companyId) {
        return res.status(400).json({ error: "userId and companyId required" });
      }

      const context = await storage.getCompanyContext(userId, companyId);
      if (!context) {
        return res.status(403).json({ error: "User does not have access to this company" });
      }

      // Update user's default company
      await storage.updateUser(userId, { defaultCompanyId: companyId });

      res.json(context);
    } catch (error) {
      res.status(500).json({ error: "Failed to switch company" });
    }
  });

  // Get current company context
  app.get("/api/session/context", async (req: CompanyRequest, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      const companyId = req.headers["x-company-id"] as string;

      if (!userId || !companyId) {
        return res.status(400).json({ error: "x-user-id and x-company-id headers required" });
      }

      const context = await storage.getCompanyContext(userId, companyId);
      if (!context) {
        return res.status(403).json({ error: "Invalid context" });
      }

      res.json(context);
    } catch (error) {
      res.status(500).json({ error: "Failed to get context" });
    }
  });

  // ============================================================================
  // USER-COMPANY ROLE MANAGEMENT
  // ============================================================================

  // Get roles
  app.get("/api/roles", async (req: CompanyRequest, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch roles" });
    }
  });

  // Assign user to company
  app.post("/api/user-company-roles", async (req: CompanyRequest, res) => {
    try {
      const parsed = insertUserCompanyRoleSchema.parse(req.body);
      const assignment = await storage.assignUserToCompany(parsed);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to assign user to company" });
    }
  });

  // Remove user from company
  app.delete("/api/user-company-roles/:userId/:companyId", async (req: CompanyRequest, res) => {
    try {
      await storage.removeUserFromCompany(req.params.userId, req.params.companyId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove user from company" });
    }
  });

  // ============================================================================
  // COMPANY-SCOPED MASTER DATA
  // ============================================================================

  // Chart of Accounts
  app.get("/api/companies/:companyId/accounts", async (req: CompanyRequest, res) => {
    try {
      const accounts = await storage.getAccounts(req.params.companyId);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch accounts" });
    }
  });

  app.post("/api/companies/:companyId/accounts", async (req: CompanyRequest, res) => {
    try {
      const parsed = insertAccountSchema.parse({
        ...req.body,
        companyId: req.params.companyId,
      });
      const account = await storage.createAccount(parsed);
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.patch("/api/companies/:companyId/accounts/:accountId", async (req: CompanyRequest, res) => {
    try {
      const account = await storage.getAccount(req.params.accountId);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      if (account.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Account does not belong to this company" });
      }
      // Sanitize: remove ownership fields from update payload to prevent cross-company tampering
      const { companyId, id, ...sanitizedUpdates } = req.body;
      const updated = await storage.updateAccount(req.params.accountId, sanitizedUpdates);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update account" });
    }
  });

  app.delete("/api/companies/:companyId/accounts/:accountId", async (req: CompanyRequest, res) => {
    try {
      const account = await storage.getAccount(req.params.accountId);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      if (account.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Account does not belong to this company" });
      }
      const deleted = await storage.deleteAccount(req.params.accountId);
      if (!deleted) {
        return res.status(400).json({ error: "Cannot delete account with child accounts" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // Warehouses
  app.get("/api/companies/:companyId/warehouses", async (req: CompanyRequest, res) => {
    try {
      const warehouses = await storage.getWarehouses(req.params.companyId);
      res.json(warehouses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch warehouses" });
    }
  });

  app.post("/api/companies/:companyId/warehouses", async (req: CompanyRequest, res) => {
    try {
      const parsed = insertWarehouseSchema.parse({
        ...req.body,
        companyId: req.params.companyId,
      });
      const warehouse = await storage.createWarehouse(parsed);
      res.status(201).json(warehouse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create warehouse" });
    }
  });

  app.patch("/api/companies/:companyId/warehouses/:warehouseId", async (req: CompanyRequest, res) => {
    try {
      const warehouse = await storage.getWarehouse(req.params.warehouseId);
      if (!warehouse) {
        return res.status(404).json({ error: "Warehouse not found" });
      }
      if (warehouse.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Warehouse does not belong to this company" });
      }
      // Sanitize: remove ownership fields from update payload to prevent cross-company tampering
      const { companyId, id, ...sanitizedUpdates } = req.body;
      const updated = await storage.updateWarehouse(req.params.warehouseId, sanitizedUpdates);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update warehouse" });
    }
  });

  app.delete("/api/companies/:companyId/warehouses/:warehouseId", async (req: CompanyRequest, res) => {
    try {
      const warehouse = await storage.getWarehouse(req.params.warehouseId);
      if (!warehouse) {
        return res.status(404).json({ error: "Warehouse not found" });
      }
      if (warehouse.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Warehouse does not belong to this company" });
      }
      await storage.deleteWarehouse(req.params.warehouseId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete warehouse" });
    }
  });

  // Products
  app.get("/api/companies/:companyId/products", async (req: CompanyRequest, res) => {
    try {
      const products = await storage.getProducts(req.params.companyId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/companies/:companyId/products", async (req: CompanyRequest, res) => {
    try {
      const parsed = insertProductSchema.parse({
        ...req.body,
        companyId: req.params.companyId,
      });
      const product = await storage.createProduct(parsed);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.patch("/api/companies/:companyId/products/:productId", async (req: CompanyRequest, res) => {
    try {
      const product = await storage.getProduct(req.params.productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      if (product.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Product does not belong to this company" });
      }
      // Sanitize: remove ownership fields from update payload to prevent cross-company tampering
      const { companyId, id, ...sanitizedUpdates } = req.body;
      const updated = await storage.updateProduct(req.params.productId, sanitizedUpdates);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/companies/:companyId/products/:productId", async (req: CompanyRequest, res) => {
    try {
      const product = await storage.getProduct(req.params.productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      if (product.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Product does not belong to this company" });
      }
      await storage.deleteProduct(req.params.productId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Customers
  app.get("/api/companies/:companyId/customers", async (req: CompanyRequest, res) => {
    try {
      const customers = await storage.getCustomers(req.params.companyId);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.post("/api/companies/:companyId/customers", async (req: CompanyRequest, res) => {
    try {
      const parsed = insertCustomerSchema.parse({
        ...req.body,
        companyId: req.params.companyId,
      });
      const customer = await storage.createCustomer(parsed);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create customer" });
    }
  });

  app.patch("/api/companies/:companyId/customers/:customerId", async (req: CompanyRequest, res) => {
    try {
      const customer = await storage.getCustomer(req.params.customerId);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      if (customer.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Customer does not belong to this company" });
      }
      // Sanitize: remove ownership fields from update payload to prevent cross-company tampering
      const { companyId, id, ...sanitizedUpdates } = req.body;
      const updated = await storage.updateCustomer(req.params.customerId, sanitizedUpdates);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update customer" });
    }
  });

  app.delete("/api/companies/:companyId/customers/:customerId", async (req: CompanyRequest, res) => {
    try {
      const customer = await storage.getCustomer(req.params.customerId);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      if (customer.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Customer does not belong to this company" });
      }
      await storage.deleteCustomer(req.params.customerId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete customer" });
    }
  });

  // Vendors
  app.get("/api/companies/:companyId/vendors", async (req: CompanyRequest, res) => {
    try {
      const vendors = await storage.getVendors(req.params.companyId);
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendors" });
    }
  });

  app.post("/api/companies/:companyId/vendors", async (req: CompanyRequest, res) => {
    try {
      const parsed = insertVendorSchema.parse({
        ...req.body,
        companyId: req.params.companyId,
      });
      const vendor = await storage.createVendor(parsed);
      res.status(201).json(vendor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create vendor" });
    }
  });

  app.patch("/api/companies/:companyId/vendors/:vendorId", async (req: CompanyRequest, res) => {
    try {
      const vendor = await storage.getVendor(req.params.vendorId);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      if (vendor.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Vendor does not belong to this company" });
      }
      // Sanitize: remove ownership fields from update payload to prevent cross-company tampering
      const { companyId, id, ...sanitizedUpdates } = req.body;
      const updated = await storage.updateVendor(req.params.vendorId, sanitizedUpdates);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update vendor" });
    }
  });

  app.delete("/api/companies/:companyId/vendors/:vendorId", async (req: CompanyRequest, res) => {
    try {
      const vendor = await storage.getVendor(req.params.vendorId);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      if (vendor.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Vendor does not belong to this company" });
      }
      await storage.deleteVendor(req.params.vendorId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete vendor" });
    }
  });

  // Taxes
  app.get("/api/companies/:companyId/taxes", async (req: CompanyRequest, res) => {
    try {
      const taxes = await storage.getTaxes(req.params.companyId);
      res.json(taxes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch taxes" });
    }
  });

  app.post("/api/companies/:companyId/taxes", async (req: CompanyRequest, res) => {
    try {
      const parsed = insertTaxSchema.parse({
        ...req.body,
        companyId: req.params.companyId,
      });
      const tax = await storage.createTax(parsed);
      res.status(201).json(tax);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create tax" });
    }
  });

  app.patch("/api/companies/:companyId/taxes/:taxId", async (req: CompanyRequest, res) => {
    try {
      const tax = await storage.getTax(req.params.taxId);
      if (!tax) {
        return res.status(404).json({ error: "Tax not found" });
      }
      if (tax.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Tax belongs to different company" });
      }
      // Sanitize: remove ownership fields from update payload to prevent cross-company tampering
      const { companyId, id, ...sanitizedUpdates } = req.body;
      const updated = await storage.updateTax(req.params.taxId, sanitizedUpdates);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update tax" });
    }
  });

  app.delete("/api/companies/:companyId/taxes/:taxId", async (req: CompanyRequest, res) => {
    try {
      const tax = await storage.getTax(req.params.taxId);
      if (!tax) {
        return res.status(404).json({ error: "Tax not found" });
      }
      if (tax.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Tax belongs to different company" });
      }
      await storage.deleteTax(req.params.taxId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete tax" });
    }
  });

  // Employees
  app.get("/api/companies/:companyId/employees", async (req: CompanyRequest, res) => {
    try {
      const employees = await storage.getEmployees(req.params.companyId);
      res.json(employees);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  });

  app.post("/api/companies/:companyId/employees", async (req: CompanyRequest, res) => {
    try {
      const parsed = insertEmployeeSchema.parse({
        ...req.body,
        companyId: req.params.companyId,
      });
      const employee = await storage.createEmployee(parsed);
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create employee" });
    }
  });

  app.patch("/api/companies/:companyId/employees/:employeeId", async (req: CompanyRequest, res) => {
    try {
      const employee = await storage.getEmployee(req.params.employeeId);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      if (employee.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Employee belongs to different company" });
      }
      // Sanitize: remove ownership fields from update payload to prevent cross-company tampering
      const { companyId, id, employeeNumber, ...sanitizedUpdates } = req.body;
      const updated = await storage.updateEmployee(req.params.employeeId, sanitizedUpdates);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update employee" });
    }
  });

  app.delete("/api/companies/:companyId/employees/:employeeId", async (req: CompanyRequest, res) => {
    try {
      const employee = await storage.getEmployee(req.params.employeeId);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      if (employee.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Employee belongs to different company" });
      }
      await storage.deleteEmployee(req.params.employeeId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete employee" });
    }
  });

  // Journal Entries
  app.get("/api/companies/:companyId/journal-entries", async (req: CompanyRequest, res) => {
    try {
      const entries = await storage.getJournalEntries(req.params.companyId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch journal entries" });
    }
  });

  app.post("/api/companies/:companyId/journal-entries", async (req: CompanyRequest, res) => {
    try {
      const parsed = insertJournalEntrySchema.parse({
        ...req.body,
        companyId: req.params.companyId,
      });
      const entry = await storage.createJournalEntry(parsed);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create journal entry" });
    }
  });

  app.patch("/api/companies/:companyId/journal-entries/:entryId", async (req: CompanyRequest, res) => {
    try {
      const entry = await storage.getJournalEntry(req.params.entryId);
      if (!entry) {
        return res.status(404).json({ error: "Journal entry not found" });
      }
      if (entry.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Journal entry belongs to different company" });
      }
      // Sanitize: remove ownership fields from update payload to prevent cross-company tampering
      const { companyId, id, createdAt, ...sanitizedUpdates } = req.body;
      const updated = await storage.updateJournalEntry(req.params.entryId, sanitizedUpdates);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update journal entry" });
    }
  });

  app.delete("/api/companies/:companyId/journal-entries/:entryId", async (req: CompanyRequest, res) => {
    try {
      const entry = await storage.getJournalEntry(req.params.entryId);
      if (!entry) {
        return res.status(404).json({ error: "Journal entry not found" });
      }
      if (entry.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Journal entry belongs to different company" });
      }
      await storage.deleteJournalEntry(req.params.entryId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete journal entry" });
    }
  });

  // Fiscal Periods
  app.get("/api/companies/:companyId/fiscal-periods", async (req: CompanyRequest, res) => {
    try {
      const periods = await storage.getFiscalPeriods(req.params.companyId);
      res.json(periods);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch fiscal periods" });
    }
  });

  app.post("/api/companies/:companyId/fiscal-periods", async (req: CompanyRequest, res) => {
    try {
      const parsed = insertFiscalPeriodSchema.parse({
        ...req.body,
        companyId: req.params.companyId,
      });
      const period = await storage.createFiscalPeriod(parsed);
      res.status(201).json(period);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create fiscal period" });
    }
  });

  // ============================================================================
  // TRANSACTIONS (COMPANY-SCOPED)
  // ============================================================================

  // Sales Orders
  app.get("/api/companies/:companyId/sales-orders", async (req: CompanyRequest, res) => {
    try {
      const orders = await storage.getSalesOrders(req.params.companyId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sales orders" });
    }
  });

  app.post("/api/companies/:companyId/sales-orders", async (req: CompanyRequest, res) => {
    try {
      const parsed = insertSalesOrderSchema.parse({
        ...req.body,
        companyId: req.params.companyId,
      });
      const order = await storage.createSalesOrder(parsed);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create sales order" });
    }
  });

  app.patch("/api/companies/:companyId/sales-orders/:orderId", async (req: CompanyRequest, res) => {
    try {
      const order = await storage.getSalesOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Sales order not found" });
      }
      if (order.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Order belongs to different company" });
      }
      // Sanitize: remove ownership fields from update payload to prevent cross-company tampering
      const { companyId, id, orderNumber, ...sanitizedUpdates } = req.body;
      const updated = await storage.updateSalesOrder(req.params.orderId, sanitizedUpdates);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update sales order" });
    }
  });

  app.delete("/api/companies/:companyId/sales-orders/:orderId", async (req: CompanyRequest, res) => {
    try {
      const order = await storage.getSalesOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Sales order not found" });
      }
      if (order.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Order belongs to different company" });
      }
      await storage.deleteSalesOrder(req.params.orderId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete sales order" });
    }
  });

  app.get("/api/companies/:companyId/sales-orders/:orderId/lines", async (req: CompanyRequest, res) => {
    try {
      const order = await storage.getSalesOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Sales order not found" });
      }
      if (order.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Order belongs to different company" });
      }
      const lines = await storage.getSalesOrderLines(req.params.orderId);
      res.json(lines);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sales order lines" });
    }
  });

  // Purchase Orders
  app.get("/api/companies/:companyId/purchase-orders", async (req: CompanyRequest, res) => {
    try {
      const orders = await storage.getPurchaseOrders(req.params.companyId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch purchase orders" });
    }
  });

  app.post("/api/companies/:companyId/purchase-orders", async (req: CompanyRequest, res) => {
    try {
      const parsed = insertPurchaseOrderSchema.parse({
        ...req.body,
        companyId: req.params.companyId,
      });
      const order = await storage.createPurchaseOrder(parsed);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create purchase order" });
    }
  });

  app.patch("/api/companies/:companyId/purchase-orders/:orderId", async (req: CompanyRequest, res) => {
    try {
      const order = await storage.getPurchaseOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Purchase order not found" });
      }
      if (order.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Order belongs to different company" });
      }
      // Sanitize: remove ownership fields from update payload to prevent cross-company tampering
      const { companyId, id, orderNumber, ...sanitizedUpdates } = req.body;
      const updated = await storage.updatePurchaseOrder(req.params.orderId, sanitizedUpdates);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update purchase order" });
    }
  });

  app.delete("/api/companies/:companyId/purchase-orders/:orderId", async (req: CompanyRequest, res) => {
    try {
      const order = await storage.getPurchaseOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Purchase order not found" });
      }
      if (order.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Order belongs to different company" });
      }
      await storage.deletePurchaseOrder(req.params.orderId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete purchase order" });
    }
  });

  app.get("/api/companies/:companyId/purchase-orders/:orderId/lines", async (req: CompanyRequest, res) => {
    try {
      const order = await storage.getPurchaseOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Purchase order not found" });
      }
      if (order.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Order belongs to different company" });
      }
      const lines = await storage.getPurchaseOrderLines(req.params.orderId);
      res.json(lines);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch purchase order lines" });
    }
  });

  // ============================================================================
  // WORKFLOW ACTIONS - SALES ORDER LIFECYCLE
  // ============================================================================

  // Confirm Sales Order - reserves stock
  app.post("/api/companies/:companyId/sales-orders/:orderId/confirm", async (req: CompanyRequest, res) => {
    try {
      const { workflowService } = await import("./services/workflow-service");
      const order = await storage.getSalesOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Sales order not found" });
      }
      if (order.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Order belongs to different company" });
      }
      const result = await workflowService.confirmSalesOrder(
        req.params.orderId,
        req.userId || ""
      );
      res.json({
        success: true,
        message: "Sales order confirmed and stock reserved",
        salesOrder: result.salesOrder,
        reservations: result.reservations
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to confirm sales order" });
    }
  });

  // Deliver Sales Order - reduces stock, creates delivery note
  app.post("/api/companies/:companyId/sales-orders/:orderId/deliver", async (req: CompanyRequest, res) => {
    try {
      const { workflowService } = await import("./services/workflow-service");
      const order = await storage.getSalesOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Sales order not found" });
      }
      if (order.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Order belongs to different company" });
      }
      const result = await workflowService.createDeliveryFromSalesOrder(
        req.params.orderId,
        req.userId || ""
      );
      res.json({
        success: true,
        message: "Delivery created and inventory updated",
        delivery: result.delivery,
        deliveryLines: result.deliveryLines,
        stockMovements: result.stockMovements,
        journalEntry: result.journalEntry
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create delivery" });
    }
  });

  // Invoice Sales Order - creates AR invoice
  app.post("/api/companies/:companyId/sales-orders/:orderId/invoice", async (req: CompanyRequest, res) => {
    try {
      const { workflowService } = await import("./services/workflow-service");
      const order = await storage.getSalesOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Sales order not found" });
      }
      if (order.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Order belongs to different company" });
      }
      const result = await workflowService.createInvoiceFromSalesOrder(
        req.params.orderId,
        req.userId || ""
      );
      res.json({
        success: true,
        message: "Invoice created and AR updated",
        invoice: result.invoice,
        invoiceLines: result.invoiceLines,
        journalEntry: result.journalEntry,
        arLedgerEntry: result.arLedgerEntry
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create invoice" });
    }
  });

  // ============================================================================
  // WORKFLOW ACTIONS - PURCHASE ORDER LIFECYCLE
  // ============================================================================

  // Confirm Purchase Order
  app.post("/api/companies/:companyId/purchase-orders/:orderId/confirm", async (req: CompanyRequest, res) => {
    try {
      const { workflowService } = await import("./services/workflow-service");
      const order = await storage.getPurchaseOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Purchase order not found" });
      }
      if (order.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Order belongs to different company" });
      }
      const result = await workflowService.confirmPurchaseOrder(
        req.params.orderId,
        req.userId || ""
      );
      res.json({
        success: true,
        message: "Purchase order confirmed",
        purchaseOrder: result
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to confirm purchase order" });
    }
  });

  // Receive Goods from Purchase Order - increases stock
  app.post("/api/companies/:companyId/purchase-orders/:orderId/receive", async (req: CompanyRequest, res) => {
    try {
      const { workflowService } = await import("./services/workflow-service");
      const order = await storage.getPurchaseOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Purchase order not found" });
      }
      if (order.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Order belongs to different company" });
      }
      const result = await workflowService.receiveGoodsFromPurchaseOrder(
        req.params.orderId,
        req.userId || ""
      );
      res.json({
        success: true,
        message: "Goods received and inventory updated",
        goodsReceipt: result.goodsReceipt,
        goodsReceiptLines: result.goodsReceiptLines,
        stockMovements: result.stockMovements,
        journalEntry: result.journalEntry
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to receive goods" });
    }
  });

  // Bill Purchase Order - creates AP invoice
  app.post("/api/companies/:companyId/purchase-orders/:orderId/bill", async (req: CompanyRequest, res) => {
    try {
      const { workflowService } = await import("./services/workflow-service");
      const order = await storage.getPurchaseOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Purchase order not found" });
      }
      if (order.companyId !== req.params.companyId) {
        return res.status(403).json({ error: "Order belongs to different company" });
      }
      const result = await workflowService.createVendorInvoice(
        req.params.orderId,
        req.userId || ""
      );
      res.json({
        success: true,
        message: "Vendor invoice created and AP updated",
        invoice: result.invoice,
        invoiceLines: result.invoiceLines,
        journalEntry: result.journalEntry,
        apLedgerEntry: result.apLedgerEntry
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create vendor invoice" });
    }
  });

  // ============================================================================
  // WORKFLOW ACTIONS - PAYMENTS
  // ============================================================================

  // Receive Customer Payment
  app.post("/api/companies/:companyId/payments/receive", async (req: CompanyRequest, res) => {
    try {
      const { workflowService } = await import("./services/workflow-service");
      const { customerId, invoiceIds, amount, paymentMethod, bankAccountId } = req.body;
      
      if (!customerId || !amount) {
        return res.status(400).json({ error: "Customer ID and amount are required" });
      }

      const result = await workflowService.receivePayment(
        req.params.companyId,
        customerId,
        invoiceIds || [],
        parseFloat(amount),
        paymentMethod || "bank_transfer",
        bankAccountId || "",
        req.userId || ""
      );
      res.json({
        success: true,
        message: "Payment received and AR updated",
        payment: result.payment,
        applications: result.applications,
        journalEntry: result.journalEntry,
        arLedgerEntry: result.arLedgerEntry
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to receive payment" });
    }
  });

  // Make Vendor Payment
  app.post("/api/companies/:companyId/payments/pay", async (req: CompanyRequest, res) => {
    try {
      const { workflowService } = await import("./services/workflow-service");
      const { vendorId, invoiceIds, amount, paymentMethod, bankAccountId } = req.body;
      
      if (!vendorId || !amount) {
        return res.status(400).json({ error: "Vendor ID and amount are required" });
      }

      const result = await workflowService.makeVendorPayment(
        req.params.companyId,
        vendorId,
        invoiceIds || [],
        parseFloat(amount),
        paymentMethod || "bank_transfer",
        bankAccountId || "",
        req.userId || ""
      );
      res.json({
        success: true,
        message: "Payment made and AP updated",
        payment: result.payment,
        applications: result.applications,
        journalEntry: result.journalEntry,
        apLedgerEntry: result.apLedgerEntry
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to make payment" });
    }
  });

  // ============================================================================
  // STOCK LEVELS & INVENTORY QUERIES
  // ============================================================================

  // Get stock levels for a company
  app.get("/api/companies/:companyId/stock-levels", async (req: CompanyRequest, res) => {
    try {
      const stockLevels = await storage.getStockLevels(req.params.companyId);
      res.json(stockLevels);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock levels" });
    }
  });

  // Get stock movements for a company
  app.get("/api/companies/:companyId/stock-movements", async (req: CompanyRequest, res) => {
    try {
      const movements = await storage.getStockMovements(req.params.companyId);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock movements" });
    }
  });

  // Get invoices for a company
  app.get("/api/companies/:companyId/invoices", async (req: CompanyRequest, res) => {
    try {
      const invoices = await storage.getInvoices(req.params.companyId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  // Get deliveries for a company
  app.get("/api/companies/:companyId/deliveries", async (req: CompanyRequest, res) => {
    try {
      const deliveries = await storage.getDeliveries(req.params.companyId);
      res.json(deliveries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deliveries" });
    }
  });

  // Get goods receipts for a company
  app.get("/api/companies/:companyId/goods-receipts", async (req: CompanyRequest, res) => {
    try {
      const receipts = await storage.getGoodsReceipts(req.params.companyId);
      res.json(receipts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goods receipts" });
    }
  });

  // Get payments for a company
  app.get("/api/companies/:companyId/payments", async (req: CompanyRequest, res) => {
    try {
      const payments = await storage.getPayments(req.params.companyId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  // Get AR/AP ledger entries
  app.get("/api/companies/:companyId/ledger/:ledgerType", async (req: CompanyRequest, res) => {
    try {
      const { ledgerType } = req.params;
      if (!["AR", "AP"].includes(ledgerType)) {
        return res.status(400).json({ error: "Ledger type must be AR or AP" });
      }
      const entries = await storage.getArApLedger(req.params.companyId, ledgerType);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ledger entries" });
    }
  });

  // ============================================================================
  // INTERCOMPANY TRANSACTIONS
  // ============================================================================

  // Get intercompany transfers
  app.get("/api/companies/:companyId/intercompany-transfers", async (req: CompanyRequest, res) => {
    try {
      const transfers = await storage.getIntercompanyTransfers(req.params.companyId);
      res.json(transfers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch intercompany transfers" });
    }
  });

  // Create intercompany transfer
  app.post("/api/companies/:companyId/intercompany-transfers", async (req: CompanyRequest, res) => {
    try {
      const transfer = await storage.createIntercompanyTransfer({
        ...req.body,
        sourceCompanyId: req.params.companyId,
      });
      res.status(201).json(transfer);
    } catch (error) {
      res.status(500).json({ error: "Failed to create intercompany transfer" });
    }
  });

  // Update intercompany transfer status
  app.patch("/api/intercompany-transfers/:id", async (req: CompanyRequest, res) => {
    try {
      const transfer = await storage.updateIntercompanyTransfer(req.params.id, req.body);
      if (!transfer) {
        return res.status(404).json({ error: "Transfer not found" });
      }
      res.json(transfer);
    } catch (error) {
      res.status(500).json({ error: "Failed to update intercompany transfer" });
    }
  });

  // Get single intercompany transfer
  app.get("/api/intercompany-transfers/:id", async (req: CompanyRequest, res) => {
    try {
      const transfer = await storage.getIntercompanyTransfer(req.params.id);
      if (!transfer) {
        return res.status(404).json({ error: "Transfer not found" });
      }
      res.json(transfer);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch intercompany transfer" });
    }
  });

  // ============================================================================
  // CONSOLIDATION ENDPOINTS
  // ============================================================================

  // Get consolidated trial balance for a company and its subsidiaries
  app.get("/api/companies/:companyId/consolidation/trial-balance", async (req: CompanyRequest, res) => {
    try {
      const companyId = req.params.companyId;
      const period = req.query.period as string;
      
      // Get all subsidiaries of this company
      const subsidiaries = await storage.getCompanyHierarchy(companyId);
      
      // Get accounts for each company
      const accountsByCompany: Record<string, Account[]> = {};
      
      const company = await storage.getCompany(companyId);
      if (company) {
        const accounts = await storage.getAccounts(companyId);
        accountsByCompany[companyId] = accounts;
      }
      
      // Recursively collect accounts from subsidiaries
      const collectAccounts = async (nodes: CompanyHierarchyNode[]) => {
        for (const node of nodes) {
          const accounts = await storage.getAccounts(node.company.id);
          accountsByCompany[node.company.id] = accounts;
          if (node.children && node.children.length > 0) {
            await collectAccounts(node.children);
          }
        }
      };
      
      await collectAccounts(subsidiaries);
      
      res.json({
        period,
        accountsByCompany,
        companies: [company, ...subsidiaries.flatMap(s => [s.company])],
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch consolidated trial balance" });
    }
  });

  // Get elimination entries for consolidation
  app.get("/api/companies/:companyId/consolidation/eliminations", async (req: CompanyRequest, res) => {
    try {
      // Get intercompany transfers that need elimination
      const transfers = await storage.getIntercompanyTransfers(req.params.companyId);
      
      // Generate elimination entries based on completed stock transfers
      const eliminations = transfers
        .filter(t => t.status === "completed")
        .map(t => ({
          id: `elim-${t.id}`,
          transferId: t.id,
          type: "stock_transfer", // Intercompany stock transfers
          amount: t.totalValue || "0",
          sourceCompanyId: t.sourceCompanyId,
          targetCompanyId: t.targetCompanyId,
          description: `Eliminate IC Stock Transfer: ${t.notes || t.transferNumber}`,
        }));
      
      res.json(eliminations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch elimination entries" });
    }
  });

  return httpServer;
}
