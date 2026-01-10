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
import { useMockData } from "@/lib/MockDataContext";
import { useToast } from "@/hooks/use-toast";

// Delivery display type - derived from sales orders
interface DeliveryDisplay {
  id: string;
  orderId: string;
  customerName: string;
  date: string;
  status: string;
  items: number;
  salesOrderId: string;
}

const deliverySteps = [
  { id: "confirmed", label: "Picking" },
  { id: "packing", label: "Packing" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
];

// Delivery-visible statuses
const DELIVERY_STATUSES = ["confirmed", "packing", "shipped", "delivered", "invoiced"];

export function DeliveryList() {
  const { toast } = useToast();
  const { salesOrders, salesOrderLines, customers, products, updateSalesOrder, adjustStock, warehouses, locations, stockLevels, addJournalEntry } = useMockData();
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryDisplay | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Derive deliveries from sales orders that are in delivery workflow
  const deliveries: DeliveryDisplay[] = salesOrders
    .filter(so => DELIVERY_STATUSES.includes(so.status))
    .map(so => {
      const customer = customers.find(c => c.id === so.customerId);
      const lineCount = salesOrderLines.filter(l => l.salesOrderId === so.id).length;
      return {
        id: `DEL-${so.orderNumber}`,
        orderId: so.orderNumber,
        customerName: customer?.name || "Unknown Customer",
        date: so.orderDate,
        status: so.status, // Use SO status directly
        items: lineCount,
        salesOrderId: so.id,
      };
    });

  const handleViewDelivery = (delivery: DeliveryDisplay) => {
    setSelectedDelivery(delivery);
    setIsDetailOpen(true);
  };

  const handleStatusChange = (deliveryId: string, newStatus: string) => {
    if (isPending) return;
    setIsPending(true);
    
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (!delivery) {
      setIsPending(false);
      return;
    }

    const salesOrder = salesOrders.find(so => so.id === delivery.salesOrderId);
    if (!salesOrder) {
      setIsPending(false);
      return;
    }

    // If delivered, decrease stock
    if (newStatus === "delivered") {
      const lines = salesOrderLines.filter(l => l.salesOrderId === salesOrder.id);
      console.log("DeliveryList - delivering SO:", salesOrder.id, "lines found:", lines.length, lines);
      lines.forEach(line => {
        // Use line's warehouse/location if set, otherwise find a stockLevel with this product
        let warehouseId = line.warehouseId;
        let locationId = line.locationId;
        
        if (!warehouseId || !locationId) {
          // Find a stock level that has this product
          const stockWithProduct = stockLevels.find(s => s.productId === line.productId && s.quantity > 0);
          if (stockWithProduct) {
            warehouseId = stockWithProduct.warehouseId;
            locationId = stockWithProduct.locationId;
            console.log("DeliveryList - found stock at:", { warehouseId, locationId, availableQty: stockWithProduct.quantity });
          } else {
            // Fallback to first warehouse/location
            warehouseId = warehouses[0]?.id;
            locationId = locations.find(l => l.warehouseId === warehouseId)?.id;
            console.log("DeliveryList - no stock found, using default:", { warehouseId, locationId });
          }
        }
        
        console.log("DeliveryList - adjustStock:", { warehouseId, locationId, productId: line.productId, quantity: -line.quantity });
        if (warehouseId && locationId) {
          adjustStock(warehouseId, locationId, line.productId, -line.quantity, "SO", salesOrder.id);
        } else {
          console.log("DeliveryList - SKIPPED adjustStock: missing warehouse or location");
        }
      });
      
      // Create journal entry for COGS: DR Cost of Goods Sold, CR Inventory
      const costTotal = lines.reduce((sum, line) => {
        const product = products.find(p => p.id === line.productId);
        return sum + (product?.costPrice || 0) * line.quantity;
      }, 0);
      
      if (costTotal > 0) {
        addJournalEntry({
          companyId: salesOrder.companyId,
          date: new Date().toISOString().split("T")[0],
          description: `Goods delivered - SO ${salesOrder.orderNumber}`,
          referenceType: "SO",
          referenceId: salesOrder.id,
          status: "posted",
          lines: [
            { accountId: "acc-5000", accountCode: "5000", accountName: "Cost of Goods Sold", debit: costTotal, credit: 0 },
            { accountId: "acc-1200", accountCode: "1200", accountName: "Inventory", debit: 0, credit: costTotal },
          ]
        });
      }
    }

    // Update SO status directly
    updateSalesOrder(salesOrder.id, { status: newStatus });
    
    toast({ 
      title: `Delivery ${newStatus === "delivered" ? "completed" : "updated"}`,
      description: newStatus === "delivered" ? "Stock levels updated" : `Status changed to ${newStatus}` 
    });
    
    setIsDetailOpen(false);
    setSelectedDelivery(null);
    setIsPending(false);
  };

  // Map SO status to action button
  const getActionButton = (delivery: DeliveryDisplay) => {
    switch (delivery.status) {
      case "confirmed":
        return (
          <Button 
            size="sm" 
            disabled={isPending}
            onClick={(e) => { e.stopPropagation(); handleStatusChange(delivery.id, "packing"); }}
            data-testid={`button-pack-${delivery.id}`}
          >
            <Package className="h-3 w-3 mr-1" />
            {isPending ? "..." : "Pack"}
          </Button>
        );
      case "packing":
        return (
          <Button 
            size="sm" 
            disabled={isPending}
            onClick={(e) => { e.stopPropagation(); handleStatusChange(delivery.id, "shipped"); }}
            data-testid={`button-ship-${delivery.id}`}
          >
            <Truck className="h-3 w-3 mr-1" />
            {isPending ? "..." : "Ship"}
          </Button>
        );
      case "shipped":
        return (
          <Button 
            size="sm" 
            disabled={isPending}
            onClick={(e) => { e.stopPropagation(); handleStatusChange(delivery.id, "delivered"); }}
            data-testid={`button-deliver-${delivery.id}`}
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            {isPending ? "..." : "Delivered"}
          </Button>
        );
      default:
        return null;
    }
  };

  // Get delivery lines for selected delivery
  const getDeliveryLines = () => {
    if (!selectedDelivery) return [];
    const lines = salesOrderLines.filter(l => l.salesOrderId === selectedDelivery.salesOrderId);
    return lines.map(line => {
      const product = products.find(p => p.id === line.productId);
      const isShipped = selectedDelivery.status === "shipped" || selectedDelivery.status === "delivered" || selectedDelivery.status === "invoiced";
      const isPacked = isShipped || selectedDelivery.status === "packing";
      return {
        productName: product?.name || "Unknown Product",
        ordered: line.quantity,
        picked: isPacked ? line.quantity : 0,
        shipped: isShipped ? line.quantity : 0,
      };
    });
  };

  // Map SO status to display label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed": return "picking";
      case "packing": return "packing";
      case "shipped": return "shipped";
      case "delivered":
      case "invoiced": return "delivered";
      default: return status;
    }
  };

  const columns: Column<DeliveryDisplay>[] = [
    { key: "id", header: "Delivery ID", sortable: true },
    { key: "orderId", header: "Order", sortable: true },
    { key: "customerName", header: "Customer", sortable: true },
    { key: "date", header: "Date", sortable: true },
    { 
      key: "status", 
      header: "Status",
      render: (item) => <StatusBadge status={getStatusLabel(item.status) as "picking" | "packing" | "shipped" | "delivered"} />
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
                    <StatusBadge status={getStatusLabel(selectedDelivery.status) as "picking" | "packing" | "shipped" | "delivered"} />
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
                    {getDeliveryLines().map((line, index) => (
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
