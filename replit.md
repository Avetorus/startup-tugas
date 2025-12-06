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
- **Interconnected ERP Workflows**: A workflow orchestration layer manages transaction lifecycles (e.g., Sales Order, Purchase Order), automatically generating journal entries for financial integrity.
- **First-Time Setup Flow**: A guided setup wizard for initial company registration and super admin creation, which locks after completion to prevent reconfiguration.
- **API Design**: Consistent company-scoped API endpoints for all master data and transactional modules, ensuring data integrity and security.

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