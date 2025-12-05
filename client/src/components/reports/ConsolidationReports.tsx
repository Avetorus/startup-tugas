import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Building2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  FileText,
  Download,
  Filter,
  ChevronRight,
  ChevronDown,
  Minus,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
interface LocalCompany {
  id: string;
  name: string;
  code: string;
  currency: string;
  companyType: string;
  path: string;
  parentId: string | null;
}
import { cn } from "@/lib/utils";

interface ConsolidatedAccount {
  accountCode: string;
  accountName: string;
  accountType: string;
  level: number;
  isHeader: boolean;
  balances: Record<string, number>;
  consolidatedBalance: number;
  eliminationAmount: number;
  netBalance: number;
}

interface ConsolidatedFinancials {
  companies: LocalCompany[];
  accounts: ConsolidatedAccount[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  intercompanyEliminations: number;
}

interface EliminationEntry {
  id: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  sourceCompanyId: string;
  targetCompanyId: string;
  eliminationType: string;
}

const mockConsolidatedData: ConsolidatedFinancials = {
  companies: [
    { id: "comp-holding", name: "Unanza Holdings", code: "HOLD", currency: "USD", companyType: "holding", path: "HOLD", parentId: null },
    { id: "comp-us", name: "Unanza USA", code: "USA", currency: "USD", companyType: "subsidiary", path: "HOLD.USA", parentId: "comp-holding" },
    { id: "comp-eu", name: "Unanza Europe", code: "EU", currency: "EUR", companyType: "subsidiary", path: "HOLD.EU", parentId: "comp-holding" },
  ],
  accounts: [
    { accountCode: "1000", accountName: "Assets", accountType: "asset", level: 1, isHeader: true, balances: {}, consolidatedBalance: 0, eliminationAmount: 0, netBalance: 0 },
    { accountCode: "1100", accountName: "Current Assets", accountType: "asset", level: 2, isHeader: true, balances: {}, consolidatedBalance: 0, eliminationAmount: 0, netBalance: 0 },
    { accountCode: "1110", accountName: "Cash and Equivalents", accountType: "asset", level: 3, isHeader: false, balances: { "comp-holding": 500000, "comp-us": 350000, "comp-eu": 280000 }, consolidatedBalance: 1130000, eliminationAmount: 0, netBalance: 1130000 },
    { accountCode: "1120", accountName: "Accounts Receivable", accountType: "asset", level: 3, isHeader: false, balances: { "comp-holding": 120000, "comp-us": 450000, "comp-eu": 380000 }, consolidatedBalance: 950000, eliminationAmount: -85000, netBalance: 865000 },
    { accountCode: "1130", accountName: "Inventory", accountType: "asset", level: 3, isHeader: false, balances: { "comp-holding": 0, "comp-us": 780000, "comp-eu": 620000 }, consolidatedBalance: 1400000, eliminationAmount: -45000, netBalance: 1355000 },
    { accountCode: "1500", accountName: "Non-Current Assets", accountType: "asset", level: 2, isHeader: true, balances: {}, consolidatedBalance: 0, eliminationAmount: 0, netBalance: 0 },
    { accountCode: "1510", accountName: "Property & Equipment", accountType: "asset", level: 3, isHeader: false, balances: { "comp-holding": 2500000, "comp-us": 1800000, "comp-eu": 1200000 }, consolidatedBalance: 5500000, eliminationAmount: 0, netBalance: 5500000 },
    { accountCode: "1520", accountName: "Investment in Subsidiaries", accountType: "asset", level: 3, isHeader: false, balances: { "comp-holding": 3500000, "comp-us": 0, "comp-eu": 0 }, consolidatedBalance: 3500000, eliminationAmount: -3500000, netBalance: 0 },
    { accountCode: "2000", accountName: "Liabilities", accountType: "liability", level: 1, isHeader: true, balances: {}, consolidatedBalance: 0, eliminationAmount: 0, netBalance: 0 },
    { accountCode: "2100", accountName: "Current Liabilities", accountType: "liability", level: 2, isHeader: true, balances: {}, consolidatedBalance: 0, eliminationAmount: 0, netBalance: 0 },
    { accountCode: "2110", accountName: "Accounts Payable", accountType: "liability", level: 3, isHeader: false, balances: { "comp-holding": 80000, "comp-us": 320000, "comp-eu": 290000 }, consolidatedBalance: 690000, eliminationAmount: -85000, netBalance: 605000 },
    { accountCode: "2120", accountName: "Intercompany Payable", accountType: "liability", level: 3, isHeader: false, balances: { "comp-holding": 0, "comp-us": 150000, "comp-eu": 100000 }, consolidatedBalance: 250000, eliminationAmount: -250000, netBalance: 0 },
    { accountCode: "3000", accountName: "Equity", accountType: "equity", level: 1, isHeader: true, balances: {}, consolidatedBalance: 0, eliminationAmount: 0, netBalance: 0 },
    { accountCode: "3100", accountName: "Share Capital", accountType: "equity", level: 2, isHeader: false, balances: { "comp-holding": 5000000, "comp-us": 2000000, "comp-eu": 1500000 }, consolidatedBalance: 8500000, eliminationAmount: -3500000, netBalance: 5000000 },
    { accountCode: "3200", accountName: "Retained Earnings", accountType: "equity", level: 2, isHeader: false, balances: { "comp-holding": 1540000, "comp-us": 910000, "comp-eu": 595000 }, consolidatedBalance: 3045000, eliminationAmount: 0, netBalance: 3045000 },
    { accountCode: "4000", accountName: "Revenue", accountType: "revenue", level: 1, isHeader: true, balances: {}, consolidatedBalance: 0, eliminationAmount: 0, netBalance: 0 },
    { accountCode: "4100", accountName: "Sales Revenue", accountType: "revenue", level: 2, isHeader: false, balances: { "comp-holding": 0, "comp-us": 4500000, "comp-eu": 3200000 }, consolidatedBalance: 7700000, eliminationAmount: -320000, netBalance: 7380000 },
    { accountCode: "4200", accountName: "Service Revenue", accountType: "revenue", level: 2, isHeader: false, balances: { "comp-holding": 500000, "comp-us": 800000, "comp-eu": 450000 }, consolidatedBalance: 1750000, eliminationAmount: -180000, netBalance: 1570000 },
    { accountCode: "5000", accountName: "Expenses", accountType: "expense", level: 1, isHeader: true, balances: {}, consolidatedBalance: 0, eliminationAmount: 0, netBalance: 0 },
    { accountCode: "5100", accountName: "Cost of Goods Sold", accountType: "expense", level: 2, isHeader: false, balances: { "comp-holding": 0, "comp-us": 2700000, "comp-eu": 1920000 }, consolidatedBalance: 4620000, eliminationAmount: -275000, netBalance: 4345000 },
    { accountCode: "5200", accountName: "Operating Expenses", accountType: "expense", level: 2, isHeader: false, balances: { "comp-holding": 400000, "comp-us": 1200000, "comp-eu": 850000 }, consolidatedBalance: 2450000, eliminationAmount: -225000, netBalance: 2225000 },
  ],
  totalAssets: 8850000,
  totalLiabilities: 605000,
  totalEquity: 8045000,
  totalRevenue: 8950000,
  totalExpenses: 6570000,
  netIncome: 2380000,
  intercompanyEliminations: 4465000,
};

const mockEliminations: EliminationEntry[] = [
  { id: "elim-1", description: "Eliminate intercompany receivable/payable - US to EU", debitAccount: "2110", creditAccount: "1120", amount: 85000, sourceCompanyId: "comp-us", targetCompanyId: "comp-eu", eliminationType: "receivable_payable" },
  { id: "elim-2", description: "Eliminate intercompany payables", debitAccount: "2120", creditAccount: "2120", amount: 250000, sourceCompanyId: "comp-us", targetCompanyId: "comp-eu", eliminationType: "intercompany_balance" },
  { id: "elim-3", description: "Eliminate investment in subsidiaries", debitAccount: "3100", creditAccount: "1520", amount: 3500000, sourceCompanyId: "comp-holding", targetCompanyId: "comp-us", eliminationType: "investment_equity" },
  { id: "elim-4", description: "Eliminate intercompany sales", debitAccount: "4100", creditAccount: "5100", amount: 320000, sourceCompanyId: "comp-us", targetCompanyId: "comp-eu", eliminationType: "intercompany_sales" },
  { id: "elim-5", description: "Eliminate intercompany services", debitAccount: "4200", creditAccount: "5200", amount: 180000, sourceCompanyId: "comp-holding", targetCompanyId: "comp-us", eliminationType: "intercompany_services" },
  { id: "elim-6", description: "Eliminate unrealized profit in inventory", debitAccount: "5100", creditAccount: "1130", amount: 45000, sourceCompanyId: "comp-us", targetCompanyId: "comp-eu", eliminationType: "unrealized_profit" },
];

const eliminationTypeColors: Record<string, string> = {
  receivable_payable: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  intercompany_balance: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  investment_equity: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  intercompany_sales: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  intercompany_services: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  unrealized_profit: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

interface HierarchyRowProps {
  account: ConsolidatedAccount;
  companies: LocalCompany[];
  isExpanded: boolean;
  onToggle: () => void;
  hasChildren: boolean;
}

function HierarchyRow({ account, companies, isExpanded, onToggle, hasChildren }: HierarchyRowProps) {
  const indent = (account.level - 1) * 20;

  return (
    <TableRow 
      className={cn(
        account.isHeader && "bg-muted/50 font-semibold",
        !account.isHeader && "hover-elevate"
      )}
      data-testid={`row-account-${account.accountCode}`}
    >
      <TableCell style={{ paddingLeft: `${indent + 16}px` }}>
        <div className="flex items-center gap-2">
          {hasChildren ? (
            <button onClick={onToggle} className="p-0.5 rounded hover:bg-accent">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="w-5" />
          )}
          <span>{account.accountCode}</span>
        </div>
      </TableCell>
      <TableCell className={cn(account.isHeader && "font-semibold")}>
        {account.accountName}
      </TableCell>
      {companies.map((company) => (
        <TableCell key={company.id} className="text-right font-mono">
          {account.balances[company.id] !== undefined ? (
            account.balances[company.id].toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
            })
          ) : (
            "-"
          )}
        </TableCell>
      ))}
      <TableCell className="text-right font-mono font-semibold">
        {account.consolidatedBalance > 0 ? (
          account.consolidatedBalance.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
          })
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell className="text-right font-mono text-destructive">
        {account.eliminationAmount !== 0 ? (
          <>
            ({Math.abs(account.eliminationAmount).toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
            })})
          </>
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell className="text-right font-mono font-bold">
        {account.netBalance > 0 ? (
          account.netBalance.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
          })
        ) : (
          "-"
        )}
      </TableCell>
    </TableRow>
  );
}

export function ConsolidationReports() {
  const { toast } = useToast();
  const [period, setPeriod] = useState("2024-12");
  const [consolidationScope, setConsolidationScope] = useState("full");
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set(["1000", "2000", "3000", "4000", "5000"]));

  // In a real implementation, this would fetch from the API
  const consolidatedData = mockConsolidatedData;
  const eliminations = mockEliminations;

  const toggleAccount = (code: string) => {
    setExpandedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const visibleAccounts = consolidatedData.accounts.filter((account) => {
    // Always show level 1 accounts
    if (account.level === 1) return true;
    
    // Find parent account
    const parentCode = account.accountCode.substring(0, (account.level - 1) * 2 || 1) + "00".repeat(3 - account.level + 1);
    
    // Check if any ancestor is expanded
    for (let i = 1; i < account.level; i++) {
      const ancestorCode = account.accountCode.substring(0, i * 2 || 1) + "00".repeat(3 - i);
      if (!expandedAccounts.has(ancestorCode)) {
        return false;
      }
    }
    return true;
  });

  const hasChildren = (code: string, level: number): boolean => {
    return consolidatedData.accounts.some(
      (a) => a.level === level + 1 && a.accountCode.startsWith(code.substring(0, level * 2 || 1))
    );
  };

  const handleExport = () => {
    toast({ title: "Exporting consolidated report..." });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            Consolidation Reports
          </h1>
          <p className="text-muted-foreground">
            Consolidated financial statements with elimination entries
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]" data-testid="select-period">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-12">Dec 2024</SelectItem>
              <SelectItem value="2024-11">Nov 2024</SelectItem>
              <SelectItem value="2024-10">Oct 2024</SelectItem>
              <SelectItem value="2024-Q4">Q4 2024</SelectItem>
              <SelectItem value="2024">FY 2024</SelectItem>
            </SelectContent>
          </Select>
          <Select value={consolidationScope} onValueChange={setConsolidationScope}>
            <SelectTrigger className="w-[180px]" data-testid="select-scope">
              <SelectValue placeholder="Scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Full Consolidation</SelectItem>
              <SelectItem value="proportional">Proportional</SelectItem>
              <SelectItem value="equity">Equity Method</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport} data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Consolidated Assets
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-assets">
              ${(consolidatedData.totalAssets / 1000000).toFixed(2)}M
            </div>
            <p className="text-xs text-muted-foreground">
              After eliminations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Consolidated Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              ${(consolidatedData.totalRevenue / 1000000).toFixed(2)}M
            </div>
            <p className="text-xs text-muted-foreground">
              Excluding intercompany
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Income
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-net-income">
              ${(consolidatedData.netIncome / 1000000).toFixed(2)}M
            </div>
            <p className="text-xs text-muted-foreground">
              Consolidated profit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              IC Eliminations
            </CardTitle>
            <Calculator className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="text-eliminations">
              ${(consolidatedData.intercompanyEliminations / 1000000).toFixed(2)}M
            </div>
            <p className="text-xs text-muted-foreground">
              Total eliminated
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trial-balance" className="space-y-4">
        <TabsList data-testid="tabs-view-selector">
          <TabsTrigger value="trial-balance" data-testid="tab-trial-balance">
            <FileText className="h-4 w-4 mr-2" />
            Consolidated Trial Balance
          </TabsTrigger>
          <TabsTrigger value="eliminations" data-testid="tab-eliminations">
            <Minus className="h-4 w-4 mr-2" />
            Elimination Entries
          </TabsTrigger>
          <TabsTrigger value="hierarchy" data-testid="tab-hierarchy">
            <PieChart className="h-4 w-4 mr-2" />
            By Entity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trial-balance">
          <Card>
            <CardHeader>
              <CardTitle>Consolidated Trial Balance</CardTitle>
              <CardDescription>
                Combined financial position across all entities with eliminations
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table data-testid="table-trial-balance">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Code</TableHead>
                    <TableHead>Account</TableHead>
                    {consolidatedData.companies.map((company) => (
                      <TableHead key={company.id} className="text-right">
                        {company.code}
                      </TableHead>
                    ))}
                    <TableHead className="text-right">Consolidated</TableHead>
                    <TableHead className="text-right">Eliminations</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleAccounts.map((account) => (
                    <HierarchyRow
                      key={account.accountCode}
                      account={account}
                      companies={consolidatedData.companies}
                      isExpanded={expandedAccounts.has(account.accountCode)}
                      onToggle={() => toggleAccount(account.accountCode)}
                      hasChildren={hasChildren(account.accountCode, account.level)}
                    />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eliminations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Inter-Company Elimination Entries
              </CardTitle>
              <CardDescription>
                Adjustments to remove inter-company transactions from consolidated statements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table data-testid="table-eliminations">
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Dr Account</TableHead>
                    <TableHead>Cr Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Companies</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eliminations.map((entry) => {
                    const sourceCompany = consolidatedData.companies.find(
                      (c) => c.id === entry.sourceCompanyId
                    );
                    const targetCompany = consolidatedData.companies.find(
                      (c) => c.id === entry.targetCompanyId
                    );
                    return (
                      <TableRow key={entry.id} data-testid={`row-elimination-${entry.id}`}>
                        <TableCell className="font-medium">
                          {entry.description}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary"
                            className={eliminationTypeColors[entry.eliminationType]}
                          >
                            {entry.eliminationType.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">{entry.debitAccount}</TableCell>
                        <TableCell className="font-mono">{entry.creditAccount}</TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.amount.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                            minimumFractionDigits: 0,
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline">{sourceCompany?.code}</Badge>
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            <Badge variant="outline">{targetCompany?.code}</Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="mt-4 p-4 bg-muted rounded-md">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Eliminations</span>
                  <span className="text-xl font-bold font-mono" data-testid="text-total-eliminations">
                    {eliminations
                      .reduce((sum, e) => sum + e.amount, 0)
                      .toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 0,
                      })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hierarchy">
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary by Entity</CardTitle>
              <CardDescription>
                Individual company contributions to consolidated results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table data-testid="table-by-entity">
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Assets</TableHead>
                    <TableHead className="text-right">Liabilities</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Net Income</TableHead>
                    <TableHead className="text-right">% of Group</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consolidatedData.companies.map((company) => {
                    const assets = consolidatedData.accounts
                      .filter((a) => a.accountType === "asset" && !a.isHeader)
                      .reduce((sum, a) => sum + (a.balances[company.id] || 0), 0);
                    const liabilities = consolidatedData.accounts
                      .filter((a) => a.accountType === "liability" && !a.isHeader)
                      .reduce((sum, a) => sum + (a.balances[company.id] || 0), 0);
                    const revenue = consolidatedData.accounts
                      .filter((a) => a.accountType === "revenue" && !a.isHeader)
                      .reduce((sum, a) => sum + (a.balances[company.id] || 0), 0);
                    const expenses = consolidatedData.accounts
                      .filter((a) => a.accountType === "expense" && !a.isHeader)
                      .reduce((sum, a) => sum + (a.balances[company.id] || 0), 0);
                    const netIncome = revenue - expenses;
                    const groupPct = (netIncome / consolidatedData.netIncome) * 100;

                    return (
                      <TableRow key={company.id} data-testid={`row-entity-${company.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{company.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{company.companyType}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${(assets / 1000000).toFixed(2)}M
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${(liabilities / 1000000).toFixed(2)}M
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${(revenue / 1000000).toFixed(2)}M
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${(netIncome / 1000000).toFixed(2)}M
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={groupPct > 0 ? "default" : "secondary"}>
                            {groupPct.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={2}>Group Total (After Eliminations)</TableCell>
                    <TableCell className="text-right font-mono">
                      ${(consolidatedData.totalAssets / 1000000).toFixed(2)}M
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${(consolidatedData.totalLiabilities / 1000000).toFixed(2)}M
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${(consolidatedData.totalRevenue / 1000000).toFixed(2)}M
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${(consolidatedData.netIncome / 1000000).toFixed(2)}M
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge>100%</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
