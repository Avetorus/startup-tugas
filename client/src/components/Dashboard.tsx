import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users, 
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Clock,
} from "lucide-react";
import { mockDashboardStats, mockSalesOrders, mockProducts, mockPurchaseOrders, mockLeaveRequests } from "@/lib/mockData";
import { Link } from "wouter";

export function Dashboard() {
  const [stats] = useState(mockDashboardStats);
  const lowStockProducts = mockProducts.filter(p => p.stock < p.minLevel);
  const pendingOrders = mockSalesOrders.filter(o => o.status === "draft" || o.status === "confirmed");
  const pendingPOs = mockPurchaseOrders.filter(po => po.status === "draft" || po.status === "ordered");
  const pendingLeaves = mockLeaveRequests.filter(lr => lr.status === "pending");

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Welcome back! Here's what's happening today.`}
      />

      <OnboardingChecklist />

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Today's Sales"
          value={stats.sales.today}
          icon={DollarSign}
          trend={stats.sales.trend}
          subtitle="vs yesterday"
        />
        <StatCard
          title="Pending Orders"
          value={stats.sales.pending}
          icon={ShoppingCart}
        />
        <StatCard
          title="Inventory Value"
          value={stats.inventory.totalValue}
          icon={Package}
          trend={stats.inventory.trend}
          subtitle="this week"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.inventory.lowStock}
          icon={AlertTriangle}
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Recent Orders</CardTitle>
            <Link href="/sales/orders">
              <Button variant="ghost" size="sm" data-testid="link-view-all-orders">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockSalesOrders.slice(0, 4).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="font-medium">{order.id}</p>
                    <p className="text-sm text-muted-foreground">{order.customerName}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={order.status as "draft" | "confirmed" | "delivered" | "invoiced"} />
                    <p className="text-sm font-medium mt-1">${order.total.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Low Stock Alerts</CardTitle>
            <Link href="/warehouse/stock">
              <Button variant="ghost" size="sm" data-testid="link-view-stock">
                View Stock <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length > 0 ? (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 4).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 border rounded-md border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600 dark:text-red-400">{product.stock}</p>
                      <p className="text-xs text-muted-foreground">Min: {product.minLevel}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">All products are well stocked</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingPOs.slice(0, 2).map((po) => (
                <div key={po.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{po.id}</p>
                      <p className="text-sm text-muted-foreground">{po.vendorName}</p>
                    </div>
                  </div>
                  <StatusBadge status={po.status as "draft" | "ordered" | "received"} />
                </div>
              ))}
              {pendingLeaves.slice(0, 2).map((leave) => (
                <div key={leave.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Leave Request</p>
                      <p className="text-sm text-muted-foreground">{leave.employeeName}</p>
                    </div>
                  </div>
                  <StatusBadge status="pending" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Financial Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/30">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium">Accounts Receivable</p>
                    <p className="text-sm text-muted-foreground">Outstanding invoices</p>
                  </div>
                </div>
                <p className="text-xl font-semibold">${stats.receivables.total.toLocaleString()}</p>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-red-100 dark:bg-red-900/30">
                    <DollarSign className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="font-medium">Accounts Payable</p>
                    <p className="text-sm text-muted-foreground">Pending payments</p>
                  </div>
                </div>
                <p className="text-xl font-semibold">${stats.payables.total.toLocaleString()}</p>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-amber-100 dark:bg-amber-900/30">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium">Overdue Receivables</p>
                    <p className="text-sm text-muted-foreground">Past due date</p>
                  </div>
                </div>
                <p className="text-xl font-semibold text-amber-600 dark:text-amber-400">
                  ${stats.receivables.overdue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/sales/orders">
                <Button variant="outline" className="w-full justify-start" data-testid="button-quick-new-order">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  New Sales Order
                </Button>
              </Link>
              <Link href="/warehouse/purchase-orders">
                <Button variant="outline" className="w-full justify-start" data-testid="button-quick-new-po">
                  <Package className="h-4 w-4 mr-2" />
                  New Purchase Order
                </Button>
              </Link>
              <Link href="/sales/customers">
                <Button variant="outline" className="w-full justify-start" data-testid="button-quick-customers">
                  <Users className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              </Link>
              <Link href="/warehouse/products">
                <Button variant="outline" className="w-full justify-start" data-testid="button-quick-products">
                  <Package className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </Link>
              <Link href="/financials/journal">
                <Button variant="outline" className="w-full justify-start" data-testid="button-quick-journal">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Journal Entry
                </Button>
              </Link>
              <Link href="/reports">
                <Button variant="outline" className="w-full justify-start" data-testid="button-quick-reports">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
