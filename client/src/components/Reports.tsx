import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, TrendingUp, Package, DollarSign, BarChart3 } from "lucide-react";
import { mockSalesOrders, mockProducts, mockDashboardStats } from "@/lib/mockData";

// todo: remove mock functionality
const mockSalesData = [
  { month: "Jan", sales: 45000, orders: 32 },
  { month: "Feb", sales: 52000, orders: 38 },
  { month: "Mar", sales: 48000, orders: 35 },
  { month: "Apr", sales: 61000, orders: 45 },
  { month: "May", sales: 55000, orders: 41 },
  { month: "Jun", sales: 67000, orders: 48 },
  { month: "Jul", sales: 72000, orders: 52 },
  { month: "Aug", sales: 69000, orders: 50 },
  { month: "Sep", sales: 78000, orders: 56 },
  { month: "Oct", sales: 85000, orders: 62 },
  { month: "Nov", sales: 92000, orders: 68 },
  { month: "Dec", sales: 156000, orders: 89 },
];

const mockCategoryData = [
  { category: "Widgets", value: 125000, percentage: 45 },
  { category: "Components", value: 82000, percentage: 30 },
  { category: "Materials", value: 45000, percentage: 16 },
  { category: "Assemblies", value: 25000, percentage: 9 },
];

export function Reports() {
  const [activeTab, setActiveTab] = useState("sales");
  const [period, setPeriod] = useState("month");

  const handleExport = (reportType: string) => {
    console.log("Exporting", reportType, "report");
    // Create sample CSV data
    const csvContent = `Report Type,${reportType}\nPeriod,${period}\nGenerated,${new Date().toISOString()}\n\nSample Data,Value\n`;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}_report.csv`;
    a.click();
  };

  const totalSales = mockSalesData.reduce((sum, d) => sum + d.sales, 0);
  const totalOrders = mockSalesData.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderValue = totalSales / totalOrders;
  const inventoryValue = mockProducts.reduce((sum, p) => sum + (p.stock * p.price), 0);

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Analytics and business intelligence"
        actions={
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32" data-testid="select-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="sales" data-testid="tab-sales">
            <TrendingUp className="h-4 w-4 mr-2" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="inventory" data-testid="tab-inventory">
            <Package className="h-4 w-4 mr-2" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="financial" data-testid="tab-financial">
            <DollarSign className="h-4 w-4 mr-2" />
            Financial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-semibold">${totalSales.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-semibold">{totalOrders}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-semibold">${avgOrderValue.toFixed(0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-semibold">24.5%</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base">Monthly Sales Trend</CardTitle>
                <Button variant="outline" size="sm" onClick={() => handleExport("sales")} data-testid="button-export-sales">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end gap-1">
                  {mockSalesData.map((data, index) => {
                    const maxSales = Math.max(...mockSalesData.map(d => d.sales));
                    const height = (data.sales / maxSales) * 100;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className="w-full bg-primary/80 rounded-t-sm transition-all hover:bg-primary"
                          style={{ height: `${height}%` }}
                          title={`${data.month}: $${data.sales.toLocaleString()}`}
                        />
                        <span className="text-xs text-muted-foreground">{data.month.slice(0, 1)}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base">Sales by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCategoryData.map((cat, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{cat.category}</span>
                        <span className="font-medium">${cat.value.toLocaleString()} ({cat.percentage}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory">
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-semibold">{mockProducts.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Stock Value</p>
                <p className="text-2xl font-semibold">${inventoryValue.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-semibold text-red-600">{mockProducts.filter(p => p.stock < p.minLevel).length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Stock Turnover</p>
                <p className="text-2xl font-semibold">4.2x</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">Inventory Summary</CardTitle>
              <Button variant="outline" size="sm" onClick={() => handleExport("inventory")} data-testid="button-export-inventory">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md divide-y">
                <div className="grid grid-cols-6 gap-2 p-3 bg-muted/50 text-sm font-medium">
                  <div>SKU</div>
                  <div className="col-span-2">Product</div>
                  <div className="text-right">Stock</div>
                  <div className="text-right">Value</div>
                  <div className="text-right">% of Total</div>
                </div>
                {mockProducts.map((product) => {
                  const value = product.stock * product.price;
                  const percentage = (value / inventoryValue) * 100;
                  return (
                    <div key={product.id} className="grid grid-cols-6 gap-2 p-3 text-sm">
                      <div className="text-muted-foreground">{product.sku}</div>
                      <div className="col-span-2">{product.name}</div>
                      <div className="text-right">{product.stock}</div>
                      <div className="text-right">${value.toLocaleString()}</div>
                      <div className="text-right">{percentage.toFixed(1)}%</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-semibold text-green-600">${totalSales.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Accounts Receivable</p>
                <p className="text-2xl font-semibold">${mockDashboardStats.receivables.total.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Accounts Payable</p>
                <p className="text-2xl font-semibold">${mockDashboardStats.payables.total.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Net Position</p>
                <p className="text-2xl font-semibold">
                  ${(mockDashboardStats.receivables.total - mockDashboardStats.payables.total).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">Financial Statement Overview</CardTitle>
              <Button variant="outline" size="sm" onClick={() => handleExport("financial")} data-testid="button-export-financial">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Assets</h4>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between text-sm">
                      <span>Cash & Equivalents</span>
                      <span>$125,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Accounts Receivable</span>
                      <span>${mockDashboardStats.receivables.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Inventory</span>
                      <span>${inventoryValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Total Assets</span>
                      <span>${(125000 + mockDashboardStats.receivables.total + inventoryValue).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Liabilities</h4>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between text-sm">
                      <span>Accounts Payable</span>
                      <span>${mockDashboardStats.payables.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Accrued Expenses</span>
                      <span>$15,000</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Total Liabilities</span>
                      <span>${(mockDashboardStats.payables.total + 15000).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Equity</h4>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between text-sm">
                      <span>Owner's Equity</span>
                      <span>$350,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Retained Earnings</span>
                      <span>$89,000</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Total Equity</span>
                      <span>$439,000</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
