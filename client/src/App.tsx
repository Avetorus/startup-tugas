import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import { AppSidebar } from "@/components/layout/AppSidebar";

import { Dashboard } from "@/components/Dashboard";
import { Reports } from "@/components/Reports";
import { ConsolidationReports } from "@/components/reports/ConsolidationReports";
import { SalesOrderList } from "@/components/sales/SalesOrderList";
import { CustomerList } from "@/components/sales/CustomerList";
import { DeliveryList } from "@/components/sales/DeliveryList";
import { InvoiceList } from "@/components/sales/InvoiceList";
import { ProductList } from "@/components/warehouse/ProductList";
import { LocationList } from "@/components/warehouse/LocationList";
import { StockLevels } from "@/components/warehouse/StockLevels";
import { MovementList } from "@/components/warehouse/MovementList";
import { PurchaseOrderList } from "@/components/warehouse/PurchaseOrderList";
import { JournalEntries } from "@/components/financials/JournalEntries";
import { ChartOfAccounts } from "@/components/financials/ChartOfAccounts";
import { AccountsReceivable } from "@/components/financials/AccountsReceivable";
import { AccountsPayable } from "@/components/financials/AccountsPayable";
import { EmployeeList } from "@/components/hr/EmployeeList";
import { AttendanceList } from "@/components/hr/AttendanceList";
import { LeaveRequests } from "@/components/hr/LeaveRequests";
import { Payroll } from "@/components/hr/Payroll";
import { CompanyManagement } from "@/components/system/CompanyManagement";
import { UserRoleManagement } from "@/components/system/UserRoleManagement";
import { InterCompanyTransactions } from "@/components/system/InterCompanyTransactions";
import { VendorPortal } from "@/components/system/VendorPortal";
import { CustomerPortal } from "@/components/system/CustomerPortal";
import { Settings } from "@/components/system/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/reports" component={Reports} />
      <Route path="/reports/consolidation" component={ConsolidationReports} />
      
      <Route path="/sales/orders" component={SalesOrderList} />
      <Route path="/sales/customers" component={CustomerList} />
      <Route path="/sales/deliveries" component={DeliveryList} />
      <Route path="/sales/invoices" component={InvoiceList} />
      
      <Route path="/warehouse/products" component={ProductList} />
      <Route path="/warehouse/locations" component={LocationList} />
      <Route path="/warehouse/stock" component={StockLevels} />
      <Route path="/warehouse/movements" component={MovementList} />
      <Route path="/warehouse/purchase-orders" component={PurchaseOrderList} />
      
      <Route path="/financials/journal" component={JournalEntries} />
      <Route path="/financials/accounts" component={ChartOfAccounts} />
      <Route path="/financials/receivables" component={AccountsReceivable} />
      <Route path="/financials/payables" component={AccountsPayable} />
      
      <Route path="/hr/employees" component={EmployeeList} />
      <Route path="/hr/attendance" component={AttendanceList} />
      <Route path="/hr/leave" component={LeaveRequests} />
      <Route path="/hr/payroll" component={Payroll} />
      
      <Route path="/system/companies" component={CompanyManagement} />
      <Route path="/system/users" component={UserRoleManagement} />
      <Route path="/system/intercompany" component={InterCompanyTransactions} />
      <Route path="/system/vendors" component={VendorPortal} />
      <Route path="/system/customer-portal" component={CustomerPortal} />
      <Route path="/system/settings" component={Settings} />
      
      <Route>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-2">Page Not Found</h1>
            <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CompanyProvider>
          <TooltipProvider>
            <SidebarProvider style={style as React.CSSProperties}>
              <div className="flex h-screen w-full">
                <AppSidebar />
                <div className="flex flex-col flex-1 min-w-0">
                  <header className="flex items-center justify-between gap-2 p-3 border-b shrink-0">
                    <div className="flex items-center gap-2">
                      <SidebarTrigger data-testid="button-sidebar-toggle" />
                      <CompanySwitcher />
                    </div>
                    <ThemeToggle />
                  </header>
                  <main className="flex-1 overflow-auto p-6">
                    <Router />
                  </main>
                </div>
              </div>
            </SidebarProvider>
            <Toaster />
          </TooltipProvider>
        </CompanyProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
