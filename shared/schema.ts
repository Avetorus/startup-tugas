import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, jsonb, unique, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// MULTI-COMPANY CORE TABLES
// ============================================================================

// Companies table - supports hierarchical structure with unlimited depth
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: text("name").notNull(),
  legalName: text("legal_name"),
  taxId: varchar("tax_id", { length: 50 }),
  parentId: varchar("parent_id").references((): any => companies.id),
  path: text("path").notNull(), // Materialized path for hierarchy (e.g., "ROOT/PARENT/CHILD")
  level: integer("level").notNull().default(1), // Depth level in hierarchy
  companyType: varchar("company_type", { length: 50 }).notNull().default("subsidiary"), // holding, subsidiary, branch, division
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
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
export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export interface CompanyContext {
  activeCompanyId: string;
  activeCompany: Company;
  userCompanies: Company[];
  permissions: string[];
  role: Role | null;
}

export interface CompanyHierarchyNode {
  company: Company;
  children: CompanyHierarchyNode[];
  level: number;
}
