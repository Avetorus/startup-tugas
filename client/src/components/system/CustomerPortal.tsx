import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/layout/DataTable";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Download, Eye, FileText, ShoppingCart, Printer } from "lucide-react";
import { mockCustomers, mockSalesOrders, mockInvoices } from "@/lib/mockData";

type SalesOrder = typeof mockSalesOrders[0];
type Invoice = typeof mockInvoices[0];

// Simulating customer portal view
export function CustomerPortal() {
  // todo: remove mock functionality - simulated logged in customer
  const [currentCustomer] = useState(mockCustomers[0]);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const customerOrders = mockSalesOrders.filter(o => o.customerId === currentCustomer.id);
  const customerInvoices = mockInvoices.filter(inv => 
    customerOrders.some(o => o.id === inv.orderId)
  );

  const handleViewOrder = (order: SalesOrder) => {
    setSelectedOrder(order);
    setIsOrderDetailOpen(true);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsInvoiceOpen(true);
  };

  const orderColumns: Column<SalesOrder>[] = [
    { key: "id", header: "Order #", sortable: true },
    { key: "date", header: "Date", sortable: true },
    { 
      key: "status", 
      header: "Status",
      render: (item) => <StatusBadge status={item.status as "draft" | "confirmed" | "delivered" | "invoiced"} />
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
        <Button variant="ghost" size="icon" onClick={() => handleViewOrder(item)} data-testid={`button-view-order-${item.id}`}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const invoiceColumns: Column<Invoice>[] = [
    { key: "id", header: "Invoice #", sortable: true },
    { key: "date", header: "Date", sortable: true },
    { key: "dueDate", header: "Due Date", sortable: true },
    { 
      key: "status", 
      header: "Status",
      render: (item) => <StatusBadge status={item.status as "paid" | "unpaid" | "partial"} />
    },
    { 
      key: "total", 
      header: "Amount", 
      sortable: true,
      className: "text-right",
      render: (item) => `$${item.total.toLocaleString()}`
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (item) => (
        <Button variant="ghost" size="icon" onClick={() => handleViewInvoice(item)} data-testid={`button-view-invoice-${item.id}`}>
          <Download className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Customer Portal"
        description="View your orders and invoices"
      />

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {currentCustomer.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold" data-testid="text-customer-name">{currentCustomer.name}</h2>
                <p className="text-sm text-muted-foreground">{currentCustomer.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <p className="text-2xl font-semibold">{currentCustomer.totalOrders}</p>
                <p className="text-muted-foreground">Total Orders</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold">${currentCustomer.totalSpent.toLocaleString()}</p>
                <p className="text-muted-foreground">Total Spent</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={customerOrders.slice(0, 5)}
              columns={orderColumns}
              pageSize={5}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={customerInvoices.slice(0, 5)}
              columns={invoiceColumns}
              pageSize={5}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={isOrderDetailOpen} onOpenChange={setIsOrderDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selectedOrder.id}</h3>
                  <p className="text-sm text-muted-foreground">{selectedOrder.date}</p>
                </div>
                <StatusBadge status={selectedOrder.status as "draft" | "confirmed" | "delivered" | "invoiced"} />
              </div>
              <div className="border rounded-md p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span>{selectedOrder.items}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${selectedOrder.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invoice</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selectedInvoice.id}</h3>
                  <p className="text-sm text-muted-foreground">Due: {selectedInvoice.dueDate}</p>
                </div>
                <StatusBadge status={selectedInvoice.status as "paid" | "unpaid" | "partial"} />
              </div>
              <div className="border rounded-md p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Invoice Date</span>
                  <span>{selectedInvoice.date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order</span>
                  <span>{selectedInvoice.orderId}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Amount Due</span>
                  <span>${selectedInvoice.total.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" data-testid="button-print-invoice">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button data-testid="button-download-invoice">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
