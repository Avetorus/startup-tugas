import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Package,
  DollarSign,
  Users,
  Brain,
  FileSpreadsheet,
  Printer,
} from "lucide-react";
import { SalesReports } from "@/components/reports/SalesReports";
import { InventoryReports } from "@/components/reports/InventoryReports";
import { FinanceReports } from "@/components/reports/FinanceReports";
import { HRReports } from "@/components/reports/HRReports";
import { AdvancedReports } from "@/components/reports/AdvancedReports";
import { cn } from "@/lib/utils";

export function Reports() {
  const [activeModule, setActiveModule] = useState("sales");

  const modules = [
    { id: "sales", label: "Sales", icon: ShoppingCart, color: "text-blue-600", description: "Performance & Pipeline" },
    { id: "inventory", label: "Inventory", icon: Package, color: "text-green-600", description: "Stock & Suppliers" },
    { id: "finance", label: "Finance", icon: DollarSign, color: "text-purple-600", description: "P&L & Balance Sheet" },
    { id: "hr", label: "HR", icon: Users, color: "text-amber-600", description: "Attendance & Payroll" },
    { id: "advanced", label: "Advanced/AI", icon: Brain, color: "text-pink-600", description: "AI & Predictions" },
  ];

  const handleExportAll = () => {
    console.log("Exporting all reports...");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Comprehensive reporting across all ERP modules with AI-powered insights"
        actions={
          <>
            <Button variant="outline" onClick={handleExportAll} data-testid="button-export-all">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export All
            </Button>
            <Button variant="outline" onClick={handlePrint} data-testid="button-print">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </>
        }
      />

      <div className="grid md:grid-cols-5 gap-4 mb-6">
        {modules.map((module) => {
          const Icon = module.icon;
          const isActive = activeModule === module.id;
          return (
            <Card
              key={module.id}
              className={cn(
                "cursor-pointer transition-all hover-elevate",
                isActive && "ring-2 ring-primary"
              )}
              onClick={() => setActiveModule(module.id)}
              data-testid={`card-module-${module.id}`}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className={cn("p-2 rounded-md bg-muted", module.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{module.label}</p>
                  <p className="text-xs text-muted-foreground">{module.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="min-h-[600px]">
        {activeModule === "sales" && <SalesReports />}
        {activeModule === "inventory" && <InventoryReports />}
        {activeModule === "finance" && <FinanceReports />}
        {activeModule === "hr" && <HRReports />}
        {activeModule === "advanced" && <AdvancedReports />}
      </div>
    </div>
  );
}
