import { useState } from "react";
import { DataTable, type Column } from "@/components/layout/DataTable";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, DollarSign, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { mockInvoices } from "@/lib/mockData";

type Invoice = typeof mockInvoices[0];

// todo: remove mock functionality
const agingData = [
  { range: "Current (0-30)", amount: 2340.00, count: 1 },
  { range: "31-60 Days", amount: 4750.00, count: 2 },
  { range: "61-90 Days", amount: 0, count: 0 },
  { range: "Over 90 Days", amount: 8900.00, count: 1 },
];

export function AccountsReceivable() {
  const [invoices] = useState(mockInvoices);

  const totalReceivable = invoices.reduce((sum, inv) => {
    if (inv.status === "paid") return sum;
    if (inv.status === "partial") return sum + (inv.total - ((inv as Invoice & { paid?: number }).paid || 0));
    return sum + inv.total;
  }, 0);

  const overdueAmount = agingData.slice(1).reduce((sum, a) => sum + a.amount, 0);
  const currentAmount = agingData[0].amount;

  const handleRecordPayment = (invoiceId: string) => {
    console.log("Record payment for:", invoiceId);
  };

  const columns: Column<Invoice>[] = [
    { key: "id", header: "Invoice #", sortable: true },
    { key: "customerName", header: "Customer", sortable: true },
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
              onClick={() => handleRecordPayment(item.id)}
              data-testid={`button-pay-${item.id}`}
            >
              <DollarSign className="h-4 w-4 mr-1" />
              Payment
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Accounts Receivable"
        description="Track customer invoices and payments"
        actions={
          <Button variant="outline" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        }
      />

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Receivable"
          value={totalReceivable}
          icon={DollarSign}
        />
        <StatCard
          title="Current"
          value={currentAmount}
          icon={CheckCircle}
        />
        <StatCard
          title="Overdue"
          value={overdueAmount}
          icon={AlertTriangle}
        />
        <StatCard
          title="Avg Days Outstanding"
          value="32"
          icon={Clock}
          subtitle="days"
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
            <CardTitle className="text-base">Collection Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Invoiced This Month</span>
              <span className="font-semibold">$15,689.50</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Collected This Month</span>
              <span className="font-semibold text-green-600">$9,234.00</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-muted-foreground">Collection Rate</span>
              <span className="font-semibold">58.9%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        data={invoices.filter(inv => inv.status !== "paid")}
        columns={columns}
        searchKey="customerName"
        searchPlaceholder="Search invoices..."
      />
    </div>
  );
}
