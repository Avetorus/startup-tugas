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

export const mockAccounts = [
  { id: "1000", name: "Cash", type: "asset", balance: 125000, parent: null },
  { id: "1100", name: "Accounts Receivable", type: "asset", balance: 45600, parent: null },
  { id: "1200", name: "Inventory", type: "asset", balance: 234500, parent: null },
  { id: "2000", name: "Accounts Payable", type: "liability", balance: 28900, parent: null },
  { id: "3000", name: "Owner's Equity", type: "equity", balance: 350000, parent: null },
  { id: "4000", name: "Sales Revenue", type: "revenue", balance: 567800, parent: null },
  { id: "5000", name: "Cost of Goods Sold", type: "expense", balance: 234000, parent: null },
  { id: "5100", name: "Operating Expenses", type: "expense", balance: 89000, parent: null },
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
