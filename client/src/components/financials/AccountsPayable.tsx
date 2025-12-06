import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable, type Column } from "@/components/layout/DataTable";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, DollarSign, Clock, AlertTriangle, Send, Loader2 } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { exportToCSV } from "@/lib/export";
import type { Invoice, Vendor } from "@shared/schema";

interface VendorInvoiceDisplay extends Invoice {
  vendorName: string;
}

export function AccountsPayable() {
  const { activeCompany } = useCompany();
  const { toast } = useToast();
  const [selectedInvoice, setSelectedInvoice] = useState<VendorInvoiceDisplay | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/companies", activeCompany?.id, "invoices"],
    enabled: !!activeCompany?.id,
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/companies", activeCompany?.id, "vendors"],
    enabled: !!activeCompany?.id,
  });

  // Filter for vendor (AP) invoices - backend uses "vendor" type
  const vendorInvoices: VendorInvoiceDisplay[] = invoices
    .filter(inv => inv.invoiceType === "vendor")
    .map(invoice => ({
      ...invoice,
      vendorName: vendors.find(v => v.id === invoice.vendorId)?.name || "Unknown Vendor",
    }));

  const unpaidInvoices = vendorInvoices.filter(inv => inv.status !== "paid");
  
  const totalPayable = unpaidInvoices.reduce((sum, inv) => {
    return sum + Number(inv.amountDue ?? 0);
  }, 0);

  // Workflow mutation: Make vendor payment
  const makePaymentMutation = useMutation({
    mutationFn: async ({ vendorId, invoiceIds, amount }: { vendorId: string; invoiceIds: string[]; amount: number }) => {
      const response = await apiRequest("POST", `/api/companies/${activeCompany?.id}/payments/pay`, {
        vendorId,
        invoiceIds,
        amount,
        paymentMethod: "bank_transfer",
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "ap-ledger"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "purchase-orders"] });
      toast({ 
        title: "Payment Sent", 
        description: `Payment ${data.payment?.paymentNumber || ''} recorded and AP updated` 
      });
      setIsPaymentOpen(false);
      setSelectedInvoice(null);
      setPaymentAmount("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to make payment", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleOpenPayment = (invoice: VendorInvoiceDisplay) => {
    setSelectedInvoice(invoice);
    // Normalize to string since schema may return numbers
    const balance = invoice.amountDue ?? invoice.total ?? 0;
    setPaymentAmount(String(balance));
    setIsPaymentOpen(true);
  };

  const handleMakePayment = () => {
    if (!selectedInvoice || !paymentAmount) return;
    if (!selectedInvoice.vendorId) {
      toast({ 
        title: "Cannot make payment", 
        description: "Invoice is missing vendor information",
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
    makePaymentMutation.mutate({
      vendorId: selectedInvoice.vendorId,
      invoiceIds: [selectedInvoice.id],
      amount,
    });
  };

  const columns: Column<VendorInvoiceDisplay>[] = [
    { key: "invoiceNumber", header: "Invoice #", sortable: true },
    { key: "vendorName", header: "Vendor", sortable: true },
    { 
      key: "invoiceDate", 
      header: "Invoice Date", 
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
      header: "Amount", 
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
              size="sm" 
              onClick={() => handleOpenPayment(item)}
              disabled={makePaymentMutation.isPending}
              data-testid={`button-pay-${item.id}`}
            >
              <Send className="h-4 w-4 mr-1" />
              Pay
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleExport = () => {
    if (vendorInvoices.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    exportToCSV(
      vendorInvoices.map(inv => ({
        invoiceNumber: inv.invoiceNumber,
        vendor: inv.vendorName,
        invoiceDate: new Date(inv.invoiceDate).toLocaleDateString("id-ID"),
        dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("id-ID") : "",
        total: inv.total,
        paid: inv.amountPaid,
        due: inv.amountDue,
        status: inv.status
      })),
      [
        { key: "invoiceNumber", label: "Invoice Number" },
        { key: "vendor", label: "Vendor" },
        { key: "invoiceDate", label: "Invoice Date" },
        { key: "dueDate", label: "Due Date" },
        { key: "total", label: "Total (IDR)" },
        { key: "paid", label: "Amount Paid (IDR)" },
        { key: "due", label: "Amount Due (IDR)" },
        { key: "status", label: "Status" }
      ],
      "accounts_payable"
    );
    toast({ title: "Accounts Payable exported successfully" });
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
        title="Accounts Payable"
        description="Track vendor invoices and payments"
        actions={
          <Button variant="outline" onClick={handleExport} data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        }
      />

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Payable"
          value={`Rp ${totalPayable.toLocaleString()}`}
          icon={DollarSign}
        />
        <StatCard
          title="Invoices Pending"
          value={unpaidInvoices.length}
          icon={Clock}
        />
        <StatCard
          title="Vendors"
          value={vendors.length}
          icon={AlertTriangle}
        />
        <StatCard
          title="This Month"
          value={vendorInvoices.filter(inv => {
            const date = new Date(inv.invoiceDate || "");
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          }).length}
          icon={Send}
          subtitle="invoices"
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Summary by Vendor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from(new Set(unpaidInvoices.map(inv => inv.vendorId))).slice(0, 5).map(vendorId => {
              const vendorInvs = unpaidInvoices.filter(inv => inv.vendorId === vendorId);
              const vendorTotal = vendorInvs.reduce((sum, inv) => sum + Number(inv.amountDue ?? 0), 0);
              const vendorName = vendorInvs[0]?.vendorName || "Unknown";
              return (
                <div key={vendorId} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="font-medium">{vendorName}</p>
                    <p className="text-sm text-muted-foreground">{vendorInvs.length} invoice(s)</p>
                  </div>
                  <p className="font-semibold">Rp {vendorTotal.toLocaleString()}</p>
                </div>
              );
            })}
            {unpaidInvoices.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No unpaid invoices</p>
            )}
          </div>
        </CardContent>
      </Card>

      <DataTable
        data={unpaidInvoices}
        columns={columns}
        searchKey="vendorName"
        searchPlaceholder="Search invoices..."
      />

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription>
              Record payment for invoice {selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vendor:</span>
                <span>{selectedInvoice.vendorName}</span>
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
                  onClick={handleMakePayment} 
                  disabled={makePaymentMutation.isPending || !paymentAmount}
                  data-testid="button-confirm-payment"
                >
                  {makePaymentMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Payment
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
