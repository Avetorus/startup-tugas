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
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Eye, DollarSign, Printer, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV } from "@/lib/export";
import { useMockData } from "@/lib/MockDataContext";

// Types for display
interface InvoiceDisplay {
  id: string;
  companyId: string;
  invoiceNumber: string;
  invoiceType: string;
  customerId: string;
  invoiceDate: string;
  dueDate: string;
  status: string;
  subtotal: string;
  taxAmount: string;
  total: string;
  amountPaid: string;
  amountDue: string;
  customerName: string;
}

export function InvoiceList() {
  const { activeCompany } = useAuth();
  const { toast } = useToast();
  const { invoices: globalInvoices, customers, updateInvoice, addJournalEntry } = useMockData();
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDisplay | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Map global data to display format - filter for customer (AR) invoices
  const invoicesWithCustomers: InvoiceDisplay[] = globalInvoices
    .filter(inv => inv.invoiceType === "customer")
    .map(inv => ({
      id: inv.id,
      companyId: inv.companyId,
      invoiceNumber: inv.invoiceNumber,
      invoiceType: inv.invoiceType,
      customerId: inv.customerId || "",
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      status: inv.status,
      subtotal: inv.subtotal.toString(),
      taxAmount: inv.taxAmount.toString(),
      total: inv.total.toString(),
      amountPaid: inv.amountPaid.toString(),
      amountDue: inv.amountDue.toString(),
      customerName: customers.find(c => c.id === inv.customerId)?.name || "Unknown Customer",
    }));

  const handleViewInvoice = (invoice: InvoiceDisplay) => {
    setSelectedInvoice(invoice);
    setIsDetailOpen(true);
  };

  const handleOpenPayment = (invoice: InvoiceDisplay) => {
    setSelectedInvoice(invoice);
    const balance = invoice.amountDue ?? invoice.total ?? "0";
    setPaymentAmount(String(balance));
    setIsPaymentOpen(true);
  };

  const handleRecordPayment = () => {
    if (!selectedInvoice || !paymentAmount) return;
    if (!selectedInvoice.customerId) {
      toast({ 
        title: "Cannot record payment", 
        description: "Invoice is missing customer information",
        variant: "destructive" 
      });
      return;
    }
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ 
        title: "Invalid amount", 
        description: "Please enter a valid payment amount greater than zero",
        variant: "destructive" 
      });
      return;
    }
    const balanceDue = Number(selectedInvoice.amountDue ?? selectedInvoice.total ?? 0);
    if (amount > balanceDue) {
      toast({ 
        title: "Invalid amount", 
        description: `Payment cannot exceed balance due (Rp ${balanceDue.toLocaleString()})`,
        variant: "destructive" 
      });
      return;
    }
    
    // Mock payment processing
    setIsPending(true);
    setTimeout(() => {
      const newAmountPaid = parseFloat(selectedInvoice.amountPaid) + amount;
      const newAmountDue = parseFloat(selectedInvoice.total) - newAmountPaid;
      const newStatus = newAmountDue <= 0 ? "paid" : newAmountDue < parseFloat(selectedInvoice.total) ? "partial" : "unpaid";
      
      updateInvoice(selectedInvoice.id, { 
        amountPaid: newAmountPaid, 
        amountDue: newAmountDue, 
        status: newStatus 
      });
      
      // Create journal entry: DR Cash, CR Accounts Receivable
      addJournalEntry({
        companyId: selectedInvoice.companyId,
        date: new Date().toISOString().split("T")[0],
        description: `Payment received - Invoice ${selectedInvoice.invoiceNumber}`,
        referenceType: "PMT",
        referenceId: selectedInvoice.id,
        status: "posted",
        lines: [
          { accountId: "acc-1000", accountCode: "1000", accountName: "Cash/Bank", debit: amount, credit: 0 },
          { accountId: "acc-1100", accountCode: "1100", accountName: "Accounts Receivable", debit: 0, credit: amount },
        ]
      });
      
      toast({ 
        title: "Payment Received", 
        description: `Payment of Rp ${amount.toLocaleString()} recorded and AR updated` 
      });
      setIsPending(false);
      setIsPaymentOpen(false);
      setSelectedInvoice(null);
      setPaymentAmount("");
    }, 500);
  };

  const handlePrint = () => {
    window.print();
  };

  const columns: Column<InvoiceDisplay>[] = [
    { key: "invoiceNumber", header: "Invoice #", sortable: true },
    { key: "customerName", header: "Customer", sortable: true },
    { 
      key: "invoiceDate", 
      header: "Date", 
      sortable: true,
      render: (item) => item.invoiceDate ? new Date(item.invoiceDate).toLocaleDateString() : "-"
    },
    { 
      key: "dueDate", 
      header: "Due Date", 
      sortable: true,
      render: (item) => item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "-"
    },
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
      render: (item) => `Rp ${Number(item.total ?? 0).toLocaleString()}`
    },
    { 
      key: "amountDue", 
      header: "Balance", 
      sortable: true,
      className: "text-right",
      render: (item) => `Rp ${Number(item.amountDue ?? 0).toLocaleString()}`
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
              onClick={() => handleOpenPayment(item)}
              disabled={isPending}
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

  const handleExport = () => {
    if (invoicesWithCustomers.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    exportToCSV(
      invoicesWithCustomers.map(inv => ({
        invoiceNumber: inv.invoiceNumber,
        customer: inv.customerName,
        invoiceDate: new Date(inv.invoiceDate).toLocaleDateString("id-ID"),
        dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("id-ID") : "",
        subtotal: inv.subtotal,
        tax: inv.taxAmount,
        total: inv.total,
        paid: inv.amountPaid,
        status: inv.status
      })),
      [
        { key: "invoiceNumber", label: "Invoice Number" },
        { key: "customer", label: "Customer" },
        { key: "invoiceDate", label: "Invoice Date" },
        { key: "dueDate", label: "Due Date" },
        { key: "subtotal", label: "Subtotal (IDR)" },
        { key: "tax", label: "Tax (IDR)" },
        { key: "total", label: "Total (IDR)" },
        { key: "paid", label: "Amount Paid (IDR)" },
        { key: "status", label: "Status" }
      ],
      "invoices"
    );
    toast({ title: "Invoices exported successfully" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Sales Invoices"
        description="Manage customer invoices and payments"
        actions={
          <Button variant="outline" onClick={handleExport} data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        }
      />

      <DataTable
        data={invoicesWithCustomers}
        columns={columns}
        searchKey="customerName"
        searchPlaceholder="Search invoices..."
        onRowClick={handleViewInvoice}
      />

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record payment for invoice {selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Customer:</span>
                <span>{selectedInvoice.customerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invoice Total:</span>
                <span>Rp {Number(selectedInvoice.total ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Balance Due:</span>
                <span className="font-semibold">Rp {Number(selectedInvoice.amountDue ?? 0).toLocaleString()}</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter payment amount"
                  data-testid="input-payment-amount"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleRecordPayment} 
                  disabled={isPending || !paymentAmount}
                  data-testid="button-confirm-payment"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Record Payment
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice Detail Dialog */}
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
                        Enterprise Resource Planning
                      </p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-2xl font-bold" data-testid="text-invoice-number">{selectedInvoice.invoiceNumber}</h2>
                      <StatusBadge status={selectedInvoice.status as "paid" | "unpaid" | "partial"} className="mt-2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Bill To</h3>
                      <p className="font-medium">{selectedInvoice.customerName}</p>
                    </div>
                    <div className="text-right">
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Invoice Date:</span>
                          <span>{selectedInvoice.invoiceDate ? new Date(selectedInvoice.invoiceDate).toLocaleDateString() : "-"}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Due Date:</span>
                          <span>{selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : "-"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>Rp {Number(selectedInvoice.subtotal ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span>Rp {Number(selectedInvoice.taxAmount ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span data-testid="text-invoice-total">Rp {Number(selectedInvoice.total ?? 0).toLocaleString()}</span>
                    </div>
                    {selectedInvoice.status !== "paid" && (
                      <div className="flex justify-between font-semibold text-destructive">
                        <span>Balance Due</span>
                        <span>Rp {Number(selectedInvoice.amountDue ?? 0).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between print:hidden">
                {selectedInvoice.status !== "paid" && (
                  <Button onClick={() => { setIsDetailOpen(false); handleOpenPayment(selectedInvoice); }}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
