import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  Activity,
  AlertTriangle,
  Clock,
  Package,
  Sparkles,
  LineChart,
  BarChart3,
} from "lucide-react";
import {
  mockVendorScorecard,
  mockCustomerLifetimeValue,
  mockAuditLog,
  mockChurnProbability,
  mockPredictiveReorder,
  mockDemandForecast,
  mockHistoricalSales,
} from "@/lib/reportData";
import { cn } from "@/lib/utils";

export function AdvancedReports() {
  const [activeTab, setActiveTab] = useState("vendor");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full max-w-4xl">
          <TabsTrigger value="vendor" data-testid="tab-vendor">Vendors</TabsTrigger>
          <TabsTrigger value="clv" data-testid="tab-clv">Customer LTV</TabsTrigger>
          <TabsTrigger value="audit" data-testid="tab-audit">Audit Log</TabsTrigger>
          <TabsTrigger value="churn" data-testid="tab-churn">Churn Risk</TabsTrigger>
          <TabsTrigger value="predictive" data-testid="tab-predictive">AI Reorder</TabsTrigger>
          <TabsTrigger value="demand" data-testid="tab-demand">Demand Forecast</TabsTrigger>
        </TabsList>

        <TabsContent value="vendor" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Vendor Scorecard
              </CardTitle>
              <CardDescription>Comprehensive vendor performance evaluation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {mockVendorScorecard.map((vendor) => (
                  <Card key={vendor.id} className="border-2">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{vendor.name}</CardTitle>
                        {vendor.trend === "up" ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : vendor.trend === "down" ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <Activity className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-center mb-4">
                        <p className={cn(
                          "text-3xl font-bold",
                          vendor.overall >= 90 ? "text-green-600" :
                          vendor.overall >= 80 ? "text-amber-600" : "text-red-600"
                        )}>
                          {vendor.overall}%
                        </p>
                        <p className="text-sm text-muted-foreground">Overall Score</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Quality</span>
                          <span className="font-medium">{vendor.quality}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Delivery</span>
                          <span className="font-medium">{vendor.delivery}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Price</span>
                          <span className="font-medium">{vendor.price}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Service</span>
                          <span className="font-medium">{vendor.service}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clv" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card data-testid="card-total-clv">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total CLV</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-green-600 dark:text-green-400" data-testid="text-total-clv">
                  ${mockCustomerLifetimeValue.reduce((sum, c) => sum + c.clv, 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card data-testid="card-avg-clv">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Avg CLV per Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold" data-testid="text-avg-clv">
                  ${(mockCustomerLifetimeValue.reduce((sum, c) => sum + c.clv, 0) / mockCustomerLifetimeValue.length).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card data-testid="card-high-value-customers">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">High-Value Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold" data-testid="text-high-value-count">
                  {mockCustomerLifetimeValue.filter(c => c.segment === "high").length}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Lifetime Value Analysis
              </CardTitle>
              <CardDescription>Predicted customer value based on historical behavior</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Acquisition</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                    <TableHead className="text-right">Avg Order</TableHead>
                    <TableHead className="text-center">Frequency</TableHead>
                    <TableHead className="text-right">Lifetime Value</TableHead>
                    <TableHead className="text-center">Segment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCustomerLifetimeValue.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.acquisitionDate}</TableCell>
                      <TableCell className="text-right">${customer.totalRevenue.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${customer.avgOrderValue.toLocaleString()}</TableCell>
                      <TableCell className="text-center">{customer.frequency} orders</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        ${customer.clv.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn(
                          customer.segment === "high" ? "bg-green-500" :
                          customer.segment === "medium" ? "bg-blue-500" : "bg-gray-500"
                        )}>
                          {customer.segment}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                User Activity Audit Log
              </CardTitle>
              <CardDescription>System activity tracking for compliance and security</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAuditLog.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                      <TableCell>{log.user}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.module}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          log.action === "CREATE" ? "bg-green-500" :
                          log.action === "UPDATE" ? "bg-blue-500" :
                          log.action === "DELETE" ? "bg-red-500" :
                          log.action === "POST" ? "bg-purple-500" : "bg-amber-500"
                        )}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{log.entity}</span>
                        <span className="text-muted-foreground ml-1">({log.entityId})</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{log.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="churn" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Customer Churn Probability Analysis
              </CardTitle>
              <CardDescription>AI-powered churn risk prediction based on customer behavior</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-center">Days Since Order</TableHead>
                    <TableHead className="text-center">Frequency Decline</TableHead>
                    <TableHead className="text-center">Revenue Decline</TableHead>
                    <TableHead className="text-center">Support Tickets</TableHead>
                    <TableHead className="text-center">Churn Probability</TableHead>
                    <TableHead className="text-center">Risk Level</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockChurnProbability.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell className="text-center">{customer.lastOrderDays}</TableCell>
                      <TableCell className={cn(
                        "text-center",
                        customer.orderFrequencyDecline > 20 && "text-red-600"
                      )}>
                        {customer.orderFrequencyDecline}%
                      </TableCell>
                      <TableCell className={cn(
                        "text-center",
                        customer.revenueDecline > 20 && "text-red-600",
                        customer.revenueDecline < 0 && "text-green-600"
                      )}>
                        {customer.revenueDecline}%
                      </TableCell>
                      <TableCell className="text-center">{customer.supportTickets}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Progress 
                            value={customer.churnProbability} 
                            className={cn(
                              "h-2 w-16",
                              customer.churnProbability > 50 && "[&>div]:bg-red-500"
                            )} 
                          />
                          <span className={cn(
                            "font-medium",
                            customer.churnProbability > 50 ? "text-red-600" : "text-green-600"
                          )}>
                            {customer.churnProbability}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn(
                          customer.riskLevel === "high" ? "bg-red-500" :
                          customer.riskLevel === "medium" ? "bg-amber-500" : "bg-green-500"
                        )}>
                          {customer.riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {customer.riskLevel === "high" && (
                          <Button size="sm" variant="outline" data-testid={`button-churn-action-${customer.id}`}>
                            Take Action
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 p-4 bg-muted/50 rounded-md">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Recommendations
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                    <span><strong>Metro Retail Group:</strong> High churn risk - consider personalized outreach and special retention offer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-amber-500 mt-0.5" />
                    <span><strong>TechStart Inc.:</strong> Monitor closely - order frequency showing slight decline</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Powered Predictive Reorder
              </CardTitle>
              <CardDescription>Machine learning predictions for optimal reorder timing and quantities</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Current Stock</TableHead>
                    <TableHead className="text-center">Predicted Demand</TableHead>
                    <TableHead className="text-center">Days to Stockout</TableHead>
                    <TableHead>Optimal Reorder Date</TableHead>
                    <TableHead className="text-center">Suggested Qty</TableHead>
                    <TableHead className="text-center">Confidence</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPredictiveReorder.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell className={cn(
                        "text-center font-medium",
                        item.daysUntilStockout < 7 && "text-red-600"
                      )}>
                        {item.currentStock}
                      </TableCell>
                      <TableCell className="text-center">{item.predictedDemand}/mo</TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn(
                          item.daysUntilStockout < 7 ? "bg-red-500" :
                          item.daysUntilStockout < 14 ? "bg-amber-500" : "bg-green-500"
                        )}>
                          {item.daysUntilStockout} days
                        </Badge>
                      </TableCell>
                      <TableCell>{item.optimalReorderDate}</TableCell>
                      <TableCell className="text-center font-semibold">{item.suggestedQty}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={item.confidence} className="h-2 w-12" />
                          <span className="text-sm">{item.confidence}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" data-testid={`button-create-po-${item.id}`}>
                          Create PO
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 grid md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-4 w-4" />
                      Model Accuracy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-green-600">94.2%</p>
                    <p className="text-sm text-muted-foreground">Last 30 days</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Stockouts Prevented</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">12</p>
                    <p className="text-sm text-muted-foreground">This month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Cost Savings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-green-600">$18,500</p>
                    <p className="text-sm text-muted-foreground">Reduced carrying costs</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demand" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                AI Demand Forecasting
              </CardTitle>
              <CardDescription>6-month demand predictions based on historical patterns and seasonality</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Current</TableHead>
                    <TableHead className="text-center">+1 Mo</TableHead>
                    <TableHead className="text-center">+2 Mo</TableHead>
                    <TableHead className="text-center">+3 Mo</TableHead>
                    <TableHead className="text-center">+4 Mo</TableHead>
                    <TableHead className="text-center">+5 Mo</TableHead>
                    <TableHead className="text-center">+6 Mo</TableHead>
                    <TableHead className="text-center">Pattern</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockDemandForecast.map((product) => (
                    <TableRow key={product.productId}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-center">{product.currentMonth}</TableCell>
                      <TableCell className={cn(
                        "text-center",
                        product.month1 > product.currentMonth ? "text-green-600" : 
                        product.month1 < product.currentMonth ? "text-red-600" : ""
                      )}>
                        {product.month1}
                      </TableCell>
                      <TableCell className={cn(
                        "text-center",
                        product.month2 > product.month1 ? "text-green-600" : 
                        product.month2 < product.month1 ? "text-red-600" : ""
                      )}>
                        {product.month2}
                      </TableCell>
                      <TableCell className={cn(
                        "text-center",
                        product.month3 > product.month2 ? "text-green-600" : 
                        product.month3 < product.month2 ? "text-red-600" : ""
                      )}>
                        {product.month3}
                      </TableCell>
                      <TableCell className={cn(
                        "text-center",
                        product.month4 > product.month3 ? "text-green-600" : 
                        product.month4 < product.month3 ? "text-red-600" : ""
                      )}>
                        {product.month4}
                      </TableCell>
                      <TableCell className={cn(
                        "text-center",
                        product.month5 > product.month4 ? "text-green-600" : 
                        product.month5 < product.month4 ? "text-red-600" : ""
                      )}>
                        {product.month5}
                      </TableCell>
                      <TableCell className={cn(
                        "text-center",
                        product.month6 > product.month5 ? "text-green-600" : 
                        product.month6 < product.month5 ? "text-red-600" : ""
                      )}>
                        {product.month6}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn(
                          product.seasonality === "growing" && "border-green-500 text-green-600",
                          product.seasonality === "seasonal-high" && "border-amber-500 text-amber-600",
                          product.seasonality === "variable" && "border-purple-500 text-purple-600"
                        )}>
                          {product.seasonality}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Historical Sales Trend
                </h4>
                <div className="h-48 flex items-end gap-1">
                  {mockHistoricalSales.map((month, index) => {
                    const maxRevenue = Math.max(...mockHistoricalSales.map(m => m.revenue));
                    const height = (month.revenue / maxRevenue) * 100;
                    return (
                      <div key={month.month} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                          style={{ height: `${height}%` }}
                          title={`${month.month}: $${month.revenue.toLocaleString()}`}
                        />
                        <span className="text-xs text-muted-foreground mt-1 rotate-45 origin-left">
                          {month.month.slice(0, 3)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
