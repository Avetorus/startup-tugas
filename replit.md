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
│   ├── storage.ts           # In-memory storage with company scoping
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

### Setup Wizard
When the system starts with no companies, users are guided through:
1. **Company Registration**: Create the holding company (name, code, currency, timezone, address)
2. **Admin Account Creation**: Create the first Super Admin user
3. **Login**: Redirect to login after setup complete

### Setup Endpoints (Public)
- `GET /api/setup/status` - Check if system needs setup
- `POST /api/setup/company` - Create first company (only when no companies exist)
- `POST /api/setup/admin` - Create first admin (only after company exists)

### Post-Login Onboarding
Dashboard shows onboarding checklist with tasks:
- Set up Chart of Accounts
- Create Warehouses
- Add Team Members
- Add Subsidiaries/Branches
- Configure User Roles
- Review Settings

## Recent Changes
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
