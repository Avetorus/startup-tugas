# Unanza ERP System

## Overview
Unanza is a comprehensive, multi-tenant enterprise ERP system designed with a hierarchical multi-company architecture. It aims to provide a robust solution for managing various business operations across complex organizational structures, offering strict data segregation and supporting inter-company transactions. The system encompasses modules for Sales, Warehouse, Financials, HR, and System administration, alongside granular Role-Based Access Control. Its core purpose is to streamline business processes, enhance financial oversight, and improve operational efficiency for organizations with multiple entities.

## User Preferences
- Carbon Design System styling
- Enterprise-focused UI/UX
- Professional, clean aesthetics
- Accessibility compliant

## System Architecture

### UI/UX Decisions
The front-end is built with React, leveraging the IBM Plex Sans font family and drawing inspiration from the Carbon Design System. It supports both dark and light modes with a primary blue accent, destructive red for errors, and muted gray tones for secondary content. UI components utilize Shadcn/ui, Radix UI primitives, and Lucide React icons for a consistent and modern user experience.

### Technical Implementations
The system employs a full-stack architecture with React on the client-side and Express.js with TypeScript on the server. Data persistence is managed by PostgreSQL, integrated via Drizzle ORM. Key architectural patterns include:
- **Multi-Company Architecture**: Supports unlimited depth hierarchical company structures (Holding, Subsidiary, Branch, Division) using a path/ltree pattern in the database.
- **Data Segregation**: Strict isolation of data per company through `company_id` filtering on all entities.
- **Role-Based Access Control**: Granular permissions based on user-company-role assignments.
- **Authentication**: JWT-based authentication with access and refresh tokens, implementing hierarchy-based access control.
- **Interconnected ERP Workflows**: A workflow orchestration layer (`server/services/workflow-service.ts`) manages transaction lifecycles (e.g., Sales Order, Purchase Order), automatically generating journal entries for financial integrity.
- **ACID Transaction Safety**: All workflow methods use `db.transaction()` wrappers to ensure atomicity. Partial failures automatically roll back all changes. Row-level locking (`FOR UPDATE`) prevents race conditions and duplicate document numbers.
- **First-Time Setup Flow**: A guided setup wizard for initial company registration and super admin creation, which locks after completion to prevent reconfiguration.
- **API Design**: Consistent company-scoped API endpoints for all master data and transactional modules, ensuring data integrity and security.

### Workflow Service Architecture
The WorkflowService (`server/services/workflow-service.ts`) implements fully transactional ERP workflows:
- **Sales Order Flow**: confirmSalesOrder → deliverSalesOrder → createCustomerInvoice → receiveCustomerPayment
- **Purchase Order Flow**: confirmPurchaseOrder → receiveGoodsFromPurchaseOrder → createVendorInvoice → makeVendorPayment
- **Transaction Helpers (Tx versions)**: getSalesOrderLinesTx, getPurchaseOrderLinesTx, getOrCreateStockLevelTx, getAccountByCodeTx, createCOGSJournalEntryTx, createARInvoiceJournalEntryTx, createARLedgerEntryTx, createPaymentReceiptJournalEntryTx, createARPaymentLedgerEntryTx, createGoodsReceiptJournalEntryTx, createAPInvoiceJournalEntryTx, createAPLedgerEntryTx, createVendorPaymentJournalEntryTx, createAPPaymentLedgerEntryTx
- **Document Numbering**: Uses `getNextDocumentNumberTx()` with SELECT...FOR UPDATE to prevent duplicate codes under concurrency

### Feature Specifications
- **Modules**: Sales (Orders, Customers, Deliveries, Invoices), Warehouse (Products, Locations, Stock, POs), Financials (Journal Entries, COA, AR/AP), HR (Employees, Attendance, Payroll), System (Companies, Users, Roles, Portals, Settings).
- **Inter-Company Functionality**: Support for IC sales/purchase orders, stock transfers, and consolidation reporting.
- **Workflow Automation**: Automated stock reservation, inventory adjustments, and journal entry generation linked to operational transactions (e.g., sales order delivery, goods receipt).
- **Security**: Robust security measures including PATCH route sanitization and strict company ownership validation to prevent cross-company data tampering.

## External Dependencies
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Front-end Framework**: React
- **Back-end Framework**: Express.js
- **UI Component Libraries**: Shadcn/ui, Radix UI
- **Icons**: Lucide React
- **State Management/Data Fetching**: TanStack Query
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt

## Data Integrity Policy

### No Dummy Data
The ERP system operates with a **zero pre-populated data policy**:
- No mock companies, users, or master data are seeded in the database
- All operational records must be created organically by users through proper workflows
- The first-time setup flow is the only entry point to initialize the system
- **Exception**: System roles (ADMIN, MANAGER, USER) are auto-provisioned on first API access as they are required for the setup flow

### First-Time Setup Flow
1. **Company Creation**: User creates their first company (Holding level)
2. **Admin Account**: User creates the super admin account
3. **Master Data**: After login, users must create:
   - Chart of Accounts (COA) for financial tracking
   - Warehouses for inventory management
   - Customers for sales transactions
   - Vendors for purchase transactions
   - Products with pricing and costing

### Workflow Dependencies
All transactional flows enforce realistic dependencies:
- **Sales Orders**: Require existing customers and products
- **Purchase Orders**: Require existing vendors and products
- **Deliveries**: Originate from confirmed sales orders with reserved stock
- **Goods Receipts**: Originate from confirmed purchase orders
- **Invoices**: Generated from deliveries (AR) or goods receipts (AP)
- **Payments**: Applied against outstanding invoices
- **Journal Entries**: Auto-generated by operational events (COGS, AR/AP, etc.)

### Currency
- Default currency: Indonesian Rupiah (IDR)
- Multi-currency support with exchange rate management per company

## Frontend Workflow Integration

### Sales Order Workflow (SalesOrderList.tsx)
Frontend actions trigger complete backend workflows with ACID guarantees:
- **Confirm Order**: POST `/sales-orders/:id/confirm` → reserves stock
- **Deliver Order**: POST `/sales-orders/:id/deliver` → creates delivery, COGS journal entry
- **Create Invoice**: POST `/sales-orders/:id/invoice` → creates AR invoice, revenue journal entry

### Purchase Order Workflow (PurchaseOrderList.tsx)
- **Confirm PO**: POST `/purchase-orders/:id/confirm` → confirms purchase order
- **Receive Goods**: POST `/purchase-orders/:id/receive` → creates goods receipt, inventory journal entry
- **Create Bill**: POST `/purchase-orders/:id/bill` → creates AP invoice

### Payment Workflows
- **Receive Customer Payment** (InvoiceList.tsx): POST `/payments/receive` → updates AR, creates payment receipt
- **Make Vendor Payment** (AccountsPayable.tsx): POST `/payments/pay` → updates AP, creates payment record

### Invoice Types
- **Customer invoices** (AR): `invoiceType === "customer"`
- **Vendor invoices** (AP): `invoiceType === "vendor"`

### Cache Invalidation
After each workflow action, the frontend invalidates all affected caches:
- Orders (sales-orders, purchase-orders)
- Stock levels
- Deliveries, goods receipts
- Invoices, payments
- Journal entries
- AR/AP ledgers