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
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  FileText,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import {
  mockProfitLoss,
  mockBalanceSheet,
  mockCashFlow,
  mockProductProfitability,
  mockARAgingReport,
  mockAPAgingReport,
  mockFinancialRatios,
  mockVATReport,
  mockTrialBalance,
} from "@/lib/reportData";
import { cn } from "@/lib/utils";

export function FinanceReports() {
  const [activeTab, setActiveTab] = useState("pnl");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="pnl" data-testid="tab-pnl">P&L</TabsTrigger>
          <TabsTrigger value="balance" data-testid="tab-balance">Balance Sheet</TabsTrigger>
          <TabsTrigger value="cashflow" data-testid="tab-cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="aging" data-testid="tab-aging">AR/AP Aging</TabsTrigger>
          <TabsTrigger value="ratios" data-testid="tab-ratios">Ratios</TabsTrigger>
        </TabsList>

        <TabsContent value="pnl" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-4 gap-4">
            <Card data-testid="card-total-revenue">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-green-600 dark:text-green-400" data-testid="text-total-revenue">
                  ${mockProfitLoss.revenue.totalRevenue.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card data-testid="card-gross-profit">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Gross Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold" data-testid="text-gross-profit">
                  ${mockProfitLoss.grossProfit.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">{mockProfitLoss.grossMargin}% margin</p>
              </CardContent>
            </Card>
            <Card data-testid="card-operating-income">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Operating Income</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold" data-testid="text-operating-income">
                  ${mockProfitLoss.operatingIncome.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card data-testid="card-net-income">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Net Income</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={cn(
                  "text-2xl font-semibold",
                  mockProfitLoss.netIncome >= 0 ? "text-green-600" : "text-red-600"
                )} data-testid="text-net-income">
                  ${mockProfitLoss.netIncome.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">{mockProfitLoss.netMargin}% margin</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Profit & Loss Statement
              </CardTitle>
              <CardDescription>{mockProfitLoss.period}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="font-semibold py-2 border-b">Revenue</div>
                <div className="flex justify-between py-1 pl-4">
                  <span>Product Sales</span>
                  <span>${mockProfitLoss.revenue.productSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 pl-4">
                  <span>Service Revenue</span>
                  <span>${mockProfitLoss.revenue.serviceRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 pl-4">
                  <span>Other Income</span>
                  <span>${mockProfitLoss.revenue.otherIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 font-semibold border-t bg-muted/50 px-2 rounded">
                  <span>Total Revenue</span>
                  <span>${mockProfitLoss.revenue.totalRevenue.toLocaleString()}</span>
                </div>

                <div className="font-semibold py-2 border-b mt-4">Cost of Sales</div>
                <div className="flex justify-between py-1 pl-4">
                  <span>Materials</span>
                  <span>${mockProfitLoss.costOfSales.materials.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 pl-4">
                  <span>Direct Labor</span>
                  <span>${mockProfitLoss.costOfSales.directLabor.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 pl-4">
                  <span>Overhead</span>
                  <span>${mockProfitLoss.costOfSales.overhead.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 font-semibold border-t bg-muted/50 px-2 rounded">
                  <span>Total COGS</span>
                  <span>${mockProfitLoss.costOfSales.totalCOGS.toLocaleString()}</span>
                </div>

                <div className="flex justify-between py-3 font-bold text-lg border-y mt-4 bg-green-50 dark:bg-green-900/20 px-2 rounded">
                  <span>Gross Profit</span>
                  <span>${mockProfitLoss.grossProfit.toLocaleString()} ({mockProfitLoss.grossMargin}%)</span>
                </div>

                <div className="font-semibold py-2 border-b mt-4">Operating Expenses</div>
                <div className="flex justify-between py-1 pl-4">
                  <span>Salaries & Wages</span>
                  <span>${mockProfitLoss.operatingExpenses.salaries.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 pl-4">
                  <span>Rent</span>
                  <span>${mockProfitLoss.operatingExpenses.rent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 pl-4">
                  <span>Utilities</span>
                  <span>${mockProfitLoss.operatingExpenses.utilities.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 pl-4">
                  <span>Marketing</span>
                  <span>${mockProfitLoss.operatingExpenses.marketing.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 pl-4">
                  <span>Depreciation</span>
                  <span>${mockProfitLoss.operatingExpenses.depreciation.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 pl-4">
                  <span>Other Expenses</span>
                  <span>${mockProfitLoss.operatingExpenses.other.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 font-semibold border-t bg-muted/50 px-2 rounded">
                  <span>Total Operating Expenses</span>
                  <span>${mockProfitLoss.operatingExpenses.totalOpex.toLocaleString()}</span>
                </div>

                <div className="flex justify-between py-3 font-bold text-lg border-y mt-4 bg-blue-50 dark:bg-blue-900/20 px-2 rounded">
                  <span>Operating Income</span>
                  <span>${mockProfitLoss.operatingIncome.toLocaleString()}</span>
                </div>

                <div className="flex justify-between py-1 pl-4 mt-4">
                  <span>Interest Expense</span>
                  <span>(${mockProfitLoss.otherExpenses.interest.toLocaleString()})</span>
                </div>
                <div className="flex justify-between py-1 pl-4">
                  <span>Income Taxes</span>
                  <span>(${mockProfitLoss.otherExpenses.taxes.toLocaleString()})</span>
                </div>

                <div className={cn(
                  "flex justify-between py-3 font-bold text-lg border-y mt-4 px-2 rounded",
                  mockProfitLoss.netIncome >= 0 ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"
                )}>
                  <span>Net Income</span>
                  <span className={mockProfitLoss.netIncome >= 0 ? "text-green-600" : "text-red-600"}>
                    ${mockProfitLoss.netIncome.toLocaleString()} ({mockProfitLoss.netMargin}%)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Balance Sheet
              </CardTitle>
              <CardDescription>As of {mockBalanceSheet.asOfDate}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-lg mb-4 pb-2 border-b">ASSETS</h3>
                  
                  <div className="font-semibold py-2">Current Assets</div>
                  <div className="flex justify-between py-1 pl-4">
                    <span>Cash & Bank</span>
                    <span>${mockBalanceSheet.assets.current.cash.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 pl-4">
                    <span>Accounts Receivable</span>
                    <span>${mockBalanceSheet.assets.current.accountsReceivable.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 pl-4">
                    <span>Inventory</span>
                    <span>${mockBalanceSheet.assets.current.inventory.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 pl-4">
                    <span>Prepaid Expenses</span>
                    <span>${mockBalanceSheet.assets.current.prepaidExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 font-medium bg-muted/50 px-2 rounded">
                    <span>Total Current Assets</span>
                    <span>${mockBalanceSheet.assets.current.totalCurrent.toLocaleString()}</span>
                  </div>

                  <div className="font-semibold py-2 mt-4">Fixed Assets</div>
                  <div className="flex justify-between py-1 pl-4">
                    <span>Land</span>
                    <span>${mockBalanceSheet.assets.fixed.land.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 pl-4">
                    <span>Buildings (net)</span>
                    <span>${mockBalanceSheet.assets.fixed.buildings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 pl-4">
                    <span>Equipment (net)</span>
                    <span>${mockBalanceSheet.assets.fixed.equipment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 pl-4">
                    <span>Vehicles (net)</span>
                    <span>${mockBalanceSheet.assets.fixed.vehicles.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 pl-4">
                    <span>Furniture (net)</span>
                    <span>${mockBalanceSheet.assets.fixed.furniture.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 pl-4">
                    <span>Computers (net)</span>
                    <span>${mockBalanceSheet.assets.fixed.computers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 font-medium bg-muted/50 px-2 rounded">
                    <span>Total Fixed Assets</span>
                    <span>${mockBalanceSheet.assets.fixed.totalFixed.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-3 font-bold text-lg border-t mt-4 bg-blue-50 dark:bg-blue-900/20 px-2 rounded">
                    <span>TOTAL ASSETS</span>
                    <span>${mockBalanceSheet.assets.totalAssets.toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-4 pb-2 border-b">LIABILITIES & EQUITY</h3>
                  
                  <div className="font-semibold py-2">Current Liabilities</div>
                  <div className="flex justify-between py-1 pl-4">
                    <span>Accounts Payable</span>
                    <span>${mockBalanceSheet.liabilities.current.accountsPayable.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 pl-4">
                    <span>Accrued Expenses</span>
                    <span>${mockBalanceSheet.liabilities.current.accruedExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 pl-4">
                    <span>Taxes Payable</span>
                    <span>${mockBalanceSheet.liabilities.current.taxesPayable.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 pl-4">
                    <span>Other Current</span>
                    <span>${mockBalanceSheet.liabilities.current.otherCurrent.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 font-medium bg-muted/50 px-2 rounded">
                    <span>Total Current Liabilities</span>
                    <span>${mockBalanceSheet.liabilities.current.totalCurrent.toLocaleString()}</span>
                  </div>

                  <div className="font-semibold py-2 mt-4">Long-Term Liabilities</div>
                  <div className="flex justify-between py-1 pl-4">
                    <span>Bank Loans</span>
                    <span>${mockBalanceSheet.liabilities.longTerm.bankLoans.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 pl-4">
                    <span>Mortgage</span>
                    <span>${mockBalanceSheet.liabilities.longTerm.mortgage.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 pl-4">
                    <span>Equipment Loans</span>
                    <span>${mockBalanceSheet.liabilities.longTerm.equipmentLoans.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 font-medium bg-muted/50 px-2 rounded">
                    <span>Total Long-Term</span>
                    <span>${mockBalanceSheet.liabilities.longTerm.totalLongTerm.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-2 font-semibold border-t mt-2">
                    <span>TOTAL LIABILITIES</span>
                    <span>${mockBalanceSheet.liabilities.totalLiabilities.toLocaleString()}</span>
                  </div>

                  <div className="font-semibold py-2 mt-4">Equity</div>
                  <div className="flex justify-between py-1 pl-4">
                    <span>Common Stock</span>
                    <span>${mockBalanceSheet.equity.commonStock.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 pl-4">
                    <span>Additional Paid-in</span>
                    <span>${mockBalanceSheet.equity.additionalPaidIn.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 pl-4">
                    <span>Retained Earnings</span>
                    <span>${mockBalanceSheet.equity.retainedEarnings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 pl-4">
                    <span>Current Year</span>
                    <span className={mockBalanceSheet.equity.currentYearEarnings >= 0 ? "" : "text-red-600"}>
                      ${mockBalanceSheet.equity.currentYearEarnings.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 font-medium bg-muted/50 px-2 rounded">
                    <span>Total Equity</span>
                    <span>${mockBalanceSheet.equity.totalEquity.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-3 font-bold text-lg border-t mt-4 bg-purple-50 dark:bg-purple-900/20 px-2 rounded">
                    <span>TOTAL LIAB & EQUITY</span>
                    <span>${mockBalanceSheet.totalLiabilitiesAndEquity.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cash Flow Statement
              </CardTitle>
              <CardDescription>Monthly cash flow by activity type</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Operating</TableHead>
                    <TableHead className="text-right">Investing</TableHead>
                    <TableHead className="text-right">Financing</TableHead>
                    <TableHead className="text-right">Net Change</TableHead>
                    <TableHead className="text-right">Ending Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCashFlow.map((month) => (
                    <TableRow key={month.month}>
                      <TableCell className="font-medium">{month.month}</TableCell>
                      <TableCell className="text-right text-green-600">
                        +${month.operating.toLocaleString()}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right",
                        month.investing >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {month.investing >= 0 ? "+" : ""}${month.investing.toLocaleString()}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right",
                        month.financing >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {month.financing >= 0 ? "+" : ""}${month.financing.toLocaleString()}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-medium",
                        month.netChange >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {month.netChange >= 0 ? "+" : ""}${month.netChange.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${month.endingBalance.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aging" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <ArrowDown className="h-5 w-5" />
                  Accounts Receivable Aging
                </CardTitle>
                <CardDescription>Outstanding customer invoices by age</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockARAgingReport.map((aging) => (
                    <div key={aging.ageRange} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{aging.ageRange}</span>
                        <span className="font-medium">${aging.amount.toLocaleString()} ({aging.count})</span>
                      </div>
                      <div className="h-4 bg-muted rounded-md overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${aging.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between font-semibold">
                  <span>Total AR</span>
                  <span>${mockARAgingReport.reduce((sum, a) => sum + a.amount, 0).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <ArrowUp className="h-5 w-5" />
                  Accounts Payable Aging
                </CardTitle>
                <CardDescription>Outstanding vendor invoices by age</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockAPAgingReport.map((aging) => (
                    <div key={aging.ageRange} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{aging.ageRange}</span>
                        <span className="font-medium">${aging.amount.toLocaleString()} ({aging.count})</span>
                      </div>
                      <div className="h-4 bg-muted rounded-md overflow-hidden">
                        <div
                          className="h-full bg-red-500"
                          style={{ width: `${aging.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between font-semibold">
                  <span>Total AP</span>
                  <span>${mockAPAgingReport.reduce((sum, a) => sum + a.amount, 0).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ratios" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Liquidity Ratios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Ratio</span>
                  <span className="font-medium">{mockFinancialRatios.liquidity.currentRatio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quick Ratio</span>
                  <span className="font-medium">{mockFinancialRatios.liquidity.quickRatio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cash Ratio</span>
                  <span className="font-medium">{mockFinancialRatios.liquidity.cashRatio}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Profitability Ratios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gross Margin</span>
                  <span className="font-medium">{mockFinancialRatios.profitability.grossMargin}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Operating Margin</span>
                  <span className="font-medium">{mockFinancialRatios.profitability.operatingMargin}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Margin</span>
                  <span className={cn("font-medium", mockFinancialRatios.profitability.netMargin < 0 && "text-red-600")}>
                    {mockFinancialRatios.profitability.netMargin}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Efficiency Ratios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Inventory Turnover</span>
                  <span className="font-medium">{mockFinancialRatios.efficiency.inventoryTurnover}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">AR Turnover</span>
                  <span className="font-medium">{mockFinancialRatios.efficiency.receivablesTurnover}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asset Turnover</span>
                  <span className="font-medium">{mockFinancialRatios.efficiency.assetTurnover}x</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Leverage Ratios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Debt/Equity</span>
                  <span className="font-medium">{mockFinancialRatios.leverage.debtToEquity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Debt/Assets</span>
                  <span className="font-medium">{mockFinancialRatios.leverage.debtToAssets}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interest Coverage</span>
                  <span className="font-medium">{mockFinancialRatios.leverage.interestCoverage}x</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
