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
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  CheckCircle,
  Clock,
  Star,
} from "lucide-react";
import {
  mockInventoryAging,
  mockABCAnalysis,
  mockStockMovement,
  mockReorderRecommendations,
  mockStockAccuracy,
  mockSupplierPerformance,
} from "@/lib/reportData";
import { cn } from "@/lib/utils";

export function InventoryReports() {
  const [activeTab, setActiveTab] = useState("aging");

  const totalAgingValue = mockInventoryAging.reduce((sum, a) => sum + a.value, 0);
  const oldStockValue = mockInventoryAging.filter(a => a.ageRange.includes("90") || a.ageRange.includes("180")).reduce((sum, a) => sum + a.value, 0);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full max-w-4xl">
          <TabsTrigger value="aging" data-testid="tab-aging">Aging</TabsTrigger>
          <TabsTrigger value="abc" data-testid="tab-abc">ABC Analysis</TabsTrigger>
          <TabsTrigger value="movement" data-testid="tab-movement">Movement</TabsTrigger>
          <TabsTrigger value="reorder" data-testid="tab-reorder">Reorder</TabsTrigger>
          <TabsTrigger value="accuracy" data-testid="tab-accuracy">Accuracy</TabsTrigger>
          <TabsTrigger value="suppliers" data-testid="tab-suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="aging" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card data-testid="card-inventory-value">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Inventory Value</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold" data-testid="text-inventory-value">${totalAgingValue.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card data-testid="card-fresh-stock">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Fresh Stock (0-60 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-green-600 dark:text-green-400" data-testid="text-fresh-stock">68%</p>
              </CardContent>
            </Card>
            <Card data-testid="card-old-stock">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Old/Dead Stock (90+ days)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-red-600 dark:text-red-400" data-testid="text-old-stock">
                  ${oldStockValue.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Inventory Aging Report
              </CardTitle>
              <CardDescription>Stock age distribution to identify slow-moving inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockInventoryAging.map((aging) => {
                  const isOld = aging.ageRange.includes("90") || aging.ageRange.includes("180");
                  return (
                    <div key={aging.ageRange} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{aging.ageRange}</span>
                          {isOld && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">{aging.items} items</span>
                          <span className="font-semibold">${aging.value.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="h-6 bg-muted rounded-md overflow-hidden">
                        <div
                          className={cn(
                            "h-full flex items-center px-2 text-xs font-medium text-white",
                            isOld ? "bg-red-500" : aging.ageRange.includes("60") ? "bg-amber-500" : "bg-green-500"
                          )}
                          style={{ width: `${aging.percentage}%` }}
                        >
                          {aging.percentage}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="abc" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                ABC Analysis
              </CardTitle>
              <CardDescription>Inventory classification by value contribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                {mockABCAnalysis.map((category) => (
                  <Card key={category.category} className={cn(
                    "border-2",
                    category.category === "A" ? "border-green-500" :
                    category.category === "B" ? "border-amber-500" : "border-blue-500"
                  )}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl">Category {category.category}</CardTitle>
                        <Badge className={cn(
                          category.category === "A" ? "bg-green-500" :
                          category.category === "B" ? "bg-amber-500" : "bg-blue-500"
                        )}>
                          {category.valuePercentage}% value
                        </Badge>
                      </div>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Items</span>
                        <span className="font-medium">{category.items} ({category.percentage}%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Value</span>
                        <span className="font-medium">${category.value.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Value Share</span>
                        <span className="font-medium">{category.valuePercentage}%</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="p-4 bg-muted/50 rounded-md">
                <h4 className="font-medium mb-2">ABC Analysis Recommendations</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span><strong>Category A:</strong> Implement tight inventory control, frequent cycle counts, and maintain safety stock</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <span><strong>Category B:</strong> Use moderate controls, regular review cycles, and economic order quantities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                    <span><strong>Category C:</strong> Apply simple controls, bulk ordering, and periodic review system</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movement" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Stock Movement Summary
              </CardTitle>
              <CardDescription>Monthly inbound, outbound, and net stock changes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ArrowDownToLine className="h-4 w-4 text-green-600" />
                        Inbound
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ArrowUpFromLine className="h-4 w-4 text-blue-600" />
                        Outbound
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Adjustments</TableHead>
                    <TableHead className="text-right">Net Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockStockMovement.map((month) => (
                    <TableRow key={month.month}>
                      <TableCell className="font-medium">{month.month}</TableCell>
                      <TableCell className="text-right text-green-600">+{month.inbound.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-blue-600">-{month.outbound.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{month.adjustments}</TableCell>
                      <TableCell className={cn(
                        "text-right font-medium",
                        month.netChange >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {month.netChange >= 0 ? "+" : ""}{month.netChange.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 grid md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-md">
                  <p className="text-sm text-muted-foreground">Total Inbound</p>
                  <p className="text-xl font-semibold text-green-600">
                    +{mockStockMovement.reduce((sum, m) => sum + m.inbound, 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 border rounded-md">
                  <p className="text-sm text-muted-foreground">Total Outbound</p>
                  <p className="text-xl font-semibold text-blue-600">
                    -{mockStockMovement.reduce((sum, m) => sum + m.outbound, 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 border rounded-md">
                  <p className="text-sm text-muted-foreground">Total Adjustments</p>
                  <p className="text-xl font-semibold text-muted-foreground">
                    {mockStockMovement.reduce((sum, m) => sum + m.adjustments, 0)}
                  </p>
                </div>
                <div className="p-4 border rounded-md">
                  <p className="text-sm text-muted-foreground">Net Change</p>
                  <p className="text-xl font-semibold text-green-600">
                    +{mockStockMovement.reduce((sum, m) => sum + m.netChange, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reorder" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Reorder Recommendations
              </CardTitle>
              <CardDescription>AI-based suggestions for stock replenishment based on safety stock levels</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Priority</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Safety Stock</TableHead>
                    <TableHead className="text-right">Reorder Point</TableHead>
                    <TableHead className="text-right">Suggested Qty</TableHead>
                    <TableHead className="text-center">Lead Time</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockReorderRecommendations.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge className={cn(
                          item.priority === "critical" ? "bg-red-500" :
                          item.priority === "high" ? "bg-amber-500" :
                          item.priority === "medium" ? "bg-blue-500" : "bg-gray-500"
                        )}>
                          {item.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-medium",
                        item.currentStock < item.safetyStock ? "text-red-600" : ""
                      )}>
                        {item.currentStock}
                      </TableCell>
                      <TableCell className="text-right">{item.safetyStock}</TableCell>
                      <TableCell className="text-right">{item.reorderPoint}</TableCell>
                      <TableCell className="text-right font-semibold">{item.suggestedQty}</TableCell>
                      <TableCell className="text-center">{item.leadTime} days</TableCell>
                      <TableCell>
                        <Button size="sm" data-testid={`button-reorder-${item.id}`}>
                          Create PO
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accuracy" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Stock Accuracy Report
              </CardTitle>
              <CardDescription>Comparison between system records and physical counts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">System Qty</TableHead>
                    <TableHead className="text-right">Physical Qty</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead className="text-right">Variance %</TableHead>
                    <TableHead>Last Audit</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockStockAccuracy.map((location) => (
                    <TableRow key={location.location}>
                      <TableCell className="font-medium">{location.location}</TableCell>
                      <TableCell className="text-right">{location.systemQty.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{location.physicalQty.toLocaleString()}</TableCell>
                      <TableCell className={cn(
                        "text-right",
                        location.variance !== 0 ? "text-amber-600" : "text-green-600"
                      )}>
                        {location.variance > 0 ? "+" : ""}{location.variance}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right",
                        Math.abs(location.variancePercent) > 0.5 ? "text-amber-600" : "text-green-600"
                      )}>
                        {location.variancePercent > 0 ? "+" : ""}{location.variancePercent.toFixed(2)}%
                      </TableCell>
                      <TableCell>{location.lastAudit}</TableCell>
                      <TableCell className="text-center">
                        {Math.abs(location.variancePercent) < 1 ? (
                          <Badge className="bg-green-500">Accurate</Badge>
                        ) : (
                          <Badge className="bg-amber-500">Review</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 p-4 bg-muted/50 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Overall Stock Accuracy</p>
                    <p className="text-sm text-muted-foreground">Based on latest cycle count audit</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-semibold text-green-600">99.7%</p>
                    <p className="text-sm text-muted-foreground">Target: 99.5%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Supplier Performance
              </CardTitle>
              <CardDescription>Vendor evaluation based on delivery, quality, and pricing</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-center">On-Time Rate</TableHead>
                    <TableHead className="text-center">Quality Score</TableHead>
                    <TableHead className="text-center">Avg Lead Time</TableHead>
                    <TableHead className="text-center">Price Score</TableHead>
                    <TableHead className="text-center">Overall Score</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockSupplierPerformance.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={supplier.onTimeRate} className="h-2 w-12" />
                          <span>{supplier.onTimeRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={supplier.qualityScore} className="h-2 w-12" />
                          <span>{supplier.qualityScore}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{supplier.avgLeadTime} days</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={supplier.priceCompetitiveness} className="h-2 w-12" />
                          <span>{supplier.priceCompetitiveness}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          "font-semibold",
                          supplier.overallScore >= 90 ? "text-green-600" :
                          supplier.overallScore >= 80 ? "text-amber-600" : "text-red-600"
                        )}>
                          {supplier.overallScore}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-4 w-4",
                                i < Math.round(supplier.overallScore / 20) ? "fill-amber-400 text-amber-400" : "text-muted"
                              )}
                            />
                          ))}
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
