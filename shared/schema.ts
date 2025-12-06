import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, jsonb, unique, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// COMPANY HIERARCHY CONSTANTS (defined first for use in schema validation)
// ============================================================================

// Strict 3-level hierarchy: Holding (level 1) → Subsidiary (level 2) → Branch (level 3)
export const COMPANY_LEVELS = {
  HOLDING: 1,
  SUBSIDIARY: 2,
  BRANCH: 3,
} as const;

export const COMPANY_TYPES = {
  HOLDING: "holding",
  SUBSIDIARY: "subsidiary", 
  BRANCH: "branch",
} as const;

export type CompanyLevel = typeof COMPANY_LEVELS[keyof typeof COMPANY_LEVELS];
export type CompanyType = typeof COMPANY_TYPES[keyof typeof COMPANY_TYPES];

// ============================================================================
// MULTI-COMPANY CORE TABLES
// ============================================================================

// Companies table - strict 3-level hierarchy: Holding (1) → Subsidiary (2) → Branch (3)
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: text("name").notNull(),
  legalName: text("legal_name"),
  taxId: varchar("tax_id", { length: 50 }),
  parentId: varchar("parent_id").references((): any => companies.id),
  path: text("path").notNull(), // Materialized path for hierarchy (e.g., "HOLDING/SUBSIDIARY/BRANCH")
  level: integer("level").notNull().default(1), // 1=Holding, 2=Subsidiary, 3=Branch (max depth)
  companyType: varchar("company_type", { length: 50 }).notNull().default("holding"), // holding, subsidiary, branch only
  currency: varchar("currency", { length: 3 }).notNull().default("IDR"),
  locale: varchar("locale", { length: 10 }).default("en-US"),
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: varchar("country", { length: 2 }),
  postalCode: varchar("postal_code", { length: 20 }),
  phone: varchar("phone", { length: 30 }),
  email: text("email"),
  website: text("website"),
  logoUrl: text("logo_url"),
  consolidationEnabled: boolean("consolidation_enabled").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  pathIdx: index("companies_path_idx").on(table.path),
  parentIdx: index("companies_parent_idx").on(table.parentId),
}));

// Company settings - fiscal and operational settings per company
export const companySettings = pgTable("company_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id).unique(),
  fiscalYearStart: integer("fiscal_year_start").default(1), // Month (1-12)
  fiscalYearEnd: integer("fiscal_year_end").default(12),
  taxRegime: varchar("tax_regime", { length: 50 }),
  defaultPaymentTerms: integer("default_payment_terms").default(30), // Days
  inventoryCostingMethod: varchar("inventory_costing_method", { length: 20 }).default("fifo"), // fifo, lifo, average
  defaultWarehouseId: varchar("default_warehouse_id"),
  multiCurrencyEnabled: boolean("multi_currency_enabled").default(false),
  intercompanyEnabled: boolean("intercompany_enabled").default(true),
  autoPostIntercompany: boolean("auto_post_intercompany").default(false),
  consolidationRules: jsonb("consolidation_rules"), // JSON with elimination rules
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Fiscal periods per company
export const companyFiscalPeriods = pgTable("company_fiscal_periods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  periodCode: varchar("period_code", { length: 20 }).notNull(), // e.g., "2024-01", "2024-Q1"
  periodName: text("period_name").notNull(),
  periodType: varchar("period_type", { length: 20 }).notNull().default("month"), // month, quarter, year
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: varchar("status", { length: 20 }).default("open"), // open, closed, locked
  isClosed: boolean("is_closed").default(false),
  closedAt: timestamp("closed_at"),
  closedBy: varchar("closed_by"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  companyPeriodUnique: unique().on(table.companyId, table.periodCode),
  companyIdx: index("fiscal_periods_company_idx").on(table.companyId),
}));

// ============================================================================
// ROLES & PERMISSIONS
// ============================================================================

// System roles
export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  isSystemRole: boolean("is_system_role").default(false),
  permissions: jsonb("permissions").notNull().default([]), // Array of permission codes
  createdAt: timestamp("created_at").defaultNow(),
});

// Users table (extended)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  defaultCompanyId: varchar("default_company_id").references(() => companies.id),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User-Company role assignments
export const userCompanyRoles = pgTable("user_company_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  roleId: varchar("role_id").notNull().references(() => roles.id),
  isDefault: boolean("is_default").default(false),
  grantedAt: timestamp("granted_at").defaultNow(),
  grantedBy: varchar("granted_by").references(() => users.id),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
}, (table) => ({
  userCompanyRoleUnique: unique().on(table.userId, table.companyId, table.roleId),
  userIdx: index("user_company_roles_user_idx").on(table.userId),
  companyIdx: index("user_company_roles_company_idx").on(table.companyId),
}));

// ============================================================================
// AUTHENTICATION - JWT & REFRESH TOKENS
// ============================================================================

// Refresh tokens for JWT authentication
export const refreshTokens = pgTable("refresh_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  tokenHash: text("token_hash").notNull().unique(), // Hashed refresh token
  activeCompanyId: varchar("active_company_id").references(() => companies.id),
  deviceInfo: text("device_info"), // User agent or device identifier
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4 or IPv6
  issuedAt: timestamp("issued_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"), // Null if not revoked
  revokedReason: varchar("revoked_reason", { length: 100 }), // logout, rotation, security
  tokenVersion: integer("token_version").default(1), // For token rotation
}, (table) => ({
  userIdx: index("refresh_tokens_user_idx").on(table.userId),
  tokenHashIdx: index("refresh_tokens_hash_idx").on(table.tokenHash),
  expiresIdx: index("refresh_tokens_expires_idx").on(table.expiresAt),
}));

// Audit log for authentication events
export const authAuditLog = pgTable("auth_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  eventType: varchar("event_type", { length: 50 }).notNull(), // login, logout, refresh, failed_login, token_revoked
  companyId: varchar("company_id").references(() => companies.id),
  ipAddress: varchar("ip_address", { length: 45 }),
  deviceInfo: text("device_info"),
  success: boolean("success").default(true),
  failureReason: text("failure_reason"),
  metadata: jsonb("metadata"), // Additional context
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdx: index("auth_audit_user_idx").on(table.userId),
  eventTypeIdx: index("auth_audit_event_idx").on(table.eventType),
  createdIdx: index("auth_audit_created_idx").on(table.createdAt),
}));

// ============================================================================
// MASTER DATA - COMPANY SCOPED
// ============================================================================

// Chart of Accounts (company-scoped)
export const chartOfAccounts = pgTable("chart_of_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  accountCode: varchar("account_code", { length: 20 }).notNull(),
  name: text("name").notNull(),
  accountType: varchar("account_type", { length: 20 }).notNull(), // asset, liability, equity, revenue, expense
  level: integer("level").notNull().default(1),
  parentId: varchar("parent_id"),
  balance: decimal("balance", { precision: 18, scale: 2 }).default("0"),
  isPostable: boolean("is_postable").default(true),
  isActive: boolean("is_active").default(true),
  consolidationAccountId: varchar("consolidation_account_id"), // Maps to parent company account for consolidation
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  companyAccountUnique: unique().on(table.companyId, table.accountCode),
  companyIdx: index("coa_company_idx").on(table.companyId),
}));

// Warehouses (company-scoped)
export const warehouses = pgTable("warehouses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  code: varchar("code", { length: 20 }).notNull(),
  name: text("name").notNull(),
  warehouseType: varchar("warehouse_type", { length: 20 }).default("standard"), // standard, transit, virtual
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: varchar("country", { length: 2 }),
  managerId: varchar("manager_id"),
  isActive: boolean("is_active").default(true),
  allowNegativeStock: boolean("allow_negative_stock").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  companyCodeUnique: unique().on(table.companyId, table.code),
  companyIdx: index("warehouses_company_idx").on(table.companyId),
}));

// Products (company-scoped)
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  sku: varchar("sku", { length: 50 }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  uom: varchar("uom", { length: 20 }).default("EA"),
  price: decimal("price", { precision: 18, scale: 2 }).default("0"),
  cost: decimal("cost", { precision: 18, scale: 2 }).default("0"),
  minStockLevel: integer("min_stock_level").default(0),
  maxStockLevel: integer("max_stock_level"),
  reorderPoint: integer("reorder_point"),
  isActive: boolean("is_active").default(true),
  isSellable: boolean("is_sellable").default(true),
  isPurchasable: boolean("is_purchasable").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  companySkuUnique: unique().on(table.companyId, table.sku),
  companyIdx: index("products_company_idx").on(table.companyId),
}));

// Customers (company-scoped)
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  code: varchar("code", { length: 20 }).notNull(),
  name: text("name").notNull(),
  legalName: text("legal_name"),
  taxId: varchar("tax_id", { length: 50 }),
  email: text("email"),
  phone: varchar("phone", { length: 30 }),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: varchar("country", { length: 2 }),
  postalCode: varchar("postal_code", { length: 20 }),
  paymentTerms: integer("payment_terms").default(30),
  creditLimit: decimal("credit_limit", { precision: 18, scale: 2 }),
  currentBalance: decimal("current_balance", { precision: 18, scale: 2 }).default("0"),
  customerType: varchar("customer_type", { length: 20 }).default("regular"),
  isActive: boolean("is_active").default(true),
  isIntercompany: boolean("is_intercompany").default(false),
  linkedCompanyId: varchar("linked_company_id").references(() => companies.id), // For IC customers
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  companyCodeUnique: unique().on(table.companyId, table.code),
  companyIdx: index("customers_company_idx").on(table.companyId),
}));

// Vendors (company-scoped)
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  code: varchar("code", { length: 20 }).notNull(),
  name: text("name").notNull(),
  legalName: text("legal_name"),
  taxId: varchar("tax_id", { length: 50 }),
  email: text("email"),
  phone: varchar("phone", { length: 30 }),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: varchar("country", { length: 2 }),
  postalCode: varchar("postal_code", { length: 20 }),
  paymentTerms: integer("payment_terms").default(30),
  vendorType: varchar("vendor_type", { length: 20 }).default("regular"),
  isActive: boolean("is_active").default(true),
  isIntercompany: boolean("is_intercompany").default(false),
  linkedCompanyId: varchar("linked_company_id").references(() => companies.id), // For IC vendors
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  companyCodeUnique: unique().on(table.companyId, table.code),
  companyIdx: index("vendors_company_idx").on(table.companyId),
}));

// Employees (company-scoped)
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  employeeCode: varchar("employee_code", { length: 20 }).notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: varchar("phone", { length: 30 }),
  department: varchar("department", { length: 100 }),
  position: varchar("position", { length: 100 }),
  hireDate: timestamp("hire_date").defaultNow(),
  terminationDate: timestamp("termination_date"),
  status: varchar("status", { length: 20 }).default("active"),
  managerId: varchar("manager_id"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: varchar("country", { length: 2 }),
  salary: decimal("salary", { precision: 18, scale: 2 }),
  salaryFrequency: varchar("salary_frequency", { length: 20 }).default("monthly"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  companyCodeUnique: unique().on(table.companyId, table.employeeCode),
  companyIdx: index("employees_company_idx").on(table.companyId),
}));

// Tax configurations (company-scoped)
export const taxes = pgTable("taxes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  code: varchar("code", { length: 20 }).notNull(),
  name: text("name").notNull(),
  rate: decimal("rate", { precision: 8, scale: 4 }).notNull(),
  taxType: varchar("tax_type", { length: 20 }).default("sales"), // sales, purchase, withholding
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  accountId: varchar("account_id").references(() => chartOfAccounts.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  companyCodeUnique: unique().on(table.companyId, table.code),
  companyIdx: index("taxes_company_idx").on(table.companyId),
}));

// ============================================================================
// SHARED ACCESS CONTROL
// ============================================================================

// Shared access between companies for master data
export const sharedAccess = pgTable("shared_access", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // product, customer, vendor, account
  entityId: varchar("entity_id").notNull(),
  ownerCompanyId: varchar("owner_company_id").notNull().references(() => companies.id),
  granteeCompanyId: varchar("grantee_company_id").notNull().references(() => companies.id),
  accessLevel: varchar("access_level", { length: 20 }).default("read"), // read, write, full
  grantedAt: timestamp("granted_at").defaultNow(),
  grantedBy: varchar("granted_by").references(() => users.id),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
}, (table) => ({
  entityUnique: unique().on(table.entityType, table.entityId, table.granteeCompanyId),
  ownerIdx: index("shared_access_owner_idx").on(table.ownerCompanyId),
  granteeIdx: index("shared_access_grantee_idx").on(table.granteeCompanyId),
}));

// ============================================================================
// TRANSACTIONS - COMPANY SCOPED
// ============================================================================

// Sales Orders
export const salesOrders = pgTable("sales_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  orderNumber: varchar("order_number", { length: 30 }).notNull(),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  orderDate: timestamp("order_date").notNull().defaultNow(),
  requiredDate: timestamp("required_date"),
  status: varchar("status", { length: 20 }).default("draft"), // draft, confirmed, delivered, invoiced, cancelled
  subtotal: decimal("subtotal", { precision: 18, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 18, scale: 2 }).default("0"),
  total: decimal("total", { precision: 18, scale: 2 }).default("0"),
  fiscalPeriodId: varchar("fiscal_period_id").references(() => companyFiscalPeriods.id),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id),
  isIntercompany: boolean("is_intercompany").default(false),
  counterpartyCompanyId: varchar("counterparty_company_id").references(() => companies.id),
  linkedPurchaseOrderId: varchar("linked_purchase_order_id"),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  companyOrderUnique: unique().on(table.companyId, table.orderNumber),
  companyIdx: index("sales_orders_company_idx").on(table.companyId),
  customerIdx: index("sales_orders_customer_idx").on(table.customerId),
}));

export const salesOrderLines = pgTable("sales_order_lines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salesOrderId: varchar("sales_order_id").notNull().references(() => salesOrders.id),
  lineNumber: integer("line_number").notNull(),
  productId: varchar("product_id").notNull().references(() => products.id),
  description: text("description"),
  quantity: decimal("quantity", { precision: 18, scale: 4 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 18, scale: 4 }).notNull(),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  lineTotal: decimal("line_total", { precision: 18, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  orderIdx: index("sales_order_lines_order_idx").on(table.salesOrderId),
}));

// Purchase Orders
export const purchaseOrders = pgTable("purchase_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  orderNumber: varchar("order_number", { length: 30 }).notNull(),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  orderDate: timestamp("order_date").notNull().defaultNow(),
  expectedDate: timestamp("expected_date"),
  status: varchar("status", { length: 20 }).default("draft"), // draft, ordered, received, billed, cancelled
  subtotal: decimal("subtotal", { precision: 18, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 18, scale: 2 }).default("0"),
  total: decimal("total", { precision: 18, scale: 2 }).default("0"),
  fiscalPeriodId: varchar("fiscal_period_id").references(() => companyFiscalPeriods.id),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id),
  isIntercompany: boolean("is_intercompany").default(false),
  counterpartyCompanyId: varchar("counterparty_company_id").references(() => companies.id),
  linkedSalesOrderId: varchar("linked_sales_order_id"),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  companyOrderUnique: unique().on(table.companyId, table.orderNumber),
  companyIdx: index("purchase_orders_company_idx").on(table.companyId),
  vendorIdx: index("purchase_orders_vendor_idx").on(table.vendorId),
}));

export const purchaseOrderLines = pgTable("purchase_order_lines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseOrderId: varchar("purchase_order_id").notNull().references(() => purchaseOrders.id),
  lineNumber: integer("line_number").notNull(),
  productId: varchar("product_id").notNull().references(() => products.id),
  description: text("description"),
  quantity: decimal("quantity", { precision: 18, scale: 4 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 18, scale: 4 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  lineTotal: decimal("line_total", { precision: 18, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  orderIdx: index("purchase_order_lines_order_idx").on(table.purchaseOrderId),
}));

// ============================================================================
// INTER-COMPANY TRANSACTIONS
// ============================================================================

// Inter-company stock transfers
export const intercompanyTransfers = pgTable("intercompany_transfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transferNumber: varchar("transfer_number", { length: 30 }).notNull().unique(),
  sourceCompanyId: varchar("source_company_id").notNull().references(() => companies.id),
  targetCompanyId: varchar("target_company_id").notNull().references(() => companies.id),
  sourceWarehouseId: varchar("source_warehouse_id").notNull().references(() => warehouses.id),
  targetWarehouseId: varchar("target_warehouse_id").notNull().references(() => warehouses.id),
  transferDate: timestamp("transfer_date").notNull().defaultNow(),
  status: varchar("status", { length: 20 }).default("draft"), // draft, in_transit, received, completed, cancelled
  totalValue: decimal("total_value", { precision: 18, scale: 2 }).default("0"),
  sourceSalesOrderId: varchar("source_sales_order_id").references(() => salesOrders.id),
  targetPurchaseOrderId: varchar("target_purchase_order_id").references(() => purchaseOrders.id),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  sourceCompanyIdx: index("ic_transfers_source_idx").on(table.sourceCompanyId),
  targetCompanyIdx: index("ic_transfers_target_idx").on(table.targetCompanyId),
}));

// Journal entries (company-scoped with IC support)
export const journalEntries = pgTable("journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  entryNumber: varchar("entry_number", { length: 30 }).notNull(),
  entryDate: timestamp("entry_date").notNull().defaultNow(),
  fiscalPeriodId: varchar("fiscal_period_id").references(() => companyFiscalPeriods.id),
  description: text("description"),
  reference: text("reference"),
  sourceDocument: varchar("source_document", { length: 50 }),
  sourceDocumentId: varchar("source_document_id"),
  status: varchar("status", { length: 20 }).default("draft"), // draft, posted, reversed
  totalDebit: decimal("total_debit", { precision: 18, scale: 2 }).default("0"),
  totalCredit: decimal("total_credit", { precision: 18, scale: 2 }).default("0"),
  isIntercompany: boolean("is_intercompany").default(false),
  counterpartyCompanyId: varchar("counterparty_company_id").references(() => companies.id),
  eliminationGroupId: varchar("elimination_group_id"), // For consolidation elimination
  postedBy: varchar("posted_by").references(() => users.id),
  postedAt: timestamp("posted_at"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  companyEntryUnique: unique().on(table.companyId, table.entryNumber),
  companyIdx: index("journal_entries_company_idx").on(table.companyId),
  periodIdx: index("journal_entries_period_idx").on(table.fiscalPeriodId),
}));

// Journal entry lines
export const journalEntryLines = pgTable("journal_entry_lines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  journalEntryId: varchar("journal_entry_id").notNull().references(() => journalEntries.id),
  lineNumber: integer("line_number").notNull(),
  accountId: varchar("account_id").notNull().references(() => chartOfAccounts.id),
  description: text("description"),
  debit: decimal("debit", { precision: 18, scale: 2 }).default("0"),
  credit: decimal("credit", { precision: 18, scale: 2 }).default("0"),
  isIntercompany: boolean("is_intercompany").default(false),
  counterpartyCompanyId: varchar("counterparty_company_id").references(() => companies.id),
  counterpartyAccountId: varchar("counterparty_account_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  entryIdx: index("journal_lines_entry_idx").on(table.journalEntryId),
}));

// ============================================================================
// INVENTORY MANAGEMENT
// ============================================================================

// Stock levels per product/warehouse
export const stockLevels = pgTable("stock_levels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  warehouseId: varchar("warehouse_id").notNull().references(() => warehouses.id),
  quantityOnHand: decimal("quantity_on_hand", { precision: 18, scale: 4 }).default("0"),
  quantityReserved: decimal("quantity_reserved", { precision: 18, scale: 4 }).default("0"),
  quantityAvailable: decimal("quantity_available", { precision: 18, scale: 4 }).default("0"),
  quantityOnOrder: decimal("quantity_on_order", { precision: 18, scale: 4 }).default("0"),
  averageCost: decimal("average_cost", { precision: 18, scale: 4 }).default("0"),
  lastMovementDate: timestamp("last_movement_date"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  productWarehouseUnique: unique().on(table.companyId, table.productId, table.warehouseId),
  companyIdx: index("stock_levels_company_idx").on(table.companyId),
  productIdx: index("stock_levels_product_idx").on(table.productId),
  warehouseIdx: index("stock_levels_warehouse_idx").on(table.warehouseId),
}));

// Stock movements for audit trail
export const stockMovements = pgTable("stock_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  movementNumber: varchar("movement_number", { length: 30 }).notNull(),
  productId: varchar("product_id").notNull().references(() => products.id),
  warehouseId: varchar("warehouse_id").notNull().references(() => warehouses.id),
  movementType: varchar("movement_type", { length: 20 }).notNull(), // receipt, issue, transfer_in, transfer_out, adjustment
  movementDate: timestamp("movement_date").notNull().defaultNow(),
  quantity: decimal("quantity", { precision: 18, scale: 4 }).notNull(),
  unitCost: decimal("unit_cost", { precision: 18, scale: 4 }).default("0"),
  totalCost: decimal("total_cost", { precision: 18, scale: 4 }).default("0"),
  sourceDocument: varchar("source_document", { length: 50 }), // sales_order, purchase_order, delivery, goods_receipt, adjustment
  sourceDocumentId: varchar("source_document_id"),
  sourceDocumentNumber: varchar("source_document_number", { length: 30 }),
  reference: text("reference"),
  journalEntryId: varchar("journal_entry_id").references(() => journalEntries.id),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  companyMovementUnique: unique().on(table.companyId, table.movementNumber),
  companyIdx: index("stock_movements_company_idx").on(table.companyId),
  productIdx: index("stock_movements_product_idx").on(table.productId),
  warehouseIdx: index("stock_movements_warehouse_idx").on(table.warehouseId),
  sourceIdx: index("stock_movements_source_idx").on(table.sourceDocument, table.sourceDocumentId),
}));

// Stock reservations for sales orders
export const stockReservations = pgTable("stock_reservations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  salesOrderId: varchar("sales_order_id").notNull().references(() => salesOrders.id),
  salesOrderLineId: varchar("sales_order_line_id"),
  productId: varchar("product_id").notNull().references(() => products.id),
  warehouseId: varchar("warehouse_id").notNull().references(() => warehouses.id),
  quantityReserved: decimal("quantity_reserved", { precision: 18, scale: 4 }).notNull(),
  quantityFulfilled: decimal("quantity_fulfilled", { precision: 18, scale: 4 }).default("0"),
  status: varchar("status", { length: 20 }).default("active"), // active, fulfilled, cancelled
  reservedAt: timestamp("reserved_at").defaultNow(),
  fulfilledAt: timestamp("fulfilled_at"),
  createdBy: varchar("created_by").references(() => users.id),
}, (table) => ({
  salesOrderProductUnique: unique().on(table.salesOrderId, table.productId, table.warehouseId),
  companyIdx: index("stock_reservations_company_idx").on(table.companyId),
  salesOrderIdx: index("stock_reservations_so_idx").on(table.salesOrderId),
  productIdx: index("stock_reservations_product_idx").on(table.productId),
}));

// ============================================================================
// DELIVERIES / SHIPPING
// ============================================================================

// Delivery notes / Shipping documents
export const deliveries = pgTable("deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  deliveryNumber: varchar("delivery_number", { length: 30 }).notNull(),
  salesOrderId: varchar("sales_order_id").notNull().references(() => salesOrders.id),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  warehouseId: varchar("warehouse_id").notNull().references(() => warehouses.id),
  deliveryDate: timestamp("delivery_date").notNull().defaultNow(),
  status: varchar("status", { length: 20 }).default("draft"), // draft, shipped, delivered, cancelled
  shippingAddress: text("shipping_address"),
  shippingMethod: varchar("shipping_method", { length: 50 }),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  notes: text("notes"),
  journalEntryId: varchar("journal_entry_id").references(() => journalEntries.id),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  companyDeliveryUnique: unique().on(table.companyId, table.deliveryNumber),
  companyIdx: index("deliveries_company_idx").on(table.companyId),
  salesOrderIdx: index("deliveries_so_idx").on(table.salesOrderId),
  customerIdx: index("deliveries_customer_idx").on(table.customerId),
}));

// Delivery line items
export const deliveryLines = pgTable("delivery_lines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deliveryId: varchar("delivery_id").notNull().references(() => deliveries.id),
  lineNumber: integer("line_number").notNull(),
  productId: varchar("product_id").notNull().references(() => products.id),
  description: text("description"),
  quantityOrdered: decimal("quantity_ordered", { precision: 18, scale: 4 }).notNull(),
  quantityDelivered: decimal("quantity_delivered", { precision: 18, scale: 4 }).notNull(),
  unitCost: decimal("unit_cost", { precision: 18, scale: 4 }).default("0"),
  totalCost: decimal("total_cost", { precision: 18, scale: 4 }).default("0"),
  stockMovementId: varchar("stock_movement_id").references(() => stockMovements.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  deliveryIdx: index("delivery_lines_delivery_idx").on(table.deliveryId),
}));

// ============================================================================
// GOODS RECEIPTS (Purchase receiving)
// ============================================================================

export const goodsReceipts = pgTable("goods_receipts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  receiptNumber: varchar("receipt_number", { length: 30 }).notNull(),
  purchaseOrderId: varchar("purchase_order_id").notNull().references(() => purchaseOrders.id),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  warehouseId: varchar("warehouse_id").notNull().references(() => warehouses.id),
  receiptDate: timestamp("receipt_date").notNull().defaultNow(),
  status: varchar("status", { length: 20 }).default("draft"), // draft, received, cancelled
  notes: text("notes"),
  journalEntryId: varchar("journal_entry_id").references(() => journalEntries.id),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  companyReceiptUnique: unique().on(table.companyId, table.receiptNumber),
  companyIdx: index("goods_receipts_company_idx").on(table.companyId),
  purchaseOrderIdx: index("goods_receipts_po_idx").on(table.purchaseOrderId),
  vendorIdx: index("goods_receipts_vendor_idx").on(table.vendorId),
}));

export const goodsReceiptLines = pgTable("goods_receipt_lines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  goodsReceiptId: varchar("goods_receipt_id").notNull().references(() => goodsReceipts.id),
  lineNumber: integer("line_number").notNull(),
  productId: varchar("product_id").notNull().references(() => products.id),
  description: text("description"),
  quantityOrdered: decimal("quantity_ordered", { precision: 18, scale: 4 }).notNull(),
  quantityReceived: decimal("quantity_received", { precision: 18, scale: 4 }).notNull(),
  unitCost: decimal("unit_cost", { precision: 18, scale: 4 }).default("0"),
  totalCost: decimal("total_cost", { precision: 18, scale: 4 }).default("0"),
  stockMovementId: varchar("stock_movement_id").references(() => stockMovements.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  receiptIdx: index("goods_receipt_lines_receipt_idx").on(table.goodsReceiptId),
}));

// ============================================================================
// INVOICES (AR/AP)
// ============================================================================

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  invoiceNumber: varchar("invoice_number", { length: 30 }).notNull(),
  invoiceType: varchar("invoice_type", { length: 20 }).notNull(), // customer (AR), vendor (AP)
  customerId: varchar("customer_id").references(() => customers.id),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  salesOrderId: varchar("sales_order_id").references(() => salesOrders.id),
  purchaseOrderId: varchar("purchase_order_id").references(() => purchaseOrders.id),
  deliveryId: varchar("delivery_id").references(() => deliveries.id),
  goodsReceiptId: varchar("goods_receipt_id").references(() => goodsReceipts.id),
  invoiceDate: timestamp("invoice_date").notNull().defaultNow(),
  dueDate: timestamp("due_date"),
  fiscalPeriodId: varchar("fiscal_period_id").references(() => companyFiscalPeriods.id),
  status: varchar("status", { length: 20 }).default("draft"), // draft, posted, partially_paid, paid, cancelled
  subtotal: decimal("subtotal", { precision: 18, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 18, scale: 2 }).default("0"),
  total: decimal("total", { precision: 18, scale: 2 }).default("0"),
  amountPaid: decimal("amount_paid", { precision: 18, scale: 2 }).default("0"),
  amountDue: decimal("amount_due", { precision: 18, scale: 2 }).default("0"),
  currency: varchar("currency", { length: 3 }).default("IDR"),
  notes: text("notes"),
  journalEntryId: varchar("journal_entry_id").references(() => journalEntries.id),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  companyInvoiceUnique: unique().on(table.companyId, table.invoiceNumber),
  companyIdx: index("invoices_company_idx").on(table.companyId),
  customerIdx: index("invoices_customer_idx").on(table.customerId),
  vendorIdx: index("invoices_vendor_idx").on(table.vendorId),
  salesOrderIdx: index("invoices_so_idx").on(table.salesOrderId),
  purchaseOrderIdx: index("invoices_po_idx").on(table.purchaseOrderId),
}));

export const invoiceLines = pgTable("invoice_lines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id),
  lineNumber: integer("line_number").notNull(),
  productId: varchar("product_id").references(() => products.id),
  description: text("description"),
  quantity: decimal("quantity", { precision: 18, scale: 4 }).default("1"),
  unitPrice: decimal("unit_price", { precision: 18, scale: 4 }).default("0"),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  lineTotal: decimal("line_total", { precision: 18, scale: 2 }).default("0"),
  accountId: varchar("account_id").references(() => chartOfAccounts.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  invoiceIdx: index("invoice_lines_invoice_idx").on(table.invoiceId),
}));

// ============================================================================
// PAYMENTS
// ============================================================================

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  paymentNumber: varchar("payment_number", { length: 30 }).notNull(),
  paymentType: varchar("payment_type", { length: 20 }).notNull(), // receipt (from customer), payment (to vendor)
  customerId: varchar("customer_id").references(() => customers.id),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  paymentDate: timestamp("payment_date").notNull().defaultNow(),
  fiscalPeriodId: varchar("fiscal_period_id").references(() => companyFiscalPeriods.id),
  paymentMethod: varchar("payment_method", { length: 30 }), // cash, bank_transfer, check, credit_card
  bankAccountId: varchar("bank_account_id").references(() => chartOfAccounts.id),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("IDR"),
  exchangeRate: decimal("exchange_rate", { precision: 18, scale: 8 }).default("1"),
  reference: varchar("reference", { length: 100 }),
  notes: text("notes"),
  status: varchar("status", { length: 20 }).default("draft"), // draft, posted, cancelled
  journalEntryId: varchar("journal_entry_id").references(() => journalEntries.id),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  companyPaymentUnique: unique().on(table.companyId, table.paymentNumber),
  companyIdx: index("payments_company_idx").on(table.companyId),
  customerIdx: index("payments_customer_idx").on(table.customerId),
  vendorIdx: index("payments_vendor_idx").on(table.vendorId),
}));

// Payment applications to invoices
export const paymentApplications = pgTable("payment_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  paymentId: varchar("payment_id").notNull().references(() => payments.id),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id),
  amountApplied: decimal("amount_applied", { precision: 18, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  paymentIdx: index("payment_applications_payment_idx").on(table.paymentId),
  invoiceIdx: index("payment_applications_invoice_idx").on(table.invoiceId),
}));

// ============================================================================
// AR/AP LEDGER
// ============================================================================

export const arApLedger = pgTable("ar_ap_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  ledgerType: varchar("ledger_type", { length: 10 }).notNull(), // AR, AP
  customerId: varchar("customer_id").references(() => customers.id),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  transactionDate: timestamp("transaction_date").notNull().defaultNow(),
  transactionType: varchar("transaction_type", { length: 20 }).notNull(), // invoice, payment, credit_memo, debit_memo
  documentId: varchar("document_id").notNull(),
  documentNumber: varchar("document_number", { length: 30 }).notNull(),
  description: text("description"),
  debitAmount: decimal("debit_amount", { precision: 18, scale: 2 }).default("0"),
  creditAmount: decimal("credit_amount", { precision: 18, scale: 2 }).default("0"),
  runningBalance: decimal("running_balance", { precision: 18, scale: 2 }).default("0"),
  currency: varchar("currency", { length: 3 }).default("IDR"),
  journalEntryId: varchar("journal_entry_id").references(() => journalEntries.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  companyIdx: index("ar_ap_ledger_company_idx").on(table.companyId),
  customerIdx: index("ar_ap_ledger_customer_idx").on(table.customerId),
  vendorIdx: index("ar_ap_ledger_vendor_idx").on(table.vendorId),
  dateIdx: index("ar_ap_ledger_date_idx").on(table.transactionDate),
}));

// ============================================================================
// DOCUMENT SEQUENCES
// ============================================================================

export const documentSequences = pgTable("document_sequences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  documentType: varchar("document_type", { length: 30 }).notNull(), // SO, PO, INV, PAY, DEL, GR, JE, SM
  prefix: varchar("prefix", { length: 10 }),
  suffix: varchar("suffix", { length: 10 }),
  currentNumber: integer("current_number").notNull().default(0),
  numberLength: integer("number_length").default(6),
  fiscalYear: integer("fiscal_year"),
  resetAnnually: boolean("reset_annually").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  companyDocTypeUnique: unique().on(table.companyId, table.documentType, table.fiscalYear),
  companyIdx: index("document_sequences_company_idx").on(table.companyId),
}));

// ============================================================================
// CONSOLIDATION
// ============================================================================

// Currency exchange rates for consolidation
export const exchangeRates = pgTable("exchange_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromCurrency: varchar("from_currency", { length: 3 }).notNull(),
  toCurrency: varchar("to_currency", { length: 3 }).notNull(),
  rate: decimal("rate", { precision: 18, scale: 8 }).notNull(),
  rateType: varchar("rate_type", { length: 20 }).default("spot"), // spot, average, closing
  effectiveDate: timestamp("effective_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  currencyDateUnique: unique().on(table.fromCurrency, table.toCurrency, table.rateType, table.effectiveDate),
}));

// Consolidation runs/snapshots
export const consolidationRuns = pgTable("consolidation_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentCompanyId: varchar("parent_company_id").notNull().references(() => companies.id),
  runDate: timestamp("run_date").notNull().defaultNow(),
  asOfDate: timestamp("as_of_date").notNull(),
  fiscalPeriodId: varchar("fiscal_period_id"),
  includedCompanyIds: jsonb("included_company_ids").notNull(), // Array of company IDs
  rateSetId: varchar("rate_set_id"),
  status: varchar("status", { length: 20 }).default("draft"), // draft, completed, approved
  consolidatedData: jsonb("consolidated_data"), // Snapshot of consolidated TB/FS
  eliminationEntries: jsonb("elimination_entries"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
});

// ============================================================================
// INSERT SCHEMAS & TYPES
// ============================================================================

// Company schemas
// Insert schema with strict validation for 3-level hierarchy
const baseInsertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  // Level and path are auto-calculated based on parent, don't allow client to set
  level: true,
  path: true,
});

// Enforce only valid company types
export const insertCompanySchema = baseInsertCompanySchema.extend({
  companyType: z.enum([COMPANY_TYPES.HOLDING, COMPANY_TYPES.SUBSIDIARY, COMPANY_TYPES.BRANCH]),
  // Path is optional - will be auto-calculated if not provided
  path: z.string().optional(),
});
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

// Company Settings schemas
export const insertCompanySettingsSchema = createInsertSchema(companySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;
export type CompanySettings = typeof companySettings.$inferSelect;

// Fiscal Period schemas
export const insertFiscalPeriodSchema = createInsertSchema(companyFiscalPeriods).omit({
  id: true,
  createdAt: true,
});
export type InsertFiscalPeriod = z.infer<typeof insertFiscalPeriodSchema>;
export type FiscalPeriod = typeof companyFiscalPeriods.$inferSelect;

// Role schemas
export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
});
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof roles.$inferSelect;

// User schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// User Company Role schemas
export const insertUserCompanyRoleSchema = createInsertSchema(userCompanyRoles).omit({
  id: true,
  grantedAt: true,
});
export type InsertUserCompanyRole = z.infer<typeof insertUserCompanyRoleSchema>;
export type UserCompanyRole = typeof userCompanyRoles.$inferSelect;

// Refresh Token schemas
export const insertRefreshTokenSchema = createInsertSchema(refreshTokens).omit({
  id: true,
  issuedAt: true,
});
export type InsertRefreshToken = z.infer<typeof insertRefreshTokenSchema>;
export type RefreshToken = typeof refreshTokens.$inferSelect;

// Auth Audit Log schemas
export const insertAuthAuditLogSchema = createInsertSchema(authAuditLog).omit({
  id: true,
  createdAt: true,
});
export type InsertAuthAuditLog = z.infer<typeof insertAuthAuditLogSchema>;
export type AuthAuditLog = typeof authAuditLog.$inferSelect;

// Chart of Accounts schemas
export const insertAccountSchema = createInsertSchema(chartOfAccounts).omit({
  id: true,
  createdAt: true,
});
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof chartOfAccounts.$inferSelect;

// Warehouse schemas
export const insertWarehouseSchema = createInsertSchema(warehouses).omit({
  id: true,
  createdAt: true,
});
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type Warehouse = typeof warehouses.$inferSelect;

// Product schemas
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Customer schemas
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Vendor schemas
export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendors.$inferSelect;

// Employee schemas
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

// Tax schemas
export const insertTaxSchema = createInsertSchema(taxes).omit({
  id: true,
  createdAt: true,
});
export type InsertTax = z.infer<typeof insertTaxSchema>;
export type Tax = typeof taxes.$inferSelect;

// Sales Order schemas
export const insertSalesOrderSchema = createInsertSchema(salesOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSalesOrder = z.infer<typeof insertSalesOrderSchema>;
export type SalesOrder = typeof salesOrders.$inferSelect;

// Purchase Order schemas
export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;

// Intercompany Transfer schemas
export const insertIntercompanyTransferSchema = createInsertSchema(intercompanyTransfers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertIntercompanyTransfer = z.infer<typeof insertIntercompanyTransferSchema>;
export type IntercompanyTransfer = typeof intercompanyTransfers.$inferSelect;

// Journal Entry schemas
export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  createdAt: true,
});
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;

// Journal Entry Line schemas
export const insertJournalEntryLineSchema = createInsertSchema(journalEntryLines).omit({
  id: true,
  createdAt: true,
});
export type InsertJournalEntryLine = z.infer<typeof insertJournalEntryLineSchema>;
export type JournalEntryLine = typeof journalEntryLines.$inferSelect;

// Stock Level schemas
export const insertStockLevelSchema = createInsertSchema(stockLevels).omit({
  id: true,
  updatedAt: true,
});
export type InsertStockLevel = z.infer<typeof insertStockLevelSchema>;
export type StockLevel = typeof stockLevels.$inferSelect;

// Stock Movement schemas
export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({
  id: true,
  createdAt: true,
});
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type StockMovement = typeof stockMovements.$inferSelect;

// Stock Reservation schemas
export const insertStockReservationSchema = createInsertSchema(stockReservations).omit({
  id: true,
  reservedAt: true,
});
export type InsertStockReservation = z.infer<typeof insertStockReservationSchema>;
export type StockReservation = typeof stockReservations.$inferSelect;

// Delivery schemas
export const insertDeliverySchema = createInsertSchema(deliveries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;
export type Delivery = typeof deliveries.$inferSelect;

// Delivery Line schemas
export const insertDeliveryLineSchema = createInsertSchema(deliveryLines).omit({
  id: true,
  createdAt: true,
});
export type InsertDeliveryLine = z.infer<typeof insertDeliveryLineSchema>;
export type DeliveryLine = typeof deliveryLines.$inferSelect;

// Goods Receipt schemas
export const insertGoodsReceiptSchema = createInsertSchema(goodsReceipts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertGoodsReceipt = z.infer<typeof insertGoodsReceiptSchema>;
export type GoodsReceipt = typeof goodsReceipts.$inferSelect;

// Goods Receipt Line schemas
export const insertGoodsReceiptLineSchema = createInsertSchema(goodsReceiptLines).omit({
  id: true,
  createdAt: true,
});
export type InsertGoodsReceiptLine = z.infer<typeof insertGoodsReceiptLineSchema>;
export type GoodsReceiptLine = typeof goodsReceiptLines.$inferSelect;

// Invoice schemas
export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// Invoice Line schemas
export const insertInvoiceLineSchema = createInsertSchema(invoiceLines).omit({
  id: true,
  createdAt: true,
});
export type InsertInvoiceLine = z.infer<typeof insertInvoiceLineSchema>;
export type InvoiceLine = typeof invoiceLines.$inferSelect;

// Payment schemas
export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Payment Application schemas
export const insertPaymentApplicationSchema = createInsertSchema(paymentApplications).omit({
  id: true,
  createdAt: true,
});
export type InsertPaymentApplication = z.infer<typeof insertPaymentApplicationSchema>;
export type PaymentApplication = typeof paymentApplications.$inferSelect;

// AR/AP Ledger schemas
export const insertArApLedgerSchema = createInsertSchema(arApLedger).omit({
  id: true,
  createdAt: true,
});
export type InsertArApLedger = z.infer<typeof insertArApLedgerSchema>;
export type ArApLedger = typeof arApLedger.$inferSelect;

// Document Sequence schemas
export const insertDocumentSequenceSchema = createInsertSchema(documentSequences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDocumentSequence = z.infer<typeof insertDocumentSequenceSchema>;
export type DocumentSequence = typeof documentSequences.$inferSelect;

// Exchange Rate schemas
export const insertExchangeRateSchema = createInsertSchema(exchangeRates).omit({
  id: true,
  createdAt: true,
});
export type InsertExchangeRate = z.infer<typeof insertExchangeRateSchema>;
export type ExchangeRate = typeof exchangeRates.$inferSelect;

// Consolidation Run schemas
export const insertConsolidationRunSchema = createInsertSchema(consolidationRuns).omit({
  id: true,
  createdAt: true,
});
export type InsertConsolidationRun = z.infer<typeof insertConsolidationRunSchema>;
export type ConsolidationRun = typeof consolidationRuns.$inferSelect;

// Shared Access schemas
export const insertSharedAccessSchema = createInsertSchema(sharedAccess).omit({
  id: true,
  grantedAt: true,
});
export type InsertSharedAccess = z.infer<typeof insertSharedAccessSchema>;
export type SharedAccess = typeof sharedAccess.$inferSelect;

// ============================================================================
// HELPER TYPES FOR MULTI-COMPANY CONTEXT
// ============================================================================

// Access rules based on company level
export interface HierarchyAccessRules {
  // Branch (level 3): Can only see its own data
  // Subsidiary (level 2): Can see its own data + all its Branches
  // Holding (level 1): Can see all Subsidiaries and their Branches for consolidation
  canViewCompanyData(viewerCompanyId: string, targetCompanyId: string): boolean;
  getAccessibleCompanyIds(): string[];
  canPerformConsolidation(): boolean;
  canPerformIntercompanyTransaction(targetCompanyId: string): boolean;
}

export interface CompanyContext {
  activeCompanyId: string;
  activeCompany: Company;
  userCompanies: Company[];
  permissions: string[];
  role: Role | null;
  // Hierarchy-aware access
  companyLevel: CompanyLevel;
  accessibleCompanyIds: string[]; // IDs of companies this user can view data for
  canConsolidate: boolean; // Only Holding and Subsidiary can consolidate
  parentCompany: Company | null; // Parent in hierarchy
  childCompanies: Company[]; // Direct children in hierarchy
}

export interface CompanyHierarchyNode {
  company: Company;
  children: CompanyHierarchyNode[];
  level: number;
}

// Helper to validate company type matches level
export function getCompanyTypeForLevel(level: number): CompanyType {
  switch (level) {
    case 1: return COMPANY_TYPES.HOLDING;
    case 2: return COMPANY_TYPES.SUBSIDIARY;
    case 3: return COMPANY_TYPES.BRANCH;
    default: throw new Error(`Invalid company level: ${level}. Must be 1 (Holding), 2 (Subsidiary), or 3 (Branch)`);
  }
}

// Helper to get level for company type
export function getLevelForCompanyType(type: string): CompanyLevel {
  switch (type) {
    case COMPANY_TYPES.HOLDING: return COMPANY_LEVELS.HOLDING;
    case COMPANY_TYPES.SUBSIDIARY: return COMPANY_LEVELS.SUBSIDIARY;
    case COMPANY_TYPES.BRANCH: return COMPANY_LEVELS.BRANCH;
    default: throw new Error(`Invalid company type: ${type}. Must be holding, subsidiary, or branch`);
  }
}

// ============================================================================
// JWT AUTHENTICATION TYPES
// ============================================================================

// JWT Access Token Payload (short-lived, 15 min)
export interface JWTAccessTokenPayload {
  userId: string;
  username: string;
  activeCompanyId: string;
  roleId: string | null;
  allowedCompanyIds: string[]; // Hierarchy-derived accessible companies
  companyLevel: CompanyLevel;
  permissions: string[];
  iat?: number;  // Issued at
  exp?: number;  // Expiration
  jti?: string;  // JWT ID for tracking
}

// JWT Refresh Token Payload (long-lived, 7 days)
export interface JWTRefreshTokenPayload {
  userId: string;
  tokenId: string; // Links to refreshTokens table
  tokenVersion: number; // For rotation
  iat?: number;
  exp?: number;
}

// Auth request context attached to Express request
export interface AuthContext {
  user: User;
  role: Role | null;
  activeCompanyId: string;
  activeCompany: Company;
  allowedCompanyIds: string[]; // Hierarchy-derived
  companyLevel: CompanyLevel;
  permissions: string[];
  canConsolidate: boolean;
  isAuthenticated: true;
}

// Login request schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  companyId: z.string().optional(), // Optional: specific company to log into
});
export type LoginRequest = z.infer<typeof loginSchema>;

// Login response
export interface LoginResponse {
  accessToken: string;
  expiresIn: number; // seconds
  user: {
    id: string;
    username: string;
    email: string | null;
    fullName: string | null;
  };
  activeCompany: {
    id: string;
    code: string;
    name: string;
    companyType: string;
    level: number;
  };
  role: {
    id: string;
    name: string;
    permissions: string[];
  } | null;
  allowedCompanyIds: string[];
  companyLevel: CompanyLevel;
  canConsolidate: boolean;
}

// Token refresh response
export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

// Auth event types for audit logging
export const AUTH_EVENTS = {
  LOGIN: "login",
  LOGIN_FAILED: "login_failed",
  LOGOUT: "logout",
  REFRESH: "refresh",
  REFRESH_FAILED: "refresh_failed",
  TOKEN_REVOKED: "token_revoked",
  COMPANY_SWITCHED: "company_switched",
  PASSWORD_CHANGED: "password_changed",
} as const;
export type AuthEventType = typeof AUTH_EVENTS[keyof typeof AUTH_EVENTS];
