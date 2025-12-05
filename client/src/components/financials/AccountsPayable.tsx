import { useState } from "react";
import { DataTable, type Column } from "@/components/layout/DataTable";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, DollarSign, Clock, AlertTriangle, Send } from "lucide-react";
import { mockVendors } from "@/lib/mockData";

// todo: remove mock functionality
const mockVendorInvoices = [
  { id: "VI-001", vendorId: "V001", vendorName: "Prime Suppliers Co.", date: "2024-11-20", dueDate: "2024-12-20", status: "unpaid", total: 12500.00 },
  { id: "VI-002", vendorId: "V002", vendorName: "Quality Materials Inc.", date: "2024-11-25", dueDate: "2024-12-25", status: "unpaid", total: 8900.00 },
  { id: "VI-003", vendorId: "V003", vendorName: "FastShip Logistics", date: "2024-12-01", dueDate: "2024-12-31", status: "partial", total: 3400.00, paid: 1700.00 },
  { id: "VI-004", vendorId: "V001", vendorName: "Prime Suppliers Co.", date: "2024-10-15", dueDate: "2024-11-15", status: "unpaid", total: 5600.00 },
];

const agingData = [
  { range: "Current (0-30)", amount: 12300.00, count: 2 },
  { range: "31-60 Days", amount: 5600.00, count: 1 },
  { range: "61-90 Days", amount: 0, count: 0 },
  { range: "Over 90 Days", amount: 0, count: 0 },
];

type VendorInvoice = typeof mockVendorInvoices[0];

export function AccountsPayable() {
  const [invoices] = useState(mockVendorInvoices);

  const totalPayable = invoices.reduce((sum, inv) => {
    if (inv.status === "paid") return sum;
    if (inv.status === "partial") return sum + (inv.total - ((inv as VendorInvoice & { paid?: number }).paid || 0));
    return sum + inv.total;
  }, 0);

  const overdueAmount = agingData.slice(1).reduce((sum, a) => sum + a.amount, 0);
  const dueThisWeek = 12500;

  const handleReleasePayment = (invoiceId: string) => {
    console.log("Release payment for:", invoiceId);
  };

  const columns: Column<VendorInvoice>[] = [
    { key: "id", header: "Invoice #", sortable: true },
    { key: "vendorName", header: "Vendor", sortable: true },
    { key: "date", header: "Invoice Date", sortable: true },
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
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {item.status !== "paid" && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleReleasePayment(item.id)}
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

  return (
    <div>
      <PageHeader
        title="Accounts Payable"
        description="Track vendor invoices and payments"
        actions={
          <Button variant="outline" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        }
      />

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Payable"
          value={totalPayable}
          icon={DollarSign}
        />
        <StatCard
          title="Due This Week"
          value={dueThisWeek}
          icon={Clock}
        />
        <StatCard
          title="Overdue"
          value={overdueAmount}
          icon={AlertTriangle}
        />
        <StatCard
          title="Paid This Month"
          value={45000}
          icon={Send}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Aging Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agingData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="font-medium">{item.range}</p>
                    <p className="text-sm text-muted-foreground">{item.count} invoice(s)</p>
                  </div>
                  <p className="font-semibold">${item.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Invoiced This Month</span>
              <span className="font-semibold">$25,800.00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Paid This Month</span>
              <span className="font-semibold text-green-600">$45,000.00</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-muted-foreground">Pending Approvals</span>
              <span className="font-semibold">3</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        data={invoices.filter(inv => inv.status !== "paid")}
        columns={columns}
        searchKey="vendorName"
        searchPlaceholder="Search invoices..."
      />
    </div>
  );
}
