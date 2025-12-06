import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { useCompany } from "@/contexts/CompanyContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SalesOrder, Customer, Product, InsertSalesOrder } from "@shared/schema";

interface SalesOrderDisplay extends SalesOrder {
  customerName: string;
  itemCount: number;
}

export function SalesOrderList() {
  const { activeCompany } = useCompany();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderDisplay | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SalesOrderDisplay | null>(null);

  const { data: orders = [], isLoading: ordersLoading } = useQuery<SalesOrder[]>({
    queryKey: ["/api/companies", activeCompany?.id, "sales-orders"],
    enabled: !!activeCompany?.id,
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/companies", activeCompany?.id, "customers"],
    enabled: !!activeCompany?.id,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/companies", activeCompany?.id, "products"],
    enabled: !!activeCompany?.id,
  });

  const ordersWithCustomers: SalesOrderDisplay[] = orders.map(order => ({
    ...order,
    customerName: customers.find(c => c.id === order.customerId)?.name || "Unknown Customer",
    itemCount: 0,
  }));

  const createMutation = useMutation({
    mutationFn: async (data: Partial<InsertSalesOrder>) => {
      const orderNumber = `SO-${String(Date.now()).slice(-6)}`;
      return apiRequest("POST", `/api/companies/${activeCompany?.id}/sales-orders`, {
        ...data,
        orderNumber,
        companyId: activeCompany?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "sales-orders"] });
      toast({ title: "Sales order created successfully" });
      setIsFormOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create sales order", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SalesOrder> }) => {
      return apiRequest("PATCH", `/api/companies/${activeCompany?.id}/sales-orders/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "sales-orders"] });
      toast({ title: "Sales order updated successfully" });
      setIsFormOpen(false);
      setIsDetailOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update sales order", variant: "destructive" });
    },
  });

  // Workflow mutation: Confirm order (reserves stock)
  const confirmOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("POST", `/api/companies/${activeCompany?.id}/sales-orders/${orderId}/confirm`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "stock-levels"] });
      toast({ 
        title: "Order Confirmed", 
        description: `Stock reserved for ${data.reservations?.length || 0} line items` 
      });
      setIsDetailOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to confirm order", 
        description: error.message || "Check stock availability",
        variant: "destructive" 
      });
    },
  });

  // Workflow mutation: Deliver order (reduces stock, creates delivery, COGS journal entry)
  const deliverOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("POST", `/api/companies/${activeCompany?.id}/sales-orders/${orderId}/deliver`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "stock-levels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "journal-entries"] });
      toast({ 
        title: "Delivery Created", 
        description: `Delivery ${data.delivery?.deliveryNumber || ''} created with inventory and COGS recorded` 
      });
      setIsDetailOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create delivery", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Workflow mutation: Invoice order (creates invoice, AR ledger, revenue journal entry)
  const invoiceOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("POST", `/api/companies/${activeCompany?.id}/sales-orders/${orderId}/invoice`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "ar-ledger"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "journal-entries"] });
      toast({ 
        title: "Invoice Created", 
        description: `Invoice ${data.invoice?.invoiceNumber || ''} created and AR recorded` 
      });
      setIsDetailOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create invoice", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/companies/${activeCompany?.id}/sales-orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "sales-orders"] });
      toast({ title: "Sales order deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete sales order", variant: "destructive" });
    },
  });

  const handleCreateOrder = (orderData: Partial<InsertSalesOrder>) => {
    createMutation.mutate(orderData);
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
    deleteMutation.mutate(orderId);
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    // Use workflow endpoints for status transitions
    switch (newStatus) {
      case "confirmed":
        confirmOrderMutation.mutate(orderId);
        break;
      case "delivered":
        deliverOrderMutation.mutate(orderId);
        break;
      case "invoiced":
        invoiceOrderMutation.mutate(orderId);
        break;
      default:
        // Fallback to simple update for non-workflow status changes
        updateMutation.mutate({ id: orderId, data: { status: newStatus } });
    }
  };

  const isWorkflowPending = confirmOrderMutation.isPending || 
    deliverOrderMutation.isPending || 
    invoiceOrderMutation.isPending;

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
            disabled={deleteMutation.isPending}
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
            isPending={createMutation.isPending}
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
          {selectedOrder && (
            <SalesOrderDetailInline
              order={selectedOrder}
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
    onSubmit({
      customerId,
      subtotal: String(subtotal),
      taxAmount: String(totalTax),
      total: String(grandTotal),
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

function SalesOrderDetailInline({ order, onStatusChange, onClose, isPending }: SalesOrderDetailInlineProps) {
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

  const total = parseFloat(order.total || "0");
  const subtotal = parseFloat(order.subtotal || "0") || total * 0.9;
  const tax = parseFloat(order.taxAmount || "0") || total * 0.1;

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

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose} data-testid="button-close-detail">
          Close
        </Button>
      </div>
    </div>
  );
}
