import { db, pool } from "./db";
import { 
  companies, users, roles, userCompanyRoles, chartOfAccounts, warehouses 
} from "@shared/schema";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // Check if already seeded
  const existingCompanies = await db.select().from(companies).limit(1);
  if (existingCompanies.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  // Create roles
  console.log("Creating roles...");
  const adminRole = await db.insert(roles).values({
    id: "role-admin",
    code: "ADMIN",
    name: "Administrator",
    description: "Full system access",
    isSystemRole: true,
    permissions: ["*"],
    createdAt: new Date(),
  }).returning().then(r => r[0]);

  const managerRole = await db.insert(roles).values({
    id: "role-manager",
    code: "MANAGER",
    name: "Manager",
    description: "Department manager access",
    isSystemRole: true,
    permissions: ["read:*", "write:*", "delete:own"],
    createdAt: new Date(),
  }).returning().then(r => r[0]);

  const userRole = await db.insert(roles).values({
    id: "role-user",
    code: "USER",
    name: "User",
    description: "Standard user access",
    isSystemRole: true,
    permissions: ["read:*", "write:own"],
    createdAt: new Date(),
  }).returning().then(r => r[0]);

  // Create companies
  console.log("Creating companies...");
  const holdingCompany = await db.insert(companies).values({
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
    consolidationEnabled: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning().then(r => r[0]);

  const usSubsidiary = await db.insert(companies).values({
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
    consolidationEnabled: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning().then(r => r[0]);

  const euSubsidiary = await db.insert(companies).values({
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
    consolidationEnabled: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning().then(r => r[0]);

  const ukBranch = await db.insert(companies).values({
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
    country: "GB",
    postalCode: "EC1A 1BB",
    phone: "+44-20-555-0400",
    email: "uk@unanza.com",
    consolidationEnabled: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning().then(r => r[0]);

  const asiaPacific = await db.insert(companies).values({
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
    country: "SG",
    postalCode: "048616",
    phone: "+65-6555-0500",
    email: "apac@unanza.com",
    consolidationEnabled: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning().then(r => r[0]);

  // Create users
  console.log("Creating users...");
  const adminPasswordHash = bcrypt.hashSync("admin123", 10);
  const adminUser = await db.insert(users).values({
    id: "user-admin",
    username: "admin",
    password: adminPasswordHash,
    email: "admin@unanza.com",
    fullName: "System Administrator",
    defaultCompanyId: "comp-holding",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning().then(r => r[0]);

  const managerPasswordHash = bcrypt.hashSync("password", 10);
  const managerUser = await db.insert(users).values({
    id: "user-manager",
    username: "john.manager",
    password: managerPasswordHash,
    email: "john.manager@unanza.com",
    fullName: "John Manager",
    defaultCompanyId: "comp-us",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning().then(r => r[0]);

  const accountantPasswordHash = bcrypt.hashSync("password", 10);
  const accountantUser = await db.insert(users).values({
    id: "user-accountant",
    username: "jane.accountant",
    password: accountantPasswordHash,
    email: "jane.accountant@unanza.com",
    fullName: "Jane Accountant",
    defaultCompanyId: "comp-eu",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning().then(r => r[0]);

  // Assign admin to all companies
  console.log("Creating user-company role assignments...");
  const companyList = [holdingCompany, usSubsidiary, euSubsidiary, ukBranch, asiaPacific];
  for (let i = 0; i < companyList.length; i++) {
    await db.insert(userCompanyRoles).values({
      id: `ucr-admin-${companyList[i].id}`,
      userId: adminUser.id,
      companyId: companyList[i].id,
      roleId: adminRole.id,
      isDefault: i === 0,
      grantedAt: new Date(),
      isActive: true,
    });
  }

  // Assign manager to US subsidiary
  await db.insert(userCompanyRoles).values({
    id: "ucr-manager-comp-us",
    userId: managerUser.id,
    companyId: usSubsidiary.id,
    roleId: managerRole.id,
    isDefault: true,
    grantedAt: new Date(),
    grantedBy: adminUser.id,
    isActive: true,
  });

  // Assign accountant to EU subsidiary
  await db.insert(userCompanyRoles).values({
    id: "ucr-accountant-comp-eu",
    userId: accountantUser.id,
    companyId: euSubsidiary.id,
    roleId: userRole.id,
    isDefault: true,
    grantedAt: new Date(),
    grantedBy: adminUser.id,
    isActive: true,
  });

  // Seed Chart of Accounts for holding company
  console.log("Creating chart of accounts...");
  const seedAccounts = [
    { id: "acc-assets", accountCode: "1000", name: "Assets", accountType: "asset", level: 1, parentId: null, balance: "0", isPostable: false },
    { id: "acc-cash", accountCode: "1100", name: "Cash and Cash Equivalents", accountType: "asset", level: 2, parentId: "acc-assets", balance: "50000", isPostable: true },
    { id: "acc-receivables", accountCode: "1200", name: "Accounts Receivable", accountType: "asset", level: 2, parentId: "acc-assets", balance: "25000", isPostable: true },
    { id: "acc-liabilities", accountCode: "2000", name: "Liabilities", accountType: "liability", level: 1, parentId: null, balance: "0", isPostable: false },
    { id: "acc-payables", accountCode: "2100", name: "Accounts Payable", accountType: "liability", level: 2, parentId: "acc-liabilities", balance: "15000", isPostable: true },
    { id: "acc-equity", accountCode: "3000", name: "Equity", accountType: "equity", level: 1, parentId: null, balance: "100000", isPostable: true },
    { id: "acc-revenue", accountCode: "4000", name: "Revenue", accountType: "revenue", level: 1, parentId: null, balance: "0", isPostable: false },
    { id: "acc-sales", accountCode: "4100", name: "Sales Revenue", accountType: "revenue", level: 2, parentId: "acc-revenue", balance: "250000", isPostable: true },
    { id: "acc-expenses", accountCode: "5000", name: "Expenses", accountType: "expense", level: 1, parentId: null, balance: "0", isPostable: false },
    { id: "acc-operating", accountCode: "5100", name: "Operating Expenses", accountType: "expense", level: 2, parentId: "acc-expenses", balance: "75000", isPostable: true },
  ];

  for (const acc of seedAccounts) {
    await db.insert(chartOfAccounts).values({
      ...acc,
      companyId: holdingCompany.id,
      isActive: true,
      createdAt: new Date(),
    });
  }

  // Seed Warehouses for holding company
  console.log("Creating warehouses...");
  await db.insert(warehouses).values({
    id: "wh-main",
    companyId: holdingCompany.id,
    code: "WH-MAIN",
    name: "Main Warehouse",
    warehouseType: "standard",
    address: "Jl. Industri No. 1",
    city: "Jakarta",
    state: "DKI Jakarta",
    country: "ID",
    isActive: true,
    allowNegativeStock: false,
    createdAt: new Date(),
  });

  await db.insert(warehouses).values({
    id: "wh-distribution",
    companyId: holdingCompany.id,
    code: "WH-DIST",
    name: "Distribution Center",
    warehouseType: "standard",
    address: "Jl. Logistik No. 2",
    city: "Surabaya",
    state: "Jawa Timur",
    country: "ID",
    isActive: true,
    allowNegativeStock: false,
    createdAt: new Date(),
  });

  console.log("Database seeding completed!");
}

seed()
  .then(() => {
    console.log("Seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
