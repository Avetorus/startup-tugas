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
import { Card, CardContent } from "@/components/ui/card";
import { Download, Eye, DollarSign, Printer } from "lucide-react";
import { mockInvoices } from "@/lib/mockData";

type Invoice = typeof mockInvoices[0];

// todo: remove mock functionality
const mockInvoiceLines = [
  { description: "Industrial Widget A", quantity: 5, unitPrice: 49.99, total: 249.95 },
  { description: "Industrial Widget B", quantity: 3, unitPrice: 79.99, total: 239.97 },
  { description: "Component Beta", quantity: 2, unitPrice: 189.00, total: 378.00 },
];

export function InvoiceList() {
  const [invoices, setInvoices] = useState(mockInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailOpen(true);
  };

  const handleRecordPayment = (invoiceId: string) => {
    setInvoices(invoices.map(inv => 
      inv.id === invoiceId ? { ...inv, status: "paid" } : inv
    ));
    console.log("Payment recorded for:", invoiceId);
  };

  const handlePrint = () => {
    window.print();
    console.log("Print invoice");
  };

  const columns: Column<Invoice>[] = [
    { key: "id", header: "Invoice #", sortable: true },
    { key: "orderId", header: "Order", sortable: true },
    { key: "customerName", header: "Customer", sortable: true },
    { key: "date", header: "Date", sortable: true },
    { key: "dueDate", header: "Due Date", sortable: true },
    { 
      key: "status", 
      header: "Status",
      render: (item) => <StatusBadge status={item.status as "paid" | "unpaid" | "partial"} />
    },
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
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {item.status !== "paid" && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleRecordPayment(item.id)}
              data-testid={`button-pay-${item.id}`}
            >
              <DollarSign className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => handleViewInvoice(item)} data-testid={`button-view-${item.id}`}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Sales Invoices"
        description="Manage customer invoices and payments"
        actions={
          <Button variant="outline" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        }
      />

      <DataTable
        data={invoices}
        columns={columns}
        searchKey="customerName"
        searchPlaceholder="Search invoices..."
        onRowClick={handleViewInvoice}
      />

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              <Card className="print:shadow-none">
                <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary text-primary-foreground font-bold text-xl">
                          U
                        </div>
                        <span className="font-bold text-xl">Unanza</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        123 Business Street<br />
                        City, State 12345<br />
                        contact@unanza.com
                      </p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-2xl font-bold" data-testid="text-invoice-id">{selectedInvoice.id}</h2>
                      <StatusBadge status={selectedInvoice.status as "paid" | "unpaid" | "partial"} className="mt-2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Bill To</h3>
                      <p className="font-medium">{selectedInvoice.customerName}</p>
                      <p className="text-sm text-muted-foreground">
                        456 Customer Ave<br />
                        City, State 67890
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Invoice Date:</span>
                          <span>{selectedInvoice.date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Due Date:</span>
                          <span>{selectedInvoice.dueDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Order:</span>
                          <span>{selectedInvoice.orderId}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-md mb-8">
                    <div className="grid grid-cols-12 gap-2 p-3 bg-muted/50 text-sm font-medium">
                      <div className="col-span-5">Description</div>
                      <div className="col-span-2 text-center">Qty</div>
                      <div className="col-span-2 text-right">Unit Price</div>
                      <div className="col-span-3 text-right">Amount</div>
                    </div>
                    {mockInvoiceLines.map((line, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 p-3 text-sm border-t">
                        <div className="col-span-5">{line.description}</div>
                        <div className="col-span-2 text-center">{line.quantity}</div>
                        <div className="col-span-2 text-right">${line.unitPrice.toFixed(2)}</div>
                        <div className="col-span-3 text-right font-medium">${line.total.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <div className="w-64 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${(selectedInvoice.total * 0.9).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax (10%)</span>
                        <span>${(selectedInvoice.total * 0.1).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-base pt-2 border-t">
                        <span>Total Due</span>
                        <span data-testid="text-invoice-total">${selectedInvoice.total.toLocaleString()}</span>
                      </div>
                      {selectedInvoice.status === "partial" && (selectedInvoice as Invoice & { paid?: number }).paid && (
                        <>
                          <div className="flex justify-between text-green-600">
                            <span>Paid</span>
                            <span>-${((selectedInvoice as Invoice & { paid?: number }).paid || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-bold text-red-600">
                            <span>Balance Due</span>
                            <span>${(selectedInvoice.total - ((selectedInvoice as Invoice & { paid?: number }).paid || 0)).toLocaleString()}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
                    Thank you for your business!
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handlePrint} data-testid="button-print">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                {selectedInvoice.status !== "paid" && (
                  <Button onClick={() => handleRecordPayment(selectedInvoice.id)} data-testid="button-record-payment">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
