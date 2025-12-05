import { useState } from "react";
import { DataTable, type Column } from "@/components/layout/DataTable";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkflowStepper } from "@/components/layout/WorkflowStepper";
import { Download, Eye, Package, Truck, CheckCircle } from "lucide-react";
import { mockDeliveries } from "@/lib/mockData";

type Delivery = typeof mockDeliveries[0];

const deliverySteps = [
  { id: "picking", label: "Picking" },
  { id: "packing", label: "Packing" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
];

// todo: remove mock functionality
const mockDeliveryLines = [
  { productName: "Industrial Widget A", ordered: 5, picked: 5, packed: 5, shipped: 5 },
  { productName: "Industrial Widget B", ordered: 3, picked: 3, packed: 3, shipped: 0 },
  { productName: "Component Beta", ordered: 2, picked: 2, packed: 0, shipped: 0 },
];

export function DeliveryList() {
  const [deliveries, setDeliveries] = useState(mockDeliveries);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleViewDelivery = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setIsDetailOpen(true);
  };

  const handleStatusChange = (deliveryId: string, newStatus: string) => {
    setDeliveries(deliveries.map(d => 
      d.id === deliveryId ? { ...d, status: newStatus } : d
    ));
    console.log("Delivery status changed:", deliveryId, newStatus);
  };

  const getActionButton = (delivery: Delivery) => {
    switch (delivery.status) {
      case "picking":
        return (
          <Button 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); handleStatusChange(delivery.id, "packing"); }}
            data-testid={`button-pack-${delivery.id}`}
          >
            <Package className="h-3 w-3 mr-1" />
            Pack
          </Button>
        );
      case "packing":
        return (
          <Button 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); handleStatusChange(delivery.id, "shipped"); }}
            data-testid={`button-ship-${delivery.id}`}
          >
            <Truck className="h-3 w-3 mr-1" />
            Ship
          </Button>
        );
      case "shipped":
        return (
          <Button 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); handleStatusChange(delivery.id, "delivered"); }}
            data-testid={`button-deliver-${delivery.id}`}
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Delivered
          </Button>
        );
      default:
        return null;
    }
  };

  const columns: Column<Delivery>[] = [
    { key: "id", header: "Delivery ID", sortable: true },
    { key: "orderId", header: "Order", sortable: true },
    { key: "customerName", header: "Customer", sortable: true },
    { key: "date", header: "Date", sortable: true },
    { 
      key: "status", 
      header: "Status",
      render: (item) => <StatusBadge status={item.status as "picking" | "packing" | "shipped" | "delivered"} />
    },
    { key: "items", header: "Items", className: "text-center" },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (item) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {getActionButton(item)}
          <Button variant="ghost" size="icon" onClick={() => handleViewDelivery(item)} data-testid={`button-view-${item.id}`}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Deliveries"
        description="Track and manage order deliveries"
        actions={
          <Button variant="outline" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        }
      />

      <DataTable
        data={deliveries}
        columns={columns}
        searchKey="customerName"
        searchPlaceholder="Search deliveries..."
        onRowClick={handleViewDelivery}
      />

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delivery Details</DialogTitle>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold" data-testid="text-delivery-id">{selectedDelivery.id}</h2>
                    <StatusBadge status={selectedDelivery.status as "picking" | "packing" | "shipped" | "delivered"} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Order: {selectedDelivery.orderId} - {selectedDelivery.customerName}
                  </p>
                </div>
                {getActionButton(selectedDelivery)}
              </div>

              <WorkflowStepper steps={deliverySteps} currentStep={selectedDelivery.status} />

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Delivery Lines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md divide-y">
                    <div className="grid grid-cols-5 gap-2 p-3 bg-muted/50 text-sm font-medium">
                      <div className="col-span-2">Product</div>
                      <div className="text-center">Ordered</div>
                      <div className="text-center">Picked</div>
                      <div className="text-center">Shipped</div>
                    </div>
                    {mockDeliveryLines.map((line, index) => (
                      <div key={index} className="grid grid-cols-5 gap-2 p-3 text-sm">
                        <div className="col-span-2">{line.productName}</div>
                        <div className="text-center">{line.ordered}</div>
                        <div className="text-center">{line.picked}</div>
                        <div className="text-center">{line.shipped}</div>
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
