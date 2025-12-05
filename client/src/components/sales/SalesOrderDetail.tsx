import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { WorkflowStepper } from "@/components/layout/WorkflowStepper";
import { FileText, Truck, CheckCircle } from "lucide-react";
import type { mockSalesOrders, mockProducts } from "@/lib/mockData";

type SalesOrder = typeof mockSalesOrders[0];

interface SalesOrderDetailProps {
  order: SalesOrder;
  onStatusChange: (orderId: string, newStatus: string) => void;
  onClose: () => void;
}

// todo: remove mock functionality
const mockOrderLines = [
  { productId: "P001", productName: "Industrial Widget A", quantity: 5, price: 49.99, total: 249.95 },
  { productId: "P002", productName: "Industrial Widget B", quantity: 3, price: 79.99, total: 239.97 },
  { productId: "P004", productName: "Component Beta", quantity: 2, price: 189.00, total: 378.00 },
];

const orderSteps = [
  { id: "draft", label: "Draft" },
  { id: "confirmed", label: "Confirmed" },
  { id: "delivered", label: "Delivered" },
  { id: "invoiced", label: "Invoiced" },
];

export function SalesOrderDetail({ order, onStatusChange, onClose }: SalesOrderDetailProps) {
  const getNextStatus = (currentStatus: string): string | null => {
    const statusOrder = ["draft", "confirmed", "delivered", "invoiced"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    if (currentIndex < statusOrder.length - 1) {
      return statusOrder[currentIndex + 1];
    }
    return null;
  };

  const nextStatus = getNextStatus(order.status);

  const getActionButton = () => {
    switch (order.status) {
      case "draft":
        return (
          <Button onClick={() => onStatusChange(order.id, "confirmed")} data-testid="button-confirm-order">
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirm Order
          </Button>
        );
      case "confirmed":
        return (
          <Button onClick={() => onStatusChange(order.id, "delivered")} data-testid="button-create-delivery">
            <Truck className="h-4 w-4 mr-2" />
            Create Delivery
          </Button>
        );
      case "delivered":
        return (
          <Button onClick={() => onStatusChange(order.id, "invoiced")} data-testid="button-create-invoice">
            <FileText className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold" data-testid="text-order-id">{order.id}</h2>
            <StatusBadge status={order.status as "draft" | "confirmed" | "delivered" | "invoiced"} />
          </div>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-order-customer">
            {order.customerName}
          </p>
        </div>
        {getActionButton()}
      </div>

      <WorkflowStepper steps={orderSteps} currentStep={order.status} />

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Date</span>
              <span data-testid="text-order-date">{order.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer ID</span>
              <span>{order.customerId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Items</span>
              <span>{order.items}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${(order.total * 0.9).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax (10%)</span>
              <span>${(order.total * 0.1).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>Total</span>
              <span data-testid="text-order-total">${order.total.toLocaleString()}</span>
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
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-3 text-right">Total</div>
            </div>
            {mockOrderLines.map((line, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 p-3 text-sm">
                <div className="col-span-5">{line.productName}</div>
                <div className="col-span-2 text-center">{line.quantity}</div>
                <div className="col-span-2 text-right">${line.price.toFixed(2)}</div>
                <div className="col-span-3 text-right font-medium">${line.total.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose} data-testid="button-close-detail">
          Close
        </Button>
      </div>
    </div>
  );
}
