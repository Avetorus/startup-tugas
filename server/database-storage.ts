import { eq, and, desc, sql, inArray, like, isNull, gt, lt } from "drizzle-orm";
import { db } from "./db";
import { 
  companies, users, companySettings, companyFiscalPeriods, roles, userCompanyRoles,
  chartOfAccounts, warehouses, products, customers, vendors, taxes, employees,
  journalEntries, salesOrders, purchaseOrders, intercompanyTransfers, sharedAccess,
  refreshTokens, authAuditLog,
  stockLevels, stockMovements, deliveries, goodsReceipts, invoices, payments, arApLedger,
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
import type { IStorage } from "./storage";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export class DatabaseStorage implements IStorage {
  
  // ===================== USERS =====================
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser & { defaultCompanyId?: string }): Promise<User> {
    const id = randomUUID();
    const hashedPassword = bcrypt.hashSync(insertUser.password, 10);
    const [user] = await db.insert(users).values({
      id,
      username: insertUser.username,
      password: hashedPassword,
      email: insertUser.email ?? null,
      fullName: insertUser.fullName ?? null,
      avatarUrl: null,
      defaultCompanyId: insertUser.defaultCompanyId ?? null,
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // ===================== COMPANIES =====================
  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async getCompanyByCode(code: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.code, code));
    return company || undefined;
  }

  async getCompanies(): Promise<Company[]> {
    return db.select().from(companies).orderBy(companies.path);
  }

  async getAllCompanies(): Promise<Company[]> {
    return this.getCompanies();
  }

  async getChildCompanies(parentId: string): Promise<Company[]> {
    return db.select().from(companies).where(eq(companies.parentId, parentId));
  }

  async getCompanyHierarchy(rootId?: string): Promise<CompanyHierarchyNode[]> {
    const allCompanies = await this.getCompanies();
    
    const buildHierarchy = (parentId: string | null, level: number): CompanyHierarchyNode[] => {
      return allCompanies
        .filter(c => c.parentId === parentId)
        .map(company => ({
          company,
          children: buildHierarchy(company.id, level + 1),
          level,
        }));
    };

    if (rootId) {
      const rootCompany = allCompanies.find(c => c.id === rootId);
      if (!rootCompany) return [];
      return [{
        company: rootCompany,
        children: buildHierarchy(rootId, rootCompany.level + 1),
        level: rootCompany.level,
      }];
    }

    return buildHierarchy(null, 1);
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const id = randomUUID();
    
    let level = 1;
    let path = company.code;
    
    if (company.parentId) {
      const parentCompany = await this.getCompany(company.parentId);
      if (parentCompany) {
        level = parentCompany.level + 1;
        path = `${parentCompany.path}/${company.code}`;
      }
    }
    
    const [created] = await db.insert(companies).values({
      id,
      code: company.code,
      name: company.name,
      legalName: company.legalName,
      taxId: company.taxId,
      parentId: company.parentId,
      path,
      level,
      companyType: company.companyType,
      currency: company.currency ?? "IDR",
      locale: company.locale ?? "id-ID",
      timezone: company.timezone ?? "Asia/Jakarta",
      address: company.address,
      city: company.city,
      state: company.state,
      country: company.country,
      postalCode: company.postalCode,
      phone: company.phone,
      email: company.email,
      website: company.website,
      logoUrl: company.logoUrl,
      consolidationEnabled: company.consolidationEnabled ?? false,
      isActive: company.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return created;
  }

  async updateCompany(id: string, updates: Partial<Company>): Promise<Company | undefined> {
    const { path, level, ...safeUpdates } = updates;
    const [updated] = await db.update(companies)
      .set({ ...safeUpdates, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return updated || undefined;
  }

  // ===================== COMPANY SETTINGS =====================
  async getCompanySettings(companyId: string): Promise<CompanySettings | undefined> {
    const [settings] = await db.select().from(companySettings)
      .where(eq(companySettings.companyId, companyId));
    return settings || undefined;
  }

  async createCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings> {
    const id = randomUUID();
    const [created] = await db.insert(companySettings).values({
      id,
      ...settings,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return created;
  }

  async updateCompanySettings(companyId: string, updates: Partial<CompanySettings>): Promise<CompanySettings | undefined> {
    const [updated] = await db.update(companySettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companySettings.companyId, companyId))
      .returning();
    return updated || undefined;
  }

  // ===================== FISCAL PERIODS =====================
  async getFiscalPeriods(companyId: string): Promise<FiscalPeriod[]> {
    return db.select().from(companyFiscalPeriods)
      .where(eq(companyFiscalPeriods.companyId, companyId))
      .orderBy(desc(companyFiscalPeriods.startDate));
  }

  async getFiscalPeriod(id: string): Promise<FiscalPeriod | undefined> {
    const [period] = await db.select().from(companyFiscalPeriods)
      .where(eq(companyFiscalPeriods.id, id));
    return period || undefined;
  }

  async getCurrentFiscalPeriod(companyId: string): Promise<FiscalPeriod | undefined> {
    const now = new Date();
    const [period] = await db.select().from(companyFiscalPeriods)
      .where(and(
        eq(companyFiscalPeriods.companyId, companyId),
        lt(companyFiscalPeriods.startDate, now),
        gt(companyFiscalPeriods.endDate, now),
        eq(companyFiscalPeriods.isClosed, false)
      ));
    return period || undefined;
  }

  async createFiscalPeriod(period: InsertFiscalPeriod): Promise<FiscalPeriod> {
    const id = randomUUID();
    const [created] = await db.insert(companyFiscalPeriods).values({
      id,
      ...period,
      createdAt: new Date(),
    }).returning();
    return created;
  }

  async closeFiscalPeriod(id: string, closedBy: string): Promise<FiscalPeriod | undefined> {
    const [updated] = await db.update(companyFiscalPeriods)
      .set({ isClosed: true, closedAt: new Date(), closedBy, status: "closed" })
      .where(eq(companyFiscalPeriods.id, id))
      .returning();
    return updated || undefined;
  }

  // ===================== ROLES =====================
  async getRole(id: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role || undefined;
  }

  async getRoleByCode(code: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.code, code));
    return role || undefined;
  }

  async getRoles(): Promise<Role[]> {
    return db.select().from(roles);
  }

  async createRole(role: InsertRole): Promise<Role> {
    const id = randomUUID();
    const [created] = await db.insert(roles).values({
      id,
      ...role,
      createdAt: new Date(),
    }).returning();
    return created;
  }

  // ===================== USER COMPANY ROLES =====================
  async getUserCompanyRoles(userId: string): Promise<UserCompanyRole[]> {
    return db.select().from(userCompanyRoles)
      .where(and(eq(userCompanyRoles.userId, userId), eq(userCompanyRoles.isActive, true)));
  }

  async getUserCompanies(userId: string): Promise<Company[]> {
    const assignments = await this.getUserCompanyRoles(userId);
    if (assignments.length === 0) return [];
    
    const companyIds = assignments.map(a => a.companyId);
    return db.select().from(companies).where(inArray(companies.id, companyIds));
  }

  async getUserRole(userId: string, companyId: string): Promise<Role | undefined> {
    const [assignment] = await db.select().from(userCompanyRoles)
      .where(and(
        eq(userCompanyRoles.userId, userId),
        eq(userCompanyRoles.companyId, companyId),
        eq(userCompanyRoles.isActive, true)
      ));
    if (!assignment) return undefined;
    return this.getRole(assignment.roleId);
  }

  async getUserCompanyRole(userId: string, companyId: string): Promise<UserCompanyRole | undefined> {
    const [assignment] = await db.select().from(userCompanyRoles)
      .where(and(
        eq(userCompanyRoles.userId, userId),
        eq(userCompanyRoles.companyId, companyId),
        eq(userCompanyRoles.isActive, true)
      ));
    return assignment || undefined;
  }

  async assignUserToCompany(assignment: InsertUserCompanyRole): Promise<UserCompanyRole> {
    const id = randomUUID();
    const [created] = await db.insert(userCompanyRoles).values({
      id,
      ...assignment,
      grantedAt: new Date(),
      isActive: true,
    }).returning();
    return created;
  }

  async removeUserFromCompany(userId: string, companyId: string): Promise<void> {
    await db.update(userCompanyRoles)
      .set({ isActive: false })
      .where(and(
        eq(userCompanyRoles.userId, userId),
        eq(userCompanyRoles.companyId, companyId)
      ));
  }

  // ===================== COMPANY CONTEXT =====================
  async getCompanyContext(userId: string, companyId: string): Promise<CompanyContext | undefined> {
    const company = await this.getCompany(companyId);
    if (!company) return undefined;

    const userCompanyList = await this.getUserCompanies(userId);
    const role = await this.getUserRole(userId, companyId);
    
    const allCompanies = await this.getCompanies();
    const childCompanies = allCompanies.filter(c => c.parentId === companyId);
    const parentCompany = company.parentId ? allCompanies.find(c => c.id === company.parentId) || null : null;

    const getDescendantIds = (parentId: string): string[] => {
      const children = allCompanies.filter(c => c.parentId === parentId);
      return children.reduce((acc, child) => {
        return [...acc, child.id, ...getDescendantIds(child.id)];
      }, [] as string[]);
    };
    const accessibleCompanyIds = [companyId, ...getDescendantIds(companyId)];

    return {
      activeCompanyId: companyId,
      activeCompany: company,
      userCompanies: userCompanyList,
      permissions: role?.permissions as string[] || [],
      role: role || null,
      companyLevel: company.level as 1 | 2 | 3,
      accessibleCompanyIds,
      canConsolidate: company.consolidationEnabled || company.level < 3,
      parentCompany,
      childCompanies,
    };
  }

  // ===================== CHART OF ACCOUNTS =====================
  async getAccounts(companyId: string): Promise<Account[]> {
    return db.select().from(chartOfAccounts)
      .where(eq(chartOfAccounts.companyId, companyId))
      .orderBy(chartOfAccounts.accountCode);
  }

  async getAccount(id: string): Promise<Account | undefined> {
    const [account] = await db.select().from(chartOfAccounts)
      .where(eq(chartOfAccounts.id, id));
    return account || undefined;
  }

  async getAccountByCode(companyId: string, accountCode: string): Promise<Account | undefined> {
    const [account] = await db.select().from(chartOfAccounts)
      .where(and(
        eq(chartOfAccounts.companyId, companyId),
        eq(chartOfAccounts.accountCode, accountCode)
      ));
    return account || undefined;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const id = randomUUID();
    const [created] = await db.insert(chartOfAccounts).values({
      id,
      ...account,
      createdAt: new Date(),
    }).returning();
    return created;
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account | undefined> {
    const [updated] = await db.update(chartOfAccounts)
      .set(updates)
      .where(eq(chartOfAccounts.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAccount(id: string): Promise<boolean> {
    const result = await db.delete(chartOfAccounts).where(eq(chartOfAccounts.id, id));
    return true;
  }

  // ===================== WAREHOUSES =====================
  async getWarehouses(companyId: string): Promise<Warehouse[]> {
    return db.select().from(warehouses)
      .where(eq(warehouses.companyId, companyId))
      .orderBy(warehouses.name);
  }

  async getWarehouse(id: string): Promise<Warehouse | undefined> {
    const [warehouse] = await db.select().from(warehouses)
      .where(eq(warehouses.id, id));
    return warehouse || undefined;
  }

  async createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse> {
    const id = randomUUID();
    const [created] = await db.insert(warehouses).values({
      id,
      ...warehouse,
      createdAt: new Date(),
    }).returning();
    return created;
  }

  async updateWarehouse(id: string, updates: Partial<Warehouse>): Promise<Warehouse | undefined> {
    const [updated] = await db.update(warehouses)
      .set(updates)
      .where(eq(warehouses.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteWarehouse(id: string): Promise<boolean> {
    await db.delete(warehouses).where(eq(warehouses.id, id));
    return true;
  }

  // ===================== PRODUCTS =====================
  async getProducts(companyId: string): Promise<Product[]> {
    return db.select().from(products)
      .where(eq(products.companyId, companyId))
      .orderBy(products.name);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products)
      .where(eq(products.id, id));
    return product || undefined;
  }

  async getProductBySku(companyId: string, sku: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products)
      .where(and(
        eq(products.companyId, companyId),
        eq(products.sku, sku)
      ));
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const [created] = await db.insert(products).values({
      id,
      ...product,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return created;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const [updated] = await db.update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    await db.delete(products).where(eq(products.id, id));
    return true;
  }

  // ===================== CUSTOMERS =====================
  async getCustomers(companyId: string): Promise<Customer[]> {
    return db.select().from(customers)
      .where(eq(customers.companyId, companyId))
      .orderBy(customers.name);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers)
      .where(eq(customers.id, id));
    return customer || undefined;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const [created] = await db.insert(customers).values({
      id,
      ...customer,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return created;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | undefined> {
    const [updated] = await db.update(customers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    await db.delete(customers).where(eq(customers.id, id));
    return true;
  }

  // ===================== VENDORS =====================
  async getVendors(companyId: string): Promise<Vendor[]> {
    return db.select().from(vendors)
      .where(eq(vendors.companyId, companyId))
      .orderBy(vendors.name);
  }

  async getVendor(id: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors)
      .where(eq(vendors.id, id));
    return vendor || undefined;
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const id = randomUUID();
    const [created] = await db.insert(vendors).values({
      id,
      ...vendor,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return created;
  }

  async updateVendor(id: string, updates: Partial<Vendor>): Promise<Vendor | undefined> {
    const [updated] = await db.update(vendors)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vendors.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteVendor(id: string): Promise<boolean> {
    await db.delete(vendors).where(eq(vendors.id, id));
    return true;
  }

  // ===================== TAXES =====================
  async getTaxes(companyId: string): Promise<Tax[]> {
    return db.select().from(taxes)
      .where(eq(taxes.companyId, companyId))
      .orderBy(taxes.name);
  }

  async getTax(id: string): Promise<Tax | undefined> {
    const [tax] = await db.select().from(taxes)
      .where(eq(taxes.id, id));
    return tax || undefined;
  }

  async createTax(tax: InsertTax): Promise<Tax> {
    const id = randomUUID();
    const [created] = await db.insert(taxes).values({
      id,
      ...tax,
      createdAt: new Date(),
    }).returning();
    return created;
  }

  async updateTax(id: string, updates: Partial<Tax>): Promise<Tax | undefined> {
    const [updated] = await db.update(taxes)
      .set(updates)
      .where(eq(taxes.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTax(id: string): Promise<boolean> {
    await db.delete(taxes).where(eq(taxes.id, id));
    return true;
  }

  // ===================== EMPLOYEES =====================
  async getEmployees(companyId: string): Promise<Employee[]> {
    return db.select().from(employees)
      .where(eq(employees.companyId, companyId))
      .orderBy(employees.name);
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees)
      .where(eq(employees.id, id));
    return employee || undefined;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const id = randomUUID();
    const companyEmployees = await this.getEmployees(employee.companyId);
    const employeeNumber = `EMP-${String(companyEmployees.length + 1).padStart(4, '0')}`;
    
    const [created] = await db.insert(employees).values({
      id,
      ...employee,
      employeeCode: employee.employeeCode || employeeNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return created;
  }

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee | undefined> {
    const { employeeCode, ...safeUpdates } = updates;
    const [updated] = await db.update(employees)
      .set({ ...safeUpdates, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    await db.delete(employees).where(eq(employees.id, id));
    return true;
  }

  // ===================== JOURNAL ENTRIES =====================
  async getJournalEntries(companyId: string): Promise<JournalEntry[]> {
    return db.select().from(journalEntries)
      .where(eq(journalEntries.companyId, companyId))
      .orderBy(desc(journalEntries.entryDate));
  }

  async getJournalEntry(id: string): Promise<JournalEntry | undefined> {
    const [entry] = await db.select().from(journalEntries)
      .where(eq(journalEntries.id, id));
    return entry || undefined;
  }

  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const id = randomUUID();
    const companyEntries = await this.getJournalEntries(entry.companyId);
    const entryNumber = entry.entryNumber || `JE-${String(companyEntries.length + 1).padStart(6, '0')}`;
    
    const [created] = await db.insert(journalEntries).values({
      id,
      companyId: entry.companyId,
      entryNumber,
      entryDate: entry.entryDate ?? new Date(),
      fiscalPeriodId: entry.fiscalPeriodId,
      description: entry.description,
      reference: entry.reference,
      sourceDocument: entry.sourceDocument,
      sourceDocumentId: entry.sourceDocumentId,
      status: entry.status ?? "draft",
      totalDebit: entry.totalDebit ?? "0",
      totalCredit: entry.totalCredit ?? "0",
      isIntercompany: entry.isIntercompany ?? false,
      counterpartyCompanyId: entry.counterpartyCompanyId,
      eliminationGroupId: entry.eliminationGroupId,
      postedBy: entry.postedBy,
      postedAt: entry.postedAt,
      createdBy: entry.createdBy,
      createdAt: new Date(),
    }).returning();
    return created;
  }

  async updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry | undefined> {
    const { createdAt, ...safeUpdates } = updates;
    const [updated] = await db.update(journalEntries)
      .set(safeUpdates)
      .where(eq(journalEntries.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteJournalEntry(id: string): Promise<boolean> {
    await db.delete(journalEntries).where(eq(journalEntries.id, id));
    return true;
  }

  // ===================== SALES ORDERS =====================
  async getSalesOrders(companyId: string): Promise<SalesOrder[]> {
    return db.select().from(salesOrders)
      .where(eq(salesOrders.companyId, companyId))
      .orderBy(desc(salesOrders.orderDate));
  }

  async getSalesOrder(id: string): Promise<SalesOrder | undefined> {
    const [order] = await db.select().from(salesOrders)
      .where(eq(salesOrders.id, id));
    return order || undefined;
  }

  async createSalesOrder(order: InsertSalesOrder): Promise<SalesOrder> {
    const id = randomUUID();
    const companyOrders = await this.getSalesOrders(order.companyId);
    const orderNumber = `SO-${String(companyOrders.length + 1).padStart(6, '0')}`;
    
    const [created] = await db.insert(salesOrders).values({
      id,
      ...order,
      orderNumber: order.orderNumber || orderNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return created;
  }

  async updateSalesOrder(id: string, updates: Partial<SalesOrder>): Promise<SalesOrder | undefined> {
    const { orderNumber, ...safeUpdates } = updates;
    const [updated] = await db.update(salesOrders)
      .set({ ...safeUpdates, updatedAt: new Date() })
      .where(eq(salesOrders.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSalesOrder(id: string): Promise<boolean> {
    await db.delete(salesOrders).where(eq(salesOrders.id, id));
    return true;
  }

  // ===================== PURCHASE ORDERS =====================
  async getPurchaseOrders(companyId: string): Promise<PurchaseOrder[]> {
    return db.select().from(purchaseOrders)
      .where(eq(purchaseOrders.companyId, companyId))
      .orderBy(desc(purchaseOrders.orderDate));
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined> {
    const [order] = await db.select().from(purchaseOrders)
      .where(eq(purchaseOrders.id, id));
    return order || undefined;
  }

  async createPurchaseOrder(order: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const id = randomUUID();
    const companyOrders = await this.getPurchaseOrders(order.companyId);
    const orderNumber = `PO-${String(companyOrders.length + 1).padStart(6, '0')}`;
    
    const [created] = await db.insert(purchaseOrders).values({
      id,
      ...order,
      orderNumber: order.orderNumber || orderNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return created;
  }

  async updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder | undefined> {
    const { orderNumber, ...safeUpdates } = updates;
    const [updated] = await db.update(purchaseOrders)
      .set({ ...safeUpdates, updatedAt: new Date() })
      .where(eq(purchaseOrders.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePurchaseOrder(id: string): Promise<boolean> {
    await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
    return true;
  }

  // ===================== INTERCOMPANY TRANSFERS =====================
  async getIntercompanyTransfers(companyId: string): Promise<IntercompanyTransfer[]> {
    return db.select().from(intercompanyTransfers)
      .where(eq(intercompanyTransfers.sourceCompanyId, companyId))
      .orderBy(desc(intercompanyTransfers.transferDate));
  }

  async getIntercompanyTransfer(id: string): Promise<IntercompanyTransfer | undefined> {
    const [transfer] = await db.select().from(intercompanyTransfers)
      .where(eq(intercompanyTransfers.id, id));
    return transfer || undefined;
  }

  async createIntercompanyTransfer(transfer: InsertIntercompanyTransfer): Promise<IntercompanyTransfer> {
    const id = randomUUID();
    const allTransfers = await db.select().from(intercompanyTransfers);
    const transferNumber = `ICT-${String(allTransfers.length + 1).padStart(6, '0')}`;
    
    const [created] = await db.insert(intercompanyTransfers).values({
      id,
      ...transfer,
      transferNumber: transfer.transferNumber || transferNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return created;
  }

  async updateIntercompanyTransfer(id: string, updates: Partial<IntercompanyTransfer>): Promise<IntercompanyTransfer | undefined> {
    const [updated] = await db.update(intercompanyTransfers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(intercompanyTransfers.id, id))
      .returning();
    return updated || undefined;
  }

  // ===================== SHARED ACCESS =====================
  async getSharedAccess(granteeCompanyId: string, entityType: string): Promise<SharedAccess[]> {
    return db.select().from(sharedAccess)
      .where(and(
        eq(sharedAccess.granteeCompanyId, granteeCompanyId),
        eq(sharedAccess.entityType, entityType),
        eq(sharedAccess.isActive, true)
      ));
  }

  async grantSharedAccess(access: InsertSharedAccess): Promise<SharedAccess> {
    const id = randomUUID();
    const [created] = await db.insert(sharedAccess).values({
      id,
      ...access,
      grantedAt: new Date(),
      isActive: true,
    }).returning();
    return created;
  }

  async revokeSharedAccess(id: string): Promise<void> {
    await db.update(sharedAccess)
      .set({ isActive: false })
      .where(eq(sharedAccess.id, id));
  }

  // ===================== REFRESH TOKENS =====================
  async createRefreshToken(token: InsertRefreshToken): Promise<RefreshToken> {
    const id = randomUUID();
    const [created] = await db.insert(refreshTokens).values({
      id,
      ...token,
      issuedAt: new Date(),
    }).returning();
    return created;
  }

  async getRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | undefined> {
    const [token] = await db.select().from(refreshTokens)
      .where(and(
        eq(refreshTokens.tokenHash, tokenHash),
        isNull(refreshTokens.revokedAt)
      ));
    return token || undefined;
  }

  async revokeRefreshToken(id: string, reason: string): Promise<void> {
    await db.update(refreshTokens)
      .set({ revokedAt: new Date(), revokedReason: reason })
      .where(eq(refreshTokens.id, id));
  }

  async revokeAllUserRefreshTokens(userId: string, reason: string): Promise<void> {
    await db.update(refreshTokens)
      .set({ revokedAt: new Date(), revokedReason: reason })
      .where(and(
        eq(refreshTokens.userId, userId),
        isNull(refreshTokens.revokedAt)
      ));
  }

  // ===================== AUTH AUDIT LOG =====================
  async createAuthAuditLog(log: InsertAuthAuditLog): Promise<AuthAuditLog> {
    const id = randomUUID();
    const [created] = await db.insert(authAuditLog).values({
      id,
      ...log,
      createdAt: new Date(),
    }).returning();
    return created;
  }

  async getAuthAuditLogs(userId: string, limit: number = 50): Promise<AuthAuditLog[]> {
    return db.select().from(authAuditLog)
      .where(eq(authAuditLog.userId, userId))
      .orderBy(desc(authAuditLog.createdAt))
      .limit(limit);
  }

  // ===================== SYSTEM =====================
  async isSystemInitialized(): Promise<boolean> {
    const companyList = await db.select().from(companies).limit(1);
    const userList = await db.select().from(users).limit(1);
    return companyList.length > 0 && userList.length > 0;
  }

  async getSystemStats(): Promise<{ companyCount: number; userCount: number }> {
    const [companyResult] = await db.select({ count: sql<number>`count(*)` }).from(companies);
    const [userResult] = await db.select({ count: sql<number>`count(*)` }).from(users);
    return {
      companyCount: Number(companyResult?.count || 0),
      userCount: Number(userResult?.count || 0),
    };
  }

  // ===================== STOCK LEVELS =====================
  async getStockLevels(companyId: string): Promise<StockLevel[]> {
    return db.select().from(stockLevels)
      .where(eq(stockLevels.companyId, companyId))
      .orderBy(desc(stockLevels.updatedAt));
  }

  async getStockLevel(companyId: string, productId: string, warehouseId: string): Promise<StockLevel | undefined> {
    const [level] = await db.select().from(stockLevels)
      .where(and(
        eq(stockLevels.companyId, companyId),
        eq(stockLevels.productId, productId),
        eq(stockLevels.warehouseId, warehouseId)
      ));
    return level || undefined;
  }

  // ===================== STOCK MOVEMENTS =====================
  async getStockMovements(companyId: string): Promise<StockMovement[]> {
    return db.select().from(stockMovements)
      .where(eq(stockMovements.companyId, companyId))
      .orderBy(desc(stockMovements.movementDate));
  }

  // ===================== DELIVERIES =====================
  async getDeliveries(companyId: string): Promise<Delivery[]> {
    return db.select().from(deliveries)
      .where(eq(deliveries.companyId, companyId))
      .orderBy(desc(deliveries.deliveryDate));
  }

  async getDelivery(id: string): Promise<Delivery | undefined> {
    const [delivery] = await db.select().from(deliveries).where(eq(deliveries.id, id));
    return delivery || undefined;
  }

  // ===================== GOODS RECEIPTS =====================
  async getGoodsReceipts(companyId: string): Promise<GoodsReceipt[]> {
    return db.select().from(goodsReceipts)
      .where(eq(goodsReceipts.companyId, companyId))
      .orderBy(desc(goodsReceipts.receiptDate));
  }

  async getGoodsReceipt(id: string): Promise<GoodsReceipt | undefined> {
    const [receipt] = await db.select().from(goodsReceipts).where(eq(goodsReceipts.id, id));
    return receipt || undefined;
  }

  // ===================== INVOICES =====================
  async getInvoices(companyId: string): Promise<Invoice[]> {
    return db.select().from(invoices)
      .where(eq(invoices.companyId, companyId))
      .orderBy(desc(invoices.invoiceDate));
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || undefined;
  }

  // ===================== PAYMENTS =====================
  async getPayments(companyId: string): Promise<Payment[]> {
    return db.select().from(payments)
      .where(eq(payments.companyId, companyId))
      .orderBy(desc(payments.paymentDate));
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  // ===================== AR/AP LEDGER =====================
  async getArApLedger(companyId: string, ledgerType: string): Promise<ArApLedger[]> {
    return db.select().from(arApLedger)
      .where(and(
        eq(arApLedger.companyId, companyId),
        eq(arApLedger.ledgerType, ledgerType)
      ))
      .orderBy(desc(arApLedger.transactionDate));
  }
}
