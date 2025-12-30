client
1. pages/setup
    API: api/setup/status
        SetupStatus {
            isInitialized: boolean;
            needsCompanySetup: boolean;
            needsAdminSetup: boolean;
            stats: { companyCount: number; userCount: number };
        }
        
2. component/companyswitch
    API: /api/companies/hierarchy
        CompanyHierarchyNode {
            company: Company;
            children: CompanyHierarchyNode[];
            level: number;
        }