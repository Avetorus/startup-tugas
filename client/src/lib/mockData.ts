// todo: remove mock functionality - this file contains all mock data for the ERP prototype

export const mockCustomers = [
  { id: "C001", name: "Acme Corporation", email: "orders@acme.com", phone: "+1 555-0100", status: "active", totalOrders: 45, totalSpent: 125000 },
  { id: "C002", name: "TechStart Inc.", email: "purchasing@techstart.io", phone: "+1 555-0101", status: "active", totalOrders: 23, totalSpent: 67500 },
  { id: "C003", name: "Global Supplies Ltd", email: "procurement@globalsupplies.com", phone: "+1 555-0102", status: "active", totalOrders: 89, totalSpent: 234000 },
  { id: "C004", name: "Metro Retail Group", email: "buying@metroretail.com", phone: "+1 555-0103", status: "inactive", totalOrders: 12, totalSpent: 28900 },
  { id: "C005", name: "Summit Industries", email: "orders@summitind.com", phone: "+1 555-0104", status: "active", totalOrders: 67, totalSpent: 189000 },
];

export const mockVendors = [
  { id: "V001", name: "Prime Suppliers Co.", email: "sales@primesuppliers.com", phone: "+1 555-0200", status: "active", activePOs: 5, totalValue: 45000 },
  { id: "V002", name: "Quality Materials Inc.", email: "orders@qualitymaterials.com", phone: "+1 555-0201", status: "active", activePOs: 3, totalValue: 32000 },
  { id: "V003", name: "FastShip Logistics", email: "partners@fastship.com", phone: "+1 555-0202", status: "active", activePOs: 2, totalValue: 18500 },
  { id: "V004", name: "Industrial Parts Ltd", email: "sales@industrialparts.co", phone: "+1 555-0203", status: "pending", activePOs: 0, totalValue: 0 },
];

export const mockProducts = [
  { id: "P001", sku: "WDG-001", name: "Industrial Widget A", category: "Widgets", uom: "EA", price: 49.99, stock: 234, minLevel: 50, maxLevel: 500, location: "A-01-01" },
  { id: "P002", sku: "WDG-002", name: "Industrial Widget B", category: "Widgets", uom: "EA", price: 79.99, stock: 156, minLevel: 30, maxLevel: 300, location: "A-01-02" },
  { id: "P003", sku: "CPT-001", name: "Component Alpha", category: "Components", uom: "EA", price: 24.50, stock: 12, minLevel: 100, maxLevel: 1000, location: "B-02-01" },
  { id: "P004", sku: "CPT-002", name: "Component Beta", category: "Components", uom: "BOX", price: 189.00, stock: 89, minLevel: 20, maxLevel: 200, location: "B-02-02" },
  { id: "P005", sku: "MAT-001", name: "Raw Material X", category: "Materials", uom: "KG", price: 12.75, stock: 2450, minLevel: 500, maxLevel: 5000, location: "C-03-01" },
  { id: "P006", sku: "ASM-001", name: "Assembly Kit Pro", category: "Assemblies", uom: "KIT", price: 349.00, stock: 45, minLevel: 10, maxLevel: 100, location: "D-01-01" },
];

export const mockSalesOrders = [
  { id: "SO-001", customerId: "C001", customerName: "Acme Corporation", date: "2024-12-01", status: "invoiced", total: 4599.50, items: 3 },
  { id: "SO-002", customerId: "C002", customerName: "TechStart Inc.", date: "2024-12-02", status: "delivered", total: 2340.00, items: 2 },
  { id: "SO-003", customerId: "C003", customerName: "Global Supplies Ltd", date: "2024-12-03", status: "confirmed", total: 8750.00, items: 5 },
  { id: "SO-004", customerId: "C001", customerName: "Acme Corporation", date: "2024-12-04", status: "draft", total: 1250.00, items: 1 },
  { id: "SO-005", customerId: "C005", customerName: "Summit Industries", date: "2024-12-05", status: "confirmed", total: 15600.00, items: 8 },
];

export const mockPurchaseOrders = [
  { id: "PO-001", vendorId: "V001", vendorName: "Prime Suppliers Co.", date: "2024-12-01", status: "received", total: 12500.00, items: 4 },
  { id: "PO-002", vendorId: "V002", vendorName: "Quality Materials Inc.", date: "2024-12-02", status: "ordered", total: 8900.00, items: 3 },
  { id: "PO-003", vendorId: "V001", vendorName: "Prime Suppliers Co.", date: "2024-12-03", status: "draft", total: 5600.00, items: 2 },
  { id: "PO-004", vendorId: "V003", vendorName: "FastShip Logistics", date: "2024-12-04", status: "ordered", total: 3400.00, items: 2 },
];

export const mockDeliveries = [
  { id: "DEL-001", orderId: "SO-001", customerName: "Acme Corporation", date: "2024-12-03", status: "shipped", items: 3 },
  { id: "DEL-002", orderId: "SO-002", customerName: "TechStart Inc.", date: "2024-12-04", status: "delivered", items: 2 },
  { id: "DEL-003", orderId: "SO-003", customerName: "Global Supplies Ltd", date: "2024-12-05", status: "picking", items: 5 },
  { id: "DEL-004", orderId: "SO-005", customerName: "Summit Industries", date: "2024-12-06", status: "packing", items: 8 },
];

export const mockInvoices = [
  { id: "INV-001", orderId: "SO-001", customerName: "Acme Corporation", date: "2024-12-03", dueDate: "2024-12-18", status: "paid", total: 4599.50 },
  { id: "INV-002", orderId: "SO-002", customerName: "TechStart Inc.", date: "2024-12-04", dueDate: "2024-12-19", status: "unpaid", total: 2340.00 },
  { id: "INV-003", orderId: "SO-003", customerName: "Global Supplies Ltd", date: "2024-12-05", dueDate: "2024-12-20", status: "partial", total: 8750.00, paid: 4000.00 },
];

export const mockEmployees = [
  { id: "E001", name: "Sarah Johnson", email: "sarah.johnson@unanza.com", department: "Sales", position: "Sales Manager", status: "active", hireDate: "2022-03-15" },
  { id: "E002", name: "Michael Chen", email: "michael.chen@unanza.com", department: "Warehouse", position: "Warehouse Supervisor", status: "active", hireDate: "2021-08-01" },
  { id: "E003", name: "Emily Rodriguez", email: "emily.rodriguez@unanza.com", department: "Finance", position: "Senior Accountant", status: "active", hireDate: "2020-01-10" },
  { id: "E004", name: "David Kim", email: "david.kim@unanza.com", department: "HR", position: "HR Coordinator", status: "active", hireDate: "2023-05-20" },
  { id: "E005", name: "Lisa Wang", email: "lisa.wang@unanza.com", department: "Operations", position: "Operations Analyst", status: "on-leave", hireDate: "2022-11-01" },
];

export const mockLeaveRequests = [
  { id: "LR-001", employeeId: "E001", employeeName: "Sarah Johnson", type: "vacation", startDate: "2024-12-20", endDate: "2024-12-27", status: "approved", days: 5 },
  { id: "LR-002", employeeId: "E003", employeeName: "Emily Rodriguez", type: "sick", startDate: "2024-12-10", endDate: "2024-12-11", status: "approved", days: 2 },
  { id: "LR-003", employeeId: "E002", employeeName: "Michael Chen", type: "personal", startDate: "2024-12-15", endDate: "2024-12-15", status: "pending", days: 1 },
  { id: "LR-004", employeeId: "E005", employeeName: "Lisa Wang", type: "vacation", startDate: "2024-12-01", endDate: "2024-12-14", status: "approved", days: 10 },
];

export const mockAttendance = [
  { id: "ATT-001", employeeId: "E001", employeeName: "Sarah Johnson", date: "2024-12-05", checkIn: "08:45", checkOut: "17:30", hours: 8.75, status: "present" },
  { id: "ATT-002", employeeId: "E002", employeeName: "Michael Chen", date: "2024-12-05", checkIn: "07:00", checkOut: "15:30", hours: 8.5, status: "present" },
  { id: "ATT-003", employeeId: "E003", employeeName: "Emily Rodriguez", date: "2024-12-05", checkIn: "09:00", checkOut: "18:00", hours: 9, status: "present" },
  { id: "ATT-004", employeeId: "E004", employeeName: "David Kim", date: "2024-12-05", checkIn: "08:30", checkOut: "17:00", hours: 8.5, status: "present" },
  { id: "ATT-005", employeeId: "E005", employeeName: "Lisa Wang", date: "2024-12-05", checkIn: null, checkOut: null, hours: 0, status: "on-leave" },
];

// todo: remove mock functionality - Complete Chart of Accounts with hierarchy
export interface ChartOfAccountsEntry {
  id: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  level: 1 | 2 | 3;
  parentId: string | null;
  balance: number;
  isPostable: boolean;
}

export const mockAccounts: ChartOfAccountsEntry[] = [
  // ASSETS (1000-1999)
  { id: "1000", name: "Assets", type: "asset", level: 1, parentId: null, balance: 0, isPostable: false },
  
  // Current Assets (1100-1199)
  { id: "1100", name: "Current Assets", type: "asset", level: 2, parentId: "1000", balance: 0, isPostable: false },
  
  // Cash & Bank (1110-1119)
  { id: "1110", name: "Cash & Bank", type: "asset", level: 2, parentId: "1100", balance: 0, isPostable: false },
  { id: "1111", name: "Cash on Hand", type: "asset", level: 3, parentId: "1110", balance: 15000, isPostable: true },
  { id: "1112", name: "Petty Cash", type: "asset", level: 3, parentId: "1110", balance: 2500, isPostable: true },
  { id: "1113", name: "Checking Account - Main", type: "asset", level: 3, parentId: "1110", balance: 85000, isPostable: true },
  { id: "1114", name: "Savings Account", type: "asset", level: 3, parentId: "1110", balance: 45000, isPostable: true },
  { id: "1115", name: "Money Market Account", type: "asset", level: 3, parentId: "1110", balance: 25000, isPostable: true },
  
  // Accounts Receivable (1120-1129)
  { id: "1120", name: "Accounts Receivable", type: "asset", level: 2, parentId: "1100", balance: 0, isPostable: false },
  { id: "1121", name: "Trade Receivables", type: "asset", level: 3, parentId: "1120", balance: 45600, isPostable: true },
  { id: "1122", name: "Employee Receivables", type: "asset", level: 3, parentId: "1120", balance: 3200, isPostable: true },
  { id: "1123", name: "Allowance for Doubtful Accounts", type: "asset", level: 3, parentId: "1120", balance: -2500, isPostable: true },
  { id: "1124", name: "Notes Receivable - Short Term", type: "asset", level: 3, parentId: "1120", balance: 12000, isPostable: true },
  
  // Inventory (1130-1139)
  { id: "1130", name: "Inventory", type: "asset", level: 2, parentId: "1100", balance: 0, isPostable: false },
  { id: "1131", name: "Raw Materials", type: "asset", level: 3, parentId: "1130", balance: 78500, isPostable: true },
  { id: "1132", name: "Work in Progress", type: "asset", level: 3, parentId: "1130", balance: 45000, isPostable: true },
  { id: "1133", name: "Finished Goods", type: "asset", level: 3, parentId: "1130", balance: 98000, isPostable: true },
  { id: "1134", name: "Merchandise Inventory", type: "asset", level: 3, parentId: "1130", balance: 67000, isPostable: true },
  { id: "1135", name: "Inventory Reserve", type: "asset", level: 3, parentId: "1130", balance: -5000, isPostable: true },
  
  // Other Current Assets (1140-1149)
  { id: "1140", name: "Other Current Assets", type: "asset", level: 2, parentId: "1100", balance: 0, isPostable: false },
  { id: "1141", name: "Prepaid Insurance", type: "asset", level: 3, parentId: "1140", balance: 8500, isPostable: true },
  { id: "1142", name: "Prepaid Rent", type: "asset", level: 3, parentId: "1140", balance: 12000, isPostable: true },
  { id: "1143", name: "Prepaid Expenses - Other", type: "asset", level: 3, parentId: "1140", balance: 4500, isPostable: true },
  
  // Fixed Assets (1200-1299)
  { id: "1200", name: "Fixed Assets", type: "asset", level: 2, parentId: "1000", balance: 0, isPostable: false },
  { id: "1210", name: "Land", type: "asset", level: 3, parentId: "1200", balance: 150000, isPostable: true },
  { id: "1220", name: "Buildings", type: "asset", level: 3, parentId: "1200", balance: 450000, isPostable: true },
  { id: "1221", name: "Accumulated Depreciation - Buildings", type: "asset", level: 3, parentId: "1200", balance: -95000, isPostable: true },
  { id: "1230", name: "Machinery & Equipment", type: "asset", level: 3, parentId: "1200", balance: 285000, isPostable: true },
  { id: "1231", name: "Accumulated Depreciation - Machinery", type: "asset", level: 3, parentId: "1200", balance: -78000, isPostable: true },
  { id: "1240", name: "Vehicles", type: "asset", level: 3, parentId: "1200", balance: 125000, isPostable: true },
  { id: "1241", name: "Accumulated Depreciation - Vehicles", type: "asset", level: 3, parentId: "1200", balance: -45000, isPostable: true },
  { id: "1250", name: "Furniture & Fixtures", type: "asset", level: 3, parentId: "1200", balance: 65000, isPostable: true },
  { id: "1251", name: "Accumulated Depreciation - Furniture", type: "asset", level: 3, parentId: "1200", balance: -18000, isPostable: true },
  { id: "1260", name: "Computer Equipment", type: "asset", level: 3, parentId: "1200", balance: 85000, isPostable: true },
  { id: "1261", name: "Accumulated Depreciation - Computers", type: "asset", level: 3, parentId: "1200", balance: -32000, isPostable: true },
  
  // LIABILITIES (2000-2999)
  { id: "2000", name: "Liabilities", type: "liability", level: 1, parentId: null, balance: 0, isPostable: false },
  
  // Current Liabilities (2100-2199)
  { id: "2100", name: "Current Liabilities", type: "liability", level: 2, parentId: "2000", balance: 0, isPostable: false },
  
  // Accounts Payable (2110-2119)
  { id: "2110", name: "Accounts Payable", type: "liability", level: 2, parentId: "2100", balance: 0, isPostable: false },
  { id: "2111", name: "Trade Payables", type: "liability", level: 3, parentId: "2110", balance: 28900, isPostable: true },
  { id: "2112", name: "Vendor Advances", type: "liability", level: 3, parentId: "2110", balance: 5500, isPostable: true },
  { id: "2113", name: "Notes Payable - Short Term", type: "liability", level: 3, parentId: "2110", balance: 15000, isPostable: true },
  
  // Accrued Expenses (2120-2129)
  { id: "2120", name: "Accrued Expenses", type: "liability", level: 2, parentId: "2100", balance: 0, isPostable: false },
  { id: "2121", name: "Accrued Salaries & Wages", type: "liability", level: 3, parentId: "2120", balance: 18500, isPostable: true },
  { id: "2122", name: "Accrued Payroll Taxes", type: "liability", level: 3, parentId: "2120", balance: 7200, isPostable: true },
  { id: "2123", name: "Accrued Interest", type: "liability", level: 3, parentId: "2120", balance: 3400, isPostable: true },
  { id: "2124", name: "Accrued Utilities", type: "liability", level: 3, parentId: "2120", balance: 2800, isPostable: true },
  
  // Taxes Payable (2130-2139)
  { id: "2130", name: "Taxes Payable", type: "liability", level: 2, parentId: "2100", balance: 0, isPostable: false },
  { id: "2131", name: "Sales Tax Payable", type: "liability", level: 3, parentId: "2130", balance: 8900, isPostable: true },
  { id: "2132", name: "Income Tax Payable", type: "liability", level: 3, parentId: "2130", balance: 22000, isPostable: true },
  { id: "2133", name: "Payroll Tax Payable", type: "liability", level: 3, parentId: "2130", balance: 6500, isPostable: true },
  
  // Other Current Liabilities (2140-2149)
  { id: "2140", name: "Other Current Liabilities", type: "liability", level: 2, parentId: "2100", balance: 0, isPostable: false },
  { id: "2141", name: "Customer Deposits", type: "liability", level: 3, parentId: "2140", balance: 12500, isPostable: true },
  { id: "2142", name: "Unearned Revenue", type: "liability", level: 3, parentId: "2140", balance: 8000, isPostable: true },
  { id: "2143", name: "Current Portion - Long Term Debt", type: "liability", level: 3, parentId: "2140", balance: 24000, isPostable: true },
  
  // Long-Term Liabilities (2200-2299)
  { id: "2200", name: "Long-Term Liabilities", type: "liability", level: 2, parentId: "2000", balance: 0, isPostable: false },
  { id: "2210", name: "Bank Loans - Long Term", type: "liability", level: 3, parentId: "2200", balance: 150000, isPostable: true },
  { id: "2220", name: "Mortgage Payable", type: "liability", level: 3, parentId: "2200", balance: 280000, isPostable: true },
  { id: "2230", name: "Equipment Loans", type: "liability", level: 3, parentId: "2200", balance: 75000, isPostable: true },
  
  // EQUITY (3000-3999)
  { id: "3000", name: "Equity", type: "equity", level: 1, parentId: null, balance: 0, isPostable: false },
  
  // Owner's Equity (3100-3199)
  { id: "3100", name: "Owner's Equity", type: "equity", level: 2, parentId: "3000", balance: 0, isPostable: false },
  { id: "3110", name: "Common Stock", type: "equity", level: 3, parentId: "3100", balance: 200000, isPostable: true },
  { id: "3120", name: "Preferred Stock", type: "equity", level: 3, parentId: "3100", balance: 50000, isPostable: true },
  { id: "3130", name: "Additional Paid-in Capital", type: "equity", level: 3, parentId: "3100", balance: 75000, isPostable: true },
  { id: "3140", name: "Owner's Contributions", type: "equity", level: 3, parentId: "3100", balance: 100000, isPostable: true },
  { id: "3150", name: "Owner's Drawings", type: "equity", level: 3, parentId: "3100", balance: -25000, isPostable: true },
  
  // Retained Earnings (3200-3299)
  { id: "3200", name: "Retained Earnings", type: "equity", level: 2, parentId: "3000", balance: 0, isPostable: false },
  { id: "3210", name: "Retained Earnings - Prior Years", type: "equity", level: 3, parentId: "3200", balance: 185000, isPostable: true },
  { id: "3220", name: "Current Year Earnings", type: "equity", level: 3, parentId: "3200", balance: 0, isPostable: true },
  { id: "3230", name: "Dividends Paid", type: "equity", level: 3, parentId: "3200", balance: -15000, isPostable: true },
  
  // REVENUE (4000-4999)
  { id: "4000", name: "Revenue", type: "revenue", level: 1, parentId: null, balance: 0, isPostable: false },
  
  // Sales Revenue (4100-4199)
  { id: "4100", name: "Sales Revenue", type: "revenue", level: 2, parentId: "4000", balance: 0, isPostable: false },
  { id: "4110", name: "Product Sales", type: "revenue", level: 3, parentId: "4100", balance: 485000, isPostable: true },
  { id: "4120", name: "Service Revenue", type: "revenue", level: 3, parentId: "4100", balance: 125000, isPostable: true },
  { id: "4130", name: "Shipping & Handling Revenue", type: "revenue", level: 3, parentId: "4100", balance: 18500, isPostable: true },
  { id: "4140", name: "Sales Returns & Allowances", type: "revenue", level: 3, parentId: "4100", balance: -12500, isPostable: true },
  { id: "4150", name: "Sales Discounts", type: "revenue", level: 3, parentId: "4100", balance: -8200, isPostable: true },
  
  // Other Income (4200-4299)
  { id: "4200", name: "Other Income", type: "revenue", level: 2, parentId: "4000", balance: 0, isPostable: false },
  { id: "4210", name: "Interest Income", type: "revenue", level: 3, parentId: "4200", balance: 5500, isPostable: true },
  { id: "4220", name: "Dividend Income", type: "revenue", level: 3, parentId: "4200", balance: 2800, isPostable: true },
  { id: "4230", name: "Rental Income", type: "revenue", level: 3, parentId: "4200", balance: 12000, isPostable: true },
  { id: "4240", name: "Gain on Asset Sale", type: "revenue", level: 3, parentId: "4200", balance: 4500, isPostable: true },
  { id: "4250", name: "Miscellaneous Income", type: "revenue", level: 3, parentId: "4200", balance: 1800, isPostable: true },
  
  // EXPENSES (5000-5999)
  { id: "5000", name: "Expenses", type: "expense", level: 1, parentId: null, balance: 0, isPostable: false },
  
  // Cost of Goods Sold (5100-5199)
  { id: "5100", name: "Cost of Goods Sold", type: "expense", level: 2, parentId: "5000", balance: 0, isPostable: false },
  { id: "5110", name: "Cost of Materials", type: "expense", level: 3, parentId: "5100", balance: 145000, isPostable: true },
  { id: "5120", name: "Direct Labor", type: "expense", level: 3, parentId: "5100", balance: 85000, isPostable: true },
  { id: "5130", name: "Manufacturing Overhead", type: "expense", level: 3, parentId: "5100", balance: 42000, isPostable: true },
  { id: "5140", name: "Freight In", type: "expense", level: 3, parentId: "5100", balance: 12500, isPostable: true },
  { id: "5150", name: "Purchase Discounts", type: "expense", level: 3, parentId: "5100", balance: -5800, isPostable: true },
  
  // Operating Expenses (5200-5299)
  { id: "5200", name: "Operating Expenses", type: "expense", level: 2, parentId: "5000", balance: 0, isPostable: false },
  { id: "5210", name: "Rent Expense", type: "expense", level: 3, parentId: "5200", balance: 36000, isPostable: true },
  { id: "5220", name: "Utilities Expense", type: "expense", level: 3, parentId: "5200", balance: 14500, isPostable: true },
  { id: "5230", name: "Insurance Expense", type: "expense", level: 3, parentId: "5200", balance: 18000, isPostable: true },
  { id: "5240", name: "Depreciation Expense", type: "expense", level: 3, parentId: "5200", balance: 45000, isPostable: true },
  { id: "5250", name: "Repairs & Maintenance", type: "expense", level: 3, parentId: "5200", balance: 12800, isPostable: true },
  { id: "5260", name: "Office Supplies", type: "expense", level: 3, parentId: "5200", balance: 4500, isPostable: true },
  { id: "5270", name: "Telephone & Internet", type: "expense", level: 3, parentId: "5200", balance: 6200, isPostable: true },
  { id: "5280", name: "Professional Fees", type: "expense", level: 3, parentId: "5200", balance: 15000, isPostable: true },
  
  // Payroll Expenses (5300-5399)
  { id: "5300", name: "Payroll Expenses", type: "expense", level: 2, parentId: "5000", balance: 0, isPostable: false },
  { id: "5310", name: "Salaries & Wages", type: "expense", level: 3, parentId: "5300", balance: 185000, isPostable: true },
  { id: "5320", name: "Payroll Taxes", type: "expense", level: 3, parentId: "5300", balance: 28500, isPostable: true },
  { id: "5330", name: "Employee Benefits", type: "expense", level: 3, parentId: "5300", balance: 32000, isPostable: true },
  { id: "5340", name: "Workers Compensation", type: "expense", level: 3, parentId: "5300", balance: 8500, isPostable: true },
  { id: "5350", name: "Training & Development", type: "expense", level: 3, parentId: "5300", balance: 5500, isPostable: true },
  
  // Marketing & Admin (5400-5499)
  { id: "5400", name: "Marketing & Administrative", type: "expense", level: 2, parentId: "5000", balance: 0, isPostable: false },
  { id: "5410", name: "Advertising & Promotion", type: "expense", level: 3, parentId: "5400", balance: 22000, isPostable: true },
  { id: "5420", name: "Travel & Entertainment", type: "expense", level: 3, parentId: "5400", balance: 14500, isPostable: true },
  { id: "5430", name: "Shipping & Freight Out", type: "expense", level: 3, parentId: "5400", balance: 18000, isPostable: true },
  { id: "5440", name: "Bad Debt Expense", type: "expense", level: 3, parentId: "5400", balance: 3500, isPostable: true },
  { id: "5450", name: "Bank Charges & Fees", type: "expense", level: 3, parentId: "5400", balance: 2800, isPostable: true },
  { id: "5460", name: "Interest Expense", type: "expense", level: 3, parentId: "5400", balance: 12500, isPostable: true },
  { id: "5470", name: "Licenses & Permits", type: "expense", level: 3, parentId: "5400", balance: 3200, isPostable: true },
  { id: "5480", name: "Miscellaneous Expense", type: "expense", level: 3, parentId: "5400", balance: 4800, isPostable: true },
];

export const mockJournalEntries = [
  { id: "JE-001", date: "2024-12-01", description: "Sales Revenue Recognition", debitAccount: "1100", creditAccount: "4000", amount: 4599.50, status: "posted" },
  { id: "JE-002", date: "2024-12-02", description: "Inventory Purchase", debitAccount: "1200", creditAccount: "2000", amount: 12500.00, status: "posted" },
  { id: "JE-003", date: "2024-12-03", description: "Payment Received", debitAccount: "1000", creditAccount: "1100", amount: 2340.00, status: "posted" },
  { id: "JE-004", date: "2024-12-04", description: "Operating Expense Payment", debitAccount: "5100", creditAccount: "1000", amount: 1500.00, status: "draft" },
];

export const mockLocations = [
  { id: "LOC-001", code: "A-01-01", name: "Rack A, Shelf 1, Bin 1", zone: "Zone A", type: "bin", capacity: 100, used: 45 },
  { id: "LOC-002", code: "A-01-02", name: "Rack A, Shelf 1, Bin 2", zone: "Zone A", type: "bin", capacity: 100, used: 78 },
  { id: "LOC-003", code: "B-02-01", name: "Rack B, Shelf 2, Bin 1", zone: "Zone B", type: "bin", capacity: 200, used: 12 },
  { id: "LOC-004", code: "B-02-02", name: "Rack B, Shelf 2, Bin 2", zone: "Zone B", type: "bin", capacity: 200, used: 156 },
  { id: "LOC-005", code: "C-03-01", name: "Bulk Storage C, Area 1", zone: "Zone C", type: "bulk", capacity: 5000, used: 2450 },
];

export const mockMovements = [
  { id: "MOV-001", type: "IN", productId: "P001", productName: "Industrial Widget A", quantity: 100, fromLocation: null, toLocation: "A-01-01", date: "2024-12-01", reference: "PO-001" },
  { id: "MOV-002", type: "OUT", productId: "P002", productName: "Industrial Widget B", quantity: 25, fromLocation: "A-01-02", toLocation: null, date: "2024-12-02", reference: "SO-001" },
  { id: "MOV-003", type: "TRANSFER", productId: "P003", productName: "Component Alpha", quantity: 50, fromLocation: "B-02-01", toLocation: "D-01-01", date: "2024-12-03", reference: "INT-001" },
  { id: "MOV-004", type: "IN", productId: "P005", productName: "Raw Material X", quantity: 500, fromLocation: null, toLocation: "C-03-01", date: "2024-12-04", reference: "PO-002" },
];

export const mockDashboardStats = {
  sales: { today: 12500, month: 156000, pending: 8, trend: 12.5 },
  inventory: { totalValue: 234500, lowStock: 3, movements: 24, trend: -2.3 },
  receivables: { total: 45600, overdue: 8900, collected: 23400, trend: 5.8 },
  payables: { total: 28900, dueThisWeek: 12500, paid: 45000, trend: -8.2 },
};
