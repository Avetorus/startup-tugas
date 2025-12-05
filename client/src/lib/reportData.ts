// todo: remove mock functionality - Report data for ERP analytics

// ============================================
// SALES REPORTS DATA
// ============================================

export const mockSalespersonPerformance = [
  { id: "SP001", name: "Sarah Johnson", region: "North", quota: 150000, achieved: 168500, orders: 45, customers: 28, avgOrderValue: 3744, winRate: 72 },
  { id: "SP002", name: "Michael Chen", region: "South", quota: 120000, achieved: 112000, orders: 38, customers: 22, avgOrderValue: 2947, winRate: 65 },
  { id: "SP003", name: "Emily Rodriguez", region: "East", quota: 130000, achieved: 145000, orders: 52, customers: 31, avgOrderValue: 2788, winRate: 78 },
  { id: "SP004", name: "David Kim", region: "West", quota: 140000, achieved: 138500, orders: 41, customers: 25, avgOrderValue: 3378, winRate: 68 },
  { id: "SP005", name: "Lisa Wang", region: "Central", quota: 110000, achieved: 125000, orders: 35, customers: 20, avgOrderValue: 3571, winRate: 74 },
];

export const mockCustomerRanking = [
  { id: "C001", name: "Acme Corporation", revenue: 125000, orders: 45, avgOrderValue: 2778, lastOrder: "2024-12-01", segment: "Enterprise", growthRate: 15.2 },
  { id: "C003", name: "Global Supplies Ltd", revenue: 234000, orders: 89, avgOrderValue: 2629, lastOrder: "2024-12-03", segment: "Enterprise", growthRate: 22.5 },
  { id: "C005", name: "Summit Industries", revenue: 189000, orders: 67, avgOrderValue: 2821, lastOrder: "2024-12-05", segment: "Enterprise", growthRate: 18.3 },
  { id: "C002", name: "TechStart Inc.", revenue: 67500, orders: 23, avgOrderValue: 2935, lastOrder: "2024-12-02", segment: "SMB", growthRate: 28.7 },
  { id: "C004", name: "Metro Retail Group", revenue: 28900, orders: 12, avgOrderValue: 2408, lastOrder: "2024-11-15", segment: "SMB", growthRate: -5.2 },
];

export const mockSalesForecast = [
  { month: "Jan 2025", predicted: 145000, lowerBound: 130000, upperBound: 160000, confidence: 85 },
  { month: "Feb 2025", predicted: 152000, lowerBound: 135000, upperBound: 169000, confidence: 82 },
  { month: "Mar 2025", predicted: 168000, lowerBound: 148000, upperBound: 188000, confidence: 80 },
  { month: "Apr 2025", predicted: 175000, lowerBound: 152000, upperBound: 198000, confidence: 78 },
  { month: "May 2025", predicted: 182000, lowerBound: 156000, upperBound: 208000, confidence: 75 },
  { month: "Jun 2025", predicted: 195000, lowerBound: 165000, upperBound: 225000, confidence: 72 },
];

export const mockSalesPipeline = [
  { stage: "Lead", count: 156, value: 780000, conversionRate: 45 },
  { stage: "Qualified", count: 70, value: 420000, conversionRate: 60 },
  { stage: "Proposal", count: 42, value: 315000, conversionRate: 75 },
  { stage: "Negotiation", count: 32, value: 256000, conversionRate: 85 },
  { stage: "Closed Won", count: 27, value: 218000, conversionRate: 100 },
];

export const mockOrderFulfillment = [
  { month: "Jul 2024", totalOrders: 145, onTime: 132, late: 10, cancelled: 3, fulfillmentRate: 91 },
  { month: "Aug 2024", totalOrders: 158, onTime: 148, late: 8, cancelled: 2, fulfillmentRate: 94 },
  { month: "Sep 2024", totalOrders: 162, onTime: 152, late: 7, cancelled: 3, fulfillmentRate: 94 },
  { month: "Oct 2024", totalOrders: 175, onTime: 165, late: 6, cancelled: 4, fulfillmentRate: 94 },
  { month: "Nov 2024", totalOrders: 189, onTime: 180, late: 5, cancelled: 4, fulfillmentRate: 95 },
  { month: "Dec 2024", totalOrders: 198, onTime: 190, late: 4, cancelled: 4, fulfillmentRate: 96 },
];

// ============================================
// INVENTORY/WAREHOUSE REPORTS DATA
// ============================================

export const mockInventoryAging = [
  { ageRange: "0-30 days", items: 145, value: 125000, percentage: 42 },
  { ageRange: "31-60 days", items: 89, value: 78500, percentage: 26 },
  { ageRange: "61-90 days", items: 56, value: 45000, percentage: 15 },
  { ageRange: "91-180 days", items: 34, value: 28500, percentage: 10 },
  { ageRange: "180+ days", items: 22, value: 18000, percentage: 6 },
];

export const mockABCAnalysis = [
  { category: "A", items: 45, percentage: 15, value: 485000, valuePercentage: 70, description: "High-value, critical items" },
  { category: "B", items: 89, percentage: 30, value: 145000, valuePercentage: 21, description: "Medium-value, important items" },
  { category: "C", items: 165, percentage: 55, value: 62000, valuePercentage: 9, description: "Low-value, routine items" },
];

export const mockStockMovement = [
  { month: "Jul 2024", inbound: 2450, outbound: 2180, adjustments: -45, netChange: 225 },
  { month: "Aug 2024", inbound: 2680, outbound: 2520, adjustments: -32, netChange: 128 },
  { month: "Sep 2024", inbound: 2890, outbound: 2650, adjustments: -28, netChange: 212 },
  { month: "Oct 2024", inbound: 3150, outbound: 2980, adjustments: -15, netChange: 155 },
  { month: "Nov 2024", inbound: 3420, outbound: 3180, adjustments: -22, netChange: 218 },
  { month: "Dec 2024", inbound: 3680, outbound: 3450, adjustments: -18, netChange: 212 },
];

export const mockReorderRecommendations = [
  { id: "P003", sku: "CPT-001", name: "Component Alpha", currentStock: 12, safetyStock: 100, reorderPoint: 150, suggestedQty: 200, leadTime: 7, priority: "critical" },
  { id: "P006", sku: "ASM-001", name: "Assembly Kit Pro", currentStock: 45, safetyStock: 50, reorderPoint: 75, suggestedQty: 100, leadTime: 14, priority: "high" },
  { id: "P002", sku: "WDG-002", name: "Industrial Widget B", currentStock: 156, safetyStock: 100, reorderPoint: 150, suggestedQty: 150, leadTime: 5, priority: "medium" },
  { id: "P004", sku: "CPT-002", name: "Component Beta", currentStock: 89, safetyStock: 80, reorderPoint: 100, suggestedQty: 120, leadTime: 10, priority: "low" },
];

export const mockStockAccuracy = [
  { location: "Zone A", systemQty: 2450, physicalQty: 2438, variance: -12, variancePercent: -0.49, lastAudit: "2024-12-01" },
  { location: "Zone B", systemQty: 1890, physicalQty: 1895, variance: 5, variancePercent: 0.26, lastAudit: "2024-12-01" },
  { location: "Zone C", systemQty: 3250, physicalQty: 3228, variance: -22, variancePercent: -0.68, lastAudit: "2024-12-01" },
  { location: "Zone D", systemQty: 980, physicalQty: 982, variance: 2, variancePercent: 0.20, lastAudit: "2024-12-01" },
];

export const mockSupplierPerformance = [
  { id: "V001", name: "Prime Suppliers Co.", onTimeRate: 94, qualityScore: 98, avgLeadTime: 5, priceCompetitiveness: 92, overallScore: 96 },
  { id: "V002", name: "Quality Materials Inc.", onTimeRate: 88, qualityScore: 95, avgLeadTime: 7, priceCompetitiveness: 88, overallScore: 90 },
  { id: "V003", name: "FastShip Logistics", onTimeRate: 96, qualityScore: 92, avgLeadTime: 3, priceCompetitiveness: 85, overallScore: 91 },
  { id: "V004", name: "Industrial Parts Ltd", onTimeRate: 82, qualityScore: 90, avgLeadTime: 10, priceCompetitiveness: 94, overallScore: 85 },
];

// ============================================
// FINANCE REPORTS DATA
// ============================================

export const mockProfitLoss = {
  period: "Q4 2024",
  revenue: {
    productSales: 485000,
    serviceRevenue: 125000,
    otherIncome: 26600,
    totalRevenue: 636600,
  },
  costOfSales: {
    materials: 145000,
    directLabor: 85000,
    overhead: 42000,
    totalCOGS: 272000,
  },
  grossProfit: 364600,
  grossMargin: 57.3,
  operatingExpenses: {
    salaries: 185000,
    rent: 36000,
    utilities: 14500,
    marketing: 22000,
    depreciation: 45000,
    other: 52000,
    totalOpex: 354500,
  },
  operatingIncome: 10100,
  otherExpenses: {
    interest: 12500,
    taxes: 22000,
    totalOther: 34500,
  },
  netIncome: -24400,
  netMargin: -3.8,
};

export const mockBalanceSheet = {
  asOfDate: "2024-12-05",
  assets: {
    current: {
      cash: 172500,
      accountsReceivable: 58300,
      inventory: 283500,
      prepaidExpenses: 25000,
      totalCurrent: 539300,
    },
    fixed: {
      land: 150000,
      buildings: 355000,
      equipment: 337000,
      vehicles: 80000,
      furniture: 47000,
      computers: 53000,
      totalFixed: 1022000,
    },
    totalAssets: 1561300,
  },
  liabilities: {
    current: {
      accountsPayable: 49400,
      accruedExpenses: 31900,
      taxesPayable: 37400,
      otherCurrent: 44500,
      totalCurrent: 163200,
    },
    longTerm: {
      bankLoans: 150000,
      mortgage: 280000,
      equipmentLoans: 75000,
      totalLongTerm: 505000,
    },
    totalLiabilities: 668200,
  },
  equity: {
    commonStock: 200000,
    preferredStock: 50000,
    additionalPaidIn: 75000,
    retainedEarnings: 570000,
    currentYearEarnings: -24400,
    ownerDrawings: -25000,
    totalEquity: 845600,
  },
  totalLiabilitiesAndEquity: 1513800,
};

export const mockCashFlow = [
  { month: "Jul 2024", operating: 45000, investing: -15000, financing: -8000, netChange: 22000, endingBalance: 145000 },
  { month: "Aug 2024", operating: 52000, investing: -25000, financing: -8000, netChange: 19000, endingBalance: 164000 },
  { month: "Sep 2024", operating: 48000, investing: -10000, financing: -8000, netChange: 30000, endingBalance: 194000 },
  { month: "Oct 2024", operating: 38000, investing: -45000, financing: -8000, netChange: -15000, endingBalance: 179000 },
  { month: "Nov 2024", operating: 55000, investing: -12000, financing: -8000, netChange: 35000, endingBalance: 214000 },
  { month: "Dec 2024", operating: 42000, investing: -8000, financing: -75000, netChange: -41000, endingBalance: 173000 },
];

export const mockProductProfitability = [
  { id: "P001", name: "Industrial Widget A", revenue: 125000, cost: 62500, profit: 62500, margin: 50, unitsSold: 2501 },
  { id: "P002", name: "Industrial Widget B", revenue: 98000, cost: 53900, profit: 44100, margin: 45, unitsSold: 1225 },
  { id: "P003", name: "Component Alpha", revenue: 45000, cost: 31500, profit: 13500, margin: 30, unitsSold: 1837 },
  { id: "P004", name: "Component Beta", revenue: 78000, cost: 42900, profit: 35100, margin: 45, unitsSold: 413 },
  { id: "P005", name: "Raw Material X", revenue: 35000, cost: 28000, profit: 7000, margin: 20, unitsSold: 2745 },
  { id: "P006", name: "Assembly Kit Pro", revenue: 85000, cost: 42500, profit: 42500, margin: 50, unitsSold: 244 },
];

export const mockARAgingReport = [
  { ageRange: "Current", amount: 28500, count: 12, percentage: 49 },
  { ageRange: "1-30 days", amount: 15200, count: 8, percentage: 26 },
  { ageRange: "31-60 days", amount: 8500, count: 5, percentage: 15 },
  { ageRange: "61-90 days", amount: 4200, count: 3, percentage: 7 },
  { ageRange: "90+ days", amount: 1900, count: 2, percentage: 3 },
];

export const mockAPAgingReport = [
  { ageRange: "Current", amount: 22000, count: 8, percentage: 45 },
  { ageRange: "1-30 days", amount: 14500, count: 6, percentage: 29 },
  { ageRange: "31-60 days", amount: 8200, count: 4, percentage: 17 },
  { ageRange: "61-90 days", amount: 3500, count: 2, percentage: 7 },
  { ageRange: "90+ days", amount: 1200, count: 1, percentage: 2 },
];

export const mockFinancialRatios = {
  liquidity: {
    currentRatio: 3.31,
    quickRatio: 1.57,
    cashRatio: 1.06,
  },
  profitability: {
    grossMargin: 57.3,
    operatingMargin: 1.6,
    netMargin: -3.8,
    roe: -2.9,
    roa: -1.6,
  },
  efficiency: {
    inventoryTurnover: 4.2,
    receivablesTurnover: 10.9,
    payablesTurnover: 8.5,
    assetTurnover: 0.41,
  },
  leverage: {
    debtToEquity: 0.79,
    debtToAssets: 0.43,
    interestCoverage: 0.81,
  },
};

export const mockVATReport = {
  period: "Q4 2024",
  outputVAT: {
    sales: 636600,
    vatRate: 10,
    vatAmount: 63660,
  },
  inputVAT: {
    purchases: 385000,
    vatRate: 10,
    vatAmount: 38500,
  },
  netVAT: 25160,
  status: "payable",
};

export const mockTrialBalance = [
  { accountId: "1111", accountName: "Cash on Hand", debit: 15000, credit: 0 },
  { accountId: "1113", accountName: "Checking Account - Main", debit: 85000, credit: 0 },
  { accountId: "1121", accountName: "Trade Receivables", debit: 45600, credit: 0 },
  { accountId: "1131", accountName: "Raw Materials", debit: 78500, credit: 0 },
  { accountId: "1133", accountName: "Finished Goods", debit: 98000, credit: 0 },
  { accountId: "1220", accountName: "Buildings", debit: 450000, credit: 0 },
  { accountId: "1221", accountName: "Accum. Depr. - Buildings", debit: 0, credit: 95000 },
  { accountId: "2111", accountName: "Trade Payables", debit: 0, credit: 28900 },
  { accountId: "2121", accountName: "Accrued Salaries", debit: 0, credit: 18500 },
  { accountId: "3110", accountName: "Common Stock", debit: 0, credit: 200000 },
  { accountId: "3210", accountName: "Retained Earnings", debit: 0, credit: 185000 },
  { accountId: "4110", accountName: "Product Sales", debit: 0, credit: 485000 },
  { accountId: "5110", accountName: "Cost of Materials", debit: 145000, credit: 0 },
  { accountId: "5310", accountName: "Salaries & Wages", debit: 185000, credit: 0 },
];

// ============================================
// HR REPORTS DATA
// ============================================

export const mockAttendanceSummary = [
  { employeeId: "E001", name: "Sarah Johnson", department: "Sales", daysWorked: 22, daysAbsent: 0, lateArrivals: 2, avgHours: 8.5, overtimeHours: 12 },
  { employeeId: "E002", name: "Michael Chen", department: "Warehouse", daysWorked: 22, daysAbsent: 1, lateArrivals: 0, avgHours: 8.2, overtimeHours: 8 },
  { employeeId: "E003", name: "Emily Rodriguez", department: "Finance", daysWorked: 21, daysAbsent: 1, lateArrivals: 1, avgHours: 8.8, overtimeHours: 15 },
  { employeeId: "E004", name: "David Kim", department: "HR", daysWorked: 22, daysAbsent: 0, lateArrivals: 0, avgHours: 8.0, overtimeHours: 4 },
  { employeeId: "E005", name: "Lisa Wang", department: "Operations", daysWorked: 12, daysAbsent: 10, lateArrivals: 0, avgHours: 8.0, overtimeHours: 0 },
];

export const mockLeaveBalance = [
  { employeeId: "E001", name: "Sarah Johnson", department: "Sales", annualAllowed: 20, used: 5, remaining: 15, sickUsed: 2, sickRemaining: 8 },
  { employeeId: "E002", name: "Michael Chen", department: "Warehouse", annualAllowed: 20, used: 8, remaining: 12, sickUsed: 1, sickRemaining: 9 },
  { employeeId: "E003", name: "Emily Rodriguez", department: "Finance", annualAllowed: 25, used: 10, remaining: 15, sickUsed: 3, sickRemaining: 7 },
  { employeeId: "E004", name: "David Kim", department: "HR", annualAllowed: 20, used: 3, remaining: 17, sickUsed: 0, sickRemaining: 10 },
  { employeeId: "E005", name: "Lisa Wang", department: "Operations", annualAllowed: 20, used: 15, remaining: 5, sickUsed: 5, sickRemaining: 5 },
];

export const mockOvertimeSummary = [
  { department: "Sales", employees: 5, totalHours: 48, avgPerEmployee: 9.6, cost: 3600 },
  { department: "Warehouse", employees: 8, totalHours: 72, avgPerEmployee: 9.0, cost: 4320 },
  { department: "Finance", employees: 4, totalHours: 32, avgPerEmployee: 8.0, cost: 2880 },
  { department: "HR", employees: 3, totalHours: 12, avgPerEmployee: 4.0, cost: 900 },
  { department: "Operations", employees: 6, totalHours: 45, avgPerEmployee: 7.5, cost: 2700 },
];

export const mockPayrollByDepartment = [
  { department: "Sales", employees: 5, baseSalary: 45000, overtime: 3600, bonuses: 8500, deductions: 5700, netPayroll: 51400 },
  { department: "Warehouse", employees: 8, baseSalary: 52000, overtime: 4320, bonuses: 2500, deductions: 5880, netPayroll: 52940 },
  { department: "Finance", employees: 4, baseSalary: 38000, overtime: 2880, bonuses: 4200, deductions: 4508, netPayroll: 40572 },
  { department: "HR", employees: 3, baseSalary: 28000, overtime: 900, bonuses: 1500, deductions: 3040, netPayroll: 27360 },
  { department: "Operations", employees: 6, baseSalary: 42000, overtime: 2700, bonuses: 3000, deductions: 4770, netPayroll: 42930 },
];

// ============================================
// CROSS-MODULE & AI REPORTS DATA
// ============================================

export const mockVendorScorecard = [
  { id: "V001", name: "Prime Suppliers Co.", quality: 98, delivery: 94, price: 92, service: 95, overall: 95, trend: "up" },
  { id: "V002", name: "Quality Materials Inc.", quality: 95, delivery: 88, price: 88, service: 90, overall: 90, trend: "stable" },
  { id: "V003", name: "FastShip Logistics", quality: 92, delivery: 96, price: 85, service: 88, overall: 90, trend: "up" },
  { id: "V004", name: "Industrial Parts Ltd", quality: 90, delivery: 82, price: 94, service: 78, overall: 86, trend: "down" },
];

export const mockCustomerLifetimeValue = [
  { id: "C001", name: "Acme Corporation", acquisitionDate: "2020-03-15", totalRevenue: 485000, avgOrderValue: 10778, frequency: 45, clv: 645000, segment: "high" },
  { id: "C003", name: "Global Supplies Ltd", acquisitionDate: "2019-08-22", totalRevenue: 892000, avgOrderValue: 10022, frequency: 89, clv: 1250000, segment: "high" },
  { id: "C005", name: "Summit Industries", acquisitionDate: "2021-01-10", totalRevenue: 378000, avgOrderValue: 5642, frequency: 67, clv: 520000, segment: "high" },
  { id: "C002", name: "TechStart Inc.", acquisitionDate: "2022-06-01", totalRevenue: 135000, avgOrderValue: 5870, frequency: 23, clv: 185000, segment: "medium" },
  { id: "C004", name: "Metro Retail Group", acquisitionDate: "2023-02-14", totalRevenue: 28900, avgOrderValue: 2408, frequency: 12, clv: 45000, segment: "low" },
];

export const mockAuditLog = [
  { id: "AUD001", timestamp: "2024-12-05 14:32:15", user: "admin@unanza.com", module: "Sales", action: "CREATE", entity: "Sales Order", entityId: "SO-005", details: "Created new sales order" },
  { id: "AUD002", timestamp: "2024-12-05 14:28:45", user: "sarah.johnson@unanza.com", module: "Sales", action: "UPDATE", entity: "Customer", entityId: "C001", details: "Updated contact information" },
  { id: "AUD003", timestamp: "2024-12-05 13:45:22", user: "michael.chen@unanza.com", module: "Warehouse", action: "CREATE", entity: "Stock Movement", entityId: "MOV-004", details: "Received PO-002 items" },
  { id: "AUD004", timestamp: "2024-12-05 12:15:10", user: "emily.rodriguez@unanza.com", module: "Finance", action: "POST", entity: "Journal Entry", entityId: "JE-003", details: "Posted journal entry" },
  { id: "AUD005", timestamp: "2024-12-05 11:30:55", user: "admin@unanza.com", module: "System", action: "UPDATE", entity: "Settings", entityId: "SYS-001", details: "Updated company settings" },
  { id: "AUD006", timestamp: "2024-12-05 10:22:33", user: "david.kim@unanza.com", module: "HR", action: "APPROVE", entity: "Leave Request", entityId: "LR-001", details: "Approved vacation request" },
];

export const mockChurnProbability = [
  { id: "C004", name: "Metro Retail Group", lastOrderDays: 20, orderFrequencyDecline: 45, revenueDecline: 32, supportTickets: 5, churnProbability: 78, riskLevel: "high" },
  { id: "C002", name: "TechStart Inc.", lastOrderDays: 3, orderFrequencyDecline: 12, revenueDecline: 8, supportTickets: 1, churnProbability: 25, riskLevel: "low" },
  { id: "C005", name: "Summit Industries", lastOrderDays: 0, orderFrequencyDecline: -5, revenueDecline: -15, supportTickets: 0, churnProbability: 8, riskLevel: "low" },
];

// ============================================
// AI/PREDICTIVE REPORTS DATA
// ============================================

export const mockPredictiveReorder = [
  { id: "P003", sku: "CPT-001", name: "Component Alpha", currentStock: 12, predictedDemand: 180, daysUntilStockout: 2, optimalReorderDate: "2024-12-06", suggestedQty: 250, confidence: 92 },
  { id: "P006", sku: "ASM-001", name: "Assembly Kit Pro", currentStock: 45, predictedDemand: 85, daysUntilStockout: 12, optimalReorderDate: "2024-12-10", suggestedQty: 100, confidence: 88 },
  { id: "P002", sku: "WDG-002", name: "Industrial Widget B", currentStock: 156, predictedDemand: 120, daysUntilStockout: 28, optimalReorderDate: "2024-12-20", suggestedQty: 150, confidence: 85 },
  { id: "P001", sku: "WDG-001", name: "Industrial Widget A", currentStock: 234, predictedDemand: 95, daysUntilStockout: 52, optimalReorderDate: "2025-01-15", suggestedQty: 120, confidence: 82 },
];

export const mockDemandForecast = [
  { productId: "P001", name: "Industrial Widget A", currentMonth: 95, month1: 102, month2: 108, month3: 115, month4: 98, month5: 88, month6: 105, seasonality: "stable" },
  { productId: "P002", name: "Industrial Widget B", currentMonth: 120, month1: 135, month2: 142, month3: 128, month4: 115, month5: 108, month6: 125, seasonality: "growing" },
  { productId: "P003", name: "Component Alpha", currentMonth: 180, month1: 195, month2: 210, month3: 225, month4: 198, month5: 185, month6: 205, seasonality: "seasonal-high" },
  { productId: "P004", name: "Component Beta", currentMonth: 45, month1: 48, month2: 52, month3: 55, month4: 50, month5: 45, month6: 48, seasonality: "stable" },
  { productId: "P005", name: "Raw Material X", currentMonth: 350, month1: 380, month2: 410, month3: 445, month4: 420, month5: 395, month6: 425, seasonality: "growing" },
  { productId: "P006", name: "Assembly Kit Pro", currentMonth: 85, month1: 92, month2: 78, month3: 65, month4: 72, month5: 88, month6: 95, seasonality: "variable" },
];

// Historical sales data for trend analysis
export const mockHistoricalSales = [
  { month: "Jan 2024", revenue: 125000, orders: 145, avgOrderValue: 862 },
  { month: "Feb 2024", revenue: 132000, orders: 158, avgOrderValue: 835 },
  { month: "Mar 2024", revenue: 148000, orders: 175, avgOrderValue: 846 },
  { month: "Apr 2024", revenue: 142000, orders: 168, avgOrderValue: 845 },
  { month: "May 2024", revenue: 155000, orders: 182, avgOrderValue: 852 },
  { month: "Jun 2024", revenue: 168000, orders: 195, avgOrderValue: 862 },
  { month: "Jul 2024", revenue: 162000, orders: 188, avgOrderValue: 862 },
  { month: "Aug 2024", revenue: 175000, orders: 205, avgOrderValue: 854 },
  { month: "Sep 2024", revenue: 182000, orders: 215, avgOrderValue: 847 },
  { month: "Oct 2024", revenue: 195000, orders: 228, avgOrderValue: 855 },
  { month: "Nov 2024", revenue: 215000, orders: 248, avgOrderValue: 867 },
  { month: "Dec 2024", revenue: 235000, orders: 268, avgOrderValue: 877 },
];
