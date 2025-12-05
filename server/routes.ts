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
  insertFiscalPeriodSchema,
  type CompanyContext,
  type Account,
  type CompanyHierarchyNode,
} from "@shared/schema";
import { z } from "zod";

// Middleware to extract company context from headers
interface CompanyRequest extends Request {
  companyContext?: CompanyContext;
  activeCompanyId?: string;
  userId?: string;
}

// Public routes that don't require company context
const publicRoutes = [
  "/api/companies",
  "/api/companies/hierarchy", 
  "/api/session/context",
  "/api/session/switch-company",
  "/api/roles",
];

async function companyContextMiddleware(
  req: CompanyRequest, 
  res: Response, 
  next: NextFunction
) {
  const userId = req.headers["x-user-id"] as string;
  const companyId = req.headers["x-company-id"] as string;

  // Check if this is a public route (allow without auth for demo)
  const isPublicRoute = publicRoutes.some(route => 
    req.path === route || req.path.startsWith(route + "/")
  );

  if (userId && companyId) {
    const context = await storage.getCompanyContext(userId, companyId);
    if (context) {
      req.companyContext = context;
      req.activeCompanyId = companyId;
      req.userId = userId;
    } else if (!isPublicRoute) {
      return res.status(403).json({ 
        error: "Access denied: User does not have access to this company" 
      });
    }
  } else if (!isPublicRoute) {
    // For demo purposes, set default user context if not provided
    // In production, this would return 401
    const defaultContext = await storage.getCompanyContext("user-admin", "comp-holding");
    if (defaultContext) {
      req.companyContext = defaultContext;
      req.activeCompanyId = "comp-holding";
      req.userId = "user-admin";
    }
  }
  next();
}

// Middleware to verify company access for company-scoped routes
function verifyCompanyAccess(
  req: CompanyRequest,
  res: Response,
  next: NextFunction
) {
  const urlCompanyId = req.params.companyId;
  
  // If route has companyId param, verify access
  if (urlCompanyId && req.companyContext) {
    const hasAccess = req.companyContext.userCompanies.some(c => c.id === urlCompanyId);
    if (!hasAccess) {
      return res.status(403).json({
        error: "Access denied: You do not have access to this company's data"
      });
    }
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Apply company context middleware to all /api routes
  app.use("/api", companyContextMiddleware);
  
  // Apply company access verification to company-scoped routes
  app.use("/api/companies/:companyId", verifyCompanyAccess);

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

  // Get company hierarchy
  app.get("/api/companies/hierarchy", async (req: CompanyRequest, res) => {
    try {
      const rootId = req.query.rootId as string | undefined;
      const hierarchy = await storage.getCompanyHierarchy(rootId);
      res.json(hierarchy);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch company hierarchy" });
    }
  });

  // Get single company
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

  // Purchase Orders
  app.get("/api/companies/:companyId/purchase-orders", async (req: CompanyRequest, res) => {
    try {
      const orders = await storage.getPurchaseOrders(req.params.companyId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch purchase orders" });
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
      
      // Generate elimination entries based on transfers
      const eliminations = transfers
        .filter(t => t.status === "completed")
        .map(t => ({
          id: `elim-${t.id}`,
          transferId: t.id,
          type: t.transferType,
          amount: t.amount,
          sourceCompanyId: t.sourceCompanyId,
          targetCompanyId: t.targetCompanyId,
          description: `Eliminate IC ${t.transferType}: ${t.description}`,
        }));
      
      res.json(eliminations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch elimination entries" });
    }
  });

  return httpServer;
}
