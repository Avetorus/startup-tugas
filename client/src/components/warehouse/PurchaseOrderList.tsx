import { useState } from "react";
import { DataTable, type Column } from "@/components/layout/DataTable";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { WorkflowStepper } from "@/components/layout/WorkflowStepper";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Plus, Download, Eye, Edit, Trash2, Send, PackageCheck } from "lucide-react";
import { mockPurchaseOrders, mockVendors, mockProducts } from "@/lib/mockData";

type PurchaseOrder = typeof mockPurchaseOrders[0];

const poSteps = [
  { id: "draft", label: "Draft" },
  { id: "ordered", label: "Ordered" },
  { id: "received", label: "Received" },
];

// todo: remove mock functionality
const mockPOLines = [
  { productName: "Industrial Widget A", quantity: 100, unitCost: 35.00, total: 3500.00 },
  { productName: "Component Alpha", quantity: 200, unitCost: 18.50, total: 3700.00 },
];

export function PurchaseOrderList() {
  const [orders, setOrders] = useState(mockPurchaseOrders);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [formData, setFormData] = useState({
    vendorId: "",
  });

  const handleViewOrder = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // todo: remove mock functionality
    const vendor = mockVendors.find(v => v.id === formData.vendorId);
    const newOrder: PurchaseOrder = {
      id: `PO-${String(orders.length + 1).padStart(3, "0")}`,
      vendorId: formData.vendorId,
      vendorName: vendor?.name || "",
      date: new Date().toISOString().split("T")[0],
      status: "draft",
      total: 0,
      items: 0,
    };
    setOrders([newOrder, ...orders]);
    console.log("Created PO:", newOrder);
    setIsFormOpen(false);
    setFormData({ vendorId: "" });
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setOrders(orders.map(o => 
      o.id === orderId ? { ...o, status: newStatus } : o
    ));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
    console.log("PO status changed:", orderId, newStatus);
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders(orders.filter(o => o.id !== orderId));
    console.log("Deleted PO:", orderId);
  };

  const getActionButton = (order: PurchaseOrder) => {
    switch (order.status) {
      case "draft":
        return (
          <Button 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, "ordered"); }}
            data-testid={`button-send-${order.id}`}
          >
            <Send className="h-3 w-3 mr-1" />
            Send
          </Button>
        );
      case "ordered":
        return (
          <Button 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, "received"); }}
            data-testid={`button-receive-${order.id}`}
          >
            <PackageCheck className="h-3 w-3 mr-1" />
            Receive
          </Button>
        );
      default:
        return null;
    }
  };

  const columns: Column<PurchaseOrder>[] = [
    { key: "id", header: "PO #", sortable: true },
    { key: "vendorName", header: "Vendor", sortable: true },
    { key: "date", header: "Date", sortable: true },
    { 
      key: "status", 
      header: "Status",
      render: (item) => <StatusBadge status={item.status as "draft" | "ordered" | "received"} />
    },
    { key: "items", header: "Items", className: "text-center" },
    { 
      key: "total", 
      header: "Total", 
      sortable: true,
      className: "text-right",
      render: (item) => `$${item.total.toLocaleString()}`
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
            <Button variant="ghost" size="icon" onClick={() => handleDeleteOrder(item.id)} data-testid={`button-delete-${item.id}`}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        description="Manage supplier purchase orders"
        actions={
          <>
            <Button variant="outline" data-testid="button-export">
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
        data={orders}
        columns={columns}
        searchKey="vendorName"
        searchPlaceholder="Search purchase orders..."
        onRowClick={handleViewOrder}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Purchase Order</DialogTitle>
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
                  {mockVendors.map((vendor) => (
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
              <Button type="submit" disabled={!formData.vendorId} data-testid="button-create-po">
                Create PO
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold" data-testid="text-po-id">{selectedOrder.id}</h2>
                    <StatusBadge status={selectedOrder.status as "draft" | "ordered" | "received"} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedOrder.vendorName}
                  </p>
                </div>
                {getActionButton(selectedOrder)}
              </div>

              <WorkflowStepper steps={poSteps} currentStep={selectedOrder.status} />

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Order Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order Date</span>
                      <span>{selectedOrder.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vendor ID</span>
                      <span>{selectedOrder.vendorId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Items</span>
                      <span>{selectedOrder.items}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span data-testid="text-po-total">${selectedOrder.total.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Order Lines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md divide-y">
                    <div className="grid grid-cols-12 gap-2 p-3 bg-muted/50 text-sm font-medium">
                      <div className="col-span-5">Product</div>
                      <div className="col-span-2 text-center">Qty</div>
                      <div className="col-span-2 text-right">Unit Cost</div>
                      <div className="col-span-3 text-right">Total</div>
                    </div>
                    {mockPOLines.map((line, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 p-3 text-sm">
                        <div className="col-span-5">{line.productName}</div>
                        <div className="col-span-2 text-center">{line.quantity}</div>
                        <div className="col-span-2 text-right">${line.unitCost.toFixed(2)}</div>
                        <div className="col-span-3 text-right font-medium">${line.total.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
