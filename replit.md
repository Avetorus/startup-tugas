# Unanza ERP System

## Overview
Unanza is a comprehensive multi-tenant enterprise ERP system with hierarchical multi-company architecture. Built with React, Express, and TypeScript using a modern full-stack architecture.

## Key Features

### Multi-Company Architecture
- **Hierarchical Structure**: Supports unlimited depth company hierarchies using path/ltree pattern
- **Company Types**: Holding, Subsidiary, Branch, Division
- **Company Switching**: Real-time company context switching with cache invalidation
- **Data Segregation**: Strict data isolation via company_id filters on all entities
- **Inter-Company Transactions**: Support for IC sales orders, IC purchases, IC stock transfers

### Modules
1. **Sales**: Sales Orders, Customers, Deliveries, Invoices
2. **Warehouse**: Products, Locations, Stock Levels, Movements, Purchase Orders
3. **Financials**: Journal Entries, Chart of Accounts (3-level hierarchy), AR/AP
4. **HR**: Employees, Attendance, Leave Requests, Payroll
5. **System**: Companies, Users & Roles, Vendor Portal, Customer Portal, Settings

### Role-Based Access Control
- Granular permissions system (read/write per module)
- User-Company-Role assignments
- System roles vs custom roles
- Wildcard permissions support

## Project Structure

```
/
├── client/src/
│   ├── components/
│   │   ├── layout/          # AppSidebar, ThemeToggle
│   │   ├── sales/           # Sales module components
│   │   ├── warehouse/       # Warehouse module components
│   │   ├── financials/      # Financial module components
│   │   ├── hr/              # HR module components
│   │   ├── system/          # System admin components
│   │   ├── reports/         # Reporting components
│   │   └── CompanySwitcher.tsx  # Company context switcher
│   ├── contexts/
│   │   ├── ThemeContext.tsx     # Dark/light theme provider
│   │   └── CompanyContext.tsx   # Active company state management
│   ├── lib/
│   │   ├── queryClient.ts       # TanStack Query with company headers
│   │   └── mockData.ts          # Mock data for demo
│   └── pages/                   # Route pages
├── server/
│   ├── index.ts             # Express server entry
│   ├── routes.ts            # API endpoints
│   ├── storage.ts           # IStorage interface & MemStorage (legacy)
│   ├── database-storage.ts  # DatabaseStorage (PostgreSQL + Drizzle ORM)
│   ├── db.ts                # Database connection pool
│   ├── seed.ts              # Database seed script for demo data
│   ├── auth.ts              # JWT authentication middleware
│   └── vite.ts              # Vite dev server integration
├── shared/
│   └── schema.ts            # Drizzle schema & types
└── design_guidelines.md     # UI/UX design specifications
```

## Database Schema

### Multi-Company Tables
- `companies` - Company hierarchy with parent-child relationships
- `company_settings` - Per-company configuration
- `company_fiscal_periods` - Fiscal year periods
- `user_company_roles` - User-company-role assignments
- `roles` - Permission roles
- `permissions` - Granular permissions
- `shared_access` - Cross-company data sharing

### Master Data Tables (Company-Scoped)
- `chart_of_accounts` - 3-level account hierarchy
- `warehouses` - Stock locations
- `products` - Product catalog
- `customers` - Customer master
- `vendors` - Vendor master
- `taxes` - Tax configurations

### Transaction Tables
- `sales_orders`, `sales_order_lines`
- `purchase_orders`, `purchase_order_lines`
- `stock_movements`
- `journal_entries`, `journal_lines`
- `interco_transactions` - Inter-company transactions
- `interco_stock_transfers` - IC stock movements
- `elimination_entries` - Consolidation eliminations

## API Endpoints

### Company Context
- `GET /api/session/context` - Get current user/company context
- `POST /api/session/switch-company` - Switch active company

### Companies
- `GET /api/companies` - List all companies
- `GET /api/companies/hierarchy` - Get company tree
- `POST /api/companies` - Create company
- `PATCH /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### User & Roles
- `GET /api/roles` - List roles
- `POST /api/roles` - Create role
- `GET /api/user-company-roles` - List assignments
- `POST /api/user-company-roles` - Assign role

### Company-Scoped Master Data
- `GET /api/companies/:companyId/accounts` - Chart of Accounts
- `POST /api/companies/:companyId/accounts` - Create account
- `PATCH /api/companies/:companyId/accounts/:accountId` - Update account
- `DELETE /api/companies/:companyId/accounts/:accountId` - Delete account
- `GET /api/companies/:companyId/warehouses` - Warehouses
- `GET /api/companies/:companyId/products` - Products
- `GET /api/companies/:companyId/customers` - Customers
- `GET /api/companies/:companyId/vendors` - Vendors
- `GET /api/companies/:companyId/taxes` - Tax configurations
- `GET /api/companies/:companyId/fiscal-periods` - Fiscal periods

### Inter-Company Transactions
- `GET /api/companies/:companyId/intercompany-transfers` - List IC transfers
- `POST /api/companies/:companyId/intercompany-transfers` - Create IC transfer
- `PATCH /api/intercompany-transfers/:id` - Update IC transfer status
- `GET /api/intercompany-transfers/:id` - Get single IC transfer

### Consolidation
- `GET /api/companies/:companyId/consolidation/trial-balance` - Consolidated trial balance
- `GET /api/companies/:companyId/consolidation/eliminations` - Elimination entries

### Module Endpoints
All endpoints include company context via `x-company-id` header.

## Design System

### Theme
- IBM Plex Sans font family
- Carbon Design System inspired
- Dark/light mode support

### Colors
- Primary: Blue accent
- Destructive: Red for errors
- Muted: Gray tones for secondary content

### Components
- Shadcn/ui component library
- Radix UI primitives
- Lucide React icons

## User Preferences
- Carbon Design System styling
- Enterprise-focused UI/UX
- Professional, clean aesthetics
- Accessibility compliant

## Authentication System

### JWT Authentication
- **Access Tokens**: 15-minute stateless tokens with user/company/role claims
- **Refresh Tokens**: 7-day tokens with rotation, stored in httpOnly cookies
- **Password Security**: bcrypt hashing (salt rounds 10)
- **Hierarchy-Based Access**: allowedCompanyIds computed from company level

### Auth Endpoints
- `POST /api/auth/login` - Authenticate with username/password
- `POST /api/auth/refresh` - Rotate access token
- `POST /api/auth/logout` - Revoke refresh token
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/switch-company` - Change active company

### Demo Credentials
- Admin: `admin` / `admin123` (Holding level - sees all)
- Manager: `john.manager` / `password` (Subsidiary level)
- Accountant: `jane.accountant` / `password` (EU Subsidiary)

## First-Time Setup Flow

### Setup Wizard (Dedicated Routes)
When the system starts with no data, users are guided through a dedicated setup flow:

1. **`/setup`** - Entry point that checks system status and routes appropriately
2. **`/setup/company`** - Company registration (name, code, currency, timezone, address)
3. **`/setup/admin-user`** - Super Admin account creation linked to the company
4. **Completion** - Setup pages are permanently locked and user is redirected to login

### Setup Locking
Once the system is initialized (company + admin created):
- All setup routes (`/setup`, `/setup/company`, `/setup/admin-user`) show a "Setup Complete" lock screen
- Automatic redirect to `/login` after 3 seconds
- This prevents accidental reconfiguration of the ERP foundation

### Setup Endpoints (Public)
- `GET /api/setup/status` - Check system status; returns `pendingCompany` when admin setup is needed
- `POST /api/setup/company` - Create first company (only when no companies exist)
- `POST /api/setup/admin` - Create first admin (only after company exists, no users)

### Page Refresh Resilience
The admin step fetches the pending company ID from the API (`setupStatus.pendingCompany`), not just sessionStorage, ensuring the setup flow survives page refreshes.

### Post-Login Onboarding
Dashboard shows onboarding checklist with tasks:
- Set up Chart of Accounts
- Create Warehouses
- Add Team Members
- Add Subsidiaries/Branches
- Configure User Roles
- Review Settings

## Database Commands

```bash
# Push schema changes to database
npm run db:push

# Seed database with demo data
npx tsx server/seed.ts
```

## Recent Changes
- 2025-12-06: MAJOR: Migrated from in-memory storage (MemStorage) to PostgreSQL (DatabaseStorage)
- 2025-12-06: Created DatabaseStorage class implementing full IStorage interface with Drizzle ORM
- 2025-12-06: Created seed.ts for initial demo data (companies, users, roles, accounts, warehouses)
- 2025-12-06: Improved company switching - query keys now include activeCompanyId for proper cache management
- 2025-12-06: Fixed Settings page to use real company data with PATCH mutation
- 2025-12-06: Added /settings redirect to /system/settings for convenience
- 2025-12-06: Fixed critical security vulnerability - sanitized all PATCH routes to prevent cross-company data tampering
- 2025-12-06: Added Journal Entries API routes with full CRUD support
- 2025-12-06: Converted all master data components to use real API data (Warehouses, Products, Customers, Vendors)
- 2025-12-06: Added complete CRUD routes for Sales Orders (POST, PATCH, DELETE)
- 2025-12-06: Added complete CRUD routes for Purchase Orders (POST, PATCH, DELETE)
- 2025-12-06: Added PATCH/DELETE routes for Taxes with company scoping validation
- 2025-12-06: Created VendorList component with TanStack Query integration
- 2025-12-06: Added Warehouses navigation item to sidebar under Warehouse module
- 2025-12-06: Enhanced setup wizard with dedicated URL routes (/setup/company, /setup/admin-user)
- 2025-12-06: Added setup page locking to prevent reconfiguration after initialization
- 2025-12-06: Implemented first-time setup wizard (company registration + admin creation)
- 2025-12-06: Added onboarding checklist to dashboard for post-setup tasks
- 2025-12-06: Implemented JWT authentication with refresh token rotation
- 2025-12-06: Added hierarchy-based access control via allowedCompanyIds
- 2025-12-06: Secured all API routes with JWT middleware (except auth endpoints)
- 2025-12-05: Implemented multi-company architecture with unlimited depth hierarchy
- 2025-12-05: Added company switcher to header with hierarchy visualization
- 2025-12-05: Created Company Management module (CRUD, hierarchy display)
- 2025-12-05: Added User & Role Management module (assignments, permissions)
- 2025-12-05: Implemented company context with cache invalidation on switch
- 2025-12-05: Added Inter-Company Transactions module (IC transfers, sales, purchases)
- 2025-12-05: Created Consolidation Reports module (trial balance, eliminations, by entity)
- 2025-12-05: Added session/context and session/switch-company endpoints
- 2025-12-05: Implemented consolidation API endpoints for multi-company reporting

## Implementation Status

### Complete (Using Real API Data)
- Chart of Accounts: Full CRUD with 3-level hierarchy
- Warehouses: Full CRUD with type support (standard, transit, virtual)
- Products: Full CRUD with inventory settings
- Customers: Full CRUD with credit management
- Vendors: Full CRUD with payment terms
- Taxes: Full CRUD with rate configuration
- Employees: Full CRUD with auto-generated employee numbers
- Journal Entries: Full CRUD with company scoping
- Sales Orders: Full CRUD with company scoping
- Purchase Orders: Full CRUD with company scoping

### API Pattern
All master data uses consistent company-scoped endpoints:
- GET `/api/companies/:companyId/{entity}` - List all
- POST `/api/companies/:companyId/{entity}` - Create new
- PATCH `/api/companies/:companyId/{entity}/:id` - Update existing
- DELETE `/api/companies/:companyId/{entity}/:id` - Delete

All endpoints validate company ownership before mutations.

## Security: Multi-Tenant Isolation

### PATCH Route Sanitization Pattern
All PATCH routes sanitize request bodies to prevent cross-company data tampering:
1. Validate company ownership of the target entity
2. Destructure to extract and discard ownership fields (`companyId`, `id`, and entity-specific immutable fields)
3. Pass only sanitized updates to storage methods

```typescript
// Example pattern used in all PATCH routes:
const { companyId, id, ...sanitizedUpdates } = req.body;
const updated = await storage.updateEntity(id, sanitizedUpdates);
```

### Protected Fields by Entity
- **All entities**: `companyId`, `id`
- **Employees**: `employeeNumber` (auto-generated)
- **Journal Entries**: `createdAt` (system-generated)
- **Sales/Purchase Orders**: `orderNumber` (auto-generated)

### Company Ownership Validation
Every mutation route validates that the target entity belongs to the requesting company:
```typescript
if (entity.companyId !== req.params.companyId) {
  return res.status(403).json({ error: "Entity belongs to different company" });
}
```

This ensures strict data isolation between companies and prevents cross-tenant data access or mutation.
