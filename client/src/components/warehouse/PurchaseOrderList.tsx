import { useState } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMockData } from "@/lib/MockDataContext";

// Types for display
interface PurchaseOrderDisplay {
  id: string;
  companyId: string;
  orderNumber: string;
  vendorId: string;
  orderDate: string;
  expectedDate?: string;
  status: string;
  subtotal: string;
  taxAmount: string;
  total: string;
  vendorName: string;
}

const poSteps = [
  { id: "draft", label: "Draft" },
  { id: "ordered", label: "Ordered" },
  { id: "received", label: "Received" },
];

export function PurchaseOrderList() {
  const { activeCompany } = useAuth();
  const { toast } = useToast();
  const { purchaseOrders, purchaseOrderLines, vendors, products, warehouses, locations, addPurchaseOrder, addPurchaseOrderLines, updatePurchaseOrder, deletePurchaseOrder, adjustStock, addJournalEntry } = useMockData();
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderDisplay | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [formData, setFormData] = useState({ vendorId: "" });
  const [formLines, setFormLines] = useState<{productId: string; warehouseId: string; locationId: string; quantity: number; unitPrice: number}[]>([]);
  const [ordersLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Map global data to display format
  const ordersWithVendors: PurchaseOrderDisplay[] = purchaseOrders.map(order => ({
    id: order.id,
    companyId: order.companyId,
    orderNumber: order.orderNumber,
    vendorId: order.vendorId,
    orderDate: order.orderDate,
    expectedDate: order.expectedDate,
    status: order.status,
    subtotal: order.subtotal.toString(),
    taxAmount: order.taxAmount.toString(),
    total: order.total.toString(),
    vendorName: vendors.find(v => v.id === order.vendorId)?.name || "Unknown Vendor",
  }));

  console.log("PurchaseOrderList render:", { purchaseOrders: purchaseOrders.length, vendors: vendors.length, ordersWithVendors: ordersWithVendors.length });

  const isWorkflowPending = isPending;

  const handleViewOrder = (order: PurchaseOrderDisplay) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  // Get PO lines for selected order with product details
  const getOrderLines = () => {
    if (!selectedOrder) return [];
    const lines = purchaseOrderLines.filter(l => l.purchaseOrderId === selectedOrder.id);
    return lines.map(line => {
      const product = products.find(p => p.id === line.productId);
      const warehouse = warehouses.find(w => w.id === line.warehouseId);
      const location = locations.find(l => l.id === line.locationId);
      return {
        ...line,
        productName: product?.name || "Unknown Product",
        productSku: product?.sku || "",
        warehouseName: warehouse?.name || "",
        locationCode: location?.code || "",
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendorId || formLines.length === 0) {
      toast({ title: "Please select a vendor and add at least one product line", variant: "destructive" });
      return;
    }
    
    setIsPending(true);
    setTimeout(() => {
      // Calculate totals from lines
      const subtotal = formLines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);
      const taxAmount = subtotal * 0.1; // 10% tax
      const total = subtotal + taxAmount;
      
      // Create PO
      const newOrder = addPurchaseOrder({
        companyId: activeCompany?.id || "comp-002",
        orderNumber: `PO-${String(Date.now()).slice(-6)}`,
        vendorId: formData.vendorId,
        orderDate: new Date().toISOString().split("T")[0],
        status: "draft",
        subtotal,
        taxAmount,
        total,
      });
      
      // Add PO lines
      addPurchaseOrderLines(formLines.map((line, i) => ({
        purchaseOrderId: newOrder.id,
        productId: line.productId,
        warehouseId: line.warehouseId,
        locationId: line.locationId,
        lineNumber: i + 1,
        quantity: line.quantity,
        quantityReceived: 0,
        unitPrice: line.unitPrice,
        lineTotal: line.quantity * line.unitPrice,
      })));
      
      toast({ title: "Purchase order created successfully" });
      setIsPending(false);
      setIsFormOpen(false);
      setFormData({ vendorId: "" });
      setFormLines([]);
    }, 500);
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setIsPending(true);
    setTimeout(() => {
      // If receiving, increase inventory for each line item at specified location
      if (newStatus === "received") {
        const poLines = purchaseOrderLines.filter(l => l.purchaseOrderId === orderId);
        let totalAmount = 0;
        
        poLines.forEach(line => {
          // Use the line's warehouse/location or fall back to first warehouse/location
          const warehouseId = line.warehouseId || warehouses[0]?.id;
          const locationId = line.locationId || locations.find(l => l.warehouseId === warehouseId)?.id;
          
          if (warehouseId && locationId) {
            adjustStock(warehouseId, locationId, line.productId, line.quantity, "PO", orderId);
          }
          totalAmount += line.lineTotal;
        });
        
        // Create journal entry: DR Inventory, CR Accounts Payable
        const order = purchaseOrders.find(o => o.id === orderId);
        if (order && totalAmount > 0) {
          addJournalEntry({
            companyId: order.companyId,
            date: new Date().toISOString().split("T")[0],
            description: `Goods received - PO ${order.orderNumber}`,
            referenceType: "PO",
            referenceId: orderId,
            status: "posted",
            lines: [
              { accountId: "acc-1200", accountCode: "1200", accountName: "Inventory", debit: totalAmount, credit: 0 },
              { accountId: "acc-2000", accountCode: "2000", accountName: "Accounts Payable", debit: 0, credit: totalAmount },
            ]
          });
        }
      }
      
      updatePurchaseOrder(orderId, { status: newStatus });
      
      const statusMessages: Record<string, string> = {
        ordered: "Purchase Order Sent - Order sent to vendor",
        received: "Goods Received - Inventory updated at receiving location",
        billed: "Vendor Bill Created - AP recorded",
      };
      
      toast({ 
        title: statusMessages[newStatus] || "Status updated",
        description: `Order status changed to ${newStatus}` 
      });
      setIsPending(false);
      setIsDetailOpen(false);
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    }, 500);
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm("Are you sure you want to delete this purchase order?")) {
      deletePurchaseOrder(orderId);
      toast({ title: "Purchase order deleted successfully" });
    }
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
            {isPending ? "..." : "Send"}
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
            {isPending ? "..." : "Receive"}
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
              disabled={isPending}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Purchase Order</DialogTitle>
            <DialogDescription>
              Create a new purchase order by selecting a vendor and adding product lines.
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
            
            {/* Product Lines Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Order Lines *</Label>
                <Button type="button" size="sm" variant="outline" onClick={() => {
                  const defaultWarehouse = warehouses[0]?.id || "";
                  const defaultLocation = locations.find(l => l.warehouseId === defaultWarehouse)?.id || "";
                  setFormLines([...formLines, { productId: "", warehouseId: defaultWarehouse, locationId: defaultLocation, quantity: 1, unitPrice: 0 }]);
                }}>
                  <Plus className="h-3 w-3 mr-1" /> Add Line
                </Button>
              </div>
              
              {formLines.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center border rounded">No lines added yet. Click "Add Line" to add products.</p>
              ) : (
                <div className="border rounded-md divide-y">
                  {formLines.map((line, index) => (
                    <div key={index} className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Line {index + 1}</span>
                        <Button type="button" size="sm" variant="ghost" onClick={() => {
                          setFormLines(formLines.filter((_, i) => i !== index));
                        }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                          <Label className="text-xs">Product</Label>
                          <Select value={line.productId} onValueChange={(val) => {
                            const product = products.find(p => p.id === val);
                            const newLines = [...formLines];
                            newLines[index].productId = val;
                            newLines[index].unitPrice = product?.costPrice || 0;
                            setFormLines(newLines);
                          }}>
                            <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                            <SelectContent>
                              {products.map(p => <SelectItem key={p.id} value={p.id}>{p.sku} - {p.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Warehouse</Label>
                          <Select value={line.warehouseId} onValueChange={(val) => {
                            const newLines = [...formLines];
                            newLines[index].warehouseId = val;
                            newLines[index].locationId = locations.find(l => l.warehouseId === val)?.id || "";
                            setFormLines(newLines);
                          }}>
                            <SelectTrigger><SelectValue placeholder="Warehouse" /></SelectTrigger>
                            <SelectContent>
                              {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Location</Label>
                          <Select value={line.locationId} onValueChange={(val) => {
                            const newLines = [...formLines];
                            newLines[index].locationId = val;
                            setFormLines(newLines);
                          }}>
                            <SelectTrigger><SelectValue placeholder="Location" /></SelectTrigger>
                            <SelectContent>
                              {locations.filter(l => l.warehouseId === line.warehouseId).map(l => <SelectItem key={l.id} value={l.id}>{l.code}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Quantity</Label>
                          <Input type="number" min="1" value={line.quantity} onChange={(e) => {
                            const newLines = [...formLines];
                            newLines[index].quantity = parseInt(e.target.value) || 1;
                            setFormLines(newLines);
                          }} />
                        </div>
                        <div>
                          <Label className="text-xs">Unit Price</Label>
                          <Input type="number" step="0.01" value={line.unitPrice} onChange={(e) => {
                            const newLines = [...formLines];
                            newLines[index].unitPrice = parseFloat(e.target.value) || 0;
                            setFormLines(newLines);
                          }} />
                        </div>
                      </div>
                      <div className="text-right text-sm font-medium">
                        Line Total: ${(line.quantity * line.unitPrice).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {formLines.length > 0 && (
                <div className="text-right text-sm pt-2 border-t">
                  <strong>Subtotal: ${formLines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0).toFixed(2)}</strong>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setFormLines([]); }} data-testid="button-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={!formData.vendorId || formLines.length === 0 || isPending} data-testid="button-create-po">
                {isPending ? "Creating..." : "Create PO"}
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

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Order Lines</CardTitle>
                </CardHeader>
                <CardContent>
                  {getOrderLines().length === 0 ? (
                    <p className="text-sm text-muted-foreground">No lines for this order</p>
                  ) : (
                    <div className="border rounded-md divide-y">
                      <div className="grid grid-cols-5 gap-2 p-3 bg-muted/50 text-sm font-medium">
                        <div>SKU</div>
                        <div>Product</div>
                        <div className="text-right">Qty</div>
                        <div className="text-right">Unit Price</div>
                        <div className="text-right">Total</div>
                      </div>
                      {getOrderLines().map((line, index) => (
                        <div key={index} className="grid grid-cols-5 gap-2 p-3 text-sm">
                          <div className="text-muted-foreground">{line.productSku}</div>
                          <div>{line.productName}</div>
                          <div className="text-right">{line.quantity}</div>
                          <div className="text-right">${line.unitPrice.toFixed(2)}</div>
                          <div className="text-right">${line.lineTotal.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

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
