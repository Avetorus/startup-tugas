import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable, type Column } from "@/components/layout/DataTable";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { WorkflowStepper } from "@/components/layout/WorkflowStepper";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Download, Eye, Trash2, Send, PackageCheck } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PurchaseOrder, Vendor, Product, InsertPurchaseOrder } from "@shared/schema";

interface PurchaseOrderDisplay extends PurchaseOrder {
  vendorName: string;
}

const poSteps = [
  { id: "draft", label: "Draft" },
  { id: "ordered", label: "Ordered" },
  { id: "received", label: "Received" },
];

export function PurchaseOrderList() {
  const { activeCompany } = useCompany();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderDisplay | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [formData, setFormData] = useState({ vendorId: "" });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ["/api/companies", activeCompany?.id, "purchase-orders"],
    enabled: !!activeCompany?.id,
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/companies", activeCompany?.id, "vendors"],
    enabled: !!activeCompany?.id,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/companies", activeCompany?.id, "products"],
    enabled: !!activeCompany?.id,
  });

  const ordersWithVendors: PurchaseOrderDisplay[] = orders.map(order => ({
    ...order,
    vendorName: vendors.find(v => v.id === order.vendorId)?.name || "Unknown Vendor",
  }));

  const createMutation = useMutation({
    mutationFn: async (data: Partial<InsertPurchaseOrder>) => {
      const orderNumber = `PO-${String(Date.now()).slice(-6)}`;
      return apiRequest("POST", `/api/companies/${activeCompany?.id}/purchase-orders`, {
        ...data,
        orderNumber,
        companyId: activeCompany?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "purchase-orders"] });
      toast({ title: "Purchase order created successfully" });
      setIsFormOpen(false);
      setFormData({ vendorId: "" });
    },
    onError: () => {
      toast({ title: "Failed to create purchase order", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PurchaseOrder> }) => {
      return apiRequest("PATCH", `/api/companies/${activeCompany?.id}/purchase-orders/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "purchase-orders"] });
      toast({ title: "Purchase order updated successfully" });
      setIsDetailOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update purchase order", variant: "destructive" });
    },
  });

  // Workflow mutation: Confirm/Send PO to vendor
  const confirmPOMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("POST", `/api/companies/${activeCompany?.id}/purchase-orders/${orderId}/confirm`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "purchase-orders"] });
      toast({ 
        title: "Purchase Order Sent", 
        description: "Order has been confirmed and sent to vendor" 
      });
      setIsDetailOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to confirm PO", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Workflow mutation: Receive goods (creates goods receipt, updates stock, inventory journal)
  const receiveGoodsMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("POST", `/api/companies/${activeCompany?.id}/purchase-orders/${orderId}/receive`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "stock-levels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "goods-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "journal-entries"] });
      toast({ 
        title: "Goods Received", 
        description: `Receipt ${data.goodsReceipt?.receiptNumber || ''} created and inventory updated` 
      });
      setIsDetailOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to receive goods", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Workflow mutation: Create vendor invoice/bill (creates AP invoice, AP ledger, journal entry)
  const createBillMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("POST", `/api/companies/${activeCompany?.id}/purchase-orders/${orderId}/bill`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "ap-ledger"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "journal-entries"] });
      toast({ 
        title: "Vendor Bill Created", 
        description: `Bill ${data.invoice?.invoiceNumber || ''} created and AP recorded` 
      });
      setIsDetailOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create bill", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const isWorkflowPending = confirmPOMutation.isPending || 
    receiveGoodsMutation.isPending || 
    createBillMutation.isPending;

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/companies/${activeCompany?.id}/purchase-orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "purchase-orders"] });
      toast({ title: "Purchase order deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete purchase order", variant: "destructive" });
    },
  });

  const handleViewOrder = (order: PurchaseOrderDisplay) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendorId) return;
    createMutation.mutate({ vendorId: formData.vendorId });
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    // Use workflow endpoints for status transitions
    switch (newStatus) {
      case "ordered":
        confirmPOMutation.mutate(orderId);
        break;
      case "received":
        receiveGoodsMutation.mutate(orderId);
        break;
      case "billed":
        createBillMutation.mutate(orderId);
        break;
      default:
        // Fallback to simple update for non-workflow status changes
        updateMutation.mutate({ id: orderId, data: { status: newStatus } });
    }
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    deleteMutation.mutate(orderId);
  };

  const handleExport = () => {
    const csv = [
      ["PO #", "Vendor", "Date", "Status", "Total"].join(","),
      ...ordersWithVendors.map(o => [
        o.orderNumber,
        o.vendorName,
        new Date(o.orderDate).toLocaleDateString(),
        o.status,
        o.total
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "purchase_orders.csv";
    a.click();
  };

  const getActionButton = (order: PurchaseOrderDisplay) => {
    switch (order.status) {
      case "draft":
        return (
          <Button 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, "ordered"); }}
            disabled={isWorkflowPending}
            data-testid={`button-send-${order.id}`}
          >
            <Send className="h-3 w-3 mr-1" />
            {confirmPOMutation.isPending ? "..." : "Send"}
          </Button>
        );
      case "ordered":
        return (
          <Button 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, "received"); }}
            disabled={isWorkflowPending}
            data-testid={`button-receive-${order.id}`}
          >
            <PackageCheck className="h-3 w-3 mr-1" />
            {receiveGoodsMutation.isPending ? "..." : "Receive"}
          </Button>
        );
      default:
        return null;
    }
  };

  const columns: Column<PurchaseOrderDisplay>[] = [
    { key: "orderNumber", header: "PO #", sortable: true },
    { key: "vendorName", header: "Vendor", sortable: true },
    { 
      key: "orderDate", 
      header: "Date", 
      sortable: true,
      render: (item) => new Date(item.orderDate).toLocaleDateString()
    },
    { 
      key: "status", 
      header: "Status",
      render: (item) => <StatusBadge status={item.status as "draft" | "ordered" | "received"} />
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
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {getActionButton(item)}
          <Button variant="ghost" size="icon" onClick={() => handleViewOrder(item)} data-testid={`button-view-${item.id}`}>
            <Eye className="h-4 w-4" />
          </Button>
          {item.status === "draft" && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleDeleteOrder(item.id)} 
              disabled={deleteMutation.isPending}
              data-testid={`button-delete-${item.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (ordersLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Purchase Orders" description="Manage supplier purchase orders" />
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
        title="Purchase Orders"
        description="Manage supplier purchase orders"
        actions={
          <>
            <Button variant="outline" onClick={handleExport} data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setIsFormOpen(true)} data-testid="button-new-po">
              <Plus className="h-4 w-4 mr-2" />
              New PO
            </Button>
          </>
        }
      />

      <DataTable
        data={ordersWithVendors}
        columns={columns}
        searchKey="vendorName"
        searchPlaceholder="Search purchase orders..."
        onRowClick={handleViewOrder}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Purchase Order</DialogTitle>
            <DialogDescription>
              Create a new purchase order by selecting a vendor.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor *</Label>
              <Select
                value={formData.vendorId}
                onValueChange={(value) => setFormData({ vendorId: value })}
              >
                <SelectTrigger data-testid="select-vendor">
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={!formData.vendorId || createMutation.isPending} data-testid="button-create-po">
                {createMutation.isPending ? "Creating..." : "Create PO"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
            <DialogDescription>
              View and manage order {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold" data-testid="text-po-number">{selectedOrder.orderNumber}</h2>
                    <StatusBadge status={selectedOrder.status as "draft" | "ordered" | "received"} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedOrder.vendorName}
                  </p>
                </div>
                {getActionButton(selectedOrder)}
              </div>

              <WorkflowStepper steps={poSteps} currentStep={selectedOrder.status || "draft"} />

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Order Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Order Date</span>
                      <span>{new Date(selectedOrder.orderDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Vendor ID</span>
                      <span>{selectedOrder.vendorId}</span>
                    </div>
                    {selectedOrder.expectedDate && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Expected Date</span>
                        <span>{new Date(selectedOrder.expectedDate).toLocaleDateString()}</span>
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
                      <span>${parseFloat(selectedOrder.subtotal || "0").toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Tax</span>
                      <span>${parseFloat(selectedOrder.taxAmount || "0").toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between gap-2 font-semibold pt-2 border-t">
                      <span>Total</span>
                      <span data-testid="text-po-total">${parseFloat(selectedOrder.total || "0").toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)} data-testid="button-close-detail">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
