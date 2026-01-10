import { useState } from "react";
import { DataTable, type Column } from "@/components/layout/DataTable";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Download, Eye, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMockData } from "@/lib/MockDataContext";

// Types for display
interface SalesOrderDisplay {
  id: string;
  companyId: string;
  orderNumber: string;
  customerId: string;
  orderDate: string;
  requiredDate?: string;
  status: string;
  subtotal: string;
  taxAmount: string;
  total: string;
  customerName: string;
  itemCount: number;
}

interface SalesOrderLineDisplay {
  id: string;
  salesOrderId: string;
  productId: string;
  lineNumber?: number;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

export function SalesOrderList() {
  const { activeCompany } = useAuth();
  const { toast } = useToast();
  const { salesOrders, salesOrderLines, customers, products, warehouses, locations, addSalesOrder, updateSalesOrder, deleteSalesOrder, addSalesOrderLines, adjustStock, addInvoice, addJournalEntry } = useMockData();
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderDisplay | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SalesOrderDisplay | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [ordersLoading] = useState(false);

  // Map global data to display format
  const ordersWithCustomers: SalesOrderDisplay[] = salesOrders.map(o => ({
    id: o.id,
    companyId: o.companyId,
    orderNumber: o.orderNumber,
    customerId: o.customerId,
    orderDate: o.orderDate,
    status: o.status,
    subtotal: o.subtotal.toString(),
    taxAmount: o.taxAmount.toString(),
    total: o.total.toString(),
    customerName: customers.find(c => c.id === o.customerId)?.name || "Unknown Customer",
    itemCount: salesOrderLines.filter(l => l.salesOrderId === o.id).length,
  }));

  const orderLinesDisplay: SalesOrderLineDisplay[] = salesOrderLines.map((l, i) => ({
    id: l.id,
    salesOrderId: l.salesOrderId,
    productId: l.productId,
    lineNumber: l.lineNumber,
    quantity: l.quantity,
    unitPrice: l.unitPrice.toString(),
    lineTotal: l.lineTotal.toString(),
  }));

  const productsDisplay = products.map(p => ({ id: p.id, name: p.name, price: p.sellingPrice.toString() }));

  interface OrderLineData {
    productId: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }

  const handleCreateOrder = (orderData: { 
    customerId: string; 
    subtotal?: string; 
    taxAmount?: string; 
    total?: string;
    lines?: OrderLineData[];
  }) => {
    setIsPending(true);
    setTimeout(() => {
      const newOrder = addSalesOrder({
        companyId: activeCompany?.id || "comp-002",
        orderNumber: `SO-${String(Date.now()).slice(-6)}`,
        customerId: orderData.customerId || "",
        orderDate: new Date().toISOString().split("T")[0],
        status: "draft",
        subtotal: parseFloat(orderData.subtotal || "0"),
        taxAmount: parseFloat(orderData.taxAmount || "0"),
        total: parseFloat(orderData.total || "0"),
      });
      
      // Save order lines if provided
      if (orderData.lines && orderData.lines.length > 0) {
        addSalesOrderLines(orderData.lines.map((line, idx) => ({
          salesOrderId: newOrder.id,
          productId: line.productId,
          lineNumber: idx + 1,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal,
        })));
      }
      
      toast({ title: "Sales order created successfully" });
      setIsPending(false);
      setIsFormOpen(false);
    }, 500);
  };

  const handleViewOrder = (order: SalesOrderDisplay) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleEditOrder = (order: SalesOrderDisplay) => {
    setEditingOrder(order);
    setIsFormOpen(true);
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm("Are you sure you want to delete this order?")) {
      deleteSalesOrder(orderId);
      toast({ title: "Sales order deleted successfully" });
    }
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setIsPending(true);
    setTimeout(() => {
      const order = salesOrders.find(o => o.id === orderId);
      
      // Note: Stock adjustment is handled by the Delivery workflow, not here
      // This allows for proper pick/pack/ship tracking in the warehouse module
      
      // If invoiced, automatically create an invoice
      if (newStatus === "invoiced" && order) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30); // 30-day payment terms
        
        addInvoice({
          companyId: order.companyId,
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
          invoiceType: "customer",
          customerId: order.customerId,
          salesOrderId: orderId,
          invoiceDate: new Date().toISOString().split("T")[0],
          dueDate: dueDate.toISOString().split("T")[0],
          status: "unpaid",
          subtotal: order.subtotal,
          taxAmount: order.taxAmount,
          total: order.total,
          amountPaid: 0,
          amountDue: order.total,
        });
      }
      
      updateSalesOrder(orderId, { status: newStatus });
      
      const statusMessages: Record<string, string> = {
        confirmed: "Order Confirmed - Stock reserved",
        delivered: "Delivery Created - Inventory and COGS recorded",
        invoiced: "Invoice Created - AR recorded",
      };
      
      toast({ 
        title: statusMessages[newStatus] || "Status updated",
        description: `Order status changed to ${newStatus}` 
      });
      setIsPending(false);
      setIsDetailOpen(false);
    }, 500);
  };

  const isWorkflowPending = isPending;

  const handleExport = () => {
    const csv = [
      ["Order Number", "Customer", "Date", "Status", "Total"].join(","),
      ...ordersWithCustomers.map(o => [
        o.orderNumber,
        o.customerName,
        new Date(o.orderDate).toLocaleDateString(),
        o.status,
        o.total
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sales_orders.csv";
    a.click();
  };

  const columns: Column<SalesOrderDisplay>[] = [
    { key: "orderNumber", header: "Order #", sortable: true },
    { key: "customerName", header: "Customer", sortable: true },
    { 
      key: "orderDate", 
      header: "Date", 
      sortable: true,
      render: (item) => new Date(item.orderDate).toLocaleDateString()
    },
    { 
      key: "status", 
      header: "Status",
      render: (item) => <StatusBadge status={item.status as "draft" | "confirmed" | "delivered" | "invoiced"} />
    },
    { 
      key: "total", 
      header: "Total", 
      sortable: true,
      className: "text-right",
      render: (item) => `$${parseFloat(item.total || "0").toLocaleString()}`
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (item) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleViewOrder(item)}
            data-testid={`button-view-${item.id}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleEditOrder(item)}
            data-testid={`button-edit-${item.id}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleDeleteOrder(item.id)}
            disabled={isPending}
            data-testid={`button-delete-${item.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (ordersLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Sales Orders" description="Manage and track all sales orders" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Sales Orders"
        description="Manage and track all sales orders"
        actions={
          <>
            <Button variant="outline" onClick={handleExport} data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => { setEditingOrder(null); setIsFormOpen(true); }} data-testid="button-new-order">
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </>
        }
      />

      <DataTable
        data={ordersWithCustomers}
        columns={columns}
        searchKey="customerName"
        searchPlaceholder="Search by customer..."
        onRowClick={handleViewOrder}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOrder ? "Edit Sales Order" : "New Sales Order"}</DialogTitle>
            <DialogDescription>
              {editingOrder ? "Update the sales order details below." : "Create a new sales order by filling out the form below."}
            </DialogDescription>
          </DialogHeader>
          <SalesOrderFormInline
            order={editingOrder}
            customers={customers}
            products={products}
            onSubmit={handleCreateOrder}
            onCancel={() => setIsFormOpen(false)}
            isPending={isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sales Order Details</DialogTitle>
            <DialogDescription>
              View and manage order {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && activeCompany && (
            <SalesOrderDetailInline
              order={selectedOrder}
              companyId={activeCompany.id}
              products={products}
              salesOrderLines={orderLinesDisplay}
              onStatusChange={handleStatusChange}
              onClose={() => setIsDetailOpen(false)}
              isPending={isWorkflowPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SalesOrderFormInlineProps {
  order?: SalesOrderDisplay | null;
  customers: Customer[];
  products: Product[];
  onSubmit: (order: Partial<InsertSalesOrder>) => void;
  onCancel: () => void;
  isPending: boolean;
}

interface OrderLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  tax: number;
  total: number;
}

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function SalesOrderFormInline({ order, customers, products, onSubmit, onCancel, isPending }: SalesOrderFormInlineProps) {
  const [customerId, setCustomerId] = useState(order?.customerId || "");
  const [lines, setLines] = useState<OrderLine[]>([
    { id: "1", productId: "", productName: "", quantity: 1, price: 0, tax: 0, total: 0 },
  ]);

  const handleAddLine = () => {
    const newLine: OrderLine = {
      id: String(Date.now()),
      productId: "",
      productName: "",
      quantity: 1,
      price: 0,
      tax: 0,
      total: 0,
    };
    setLines([...lines, newLine]);
  };

  const handleRemoveLine = (id: string) => {
    if (lines.length > 1) {
      setLines(lines.filter((l) => l.id !== id));
    }
  };

  const handleLineChange = (id: string, field: keyof OrderLine, value: string | number) => {
    setLines(lines.map((line) => {
      if (line.id !== id) return line;

      const updated = { ...line, [field]: value };

      if (field === "productId") {
        const product = products.find((p) => p.id === value);
        if (product) {
          updated.productName = product.name;
          updated.price = parseFloat(product.price || "0");
        }
      }

      if (field === "quantity" || field === "price" || field === "tax" || field === "productId") {
        const subtotal = updated.quantity * updated.price;
        updated.total = subtotal + (subtotal * updated.tax / 100);
      }

      return updated;
    }));
  };

  const subtotal = lines.reduce((sum, line) => sum + (line.quantity * line.price), 0);
  const totalTax = lines.reduce((sum, line) => sum + (line.quantity * line.price * line.tax / 100), 0);
  const grandTotal = subtotal + totalTax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;
    
    // Convert lines to the format expected by the handler
    const orderLines = lines
      .filter(line => line.productId) // Only include lines with a product selected
      .map(line => ({
        productId: line.productId,
        quantity: line.quantity,
        unitPrice: line.price,
        lineTotal: line.total,
      }));
    
    onSubmit({
      customerId,
      subtotal: String(subtotal),
      taxAmount: String(totalTax),
      total: String(grandTotal),
      lines: orderLines,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="customer">Customer *</Label>
          <Select value={customerId} onValueChange={setCustomerId} required>
            <SelectTrigger data-testid="select-customer">
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>Order Lines</Label>
          <Button type="button" variant="outline" size="sm" onClick={handleAddLine} data-testid="button-add-line">
            <Plus className="h-4 w-4 mr-1" />
            Add Line
          </Button>
        </div>

        <div className="border rounded-md divide-y">
          <div className="grid grid-cols-12 gap-2 p-3 bg-muted/50 text-sm font-medium">
            <div className="col-span-4">Product</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-1 text-center">Tax %</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-1"></div>
          </div>

          {lines.map((line, index) => (
            <div key={line.id} className="grid grid-cols-12 gap-2 p-3 items-center">
              <div className="col-span-4">
                <Select
                  value={line.productId}
                  onValueChange={(value) => handleLineChange(line.id, "productId", value)}
                >
                  <SelectTrigger data-testid={`select-product-${index}`}>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (${parseFloat(product.price || "0").toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  min="1"
                  value={line.quantity}
                  onChange={(e) => handleLineChange(line.id, "quantity", parseInt(e.target.value) || 1)}
                  className="text-center"
                  data-testid={`input-quantity-${index}`}
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={line.price}
                  onChange={(e) => handleLineChange(line.id, "price", parseFloat(e.target.value) || 0)}
                  className="text-right"
                  data-testid={`input-price-${index}`}
                />
              </div>
              <div className="col-span-1">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={line.tax}
                  onChange={(e) => handleLineChange(line.id, "tax", parseFloat(e.target.value) || 0)}
                  className="text-center"
                  data-testid={`input-tax-${index}`}
                />
              </div>
              <div className="col-span-2 text-right font-medium">
                ${line.total.toFixed(2)}
              </div>
              <div className="col-span-1 text-right">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveLine(line.id)}
                  disabled={lines.length <= 1}
                  data-testid={`button-remove-line-${index}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border rounded-md p-4 bg-muted/30">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>${totalTax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-base pt-2 border-t">
            <span>Grand Total</span>
            <span data-testid="text-grand-total">${grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
          Cancel
        </Button>
        <Button type="submit" disabled={!customerId || isPending} data-testid="button-save-order">
          {isPending ? "Saving..." : (order ? "Update Order" : "Create Order")}
        </Button>
      </div>
    </form>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkflowStepper } from "@/components/layout/WorkflowStepper";
import { FileText, Truck, CheckCircle } from "lucide-react";

interface SalesOrderDetailInlineProps {
  order: SalesOrderDisplay;
  companyId: string;
  products: Product[];
  salesOrderLines: SalesOrderLineDisplay[];
  onStatusChange: (orderId: string, newStatus: string) => void;
  onClose: () => void;
  isPending: boolean;
}

const orderSteps = [
  { id: "draft", label: "Draft" },
  { id: "confirmed", label: "Confirmed" },
  { id: "delivered", label: "Delivered" },
  { id: "invoiced", label: "Invoiced" },
];

function SalesOrderDetailInline({ order, companyId, products, salesOrderLines, onStatusChange, onClose, isPending }: SalesOrderDetailInlineProps) {
  // Filter order lines for this order
  const orderLines = salesOrderLines.filter(l => l.salesOrderId === order.id);
  const linesLoading = false;

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || "Unknown Product";
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusOrder = ["draft", "confirmed", "delivered", "invoiced"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    if (currentIndex < statusOrder.length - 1) {
      return statusOrder[currentIndex + 1];
    }
    return null;
  };

  const getActionButton = () => {
    switch (order.status) {
      case "draft":
        return (
          <Button 
            onClick={() => onStatusChange(order.id, "confirmed")} 
            disabled={isPending}
            data-testid="button-confirm-order"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {isPending ? "Updating..." : "Confirm Order"}
          </Button>
        );
      case "confirmed":
        return (
          <Button 
            onClick={() => onStatusChange(order.id, "delivered")} 
            disabled={isPending}
            data-testid="button-create-delivery"
          >
            <Truck className="h-4 w-4 mr-2" />
            {isPending ? "Updating..." : "Create Delivery"}
          </Button>
        );
      case "delivered":
        return (
          <Button 
            onClick={() => onStatusChange(order.id, "invoiced")} 
            disabled={isPending}
            data-testid="button-create-invoice"
          >
            <FileText className="h-4 w-4 mr-2" />
            {isPending ? "Updating..." : "Create Invoice"}
          </Button>
        );
      default:
        return null;
    }
  };

  const computedSubtotal = orderLines.reduce((sum, line) => {
    const qty = line.quantity|| 0;
    const price = parseFloat(line.unitPrice || "0");
    return sum + (qty as number * price);
  }, 0);
  const computedTotal = orderLines.reduce((sum, line) => sum + parseFloat(line.lineTotal || "0"), 0);
  const computedTax = computedTotal - computedSubtotal;
  
  const subtotal = orderLines.length > 0 ? computedSubtotal : parseFloat(order.subtotal || "0");
  const total = orderLines.length > 0 ? computedTotal : parseFloat(order.total || "0");
  const tax = orderLines.length > 0 ? computedTax : parseFloat(order.taxAmount || "0");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold" data-testid="text-order-number">{order.orderNumber}</h2>
            <StatusBadge status={order.status as "draft" | "confirmed" | "delivered" | "invoiced"} />
          </div>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-order-customer">
            {order.customerName}
          </p>
        </div>
        {getActionButton()}
      </div>

      <WorkflowStepper steps={orderSteps} currentStep={order.status || "draft"} />

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Order Date</span>
              <span data-testid="text-order-date">{new Date(order.orderDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Customer ID</span>
              <span>{order.customerId}</span>
            </div>
            {order.requiredDate && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Required Date</span>
                <span>{new Date(order.requiredDate).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-2 font-semibold pt-2 border-t">
              <span>Total</span>
              <span data-testid="text-order-total">${total.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Order Lines</CardTitle>
        </CardHeader>
        <CardContent>
          {linesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : orderLines.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No order lines found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">#</th>
                    <th className="text-left py-2 font-medium">Product</th>
                    <th className="text-right py-2 font-medium">Qty</th>
                    <th className="text-right py-2 font-medium">Unit Price</th>
                    <th className="text-right py-2 font-medium">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderLines.map((line) => (
                    <tr key={line.id} className="border-b last:border-b-0" data-testid={`row-order-line-${line.id}`}>
                      <td className="py-2">{line.lineNumber}</td>
                      <td className="py-2">{getProductName(line.productId)}</td>
                      <td className="text-right py-2">{line.quantity}</td>
                      <td className="text-right py-2">IDR {parseFloat(line.unitPrice || "0").toLocaleString()}</td>
                      <td className="text-right py-2">IDR {parseFloat(line.lineTotal || "0").toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose} data-testid="button-close-detail">
          Close
        </Button>
      </div>
    </div>
  );
}
