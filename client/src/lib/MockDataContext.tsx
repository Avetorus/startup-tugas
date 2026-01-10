import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  mockWarehouses,
  mockProductsFull,
  mockVendorsFull,
  mockCustomersFull,
  mockPurchaseOrdersFull,
  mockSalesOrdersFull,
  mockSalesOrderLines,
  mockInvoicesFull,
  mockAccountsFull,
} from "./mockData";

// ============ Types ============

export interface Warehouse {
  id: string;
  companyId: string;
  code: string;
  name: string;
  address: string;
  city: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  companyId: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  uom: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  reorderPoint: number;
  isActive: boolean;
}

export interface Vendor {
  id: string;
  companyId: string;
  code: string;
  name: string;
  legalName: string;
  email: string;
  phone: string;
  taxId: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  paymentTerms: number;
  vendorType: string;
  isActive: boolean;
}

export interface Customer {
  id: string;
  companyId: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  creditLimit: number;
  paymentTerms: number;
  isActive: boolean;
}

export interface PurchaseOrder {
  id: string;
  companyId: string;
  orderNumber: string;
  vendorId: string;
  orderDate: string;
  expectedDate?: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  total: number;
}

export interface PurchaseOrderLine {
  id: string;
  purchaseOrderId: string;
  productId: string;
  warehouseId?: string;  // Receiving destination warehouse
  locationId?: string;   // Receiving destination location
  lineNumber: number;
  quantity: number;
  quantityReceived: number;  // For partial receiving
  unitPrice: number;
  lineTotal: number;
}

export interface SalesOrder {
  id: string;
  companyId: string;
  orderNumber: string;
  customerId: string;
  orderDate: string;
  requiredDate?: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  total: number;
}

export interface SalesOrderLine {
  id: string;
  salesOrderId: string;
  productId: string;
  warehouseId?: string;  // Source warehouse for delivery
  locationId?: string;   // Source location for delivery
  lineNumber: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Invoice {
  id: string;
  companyId: string;
  invoiceNumber: string;
  invoiceType: string;
  customerId: string;
  salesOrderId?: string;
  invoiceDate: string;
  dueDate: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
}

export interface Account {
  id: string;
  companyId: string;
  accountCode: string;
  name: string;
  accountType: string;
  parentId: string | null;
  level: number;
  balance: number;
  isPostable: boolean;
  isActive: boolean;
}

// ============ Warehouse ERP Entities ============

export interface Zone {
  id: string;
  companyId: string;
  warehouseId: string;
  code: string;
  name: string;
  type: "receiving" | "bulk" | "picking" | "shipping" | "staging" | "general";
  isActive: boolean;
}

export interface Location {
  id: string;
  companyId: string;
  warehouseId: string;
  zoneId: string;
  code: string;
  name: string;
  type: "bin" | "rack" | "shelf" | "bulk" | "floor";
  capacity: number;
  isActive: boolean;
}

export interface StockLevel {
  id: string;
  companyId: string;
  warehouseId: string;
  locationId: string;
  productId: string;
  quantity: number;
  minLevel: number;
  maxLevel: number;
  lastUpdated: string;
}

export interface Movement {
  id: string;
  companyId: string;
  warehouseId: string;
  type: "RECEIVE" | "SHIP" | "TRANSFER" | "ADJUST";
  productId: string;
  quantity: number;
  fromLocationId?: string;
  toLocationId?: string;
  referenceType: "PO" | "SO" | "TRANSFER" | "ADJUSTMENT";
  referenceId: string;
  date: string;
  notes?: string;
}

export interface JournalLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface JournalEntry {
  id: string;
  companyId: string;
  entryNumber: string;
  date: string;
  description: string;
  referenceType: "PO" | "SO" | "INV" | "PMT" | "ADJUST";
  referenceId: string;
  lines: JournalLine[];
  status: "draft" | "posted";
  createdAt: string;
}

// ============ Context State ============

interface MockDataState {
  warehouses: Warehouse[];
  zones: Zone[];
  locations: Location[];
  products: Product[];
  stockLevels: StockLevel[];
  movements: Movement[];
  vendors: Vendor[];
  customers: Customer[];
  purchaseOrders: PurchaseOrder[];
  purchaseOrderLines: PurchaseOrderLine[];
  salesOrders: SalesOrder[];
  salesOrderLines: SalesOrderLine[];
  invoices: Invoice[];
  accounts: Account[];
  journalEntries: JournalEntry[];
}

interface MockDataContextType extends MockDataState {
  // Warehouses
  addWarehouse: (warehouse: Omit<Warehouse, "id">) => Warehouse;
  updateWarehouse: (id: string, data: Partial<Warehouse>) => void;
  deleteWarehouse: (id: string) => void;

  // Products
  addProduct: (product: Omit<Product, "id">) => Product;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateProductStock: (productId: string, quantityChange: number) => void;

  // Vendors
  addVendor: (vendor: Omit<Vendor, "id">) => Vendor;
  updateVendor: (id: string, data: Partial<Vendor>) => void;
  deleteVendor: (id: string) => void;

  // Customers
  addCustomer: (customer: Omit<Customer, "id">) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Purchase Orders
  addPurchaseOrder: (order: Omit<PurchaseOrder, "id">) => PurchaseOrder;
  updatePurchaseOrder: (id: string, data: Partial<PurchaseOrder>) => void;
  deletePurchaseOrder: (id: string) => void;

  // Purchase Order Lines
  addPurchaseOrderLine: (line: Omit<PurchaseOrderLine, "id">) => PurchaseOrderLine;
  addPurchaseOrderLines: (lines: Omit<PurchaseOrderLine, "id">[]) => PurchaseOrderLine[];
  deletePurchaseOrderLinesByOrderId: (purchaseOrderId: string) => void;

  // Sales Orders
  addSalesOrder: (order: Omit<SalesOrder, "id">) => SalesOrder;
  updateSalesOrder: (id: string, data: Partial<SalesOrder>) => void;
  deleteSalesOrder: (id: string) => void;

  // Sales Order Lines
  addSalesOrderLine: (line: Omit<SalesOrderLine, "id">) => SalesOrderLine;
  addSalesOrderLines: (lines: Omit<SalesOrderLine, "id">[]) => SalesOrderLine[];
  deleteSalesOrderLine: (id: string) => void;
  deleteSalesOrderLinesByOrderId: (salesOrderId: string) => void;

  // Invoices
  addInvoice: (invoice: Omit<Invoice, "id">) => Invoice;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;

  // Accounts
  addAccount: (account: Omit<Account, "id">) => Account;
  updateAccount: (id: string, data: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  // Zones
  addZone: (zone: Omit<Zone, "id">) => Zone;
  updateZone: (id: string, data: Partial<Zone>) => void;
  deleteZone: (id: string) => void;

  // Locations
  addLocation: (location: Omit<Location, "id">) => Location;
  updateLocation: (id: string, data: Partial<Location>) => void;
  deleteLocation: (id: string) => void;

  // Stock Levels
  addStockLevel: (stockLevel: Omit<StockLevel, "id">) => StockLevel;
  updateStockLevel: (id: string, data: Partial<StockLevel>) => void;
  deleteStockLevel: (id: string) => void;
  adjustStock: (warehouseId: string, locationId: string, productId: string, quantityChange: number, referenceType: Movement["referenceType"], referenceId: string) => void;

  // Movements
  addMovement: (movement: Omit<Movement, "id">) => Movement;

  // Journal Entries
  addJournalEntry: (entry: Omit<JournalEntry, "id" | "entryNumber" | "createdAt">) => JournalEntry;
}

const MockDataContext = createContext<MockDataContextType | null>(null);

// ============ Initial Data Loading ============

const loadInitialWarehouses = (): Warehouse[] =>
  mockWarehouses.map((w) => ({
    id: w.id,
    companyId: "comp-002",
    code: w.code,
    name: w.name,
    address: w.address || "",
    city: w.city || "",
    isActive: true,
  }));

const loadInitialProducts = (): Product[] =>
  mockProductsFull.map((p) => ({
    id: p.id,
    companyId: p.companyId,
    sku: p.sku,
    name: p.name,
    description: p.description || "",
    category: p.category || "",
    uom: p.uom,
    costPrice: p.purchasePrice,
    sellingPrice: p.sellingPrice,
    stockQuantity: p.stockOnHand || 100, // Use stockOnHand from mock data
    reorderPoint: p.reorderLevel || 10,
    isActive: p.isActive,
  }));

const loadInitialVendors = (): Vendor[] =>
  mockVendorsFull.map((v) => ({
    id: v.id,
    companyId: v.companyId,
    code: v.code,
    name: v.name,
    legalName: v.name,
    email: v.email || "",
    phone: v.phone || "",
    taxId: v.taxId || "",
    address: v.address || "",
    city: v.city || "",
    state: v.state || "",
    country: v.country || "",
    postalCode: v.postalCode || "",
    paymentTerms: v.paymentTerms || 30,
    vendorType: "regular",
    isActive: v.isActive,
  }));

const loadInitialCustomers = (): Customer[] =>
  mockCustomersFull.map((c) => ({
    id: c.id,
    companyId: c.companyId,
    code: c.code,
    name: c.name,
    email: c.email || "",
    phone: c.phone || "",
    address: c.address || "",
    city: c.city || "",
    state: c.state || "",
    country: c.country || "",
    postalCode: c.postalCode || "",
    creditLimit: c.creditLimit || 0,
    paymentTerms: c.paymentTerms || 30,
    isActive: c.isActive,
  }));

const loadInitialPurchaseOrders = (): PurchaseOrder[] =>
  mockPurchaseOrdersFull.map((po) => ({
    id: po.id,
    companyId: po.companyId,
    orderNumber: po.orderNumber,
    vendorId: po.vendorId,
    orderDate: po.orderDate,
    expectedDate: po.expectedDeliveryDate,
    status: po.status,
    subtotal: po.subtotal,
    taxAmount: po.taxAmount,
    total: po.total,
  }));

// Initial PO lines linking purchase orders to products
const loadInitialPurchaseOrderLines = (): PurchaseOrderLine[] => [
  { id: "pol-001", purchaseOrderId: "po-001", productId: "prod-001", warehouseId: "wh-001", locationId: "loc-002", lineNumber: 1, quantity: 50, quantityReceived: 0, unitPrice: 125.0, lineTotal: 6250.0 },
  { id: "pol-002", purchaseOrderId: "po-001", productId: "prod-002", warehouseId: "wh-001", locationId: "loc-003", lineNumber: 2, quantity: 25, quantityReceived: 0, unitPrice: 250.0, lineTotal: 6250.0 },
  { id: "pol-003", purchaseOrderId: "po-002", productId: "prod-003", warehouseId: "wh-001", locationId: "loc-004", lineNumber: 1, quantity: 100, quantityReceived: 0, unitPrice: 45.0, lineTotal: 4500.0 },
  { id: "pol-004", purchaseOrderId: "po-002", productId: "prod-004", warehouseId: "wh-001", locationId: "loc-005", lineNumber: 2, quantity: 40, quantityReceived: 0, unitPrice: 110.0, lineTotal: 4400.0 },
  { id: "pol-005", purchaseOrderId: "po-003", productId: "prod-001", warehouseId: "wh-002", locationId: "loc-007", lineNumber: 1, quantity: 30, quantityReceived: 0, unitPrice: 125.0, lineTotal: 3750.0 },
];

const loadInitialSalesOrders = (): SalesOrder[] =>
  mockSalesOrdersFull.map((so) => ({
    id: so.id,
    companyId: so.companyId,
    orderNumber: so.orderNumber,
    customerId: so.customerId,
    orderDate: so.orderDate,
    status: so.status,
    subtotal: so.subtotal,
    taxAmount: so.taxAmount,
    total: so.total,
  }));

const loadInitialSalesOrderLines = (): SalesOrderLine[] =>
  mockSalesOrderLines.map((l, i) => ({
    id: l.id,
    salesOrderId: l.salesOrderId,
    productId: l.productId,
    lineNumber: i + 1,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    lineTotal: l.lineTotal,
  }));

const loadInitialInvoices = (): Invoice[] =>
  mockInvoicesFull.map((inv) => ({
    id: inv.id,
    companyId: inv.companyId,
    invoiceNumber: inv.invoiceNumber,
    invoiceType: inv.invoiceType,
    customerId: inv.customerId || "",
    invoiceDate: inv.invoiceDate,
    dueDate: inv.dueDate,
    status: inv.status,
    subtotal: inv.subtotal,
    taxAmount: inv.taxAmount,
    total: inv.total,
    amountPaid: inv.amountPaid,
    amountDue: inv.amountDue,
  }));

const loadInitialAccounts = (): Account[] =>
  mockAccountsFull.map((acc) => ({
    id: acc.id,
    companyId: acc.companyId,
    accountCode: acc.code,
    name: acc.name,
    accountType: acc.accountType,
    parentId: acc.parentId || null,
    level: acc.level,
    balance: acc.balance || 0,
    isPostable: acc.isPostable,
    isActive: acc.isActive,
  }));

// Load initial zones with warehouse relationships
const loadInitialZones = (): Zone[] => [
  { id: "zone-001", companyId: "comp-002", warehouseId: "wh-001", code: "RCV", name: "Receiving", type: "receiving", isActive: true },
  { id: "zone-002", companyId: "comp-002", warehouseId: "wh-001", code: "BULK", name: "Bulk Storage", type: "bulk", isActive: true },
  { id: "zone-003", companyId: "comp-002", warehouseId: "wh-001", code: "PICK", name: "Picking Area", type: "picking", isActive: true },
  { id: "zone-004", companyId: "comp-002", warehouseId: "wh-001", code: "SHIP", name: "Shipping", type: "shipping", isActive: true },
  { id: "zone-005", companyId: "comp-002", warehouseId: "wh-002", code: "GEN", name: "General Storage", type: "general", isActive: true },
];

// Load initial locations with zone relationships
const loadInitialLocations = (): Location[] => [
  { id: "loc-001", companyId: "comp-002", warehouseId: "wh-001", zoneId: "zone-001", code: "RCV-01", name: "Receiving Dock 1", type: "floor", capacity: 1000, isActive: true },
  { id: "loc-002", companyId: "comp-002", warehouseId: "wh-001", zoneId: "zone-002", code: "BULK-A-01", name: "Bulk Rack A Row 1", type: "rack", capacity: 500, isActive: true },
  { id: "loc-003", companyId: "comp-002", warehouseId: "wh-001", zoneId: "zone-002", code: "BULK-A-02", name: "Bulk Rack A Row 2", type: "rack", capacity: 500, isActive: true },
  { id: "loc-004", companyId: "comp-002", warehouseId: "wh-001", zoneId: "zone-003", code: "PICK-A-01", name: "Picking Bin A-01", type: "bin", capacity: 100, isActive: true },
  { id: "loc-005", companyId: "comp-002", warehouseId: "wh-001", zoneId: "zone-003", code: "PICK-A-02", name: "Picking Bin A-02", type: "bin", capacity: 100, isActive: true },
  { id: "loc-006", companyId: "comp-002", warehouseId: "wh-001", zoneId: "zone-004", code: "SHIP-01", name: "Shipping Dock 1", type: "floor", capacity: 800, isActive: true },
  { id: "loc-007", companyId: "comp-002", warehouseId: "wh-002", zoneId: "zone-005", code: "GEN-01", name: "General Shelf 1", type: "shelf", capacity: 200, isActive: true },
];

// Load initial stock levels - stock per product per location
const loadInitialStockLevels = (): StockLevel[] => [
  { id: "stk-001", companyId: "comp-002", warehouseId: "wh-001", locationId: "loc-002", productId: "prod-001", quantity: 150, minLevel: 20, maxLevel: 300, lastUpdated: new Date().toISOString() },
  { id: "stk-002", companyId: "comp-002", warehouseId: "wh-001", locationId: "loc-003", productId: "prod-002", quantity: 75, minLevel: 10, maxLevel: 150, lastUpdated: new Date().toISOString() },
  { id: "stk-003", companyId: "comp-002", warehouseId: "wh-001", locationId: "loc-004", productId: "prod-003", quantity: 200, minLevel: 50, maxLevel: 500, lastUpdated: new Date().toISOString() },
  { id: "stk-004", companyId: "comp-002", warehouseId: "wh-001", locationId: "loc-005", productId: "prod-004", quantity: 30, minLevel: 5, maxLevel: 100, lastUpdated: new Date().toISOString() },
  { id: "stk-005", companyId: "comp-002", warehouseId: "wh-002", locationId: "loc-007", productId: "prod-001", quantity: 50, minLevel: 10, maxLevel: 100, lastUpdated: new Date().toISOString() },
];

// Load initial movements - empty for now, will be populated by transactions
const loadInitialMovements = (): Movement[] => [];

// ============ Provider ============

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(loadInitialWarehouses);
  const [products, setProducts] = useState<Product[]>(loadInitialProducts);
  const [vendors, setVendors] = useState<Vendor[]>(loadInitialVendors);
  const [customers, setCustomers] = useState<Customer[]>(loadInitialCustomers);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(loadInitialPurchaseOrders);
  const [purchaseOrderLines, setPurchaseOrderLines] = useState<PurchaseOrderLine[]>(loadInitialPurchaseOrderLines);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(loadInitialSalesOrders);
  const [salesOrderLines, setSalesOrderLines] = useState<SalesOrderLine[]>(loadInitialSalesOrderLines);
  const [invoices, setInvoices] = useState<Invoice[]>(loadInitialInvoices);
  const [accounts, setAccounts] = useState<Account[]>(loadInitialAccounts);
  const [zones, setZones] = useState<Zone[]>(loadInitialZones);
  const [locations, setLocations] = useState<Location[]>(loadInitialLocations);
  const [stockLevels, setStockLevels] = useState<StockLevel[]>(loadInitialStockLevels);
  const [movements, setMovements] = useState<Movement[]>(loadInitialMovements);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  // Warehouse CRUD
  const addWarehouse = (warehouse: Omit<Warehouse, "id">) => {
    const newWarehouse = { ...warehouse, id: `wh-${Date.now()}` };
    setWarehouses((prev) => [...prev, newWarehouse]);
    return newWarehouse;
  };
  const updateWarehouse = (id: string, data: Partial<Warehouse>) => {
    setWarehouses((prev) => prev.map((w) => (w.id === id ? { ...w, ...data } : w)));
  };
  const deleteWarehouse = (id: string) => {
    setWarehouses((prev) => prev.filter((w) => w.id !== id));
  };

  // Product CRUD
  const addProduct = (product: Omit<Product, "id">) => {
    const newProduct = { ...product, id: `prod-${Date.now()}` };
    setProducts((prev) => [...prev, newProduct]);
    return newProduct;
  };
  const updateProduct = (id: string, data: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  };
  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };
  const updateProductStock = (productId: string, quantityChange: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, stockQuantity: Math.max(0, p.stockQuantity + quantityChange) }
          : p
      )
    );
  };

  // Vendor CRUD
  const addVendor = (vendor: Omit<Vendor, "id">) => {
    const newVendor = { ...vendor, id: `vend-${Date.now()}` };
    setVendors((prev) => [...prev, newVendor]);
    return newVendor;
  };
  const updateVendor = (id: string, data: Partial<Vendor>) => {
    setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, ...data } : v)));
  };
  const deleteVendor = (id: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== id));
  };

  // Customer CRUD
  const addCustomer = (customer: Omit<Customer, "id">) => {
    const newCustomer = { ...customer, id: `cust-${Date.now()}` };
    setCustomers((prev) => [...prev, newCustomer]);
    return newCustomer;
  };
  const updateCustomer = (id: string, data: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  };
  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // Purchase Order CRUD
  const addPurchaseOrder = (order: Omit<PurchaseOrder, "id">) => {
    const newOrder = { ...order, id: `po-${Date.now()}` };
    setPurchaseOrders((prev) => [...prev, newOrder]);
    return newOrder;
  };
  const updatePurchaseOrder = (id: string, data: Partial<PurchaseOrder>) => {
    setPurchaseOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...data } : o)));
  };
  const deletePurchaseOrder = (id: string) => {
    setPurchaseOrders((prev) => prev.filter((o) => o.id !== id));
    // Also delete associated order lines
    setPurchaseOrderLines((prev) => prev.filter((l) => l.purchaseOrderId !== id));
  };

  // Purchase Order Lines CRUD
  const addPurchaseOrderLine = (line: Omit<PurchaseOrderLine, "id">) => {
    const newLine = { ...line, id: `pol-${Date.now()}` };
    setPurchaseOrderLines((prev) => [...prev, newLine]);
    return newLine;
  };
  const addPurchaseOrderLines = (lines: Omit<PurchaseOrderLine, "id">[]) => {
    const newLines = lines.map((line, i) => ({ ...line, id: `pol-${Date.now()}-${i}` }));
    setPurchaseOrderLines((prev) => [...prev, ...newLines]);
    return newLines;
  };
  const deletePurchaseOrderLinesByOrderId = (purchaseOrderId: string) => {
    setPurchaseOrderLines((prev) => prev.filter((l) => l.purchaseOrderId !== purchaseOrderId));
  };

  // Sales Order CRUD
  const addSalesOrder = (order: Omit<SalesOrder, "id">) => {
    const newOrder = { ...order, id: `so-${Date.now()}` };
    setSalesOrders((prev) => [...prev, newOrder]);
    return newOrder;
  };
  const updateSalesOrder = (id: string, data: Partial<SalesOrder>) => {
    setSalesOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...data } : o)));
  };
  const deleteSalesOrder = (id: string) => {
    setSalesOrders((prev) => prev.filter((o) => o.id !== id));
    // Also delete associated order lines
    setSalesOrderLines((prev) => prev.filter((l) => l.salesOrderId !== id));
  };

  // Sales Order Lines CRUD
  const addSalesOrderLine = (line: Omit<SalesOrderLine, "id">) => {
    const newLine = { ...line, id: `sol-${Date.now()}` };
    setSalesOrderLines((prev) => [...prev, newLine]);
    return newLine;
  };
  const addSalesOrderLines = (lines: Omit<SalesOrderLine, "id">[]) => {
    const newLines = lines.map((line, i) => ({ ...line, id: `sol-${Date.now()}-${i}` }));
    setSalesOrderLines((prev) => [...prev, ...newLines]);
    return newLines;
  };
  const deleteSalesOrderLine = (id: string) => {
    setSalesOrderLines((prev) => prev.filter((l) => l.id !== id));
  };
  const deleteSalesOrderLinesByOrderId = (salesOrderId: string) => {
    setSalesOrderLines((prev) => prev.filter((l) => l.salesOrderId !== salesOrderId));
  };

  // Invoice CRUD
  const addInvoice = (invoice: Omit<Invoice, "id">) => {
    const newInvoice = { ...invoice, id: `inv-${Date.now()}` };
    setInvoices((prev) => [...prev, newInvoice]);
    return newInvoice;
  };
  const updateInvoice = (id: string, data: Partial<Invoice>) => {
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)));
  };
  const deleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  };

  // Account CRUD
  const addAccount = (account: Omit<Account, "id">) => {
    const newAccount = { ...account, id: `acc-${Date.now()}` };
    setAccounts((prev) => [...prev, newAccount]);
    return newAccount;
  };
  const updateAccount = (id: string, data: Partial<Account>) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
  };
  const deleteAccount = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  // Zone CRUD
  const addZone = (zone: Omit<Zone, "id">) => {
    const newZone = { ...zone, id: `zone-${Date.now()}` };
    setZones((prev) => [...prev, newZone]);
    return newZone;
  };
  const updateZone = (id: string, data: Partial<Zone>) => {
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, ...data } : z)));
  };
  const deleteZone = (id: string) => {
    setZones((prev) => prev.filter((z) => z.id !== id));
    // Also delete locations in this zone
    setLocations((prev) => prev.filter((l) => l.zoneId !== id));
  };

  // Location CRUD
  const addLocation = (location: Omit<Location, "id">) => {
    const newLocation = { ...location, id: `loc-${Date.now()}` };
    setLocations((prev) => [...prev, newLocation]);
    return newLocation;
  };
  const updateLocation = (id: string, data: Partial<Location>) => {
    setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, ...data } : l)));
  };
  const deleteLocation = (id: string) => {
    setLocations((prev) => prev.filter((l) => l.id !== id));
    // Also delete stock levels at this location
    setStockLevels((prev) => prev.filter((s) => s.locationId !== id));
  };

  // Stock Level CRUD
  const addStockLevel = (stockLevel: Omit<StockLevel, "id">) => {
    const newStockLevel = { ...stockLevel, id: `stk-${Date.now()}` };
    setStockLevels((prev) => [...prev, newStockLevel]);
    return newStockLevel;
  };
  const updateStockLevel = (id: string, data: Partial<StockLevel>) => {
    setStockLevels((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  };
  const deleteStockLevel = (id: string) => {
    setStockLevels((prev) => prev.filter((s) => s.id !== id));
  };
  // Adjust stock and create movement record
  const adjustStock = (
    warehouseId: string,
    locationId: string,
    productId: string,
    quantityChange: number,
    referenceType: Movement["referenceType"],
    referenceId: string
  ) => {
    console.log("adjustStock called:", { warehouseId, locationId, productId, quantityChange, referenceType, referenceId });
    
    // Use functional update to access current stockLevels state
    setStockLevels((currentStockLevels) => {
      console.log("Current stock levels:", currentStockLevels.length, "items");
      const existingStock = currentStockLevels.find(
        s => s.warehouseId === warehouseId && s.locationId === locationId && s.productId === productId
      );
      console.log("Existing stock found:", existingStock ? `${existingStock.id} with qty ${existingStock.quantity}` : "NO MATCH");
      
      if (existingStock) {
        // Update existing stock level
        return currentStockLevels.map(s => 
          s.id === existingStock.id 
            ? { ...s, quantity: Math.max(0, s.quantity + quantityChange), lastUpdated: new Date().toISOString() }
            : s
        );
      } else if (quantityChange > 0) {
        // Create new stock level entry
        const newStockLevel: StockLevel = {
          id: `stk-${Date.now()}`,
          companyId: "comp-002",
          warehouseId,
          locationId,
          productId,
          quantity: quantityChange,
          minLevel: 10,
          maxLevel: 100,
          lastUpdated: new Date().toISOString()
        };
        return [...currentStockLevels, newStockLevel];
      }
      return currentStockLevels;
    });

    // Also update the global Product.stockQuantity to keep in sync
    setProducts((currentProducts) => {
      const product = currentProducts.find(p => p.id === productId);
      if (product) {
        return currentProducts.map(p => 
          p.id === productId 
            ? { ...p, stockQuantity: Math.max(0, p.stockQuantity + quantityChange) }
            : p
        );
      }
      return currentProducts;
    });

    // Create movement record
    addMovement({
      companyId: "comp-002",
      warehouseId,
      type: quantityChange > 0 ? "RECEIVE" : "SHIP",
      productId,
      quantity: Math.abs(quantityChange),
      toLocationId: quantityChange > 0 ? locationId : undefined,
      fromLocationId: quantityChange < 0 ? locationId : undefined,
      referenceType,
      referenceId,
      date: new Date().toISOString(),
    });
  };

  // Movement CRUD
  const addMovement = (movement: Omit<Movement, "id">) => {
    const newMovement = { ...movement, id: `mov-${Date.now()}` };
    setMovements((prev) => [...prev, newMovement]);
    return newMovement;
  };

  // Journal Entry functions
  const addJournalEntry = (entry: Omit<JournalEntry, "id" | "entryNumber" | "createdAt">) => {
    const entryNumber = `JE-${String(Date.now()).slice(-8)}`;
    const newEntry: JournalEntry = {
      ...entry,
      id: `je-${Date.now()}`,
      entryNumber,
      createdAt: new Date().toISOString(),
    };
    setJournalEntries((prev) => [...prev, newEntry]);
    console.log("Journal entry created:", newEntry);
    return newEntry;
  };
  return (
    <MockDataContext.Provider
      value={{
        warehouses,
        products,
        vendors,
        customers,
        purchaseOrders,
        purchaseOrderLines,
        salesOrders,
        salesOrderLines,
        invoices,
        accounts,
        addWarehouse,
        updateWarehouse,
        deleteWarehouse,
        addProduct,
        updateProduct,
        deleteProduct,
        updateProductStock,
        addVendor,
        updateVendor,
        deleteVendor,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addPurchaseOrder,
        updatePurchaseOrder,
        deletePurchaseOrder,
        addPurchaseOrderLine,
        addPurchaseOrderLines,
        deletePurchaseOrderLinesByOrderId,
        addSalesOrder,
        updateSalesOrder,
        deleteSalesOrder,
        addSalesOrderLine,
        addSalesOrderLines,
        deleteSalesOrderLine,
        deleteSalesOrderLinesByOrderId,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        addAccount,
        updateAccount,
        deleteAccount,
        zones,
        locations,
        stockLevels,
        movements,
        addZone,
        updateZone,
        deleteZone,
        addLocation,
        updateLocation,
        deleteLocation,
        addStockLevel,
        updateStockLevel,
        deleteStockLevel,
        adjustStock,
        addMovement,
        journalEntries,
        addJournalEntry,
      }}
    >
      {children}
    </MockDataContext.Provider>
  );
}

export function useMockData() {
  const context = useContext(MockDataContext);
  if (!context) {
    throw new Error("useMockData must be used within a MockDataProvider");
  }
  return context;
}
