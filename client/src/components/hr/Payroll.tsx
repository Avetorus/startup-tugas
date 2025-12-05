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
import { Download, Eye, Printer } from "lucide-react";
import { mockEmployees } from "@/lib/mockData";

// todo: remove mock functionality
const mockPayrollRuns = [
  { id: "PR-2024-12", period: "December 2024", date: "2024-12-31", status: "pending", totalGross: 45600, totalNet: 34200, employees: 5 },
  { id: "PR-2024-11", period: "November 2024", date: "2024-11-30", status: "paid", totalGross: 45600, totalNet: 34200, employees: 5 },
  { id: "PR-2024-10", period: "October 2024", date: "2024-10-31", status: "paid", totalGross: 44800, totalNet: 33600, employees: 5 },
];

const mockPayslip = {
  employee: mockEmployees[0],
  period: "December 2024",
  basicSalary: 8500,
  allowances: 500,
  overtime: 200,
  grossPay: 9200,
  taxDeduction: 1840,
  socialSecurity: 690,
  healthInsurance: 230,
  totalDeductions: 2760,
  netPay: 6440,
};

type PayrollRun = typeof mockPayrollRuns[0];

export function Payroll() {
  const [payrollRuns] = useState(mockPayrollRuns);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleViewRun = (run: PayrollRun) => {
    setSelectedRun(run);
    setIsDetailOpen(true);
  };

  const handlePrint = () => {
    window.print();
    console.log("Print payslip");
  };

  const columns: Column<PayrollRun>[] = [
    { key: "id", header: "Run ID", sortable: true },
    { key: "period", header: "Period", sortable: true },
    { key: "date", header: "Date", sortable: true },
    { key: "employees", header: "Employees", className: "text-center" },
    { 
      key: "totalGross", 
      header: "Gross Pay", 
      sortable: true,
      className: "text-right",
      render: (item) => `$${item.totalGross.toLocaleString()}`
    },
    { 
      key: "totalNet", 
      header: "Net Pay", 
      sortable: true,
      className: "text-right",
      render: (item) => `$${item.totalNet.toLocaleString()}`
    },
    { 
      key: "status", 
      header: "Status",
      render: (item) => <StatusBadge status={item.status as "pending" | "paid"} />
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (item) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => handleViewRun(item)} data-testid={`button-view-${item.id}`}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Payroll"
        description="Manage payroll runs and payslips"
        actions={
          <Button variant="outline" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        }
      />

      <DataTable
        data={payrollRuns}
        columns={columns}
        searchKey="period"
        searchPlaceholder="Search payroll runs..."
        onRowClick={handleViewRun}
      />

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payslip Details</DialogTitle>
          </DialogHeader>
          {selectedRun && (
            <div className="space-y-6">
              <Card className="print:shadow-none">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground font-bold">
                          U
                        </div>
                        <span className="font-bold text-lg">Unanza</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        123 Business Street<br />
                        City, State 12345
                      </p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-xl font-bold">PAYSLIP</h2>
                      <p className="text-sm text-muted-foreground">{selectedRun.period}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6 p-4 bg-muted/30 rounded-md">
                    <div>
                      <p className="text-sm text-muted-foreground">Employee</p>
                      <p className="font-medium">{mockPayslip.employee.name}</p>
                      <p className="text-sm text-muted-foreground">{mockPayslip.employee.position}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Employee ID</p>
                      <p className="font-medium">{mockPayslip.employee.id}</p>
                      <p className="text-sm text-muted-foreground">{mockPayslip.employee.department}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">Earnings</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Basic Salary</span>
                          <span>${mockPayslip.basicSalary.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Allowances</span>
                          <span>${mockPayslip.allowances.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Overtime</span>
                          <span>${mockPayslip.overtime.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-semibold pt-2 border-t">
                          <span>Gross Pay</span>
                          <span>${mockPayslip.grossPay.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Deductions</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Income Tax</span>
                          <span>${mockPayslip.taxDeduction.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Social Security</span>
                          <span>${mockPayslip.socialSecurity.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Health Insurance</span>
                          <span>${mockPayslip.healthInsurance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-semibold pt-2 border-t">
                          <span>Total Deductions</span>
                          <span>${mockPayslip.totalDeductions.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-primary/10 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-lg">Net Pay</span>
                      <span className="font-bold text-2xl" data-testid="text-net-pay">
                        ${mockPayslip.netPay.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handlePrint} data-testid="button-print">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" data-testid="button-download">
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
