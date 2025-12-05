import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  BarChart3,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  mockSalespersonPerformance,
  mockCustomerRanking,
  mockSalesForecast,
  mockSalesPipeline,
  mockOrderFulfillment,
} from "@/lib/reportData";
import { cn } from "@/lib/utils";

export function SalesReports() {
  const [activeTab, setActiveTab] = useState("performance");

  const totalQuota = mockSalespersonPerformance.reduce((sum, sp) => sum + sp.quota, 0);
  const totalAchieved = mockSalespersonPerformance.reduce((sum, sp) => sum + sp.achieved, 0);
  const overallAttainment = (totalAchieved / totalQuota) * 100;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="performance" data-testid="tab-performance">Performance</TabsTrigger>
          <TabsTrigger value="customers" data-testid="tab-customers">Customers</TabsTrigger>
          <TabsTrigger value="forecast" data-testid="tab-forecast">Forecast</TabsTrigger>
          <TabsTrigger value="pipeline" data-testid="tab-pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="fulfillment" data-testid="tab-fulfillment">Fulfillment</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-4 gap-4">
            <Card data-testid="card-total-quota">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Quota</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold" data-testid="text-total-quota">${totalQuota.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card data-testid="card-total-achieved">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Achieved</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-green-600 dark:text-green-400" data-testid="text-total-achieved">
                  ${totalAchieved.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card data-testid="card-attainment">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Attainment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={cn(
                  "text-2xl font-semibold",
                  overallAttainment >= 100 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
                )} data-testid="text-attainment">
                  {overallAttainment.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
            <Card data-testid="card-win-rate">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Avg Win Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold" data-testid="text-win-rate">
                  {(mockSalespersonPerformance.reduce((sum, sp) => sum + sp.winRate, 0) / mockSalespersonPerformance.length).toFixed(0)}%
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Salesperson Performance
              </CardTitle>
              <CardDescription>Quota attainment and key metrics by salesperson</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Salesperson</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead className="text-right">Quota</TableHead>
                    <TableHead className="text-right">Achieved</TableHead>
                    <TableHead className="text-center">Attainment</TableHead>
                    <TableHead className="text-center">Orders</TableHead>
                    <TableHead className="text-center">Customers</TableHead>
                    <TableHead className="text-right">Avg Order</TableHead>
                    <TableHead className="text-center">Win Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockSalespersonPerformance.map((sp) => {
                    const attainment = (sp.achieved / sp.quota) * 100;
                    return (
                      <TableRow key={sp.id} data-testid={`row-salesperson-${sp.id}`}>
                        <TableCell className="font-medium">{sp.name}</TableCell>
                        <TableCell>{sp.region}</TableCell>
                        <TableCell className="text-right">${sp.quota.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${sp.achieved.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={Math.min(attainment, 100)} className="h-2 w-16" />
                            <span className={cn(
                              "text-sm font-medium",
                              attainment >= 100 ? "text-green-600" : attainment >= 80 ? "text-amber-600" : "text-red-600"
                            )}>
                              {attainment.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{sp.orders}</TableCell>
                        <TableCell className="text-center">{sp.customers}</TableCell>
                        <TableCell className="text-right">${sp.avgOrderValue.toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={sp.winRate >= 70 ? "default" : "secondary"}>
                            {sp.winRate}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Ranking by Revenue
              </CardTitle>
              <CardDescription>Top customers sorted by total revenue contribution</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-center">Orders</TableHead>
                    <TableHead className="text-right">Avg Order</TableHead>
                    <TableHead>Last Order</TableHead>
                    <TableHead className="text-center">Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCustomerRanking
                    .sort((a, b) => b.revenue - a.revenue)
                    .map((customer, index) => (
                      <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                        <TableCell>
                          <Badge variant={index < 3 ? "default" : "outline"}>
                            #{index + 1}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{customer.segment}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${customer.revenue.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">{customer.orders}</TableCell>
                        <TableCell className="text-right">${customer.avgOrderValue.toLocaleString()}</TableCell>
                        <TableCell>{customer.lastOrder}</TableCell>
                        <TableCell className="text-center">
                          <div className={cn(
                            "flex items-center justify-center gap-1",
                            customer.growthRate >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {customer.growthRate >= 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            {Math.abs(customer.growthRate)}%
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Sales Forecast (6 Months)
              </CardTitle>
              <CardDescription>AI-powered sales predictions with confidence intervals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockSalesForecast.map((forecast, index) => (
                  <div key={forecast.month} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{forecast.month}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          Range: ${forecast.lowerBound.toLocaleString()} - ${forecast.upperBound.toLocaleString()}
                        </span>
                        <Badge variant="outline">{forecast.confidence}% confidence</Badge>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="h-8 bg-muted rounded-md overflow-hidden relative">
                        <div
                          className="absolute h-full bg-blue-200 dark:bg-blue-900/50"
                          style={{
                            left: `${(forecast.lowerBound / forecast.upperBound) * 80}%`,
                            width: `${((forecast.upperBound - forecast.lowerBound) / forecast.upperBound) * 80}%`,
                          }}
                        />
                        <div
                          className="absolute h-full w-1 bg-blue-600"
                          style={{ left: `${(forecast.predicted / forecast.upperBound) * 80}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-sm">
                        <span className="text-muted-foreground">$0</span>
                        <span className="font-semibold text-blue-600">${forecast.predicted.toLocaleString()}</span>
                        <span className="text-muted-foreground">${(forecast.upperBound * 1.25).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Sales Pipeline
              </CardTitle>
              <CardDescription>Lead to order conversion funnel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockSalesPipeline.map((stage, index) => {
                  const maxValue = mockSalesPipeline[0].value;
                  const width = (stage.value / maxValue) * 100;
                  const isLast = index === mockSalesPipeline.length - 1;

                  return (
                    <div key={stage.stage} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{stage.stage}</span>
                          <Badge variant="secondary">{stage.count} opportunities</Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold">${stage.value.toLocaleString()}</span>
                          {!isLast && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <ArrowRight className="h-4 w-4" />
                              <span>{stage.conversionRate}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="h-10 bg-muted rounded-md overflow-hidden">
                        <div
                          className={cn(
                            "h-full flex items-center justify-center text-white font-medium transition-all",
                            isLast ? "bg-green-600" : "bg-blue-600"
                          )}
                          style={{ width: `${width}%` }}
                        >
                          {width > 20 && `$${stage.value.toLocaleString()}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-md">
                  <p className="text-sm text-muted-foreground">Total Pipeline Value</p>
                  <p className="text-2xl font-semibold">
                    ${mockSalesPipeline.reduce((sum, s) => sum + s.value, 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 border rounded-md">
                  <p className="text-sm text-muted-foreground">Weighted Pipeline</p>
                  <p className="text-2xl font-semibold">
                    ${mockSalesPipeline.reduce((sum, s) => sum + (s.value * s.conversionRate / 100), 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 border rounded-md">
                  <p className="text-sm text-muted-foreground">Overall Conversion</p>
                  <p className="text-2xl font-semibold">
                    {((mockSalesPipeline[4].count / mockSalesPipeline[0].count) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fulfillment" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Avg Fulfillment Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                  {(mockOrderFulfillment.reduce((sum, m) => sum + m.fulfillmentRate, 0) / mockOrderFulfillment.length).toFixed(1)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Orders (6 mo)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {mockOrderFulfillment.reduce((sum, m) => sum + m.totalOrders, 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Late Deliveries</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
                  {mockOrderFulfillment.reduce((sum, m) => sum + m.late, 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Order Fulfillment Rate
              </CardTitle>
              <CardDescription>Monthly delivery performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-center">Total Orders</TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        On Time
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="h-4 w-4 text-amber-600" />
                        Late
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Cancelled
                      </div>
                    </TableHead>
                    <TableHead className="text-center">Fulfillment Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockOrderFulfillment.map((month) => (
                    <TableRow key={month.month}>
                      <TableCell className="font-medium">{month.month}</TableCell>
                      <TableCell className="text-center">{month.totalOrders}</TableCell>
                      <TableCell className="text-center text-green-600">{month.onTime}</TableCell>
                      <TableCell className="text-center text-amber-600">{month.late}</TableCell>
                      <TableCell className="text-center text-red-600">{month.cancelled}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={month.fulfillmentRate} className="h-2 w-16" />
                          <span className={cn(
                            "font-medium",
                            month.fulfillmentRate >= 95 ? "text-green-600" : "text-amber-600"
                          )}>
                            {month.fulfillmentRate}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
