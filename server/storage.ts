import { 
  type User, type InsertUser,
  type Company, type InsertCompany,
  type CompanySettings, type InsertCompanySettings,
  type FiscalPeriod, type InsertFiscalPeriod,
  type Role, type InsertRole,
  type UserCompanyRole, type InsertUserCompanyRole,
  type Account, type InsertAccount,
  type Warehouse, type InsertWarehouse,
  type Product, type InsertProduct,
  type Customer, type InsertCustomer,
  type Vendor, type InsertVendor,
  type Tax, type InsertTax,
  type Employee, type InsertEmployee,
  type SalesOrder, type InsertSalesOrder,
  type PurchaseOrder, type InsertPurchaseOrder,
  type IntercompanyTransfer, type InsertIntercompanyTransfer,
  type JournalEntry, type InsertJournalEntry,
  type SharedAccess, type InsertSharedAccess,
  type RefreshToken, type InsertRefreshToken,
  type AuthAuditLog, type InsertAuthAuditLog,
  type CompanyContext, type CompanyHierarchyNode,
  type StockLevel, type StockMovement,
  type Delivery, type GoodsReceipt,
  type Invoice, type Payment, type ArApLedger
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

// ============================================================================
// STORAGE INTERFACE - MULTI-COMPANY SUPPORT
// ============================================================================

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Companies
  getCompany(id: string): Promise<Company | undefined>;
  getCompanyByCode(code: string): Promise<Company | undefined>;
  getCompanies(): Promise<Company[]>;
  getChildCompanies(parentId: string): Promise<Company[]>;
  getCompanyHierarchy(rootId?: string): Promise<CompanyHierarchyNode[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, updates: Partial<Company>): Promise<Company | undefined>;
  
  // Company Settings
  getCompanySettings(companyId: string): Promise<CompanySettings | undefined>;
  createCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings>;
  updateCompanySettings(companyId: string, updates: Partial<CompanySettings>): Promise<CompanySettings | undefined>;
  
  // Fiscal Periods
  getFiscalPeriods(companyId: string): Promise<FiscalPeriod[]>;
  getFiscalPeriod(id: string): Promise<FiscalPeriod | undefined>;
  getCurrentFiscalPeriod(companyId: string): Promise<FiscalPeriod | undefined>;
  createFiscalPeriod(period: InsertFiscalPeriod): Promise<FiscalPeriod>;
  closeFiscalPeriod(id: string, closedBy: string): Promise<FiscalPeriod | undefined>;
  
  // Roles
  getRole(id: string): Promise<Role | undefined>;
  getRoleByCode(code: string): Promise<Role | undefined>;
  getRoles(): Promise<Role[]>;
  createRole(role: InsertRole): Promise<Role>;
  
  // User Company Roles
  getUserCompanyRoles(userId: string): Promise<UserCompanyRole[]>;
  getUserCompanies(userId: string): Promise<Company[]>;
  getUserRole(userId: string, companyId: string): Promise<Role | undefined>;
  assignUserToCompany(assignment: InsertUserCompanyRole): Promise<UserCompanyRole>;
  removeUserFromCompany(userId: string, companyId: string): Promise<void>;
  
  // Company Context
  getCompanyContext(userId: string, companyId: string): Promise<CompanyContext | undefined>;
  
  // Chart of Accounts (company-scoped)
  getAccounts(companyId: string): Promise<Account[]>;
  getAccount(id: string): Promise<Account | undefined>;
  getAccountByCode(companyId: string, accountCode: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: string, updates: Partial<Account>): Promise<Account | undefined>;
  deleteAccount(id: string): Promise<boolean>;
  
  // Warehouses (company-scoped)
  getWarehouses(companyId: string): Promise<Warehouse[]>;
  getWarehouse(id: string): Promise<Warehouse | undefined>;
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;
  updateWarehouse(id: string, updates: Partial<Warehouse>): Promise<Warehouse | undefined>;
  deleteWarehouse(id: string): Promise<boolean>;
  
  // Products (company-scoped)
  getProducts(companyId: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductBySku(companyId: string, sku: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  
  // Customers (company-scoped)
  getCustomers(companyId: string): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;
  
  // Vendors (company-scoped)
  getVendors(companyId: string): Promise<Vendor[]>;
  getVendor(id: string): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, updates: Partial<Vendor>): Promise<Vendor | undefined>;
  deleteVendor(id: string): Promise<boolean>;
  
  // Taxes (company-scoped)
  getTaxes(companyId: string): Promise<Tax[]>;
  getTax(id: string): Promise<Tax | undefined>;
  createTax(tax: InsertTax): Promise<Tax>;
  updateTax(id: string, updates: Partial<Tax>): Promise<Tax | undefined>;
  deleteTax(id: string): Promise<boolean>;
  
  // Employees (company-scoped)
  getEmployees(companyId: string): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee | undefined>;
  deleteEmployee(id: string): Promise<boolean>;
  
  // Journal Entries (company-scoped)
  getJournalEntries(companyId: string): Promise<JournalEntry[]>;
  getJournalEntry(id: string): Promise<JournalEntry | undefined>;
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry | undefined>;
  deleteJournalEntry(id: string): Promise<boolean>;
  
  // Sales Orders (company-scoped)
  getSalesOrders(companyId: string): Promise<SalesOrder[]>;
  getSalesOrder(id: string): Promise<SalesOrder | undefined>;
  createSalesOrder(order: InsertSalesOrder): Promise<SalesOrder>;
  updateSalesOrder(id: string, updates: Partial<SalesOrder>): Promise<SalesOrder | undefined>;
  deleteSalesOrder(id: string): Promise<boolean>;
  
  // Purchase Orders (company-scoped)
  getPurchaseOrders(companyId: string): Promise<PurchaseOrder[]>;
  getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined>;
  createPurchaseOrder(order: InsertPurchaseOrder): Promise<PurchaseOrder>;
  updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder | undefined>;
  deletePurchaseOrder(id: string): Promise<boolean>;
  
  // Intercompany Transfers
  getIntercompanyTransfers(companyId: string): Promise<IntercompanyTransfer[]>;
  getIntercompanyTransfer(id: string): Promise<IntercompanyTransfer | undefined>;
  createIntercompanyTransfer(transfer: InsertIntercompanyTransfer): Promise<IntercompanyTransfer>;
  updateIntercompanyTransfer(id: string, updates: Partial<IntercompanyTransfer>): Promise<IntercompanyTransfer | undefined>;
  
  // Shared Access
  getSharedAccess(granteeCompanyId: string, entityType: string): Promise<SharedAccess[]>;
  grantSharedAccess(access: InsertSharedAccess): Promise<SharedAccess>;
  revokeSharedAccess(id: string): Promise<void>;
  
  // Refresh Tokens (for JWT auth)
  createRefreshToken(token: InsertRefreshToken): Promise<RefreshToken>;
  getRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | undefined>;
  revokeRefreshToken(id: string, reason: string): Promise<void>;
  revokeAllUserRefreshTokens(userId: string, reason: string): Promise<void>;
  
  // Auth Audit Log
  createAuthAuditLog(log: InsertAuthAuditLog): Promise<AuthAuditLog>;
  getAuthAuditLogs(userId: string, limit?: number): Promise<AuthAuditLog[]>;
  
  // Additional methods for auth
  getAllCompanies(): Promise<Company[]>;
  getUserCompanyRole(userId: string, companyId: string): Promise<UserCompanyRole | undefined>;
  
  // System initialization
  isSystemInitialized(): Promise<boolean>;
  getSystemStats(): Promise<{ companyCount: number; userCount: number }>;
  
  // Stock Levels
  getStockLevels(companyId: string): Promise<StockLevel[]>;
  getStockLevel(companyId: string, productId: string, warehouseId: string): Promise<StockLevel | undefined>;
  
  // Stock Movements
  getStockMovements(companyId: string): Promise<StockMovement[]>;
  
  // Deliveries
  getDeliveries(companyId: string): Promise<Delivery[]>;
  getDelivery(id: string): Promise<Delivery | undefined>;
  
  // Goods Receipts
  getGoodsReceipts(companyId: string): Promise<GoodsReceipt[]>;
  getGoodsReceipt(id: string): Promise<GoodsReceipt | undefined>;
  
  // Invoices
  getInvoices(companyId: string): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  
  // Payments
  getPayments(companyId: string): Promise<Payment[]>;
  getPayment(id: string): Promise<Payment | undefined>;
  
  // AR/AP Ledger
  getArApLedger(companyId: string, ledgerType: string): Promise<ArApLedger[]>;
}

// ============================================================================
// IN-MEMORY STORAGE IMPLEMENTATION
// ============================================================================

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private companies: Map<string, Company>;
  private companySettings: Map<string, CompanySettings>;
  private fiscalPeriods: Map<string, FiscalPeriod>;
  private roles: Map<string, Role>;
  private userCompanyRoles: Map<string, UserCompanyRole>;
  private accounts: Map<string, Account>;
  private warehouses: Map<string, Warehouse>;
  private products: Map<string, Product>;
  private customers: Map<string, Customer>;
  private vendors: Map<string, Vendor>;
  private taxes: Map<string, Tax>;
  private employees: Map<string, Employee>;
  private journalEntries: Map<string, JournalEntry>;
  private salesOrders: Map<string, SalesOrder>;
  private purchaseOrders: Map<string, PurchaseOrder>;
  private intercompanyTransfers: Map<string, IntercompanyTransfer>;
  private sharedAccess: Map<string, SharedAccess>;
  private refreshTokens: Map<string, RefreshToken>;
  private authAuditLogs: Map<string, AuthAuditLog>;

  constructor() {
    this.users = new Map();
    this.companies = new Map();
    this.companySettings = new Map();
    this.fiscalPeriods = new Map();
    this.roles = new Map();
    this.userCompanyRoles = new Map();
    this.accounts = new Map();
    this.warehouses = new Map();
    this.products = new Map();
    this.customers = new Map();
    this.vendors = new Map();
    this.taxes = new Map();
    this.employees = new Map();
    this.journalEntries = new Map();
    this.salesOrders = new Map();
    this.purchaseOrders = new Map();
    this.intercompanyTransfers = new Map();
    this.sharedAccess = new Map();
    this.refreshTokens = new Map();
    this.authAuditLogs = new Map();
    
    // Initialize with default data
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default roles
    const adminRole: Role = {
      id: "role-admin",
      code: "ADMIN",
      name: "Administrator",
      description: "Full system access",
      isSystemRole: true,
      permissions: ["*"],
      createdAt: new Date(),
    };
    
    const managerRole: Role = {
      id: "role-manager",
      code: "MANAGER",
      name: "Manager",
      description: "Department manager access",
      isSystemRole: true,
      permissions: ["read:*", "write:*", "delete:own"],
      createdAt: new Date(),
    };
    
    const userRole: Role = {
      id: "role-user",
      code: "USER",
      name: "User",
      description: "Standard user access",
      isSystemRole: true,
      permissions: ["read:*", "write:own"],
      createdAt: new Date(),
    };
    
    this.roles.set(adminRole.id, adminRole);
    this.roles.set(managerRole.id, managerRole);
    this.roles.set(userRole.id, userRole);

    // Create sample company hierarchy
    const holdingCompany: Company = {
      id: "comp-holding",
      code: "UNANZA-HQ",
      name: "Unanza Holdings Ltd",
      legalName: "PT Unanza Holdings",
      taxId: "01.234.567.8-012.345",
      parentId: null,
      path: "UNANZA-HQ",
      level: 1,
      companyType: "holding",
      currency: "IDR",
      locale: "id-ID",
      timezone: "Asia/Jakarta",
      address: "Jl. Sudirman No. 100",
      city: "Jakarta",
      state: "DKI Jakarta",
      country: "ID",
      postalCode: "10220",
      phone: "+62-21-555-0100",
      email: "contact@unanza.co.id",
      website: "https://unanza.co.id",
      logoUrl: null,
      consolidationEnabled: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const usSubsidiary: Company = {
      id: "comp-us",
      code: "UNANZA-US",
      name: "Unanza USA Inc.",
      legalName: "Unanza USA Incorporated",
      taxId: "98-7654321",
      parentId: "comp-holding",
      path: "UNANZA-HQ/UNANZA-US",
      level: 2,
      companyType: "subsidiary",
      currency: "USD",
      locale: "en-US",
      timezone: "America/New_York",
      address: "200 Main Street",
      city: "Boston",
      state: "MA",
      country: "US",
      postalCode: "02101",
      phone: "+1-617-555-0200",
      email: "usa@unanza.com",
      website: null,
      logoUrl: null,
      consolidationEnabled: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const euSubsidiary: Company = {
      id: "comp-eu",
      code: "UNANZA-EU",
      name: "Unanza Europe GmbH",
      legalName: "Unanza Europe GmbH",
      taxId: "DE123456789",
      parentId: "comp-holding",
      path: "UNANZA-HQ/UNANZA-EU",
      level: 2,
      companyType: "subsidiary",
      currency: "EUR",
      locale: "de-DE",
      timezone: "Europe/Berlin",
      address: "Hauptstrasse 50",
      city: "Frankfurt",
      state: "HE",
      country: "DE",
      postalCode: "60311",
      phone: "+49-69-555-0300",
      email: "europe@unanza.com",
      website: null,
      logoUrl: null,
      consolidationEnabled: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const ukBranch: Company = {
      id: "comp-uk",
      code: "UNANZA-UK",
      name: "Unanza UK Branch",
      legalName: "Unanza UK",
      taxId: "GB123456789",
      parentId: "comp-eu",
      path: "UNANZA-HQ/UNANZA-EU/UNANZA-UK",
      level: 3,
      companyType: "branch",
      currency: "GBP",
      locale: "en-GB",
      timezone: "Europe/London",
      address: "10 High Street",
      city: "London",
      state: null,
      country: "GB",
      postalCode: "EC1A 1BB",
      phone: "+44-20-555-0400",
      email: "uk@unanza.com",
      website: null,
      logoUrl: null,
      consolidationEnabled: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const asiaPacific: Company = {
      id: "comp-apac",
      code: "UNANZA-APAC",
      name: "Unanza Asia Pacific Pte Ltd",
      legalName: "Unanza Asia Pacific Private Limited",
      taxId: "SG12345678",
      parentId: "comp-holding",
      path: "UNANZA-HQ/UNANZA-APAC",
      level: 2,
      companyType: "subsidiary",
      currency: "SGD",
      locale: "en-SG",
      timezone: "Asia/Singapore",
      address: "1 Raffles Place",
      city: "Singapore",
      state: null,
      country: "SG",
      postalCode: "048616",
      phone: "+65-6555-0500",
      email: "apac@unanza.com",
      website: null,
      logoUrl: null,
      consolidationEnabled: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.companies.set(holdingCompany.id, holdingCompany);
    this.companies.set(usSubsidiary.id, usSubsidiary);
    this.companies.set(euSubsidiary.id, euSubsidiary);
    this.companies.set(ukBranch.id, ukBranch);
    this.companies.set(asiaPacific.id, asiaPacific);

    // Create default admin user with hashed password
    const adminPasswordHash = bcrypt.hashSync("admin123", 10);
    const adminUser: User = {
      id: "user-admin",
      username: "admin",
      password: adminPasswordHash,
      email: "admin@unanza.com",
      fullName: "System Administrator",
      avatarUrl: null,
      defaultCompanyId: "comp-holding",
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(adminUser.id, adminUser);

    // Create additional demo users
    const managerPasswordHash = bcrypt.hashSync("password", 10);
    const managerUser: User = {
      id: "user-manager",
      username: "john.manager",
      password: managerPasswordHash,
      email: "john.manager@unanza.com",
      fullName: "John Manager",
      avatarUrl: null,
      defaultCompanyId: "comp-us",
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(managerUser.id, managerUser);

    const accountantPasswordHash = bcrypt.hashSync("password", 10);
    const accountantUser: User = {
      id: "user-accountant",
      username: "jane.accountant",
      password: accountantPasswordHash,
      email: "jane.accountant@unanza.com",
      fullName: "Jane Accountant",
      avatarUrl: null,
      defaultCompanyId: "comp-eu",
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(accountantUser.id, accountantUser);

    // Assign admin to all companies
    const companiesArr = [holdingCompany, usSubsidiary, euSubsidiary, ukBranch, asiaPacific];
    companiesArr.forEach((company, index) => {
      const assignment: UserCompanyRole = {
        id: `ucr-admin-${company.id}`,
        userId: adminUser.id,
        companyId: company.id,
        roleId: adminRole.id,
        isDefault: index === 0,
        grantedAt: new Date(),
        grantedBy: null,
        expiresAt: null,
        isActive: true,
      };
      this.userCompanyRoles.set(assignment.id, assignment);
    });

    // Assign manager to US subsidiary
    const managerAssignment: UserCompanyRole = {
      id: "ucr-manager-comp-us",
      userId: managerUser.id,
      companyId: usSubsidiary.id,
      roleId: managerRole.id,
      isDefault: true,
      grantedAt: new Date(),
      grantedBy: adminUser.id,
      expiresAt: null,
      isActive: true,
    };
    this.userCompanyRoles.set(managerAssignment.id, managerAssignment);

    // Assign accountant to EU subsidiary with user role
    const accountantAssignment: UserCompanyRole = {
      id: "ucr-accountant-comp-eu",
      userId: accountantUser.id,
      companyId: euSubsidiary.id,
      roleId: userRole.id,
      isDefault: true,
      grantedAt: new Date(),
      grantedBy: adminUser.id,
      expiresAt: null,
      isActive: true,
    };
    this.userCompanyRoles.set(accountantAssignment.id, accountantAssignment);

    // Seed Chart of Accounts for holding company
    const seedAccounts: Account[] = [
      {
        id: "acc-assets",
        companyId: holdingCompany.id,
        accountCode: "1000",
        name: "Assets",
        accountType: "asset",
        level: 1,
        parentId: null,
        balance: "0",
        isPostable: false,
        isActive: true,
        consolidationAccountId: null,
        createdAt: new Date(),
      },
      {
        id: "acc-cash",
        companyId: holdingCompany.id,
        accountCode: "1100",
        name: "Cash and Cash Equivalents",
        accountType: "asset",
        level: 2,
        parentId: "acc-assets",
        balance: "50000",
        isPostable: true,
        isActive: true,
        consolidationAccountId: null,
        createdAt: new Date(),
      },
      {
        id: "acc-receivables",
        companyId: holdingCompany.id,
        accountCode: "1200",
        name: "Accounts Receivable",
        accountType: "asset",
        level: 2,
        parentId: "acc-assets",
        balance: "25000",
        isPostable: true,
        isActive: true,
        consolidationAccountId: null,
        createdAt: new Date(),
      },
      {
        id: "acc-liabilities",
        companyId: holdingCompany.id,
        accountCode: "2000",
        name: "Liabilities",
        accountType: "liability",
        level: 1,
        parentId: null,
        balance: "0",
        isPostable: false,
        isActive: true,
        consolidationAccountId: null,
        createdAt: new Date(),
      },
      {
        id: "acc-payables",
        companyId: holdingCompany.id,
        accountCode: "2100",
        name: "Accounts Payable",
        accountType: "liability",
        level: 2,
        parentId: "acc-liabilities",
        balance: "15000",
        isPostable: true,
        isActive: true,
        consolidationAccountId: null,
        createdAt: new Date(),
      },
      {
        id: "acc-equity",
        companyId: holdingCompany.id,
        accountCode: "3000",
        name: "Equity",
        accountType: "equity",
        level: 1,
        parentId: null,
        balance: "100000",
        isPostable: true,
        isActive: true,
        consolidationAccountId: null,
        createdAt: new Date(),
      },
      {
        id: "acc-revenue",
        companyId: holdingCompany.id,
        accountCode: "4000",
        name: "Revenue",
        accountType: "revenue",
        level: 1,
        parentId: null,
        balance: "0",
        isPostable: false,
        isActive: true,
        consolidationAccountId: null,
        createdAt: new Date(),
      },
      {
        id: "acc-sales",
        companyId: holdingCompany.id,
        accountCode: "4100",
        name: "Sales Revenue",
        accountType: "revenue",
        level: 2,
        parentId: "acc-revenue",
        balance: "250000",
        isPostable: true,
        isActive: true,
        consolidationAccountId: null,
        createdAt: new Date(),
      },
      {
        id: "acc-expenses",
        companyId: holdingCompany.id,
        accountCode: "5000",
        name: "Expenses",
        accountType: "expense",
        level: 1,
        parentId: null,
        balance: "0",
        isPostable: false,
        isActive: true,
        consolidationAccountId: null,
        createdAt: new Date(),
      },
      {
        id: "acc-operating",
        companyId: holdingCompany.id,
        accountCode: "5100",
        name: "Operating Expenses",
        accountType: "expense",
        level: 2,
        parentId: "acc-expenses",
        balance: "75000",
        isPostable: true,
        isActive: true,
        consolidationAccountId: null,
        createdAt: new Date(),
      },
    ];
    seedAccounts.forEach(acc => this.accounts.set(acc.id, acc));

    // Seed Warehouses for holding company
    const seedWarehouses: Warehouse[] = [
      {
        id: "wh-main",
        companyId: holdingCompany.id,
        code: "WH-MAIN",
        name: "Main Warehouse",
        warehouseType: "standard",
        address: "123 Logistics Way",
        city: "Metropolis",
        state: "NY",
        country: "US",
        managerId: null,
        isActive: true,
        allowNegativeStock: false,
        createdAt: new Date(),
      },
      {
        id: "wh-distribution",
        companyId: holdingCompany.id,
        code: "WH-DIST",
        name: "Distribution Center",
        warehouseType: "standard",
        address: "456 Distribution Blvd",
        city: "Metropolis",
        state: "NY",
        country: "US",
        managerId: null,
        isActive: true,
        allowNegativeStock: false,
        createdAt: new Date(),
      },
    ];
    seedWarehouses.forEach(wh => this.warehouses.set(wh.id, wh));
  }

  // ===================== USERS =====================
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = bcrypt.hashSync(insertUser.password, 10);
    const user: User = { 
      id,
      username: insertUser.username,
      password: hashedPassword,
      email: insertUser.email ?? null,
      fullName: insertUser.fullName ?? null,
      avatarUrl: null,
      defaultCompanyId: null,
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  // ===================== COMPANIES =====================
  async getCompany(id: string): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async getCompanyByCode(code: string): Promise<Company | undefined> {
    return Array.from(this.companies.values()).find(c => c.code === code);
  }

  async getCompanies(): Promise<Company[]> {
    return Array.from(this.companies.values()).filter(c => c.isActive);
  }

  async getChildCompanies(parentId: string): Promise<Company[]> {
    return Array.from(this.companies.values()).filter(
      c => c.parentId === parentId && c.isActive
    );
  }

  async getCompanyHierarchy(rootId?: string): Promise<CompanyHierarchyNode[]> {
    const buildTree = (parentId: string | null, level: number): CompanyHierarchyNode[] => {
      const children = Array.from(this.companies.values())
        .filter(c => c.parentId === parentId && c.isActive)
        .map(company => ({
          company,
          children: buildTree(company.id, level + 1),
          level,
        }));
      return children;
    };

    if (rootId) {
      const root = this.companies.get(rootId);
      if (!root) return [];
      return [{
        company: root,
        children: buildTree(rootId, 2),
        level: 1,
      }];
    }

    // Return all root companies (no parent)
    return Array.from(this.companies.values())
      .filter(c => !c.parentId && c.isActive)
      .map(company => ({
        company,
        children: buildTree(company.id, 2),
        level: 1,
      }));
  }

  // Validate 3-level hierarchy rules:
  // - Holding (level 1): No parent, companyType must be 'holding'
  // - Subsidiary (level 2): Parent must be Holding, companyType must be 'subsidiary'
  // - Branch (level 3): Parent must be Subsidiary, companyType must be 'branch'
  private async validateCompanyHierarchy(
    companyType: string,
    parentId: string | null,
    excludeCompanyId?: string
  ): Promise<{ valid: boolean; error?: string; level: number; path: string }> {
    const validTypes = ["holding", "subsidiary", "branch"];
    if (!validTypes.includes(companyType)) {
      return { 
        valid: false, 
        error: `Invalid company type: ${companyType}. Must be holding, subsidiary, or branch.`,
        level: 0,
        path: ""
      };
    }

    // Holding must have no parent
    if (companyType === "holding") {
      if (parentId) {
        return { 
          valid: false, 
          error: "Holding companies cannot have a parent.",
          level: 0,
          path: ""
        };
      }
      return { valid: true, level: 1, path: "" }; // Path will be set to company code
    }

    // Subsidiary and Branch must have a parent
    if (!parentId) {
      return { 
        valid: false, 
        error: `${companyType} companies must have a parent.`,
        level: 0,
        path: ""
      };
    }

    const parent = await this.getCompany(parentId);
    if (!parent) {
      return { 
        valid: false, 
        error: "Parent company not found.",
        level: 0,
        path: ""
      };
    }

    // Subsidiary must have Holding parent
    if (companyType === "subsidiary") {
      if (parent.companyType !== "holding") {
        return { 
          valid: false, 
          error: "Subsidiaries must belong to a Holding company.",
          level: 0,
          path: ""
        };
      }
      return { valid: true, level: 2, path: parent.path };
    }

    // Branch must have Subsidiary parent
    if (companyType === "branch") {
      if (parent.companyType !== "subsidiary") {
        return { 
          valid: false, 
          error: "Branches must belong to a Subsidiary company.",
          level: 0,
          path: ""
        };
      }
      return { valid: true, level: 3, path: parent.path };
    }

    return { valid: false, error: "Unknown validation error.", level: 0, path: "" };
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    // Validate 3-level hierarchy
    const companyType = insertCompany.companyType ?? "subsidiary";
    const validation = await this.validateCompanyHierarchy(
      companyType,
      insertCompany.parentId ?? null
    );

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const id = randomUUID();
    
    // Auto-calculate path and level based on hierarchy
    const path = validation.level === 1 
      ? insertCompany.code 
      : `${validation.path}/${insertCompany.code}`;

    const company: Company = {
      id,
      code: insertCompany.code,
      name: insertCompany.name,
      legalName: insertCompany.legalName ?? null,
      taxId: insertCompany.taxId ?? null,
      parentId: insertCompany.parentId ?? null,
      path: path, // Always use calculated path based on hierarchy
      level: validation.level, // Always use calculated level
      companyType: companyType,
      currency: insertCompany.currency ?? "IDR",
      locale: insertCompany.locale ?? "id-ID",
      timezone: insertCompany.timezone ?? "Asia/Jakarta",
      address: insertCompany.address ?? null,
      city: insertCompany.city ?? null,
      state: insertCompany.state ?? null,
      country: insertCompany.country ?? null,
      postalCode: insertCompany.postalCode ?? null,
      phone: insertCompany.phone ?? null,
      email: insertCompany.email ?? null,
      website: insertCompany.website ?? null,
      logoUrl: insertCompany.logoUrl ?? null,
      consolidationEnabled: insertCompany.consolidationEnabled ?? false,
      isActive: insertCompany.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.companies.set(id, company);
    return company;
  }

  async updateCompany(id: string, updates: Partial<Company>): Promise<Company | undefined> {
    const company = this.companies.get(id);
    if (!company) return undefined;
    
    // SECURITY: Always ignore client-supplied path and level - they must be calculated
    // This prevents path/level tampering even when parent/type aren't changed
    delete updates.path;
    delete updates.level;

    // Determine the effective type and parent (use updates if provided, else existing)
    const effectiveType = updates.companyType || company.companyType;
    const effectiveParentId = updates.parentId !== undefined ? updates.parentId : company.parentId;
    const effectiveCode = updates.code || company.code;
    
    // Always validate and recalculate hierarchy for any update (in case code changed, which affects path)
    const validation = await this.validateCompanyHierarchy(
      effectiveType,
      effectiveParentId,
      id // Exclude self when validating
    );

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Always calculate path and level from hierarchy, not from client input
    const calculatedPath = validation.level === 1 
      ? effectiveCode 
      : `${validation.path}/${effectiveCode}`;

    const updated = { 
      ...company, 
      ...updates, 
      path: calculatedPath,
      level: validation.level,
      updatedAt: new Date() 
    };
    this.companies.set(id, updated);
    return updated;
  }

  // ===================== COMPANY SETTINGS =====================
  async getCompanySettings(companyId: string): Promise<CompanySettings | undefined> {
    return Array.from(this.companySettings.values()).find(s => s.companyId === companyId);
  }

  async createCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings> {
    const id = randomUUID();
    const newSettings: CompanySettings = {
      id,
      companyId: settings.companyId,
      fiscalYearStart: settings.fiscalYearStart ?? 1,
      fiscalYearEnd: settings.fiscalYearEnd ?? 12,
      taxRegime: settings.taxRegime ?? null,
      defaultPaymentTerms: settings.defaultPaymentTerms ?? 30,
      inventoryCostingMethod: settings.inventoryCostingMethod ?? "fifo",
      defaultWarehouseId: settings.defaultWarehouseId ?? null,
      multiCurrencyEnabled: settings.multiCurrencyEnabled ?? false,
      intercompanyEnabled: settings.intercompanyEnabled ?? true,
      autoPostIntercompany: settings.autoPostIntercompany ?? false,
      consolidationRules: settings.consolidationRules ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.companySettings.set(id, newSettings);
    return newSettings;
  }

  async updateCompanySettings(companyId: string, updates: Partial<CompanySettings>): Promise<CompanySettings | undefined> {
    const settings = await this.getCompanySettings(companyId);
    if (!settings) return undefined;
    const updated = { ...settings, ...updates, updatedAt: new Date() };
    this.companySettings.set(settings.id, updated);
    return updated;
  }

  // ===================== FISCAL PERIODS =====================
  async getFiscalPeriods(companyId: string): Promise<FiscalPeriod[]> {
    return Array.from(this.fiscalPeriods.values()).filter(p => p.companyId === companyId);
  }

  async getFiscalPeriod(id: string): Promise<FiscalPeriod | undefined> {
    return this.fiscalPeriods.get(id);
  }

  async getCurrentFiscalPeriod(companyId: string): Promise<FiscalPeriod | undefined> {
    const now = new Date();
    return Array.from(this.fiscalPeriods.values()).find(
      p => p.companyId === companyId && 
           p.startDate <= now && 
           p.endDate >= now && 
           p.status === "open"
    );
  }

  async createFiscalPeriod(period: InsertFiscalPeriod): Promise<FiscalPeriod> {
    const id = randomUUID();
    const newPeriod: FiscalPeriod = {
      id,
      companyId: period.companyId,
      periodCode: period.periodCode,
      periodName: period.periodName,
      periodType: period.periodType ?? "month",
      startDate: period.startDate,
      endDate: period.endDate,
      status: period.status ?? "open",
      isClosed: period.isClosed ?? false,
      closedAt: period.closedAt ?? null,
      closedBy: period.closedBy ?? null,
      createdAt: new Date(),
    };
    this.fiscalPeriods.set(id, newPeriod);
    return newPeriod;
  }

  async closeFiscalPeriod(id: string, closedBy: string): Promise<FiscalPeriod | undefined> {
    const period = this.fiscalPeriods.get(id);
    if (!period) return undefined;
    const updated = { 
      ...period, 
      status: "closed" as const, 
      isClosed: true, 
      closedAt: new Date(), 
      closedBy 
    };
    this.fiscalPeriods.set(id, updated);
    return updated;
  }

  // ===================== ROLES =====================
  async getRole(id: string): Promise<Role | undefined> {
    return this.roles.get(id);
  }

  async getRoleByCode(code: string): Promise<Role | undefined> {
    return Array.from(this.roles.values()).find(r => r.code === code);
  }

  async getRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }

  async createRole(role: InsertRole): Promise<Role> {
    const id = randomUUID();
    const newRole: Role = {
      id,
      code: role.code,
      name: role.name,
      description: role.description ?? null,
      isSystemRole: role.isSystemRole ?? false,
      permissions: role.permissions ?? [],
      createdAt: new Date(),
    };
    this.roles.set(id, newRole);
    return newRole;
  }

  // ===================== USER COMPANY ROLES =====================
  async getUserCompanyRoles(userId: string): Promise<UserCompanyRole[]> {
    return Array.from(this.userCompanyRoles.values()).filter(
      ucr => ucr.userId === userId && ucr.isActive
    );
  }

  async getUserCompanies(userId: string): Promise<Company[]> {
    const roles = await this.getUserCompanyRoles(userId);
    const companyIds = roles.map(r => r.companyId);
    return Array.from(this.companies.values()).filter(
      c => companyIds.includes(c.id) && c.isActive
    );
  }

  async getUserRole(userId: string, companyId: string): Promise<Role | undefined> {
    const assignment = Array.from(this.userCompanyRoles.values()).find(
      ucr => ucr.userId === userId && ucr.companyId === companyId && ucr.isActive
    );
    if (!assignment) return undefined;
    return this.roles.get(assignment.roleId);
  }

  async assignUserToCompany(assignment: InsertUserCompanyRole): Promise<UserCompanyRole> {
    const id = randomUUID();
    const newAssignment: UserCompanyRole = {
      id,
      userId: assignment.userId,
      companyId: assignment.companyId,
      roleId: assignment.roleId,
      isDefault: assignment.isDefault ?? false,
      grantedAt: new Date(),
      grantedBy: assignment.grantedBy ?? null,
      expiresAt: assignment.expiresAt ?? null,
      isActive: assignment.isActive ?? true,
    };
    this.userCompanyRoles.set(id, newAssignment);
    return newAssignment;
  }

  async removeUserFromCompany(userId: string, companyId: string): Promise<void> {
    const entries = Array.from(this.userCompanyRoles.entries());
    for (const [id, ucr] of entries) {
      if (ucr.userId === userId && ucr.companyId === companyId) {
        this.userCompanyRoles.delete(id);
      }
    }
  }

  // ===================== COMPANY CONTEXT =====================
  
  // Get accessible company IDs based on hierarchy level
  // - Holding: Can see all subsidiaries and their branches
  // - Subsidiary: Can see itself and all its branches
  // - Branch: Can only see itself
  private getAccessibleCompanyIds(company: Company, allCompanies: Company[]): string[] {
    const accessibleIds: string[] = [company.id];
    
    if (company.level === 1) { // Holding - can see all descendants
      const descendants = allCompanies.filter(c => 
        c.path.startsWith(company.path + "/") && c.id !== company.id
      );
      accessibleIds.push(...descendants.map(c => c.id));
    } else if (company.level === 2) { // Subsidiary - can see its branches
      const branches = allCompanies.filter(c => 
        c.parentId === company.id && c.level === 3
      );
      accessibleIds.push(...branches.map(c => c.id));
    }
    // Branch (level 3) can only see itself - already added
    
    return accessibleIds;
  }

  async getCompanyContext(userId: string, companyId: string): Promise<CompanyContext | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const company = await this.getCompany(companyId);
    if (!company) return undefined;

    const userCompanies = await this.getUserCompanies(userId);
    if (!userCompanies.find(c => c.id === companyId)) return undefined;

    const role = await this.getUserRole(userId, companyId);
    const permissions = role ? (role.permissions as string[]) : [];

    // Get all companies for hierarchy calculations
    const allCompanies = await this.getCompanies();
    
    // Get parent company
    const parentCompany = company.parentId 
      ? allCompanies.find(c => c.id === company.parentId) || null 
      : null;
    
    // Get direct child companies
    const childCompanies = allCompanies.filter(c => c.parentId === company.id);
    
    // Calculate accessible company IDs based on hierarchy
    const accessibleCompanyIds = this.getAccessibleCompanyIds(company, allCompanies);
    
    // Determine company level (1=Holding, 2=Subsidiary, 3=Branch)
    const companyLevel = company.level as 1 | 2 | 3;
    
    // Only Holding and Subsidiary can consolidate
    const canConsolidate = company.level <= 2;

    return {
      activeCompanyId: companyId,
      activeCompany: company,
      userCompanies,
      permissions,
      role: role || null,
      companyLevel,
      accessibleCompanyIds,
      canConsolidate,
      parentCompany,
      childCompanies,
    };
  }

  // ===================== CHART OF ACCOUNTS =====================
  async getAccounts(companyId: string): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter(a => a.companyId === companyId);
  }

  async getAccount(id: string): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async getAccountByCode(companyId: string, accountCode: string): Promise<Account | undefined> {
    return Array.from(this.accounts.values()).find(
      a => a.companyId === companyId && a.accountCode === accountCode
    );
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const id = randomUUID();
    const newAccount: Account = {
      id,
      companyId: account.companyId,
      accountCode: account.accountCode,
      name: account.name,
      accountType: account.accountType,
      level: account.level ?? 1,
      parentId: account.parentId ?? null,
      balance: account.balance ?? "0",
      isPostable: account.isPostable ?? true,
      isActive: account.isActive ?? true,
      consolidationAccountId: account.consolidationAccountId ?? null,
      createdAt: new Date(),
    };
    this.accounts.set(id, newAccount);
    return newAccount;
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account | undefined> {
    const account = this.accounts.get(id);
    if (!account) return undefined;
    const updated = { ...account, ...updates };
    this.accounts.set(id, updated);
    return updated;
  }

  async deleteAccount(id: string): Promise<boolean> {
    const account = this.accounts.get(id);
    if (!account) return false;
    
    // Check if account has children
    const hasChildren = Array.from(this.accounts.values()).some(a => a.parentId === id);
    if (hasChildren) return false;
    
    this.accounts.delete(id);
    return true;
  }

  // ===================== WAREHOUSES =====================
  async getWarehouses(companyId: string): Promise<Warehouse[]> {
    return Array.from(this.warehouses.values()).filter(w => w.companyId === companyId);
  }

  async getWarehouse(id: string): Promise<Warehouse | undefined> {
    return this.warehouses.get(id);
  }

  async createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse> {
    const id = randomUUID();
    const newWarehouse: Warehouse = {
      id,
      companyId: warehouse.companyId,
      code: warehouse.code,
      name: warehouse.name,
      warehouseType: warehouse.warehouseType ?? "standard",
      address: warehouse.address ?? null,
      city: warehouse.city ?? null,
      state: warehouse.state ?? null,
      country: warehouse.country ?? null,
      managerId: warehouse.managerId ?? null,
      isActive: warehouse.isActive ?? true,
      allowNegativeStock: warehouse.allowNegativeStock ?? false,
      createdAt: new Date(),
    };
    this.warehouses.set(id, newWarehouse);
    return newWarehouse;
  }

  async updateWarehouse(id: string, updates: Partial<Warehouse>): Promise<Warehouse | undefined> {
    const warehouse = this.warehouses.get(id);
    if (!warehouse) return undefined;
    const updated = { ...warehouse, ...updates };
    this.warehouses.set(id, updated);
    return updated;
  }

  async deleteWarehouse(id: string): Promise<boolean> {
    const warehouse = this.warehouses.get(id);
    if (!warehouse) return false;
    this.warehouses.delete(id);
    return true;
  }

  // ===================== PRODUCTS =====================
  async getProducts(companyId: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.companyId === companyId);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductBySku(companyId: string, sku: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(
      p => p.companyId === companyId && p.sku === sku
    );
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const newProduct: Product = {
      id,
      companyId: product.companyId,
      sku: product.sku,
      name: product.name,
      description: product.description ?? null,
      category: product.category ?? null,
      uom: product.uom ?? "EA",
      price: product.price ?? "0",
      cost: product.cost ?? "0",
      minStockLevel: product.minStockLevel ?? 0,
      maxStockLevel: product.maxStockLevel ?? null,
      reorderPoint: product.reorderPoint ?? null,
      isActive: product.isActive ?? true,
      isSellable: product.isSellable ?? true,
      isPurchasable: product.isPurchasable ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    const updated = { ...product, ...updates, updatedAt: new Date() };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const product = this.products.get(id);
    if (!product) return false;
    this.products.delete(id);
    return true;
  }

  // ===================== CUSTOMERS =====================
  async getCustomers(companyId: string): Promise<Customer[]> {
    return Array.from(this.customers.values()).filter(c => c.companyId === companyId);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const newCustomer: Customer = {
      id,
      companyId: customer.companyId,
      code: customer.code,
      name: customer.name,
      legalName: customer.legalName ?? null,
      taxId: customer.taxId ?? null,
      email: customer.email ?? null,
      phone: customer.phone ?? null,
      address: customer.address ?? null,
      city: customer.city ?? null,
      state: customer.state ?? null,
      country: customer.country ?? null,
      postalCode: customer.postalCode ?? null,
      paymentTerms: customer.paymentTerms ?? 30,
      creditLimit: customer.creditLimit ?? null,
      currentBalance: customer.currentBalance ?? "0",
      customerType: customer.customerType ?? "regular",
      isActive: customer.isActive ?? true,
      isIntercompany: customer.isIntercompany ?? false,
      linkedCompanyId: customer.linkedCompanyId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.customers.set(id, newCustomer);
    return newCustomer;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;
    const updated = { ...customer, ...updates, updatedAt: new Date() };
    this.customers.set(id, updated);
    return updated;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const customer = this.customers.get(id);
    if (!customer) return false;
    this.customers.delete(id);
    return true;
  }

  // ===================== VENDORS =====================
  async getVendors(companyId: string): Promise<Vendor[]> {
    return Array.from(this.vendors.values()).filter(v => v.companyId === companyId);
  }

  async getVendor(id: string): Promise<Vendor | undefined> {
    return this.vendors.get(id);
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const id = randomUUID();
    const newVendor: Vendor = {
      id,
      companyId: vendor.companyId,
      code: vendor.code,
      name: vendor.name,
      legalName: vendor.legalName ?? null,
      taxId: vendor.taxId ?? null,
      email: vendor.email ?? null,
      phone: vendor.phone ?? null,
      address: vendor.address ?? null,
      city: vendor.city ?? null,
      state: vendor.state ?? null,
      country: vendor.country ?? null,
      postalCode: vendor.postalCode ?? null,
      paymentTerms: vendor.paymentTerms ?? 30,
      vendorType: vendor.vendorType ?? "regular",
      isActive: vendor.isActive ?? true,
      isIntercompany: vendor.isIntercompany ?? false,
      linkedCompanyId: vendor.linkedCompanyId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.vendors.set(id, newVendor);
    return newVendor;
  }

  async updateVendor(id: string, updates: Partial<Vendor>): Promise<Vendor | undefined> {
    const vendor = this.vendors.get(id);
    if (!vendor) return undefined;
    const updated = { ...vendor, ...updates, updatedAt: new Date() };
    this.vendors.set(id, updated);
    return updated;
  }

  async deleteVendor(id: string): Promise<boolean> {
    const vendor = this.vendors.get(id);
    if (!vendor) return false;
    this.vendors.delete(id);
    return true;
  }

  // ===================== TAXES =====================
  async getTaxes(companyId: string): Promise<Tax[]> {
    return Array.from(this.taxes.values()).filter(t => t.companyId === companyId);
  }

  async getTax(id: string): Promise<Tax | undefined> {
    return this.taxes.get(id);
  }

  async createTax(tax: InsertTax): Promise<Tax> {
    const id = randomUUID();
    const newTax: Tax = {
      id,
      companyId: tax.companyId,
      code: tax.code,
      name: tax.name,
      rate: tax.rate,
      taxType: tax.taxType ?? "sales",
      isDefault: tax.isDefault ?? false,
      isActive: tax.isActive ?? true,
      accountId: tax.accountId ?? null,
      createdAt: new Date(),
    };
    this.taxes.set(id, newTax);
    return newTax;
  }

  async updateTax(id: string, updates: Partial<Tax>): Promise<Tax | undefined> {
    const tax = this.taxes.get(id);
    if (!tax) return undefined;
    const updated = { ...tax, ...updates };
    this.taxes.set(id, updated);
    return updated;
  }

  async deleteTax(id: string): Promise<boolean> {
    const tax = this.taxes.get(id);
    if (!tax) return false;
    this.taxes.delete(id);
    return true;
  }

  // ===================== EMPLOYEES =====================
  async getEmployees(companyId: string): Promise<Employee[]> {
    return Array.from(this.employees.values()).filter(e => e.companyId === companyId);
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const id = randomUUID();
    const newEmployee: Employee = {
      id,
      companyId: employee.companyId,
      employeeCode: employee.employeeCode,
      name: employee.name,
      email: employee.email ?? null,
      phone: employee.phone ?? null,
      department: employee.department ?? null,
      position: employee.position ?? null,
      hireDate: employee.hireDate ?? new Date(),
      terminationDate: employee.terminationDate ?? null,
      status: employee.status ?? "active",
      managerId: employee.managerId ?? null,
      address: employee.address ?? null,
      city: employee.city ?? null,
      state: employee.state ?? null,
      country: employee.country ?? null,
      salary: employee.salary ?? null,
      salaryFrequency: employee.salaryFrequency ?? "monthly",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.employees.set(id, newEmployee);
    return newEmployee;
  }

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee | undefined> {
    const employee = this.employees.get(id);
    if (!employee) return undefined;
    const updated = { ...employee, ...updates, updatedAt: new Date() };
    this.employees.set(id, updated);
    return updated;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    const employee = this.employees.get(id);
    if (!employee) return false;
    this.employees.delete(id);
    return true;
  }

  // ===================== JOURNAL ENTRIES =====================
  async getJournalEntries(companyId: string): Promise<JournalEntry[]> {
    return Array.from(this.journalEntries.values()).filter(e => e.companyId === companyId);
  }

  async getJournalEntry(id: string): Promise<JournalEntry | undefined> {
    return this.journalEntries.get(id);
  }

  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const id = randomUUID();
    const newEntry: JournalEntry = {
      id,
      companyId: entry.companyId,
      entryNumber: entry.entryNumber,
      entryDate: entry.entryDate ?? new Date(),
      fiscalPeriodId: entry.fiscalPeriodId ?? null,
      description: entry.description ?? null,
      reference: entry.reference ?? null,
      sourceDocument: entry.sourceDocument ?? null,
      sourceDocumentId: entry.sourceDocumentId ?? null,
      status: entry.status ?? "draft",
      totalDebit: entry.totalDebit ?? "0",
      totalCredit: entry.totalCredit ?? "0",
      isIntercompany: entry.isIntercompany ?? false,
      counterpartyCompanyId: entry.counterpartyCompanyId ?? null,
      eliminationGroupId: entry.eliminationGroupId ?? null,
      postedBy: entry.postedBy ?? null,
      postedAt: entry.postedAt ?? null,
      createdBy: entry.createdBy ?? null,
      createdAt: new Date(),
    };
    this.journalEntries.set(id, newEntry);
    return newEntry;
  }

  async updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry | undefined> {
    const entry = this.journalEntries.get(id);
    if (!entry) return undefined;
    const updated = { ...entry, ...updates };
    this.journalEntries.set(id, updated);
    return updated;
  }

  async deleteJournalEntry(id: string): Promise<boolean> {
    const entry = this.journalEntries.get(id);
    if (!entry) return false;
    this.journalEntries.delete(id);
    return true;
  }

  // ===================== SALES ORDERS =====================
  async getSalesOrders(companyId: string): Promise<SalesOrder[]> {
    return Array.from(this.salesOrders.values()).filter(o => o.companyId === companyId);
  }

  async getSalesOrder(id: string): Promise<SalesOrder | undefined> {
    return this.salesOrders.get(id);
  }

  async createSalesOrder(order: InsertSalesOrder): Promise<SalesOrder> {
    const id = randomUUID();
    const newOrder: SalesOrder = {
      id,
      companyId: order.companyId,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      orderDate: order.orderDate ?? new Date(),
      requiredDate: order.requiredDate ?? null,
      status: order.status ?? "draft",
      subtotal: order.subtotal ?? "0",
      taxAmount: order.taxAmount ?? "0",
      total: order.total ?? "0",
      fiscalPeriodId: order.fiscalPeriodId ?? null,
      warehouseId: order.warehouseId ?? null,
      isIntercompany: order.isIntercompany ?? false,
      counterpartyCompanyId: order.counterpartyCompanyId ?? null,
      linkedPurchaseOrderId: order.linkedPurchaseOrderId ?? null,
      notes: order.notes ?? null,
      createdBy: order.createdBy ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.salesOrders.set(id, newOrder);
    return newOrder;
  }

  async updateSalesOrder(id: string, updates: Partial<SalesOrder>): Promise<SalesOrder | undefined> {
    const order = this.salesOrders.get(id);
    if (!order) return undefined;
    const updated = { ...order, ...updates, updatedAt: new Date() };
    this.salesOrders.set(id, updated);
    return updated;
  }

  async deleteSalesOrder(id: string): Promise<boolean> {
    const order = this.salesOrders.get(id);
    if (!order) return false;
    this.salesOrders.delete(id);
    return true;
  }

  // ===================== PURCHASE ORDERS =====================
  async getPurchaseOrders(companyId: string): Promise<PurchaseOrder[]> {
    return Array.from(this.purchaseOrders.values()).filter(o => o.companyId === companyId);
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined> {
    return this.purchaseOrders.get(id);
  }

  async createPurchaseOrder(order: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const id = randomUUID();
    const newOrder: PurchaseOrder = {
      id,
      companyId: order.companyId,
      orderNumber: order.orderNumber,
      vendorId: order.vendorId,
      orderDate: order.orderDate ?? new Date(),
      expectedDate: order.expectedDate ?? null,
      status: order.status ?? "draft",
      subtotal: order.subtotal ?? "0",
      taxAmount: order.taxAmount ?? "0",
      total: order.total ?? "0",
      fiscalPeriodId: order.fiscalPeriodId ?? null,
      warehouseId: order.warehouseId ?? null,
      isIntercompany: order.isIntercompany ?? false,
      counterpartyCompanyId: order.counterpartyCompanyId ?? null,
      linkedSalesOrderId: order.linkedSalesOrderId ?? null,
      notes: order.notes ?? null,
      createdBy: order.createdBy ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.purchaseOrders.set(id, newOrder);
    return newOrder;
  }

  async updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder | undefined> {
    const order = this.purchaseOrders.get(id);
    if (!order) return undefined;
    const updated = { ...order, ...updates, updatedAt: new Date() };
    this.purchaseOrders.set(id, updated);
    return updated;
  }

  async deletePurchaseOrder(id: string): Promise<boolean> {
    const order = this.purchaseOrders.get(id);
    if (!order) return false;
    this.purchaseOrders.delete(id);
    return true;
  }

  // ===================== INTERCOMPANY TRANSFERS =====================
  async getIntercompanyTransfers(companyId: string): Promise<IntercompanyTransfer[]> {
    return Array.from(this.intercompanyTransfers.values()).filter(
      t => t.sourceCompanyId === companyId || t.targetCompanyId === companyId
    );
  }

  async getIntercompanyTransfer(id: string): Promise<IntercompanyTransfer | undefined> {
    return this.intercompanyTransfers.get(id);
  }

  async createIntercompanyTransfer(transfer: InsertIntercompanyTransfer): Promise<IntercompanyTransfer> {
    const id = randomUUID();
    const newTransfer: IntercompanyTransfer = {
      id,
      transferNumber: transfer.transferNumber,
      sourceCompanyId: transfer.sourceCompanyId,
      targetCompanyId: transfer.targetCompanyId,
      sourceWarehouseId: transfer.sourceWarehouseId,
      targetWarehouseId: transfer.targetWarehouseId,
      transferDate: transfer.transferDate ?? new Date(),
      status: transfer.status ?? "draft",
      totalValue: transfer.totalValue ?? "0",
      sourceSalesOrderId: transfer.sourceSalesOrderId ?? null,
      targetPurchaseOrderId: transfer.targetPurchaseOrderId ?? null,
      notes: transfer.notes ?? null,
      createdBy: transfer.createdBy ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.intercompanyTransfers.set(id, newTransfer);
    return newTransfer;
  }

  async updateIntercompanyTransfer(id: string, updates: Partial<IntercompanyTransfer>): Promise<IntercompanyTransfer | undefined> {
    const transfer = this.intercompanyTransfers.get(id);
    if (!transfer) return undefined;
    const updated = { ...transfer, ...updates, updatedAt: new Date() };
    this.intercompanyTransfers.set(id, updated);
    return updated;
  }

  // ===================== SHARED ACCESS =====================
  async getSharedAccess(granteeCompanyId: string, entityType: string): Promise<SharedAccess[]> {
    return Array.from(this.sharedAccess.values()).filter(
      sa => sa.granteeCompanyId === granteeCompanyId && 
            sa.entityType === entityType && 
            sa.isActive
    );
  }

  async grantSharedAccess(access: InsertSharedAccess): Promise<SharedAccess> {
    const id = randomUUID();
    const newAccess: SharedAccess = {
      id,
      entityType: access.entityType,
      entityId: access.entityId,
      ownerCompanyId: access.ownerCompanyId,
      granteeCompanyId: access.granteeCompanyId,
      accessLevel: access.accessLevel ?? "read",
      grantedAt: new Date(),
      grantedBy: access.grantedBy ?? null,
      expiresAt: access.expiresAt ?? null,
      isActive: access.isActive ?? true,
    };
    this.sharedAccess.set(id, newAccess);
    return newAccess;
  }

  async revokeSharedAccess(id: string): Promise<void> {
    this.sharedAccess.delete(id);
  }

  // ===================== REFRESH TOKENS (JWT AUTH) =====================
  async createRefreshToken(token: InsertRefreshToken): Promise<RefreshToken> {
    const id = randomUUID();
    const newToken: RefreshToken = {
      id,
      userId: token.userId,
      tokenHash: token.tokenHash,
      activeCompanyId: token.activeCompanyId ?? null,
      deviceInfo: token.deviceInfo ?? null,
      ipAddress: token.ipAddress ?? null,
      issuedAt: new Date(),
      expiresAt: token.expiresAt,
      revokedAt: null,
      revokedReason: null,
      tokenVersion: token.tokenVersion ?? 1,
    };
    this.refreshTokens.set(id, newToken);
    return newToken;
  }

  async getRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | undefined> {
    return Array.from(this.refreshTokens.values()).find(t => t.tokenHash === tokenHash);
  }

  async revokeRefreshToken(id: string, reason: string): Promise<void> {
    const token = this.refreshTokens.get(id);
    if (token) {
      token.revokedAt = new Date();
      token.revokedReason = reason;
      this.refreshTokens.set(id, token);
    }
  }

  async revokeAllUserRefreshTokens(userId: string, reason: string): Promise<void> {
    const now = new Date();
    const entries = Array.from(this.refreshTokens.entries());
    for (const [id, token] of entries) {
      if (token.userId === userId && !token.revokedAt) {
        token.revokedAt = now;
        token.revokedReason = reason;
        this.refreshTokens.set(id, token);
      }
    }
  }

  // ===================== AUTH AUDIT LOG =====================
  async createAuthAuditLog(log: InsertAuthAuditLog): Promise<AuthAuditLog> {
    const id = randomUUID();
    const newLog: AuthAuditLog = {
      id,
      userId: log.userId ?? null,
      eventType: log.eventType,
      companyId: log.companyId ?? null,
      ipAddress: log.ipAddress ?? null,
      deviceInfo: log.deviceInfo ?? null,
      success: log.success ?? true,
      failureReason: log.failureReason ?? null,
      metadata: log.metadata ?? null,
      createdAt: new Date(),
    };
    this.authAuditLogs.set(id, newLog);
    return newLog;
  }

  async getAuthAuditLogs(userId: string, limit: number = 100): Promise<AuthAuditLog[]> {
    return Array.from(this.authAuditLogs.values())
      .filter(l => l.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  // ===================== ADDITIONAL AUTH METHODS =====================
  async getAllCompanies(): Promise<Company[]> {
    return Array.from(this.companies.values());
  }

  async getUserCompanyRole(userId: string, companyId: string): Promise<UserCompanyRole | undefined> {
    return Array.from(this.userCompanyRoles.values()).find(
      ucr => ucr.userId === userId && ucr.companyId === companyId && ucr.isActive
    );
  }

  // ===================== SYSTEM INITIALIZATION =====================
  async isSystemInitialized(): Promise<boolean> {
    // System is initialized if there is at least one company
    return this.companies.size > 0;
  }

  async getSystemStats(): Promise<{ companyCount: number; userCount: number }> {
    return {
      companyCount: this.companies.size,
      userCount: this.users.size,
    };
  }

  // Stock Levels - stub implementations for MemStorage
  async getStockLevels(companyId: string): Promise<StockLevel[]> {
    return [];
  }

  async getStockLevel(companyId: string, productId: string, warehouseId: string): Promise<StockLevel | undefined> {
    return undefined;
  }

  async getStockMovements(companyId: string): Promise<StockMovement[]> {
    return [];
  }

  async getDeliveries(companyId: string): Promise<Delivery[]> {
    return [];
  }

  async getDelivery(id: string): Promise<Delivery | undefined> {
    return undefined;
  }

  async getGoodsReceipts(companyId: string): Promise<GoodsReceipt[]> {
    return [];
  }

  async getGoodsReceipt(id: string): Promise<GoodsReceipt | undefined> {
    return undefined;
  }

  async getInvoices(companyId: string): Promise<Invoice[]> {
    return [];
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    return undefined;
  }

  async getPayments(companyId: string): Promise<Payment[]> {
    return [];
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    return undefined;
  }

  async getArApLedger(companyId: string, ledgerType: string): Promise<ArApLedger[]> {
    return [];
  }
}

import { DatabaseStorage } from "./database-storage";

// Use DatabaseStorage for production with PostgreSQL
// Keep MemStorage available for testing/development if needed
export const storage: IStorage = new DatabaseStorage();
