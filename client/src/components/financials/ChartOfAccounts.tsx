import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Download,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  FileText,
  Layers,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMockData } from "@/lib/MockDataContext";

// Types for display
interface AccountDisplay {
  id: string;
  companyId: string;
  accountCode: string;
  name: string;
  accountType: string;
  parentId: string | null;
  level: number;
  balance: string;
  isPostable: boolean;
  isActive: boolean;
}

const accountTypeColors: Record<string, string> = {
  asset: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  liability: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  equity: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  revenue: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  expense: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

export function ChartOfAccounts() {
  const { activeCompany } = useAuth();
  const { toast } = useToast();
  const { accounts: globalAccounts, addAccount, updateAccount, deleteAccount } = useMockData();
  const companyId = activeCompany?.id;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountDisplay | null>(null);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const [formData, setFormData] = useState({
    accountCode: "",
    name: "",
    accountType: "asset" as "asset" | "liability" | "equity" | "revenue" | "expense",
    level: 3 as 1 | 2 | 3,
    parentId: "__none__",
    isPostable: true,
  });

  // Map global accounts to display format
  const accounts: AccountDisplay[] = globalAccounts.map(acc => ({
    id: acc.id,
    companyId: acc.companyId,
    accountCode: acc.accountCode,
    name: acc.name,
    accountType: acc.accountType,
    parentId: acc.parentId || null,
    level: acc.level,
    balance: (acc.balance || 0).toString(),
    isPostable: acc.isPostable,
    isActive: acc.isActive,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      parentId: formData.parentId === "__none__" ? null : formData.parentId,
    };
    
    setIsPending(true);
    setTimeout(() => {
      if (editingAccount) {
        updateAccount(editingAccount.id, {
          accountCode: submitData.accountCode,
          name: submitData.name,
          accountType: submitData.accountType,
          parentId: submitData.parentId,
          level: submitData.level,
          isPostable: submitData.isPostable,
        });
        toast({ title: "Account updated successfully" });
      } else {
        addAccount({
          companyId: companyId || "comp-002",
          accountCode: submitData.accountCode,
          name: submitData.name,
          accountType: submitData.accountType,
          parentId: submitData.parentId,
          level: submitData.level,
          balance: 0,
          isPostable: submitData.isPostable,
          isActive: true,
        });
        toast({ title: "Account created successfully" });
      }
      setIsPending(false);
      setIsFormOpen(false);
    }, 500);
  };

  const handleDeleteAccount = (accountId: string) => {
    const hasChildren = accounts.some(a => a.parentId === accountId);
    if (hasChildren) {
      toast({ title: "Cannot delete account with child accounts", variant: "destructive" });
      return;
    }
    if (confirm("Are you sure you want to delete this account?")) {
      deleteAccount(accountId);
      toast({ title: "Account deleted successfully" });
    }
  };

  const toggleExpand = (accountId: string) => {
    setExpandedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allParentIds = accounts.filter(a => !a.isPostable).map(a => a.id);
    setExpandedAccounts(new Set(allParentIds));
  };

  const collapseAll = () => {
    setExpandedAccounts(new Set());
  };

  const handleOpenForm = (account?: Account) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        accountCode: account.accountCode,
        name: account.name,
        accountType: account.accountType as typeof formData.accountType,
        level: account.level as 1 | 2 | 3,
        parentId: account.parentId || "__none__",
        isPostable: account.isPostable ?? true,
      });
    } else {
      setEditingAccount(null);
      setFormData({ accountCode: "", name: "", accountType: "asset", level: 3, parentId: "__none__", isPostable: true });
    }
    setIsFormOpen(true);
  };

  const getChildAccounts = (parentId: string | null): Account[] => {
    return accounts.filter(a => a.parentId === parentId);
  };

  const calculateBalance = (account: Account): number => {
    if (account.isPostable) {
      return parseFloat(account.balance || "0");
    }
    const children = accounts.filter(a => a.parentId === account.id);
    return children.reduce((sum, child) => sum + calculateBalance(child), 0);
  };

  const filteredAccounts = useMemo(() => {
    let filtered = accounts;
    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.accountCode.includes(searchTerm)
      );
    }
    if (filterType !== "all") {
      filtered = filtered.filter(a => a.accountType === filterType);
    }
    return filtered;
  }, [accounts, searchTerm, filterType]);

  const rootAccounts = useMemo(() => {
    if (searchTerm || filterType !== "all") {
      return filteredAccounts;
    }
    return accounts.filter(a => a.parentId === null);
  }, [accounts, filteredAccounts, searchTerm, filterType]);

  const parentAccountOptions = useMemo(() => {
    return accounts.filter(a => !a.isPostable);
  }, [accounts]);

  const totalAssets = useMemo(() =>
    accounts.filter(a => a.accountType === "asset" && a.isPostable).reduce((sum, a) => sum + parseFloat(a.balance || "0"), 0),
    [accounts]
  );
  const totalLiabilities = useMemo(() =>
    accounts.filter(a => a.accountType === "liability" && a.isPostable).reduce((sum, a) => sum + parseFloat(a.balance || "0"), 0),
    [accounts]
  );
  const totalEquity = useMemo(() =>
    accounts.filter(a => a.accountType === "equity" && a.isPostable).reduce((sum, a) => sum + parseFloat(a.balance || "0"), 0),
    [accounts]
  );
  const totalRevenue = useMemo(() =>
    accounts.filter(a => a.accountType === "revenue" && a.isPostable).reduce((sum, a) => sum + parseFloat(a.balance || "0"), 0),
    [accounts]
  );
  const totalExpenses = useMemo(() =>
    accounts.filter(a => a.accountType === "expense" && a.isPostable).reduce((sum, a) => sum + parseFloat(a.balance || "0"), 0),
    [accounts]
  );

  const renderAccountRow = (account: Account, depth: number = 0) => {
    const children = getChildAccounts(account.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedAccounts.has(account.id);
    const calculatedBalance = calculateBalance(account);

    return (
      <div key={account.id}>
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 border-b hover-elevate cursor-pointer",
            account.level === 1 && "bg-muted/50 font-semibold",
            account.level === 2 && "font-medium",
          )}
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
          onClick={() => hasChildren && toggleExpand(account.id)}
          data-testid={`row-account-${account.id}`}
        >
          <div className="w-5 flex justify-center">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )
            ) : (
              <span className="w-4" />
            )}
          </div>

          <div className="flex-1 min-w-0 flex items-center gap-3">
            <span className="font-mono text-sm w-14 shrink-0">{account.accountCode}</span>
            <span className="truncate">{account.name}</span>
            {account.isPostable && (
              <Badge variant="outline" className="text-xs shrink-0">Postable</Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Badge className={cn("text-xs capitalize", accountTypeColors[account.accountType])}>
              {account.accountType}
            </Badge>
            <span className="text-xs text-muted-foreground w-8 text-center">L{account.level}</span>
            <span className={cn(
              "w-28 text-right font-mono text-sm",
              calculatedBalance < 0 && "text-red-600 dark:text-red-400"
            )}>
              ${calculatedBalance.toLocaleString()}
            </span>
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" onClick={() => handleOpenForm(account)} data-testid={`button-edit-${account.id}`}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteAccount(account.id)}
                disabled={hasChildren || isPending}
                data-testid={`button-delete-${account.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {children.map(child => renderAccountRow(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleExportCSV = () => {
    const headers = ["Account Code", "Account Name", "Type", "Level", "Parent Account", "Balance", "Postable"];
    const rows = accounts.map(a => [
      a.accountCode,
      a.name,
      a.accountType.charAt(0).toUpperCase() + a.accountType.slice(1),
      a.level,
      a.parentId || "",
      calculateBalance(a),
      a.isPostable ? "Yes" : "No"
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "chart_of_accounts.csv";
    link.click();
  };

  const handleExportJSON = () => {
    const jsonData = accounts.map(a => ({
      accountCode: a.accountCode,
      accountName: a.name,
      accountType: a.accountType.charAt(0).toUpperCase() + a.accountType.slice(1),
      level: a.level,
      parentAccountCode: a.parentId,
      balance: calculateBalance(a),
      isPostable: a.isPostable
    }));

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "chart_of_accounts.json";
    link.click();
  };

  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please select a company to view Chart of Accounts</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Chart of Accounts"
        description={`${accounts.length} accounts across ${accounts.filter(a => a.level === 1).length} categories`}
        actions={
          <>
            <Button variant="outline" onClick={handleExportCSV} data-testid="button-export-csv">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={handleExportJSON} data-testid="button-export-json">
              <FileText className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
            <Button onClick={() => handleOpenForm()} data-testid="button-new-account">
              <Plus className="h-4 w-4 mr-2" />
              New Account
            </Button>
          </>
        }
      />

      <div className="grid md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400" data-testid="text-total-assets">
              ${totalAssets.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Liabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-red-600 dark:text-red-400" data-testid="text-total-liabilities">
              ${totalLiabilities.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Equity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-purple-600 dark:text-purple-400" data-testid="text-total-equity">
              ${totalEquity.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-green-600 dark:text-green-400" data-testid="text-total-revenue">
              ${totalRevenue.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-orange-600 dark:text-orange-400" data-testid="text-total-expenses">
              ${totalExpenses.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Account Hierarchy
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
                data-testid="input-search"
              />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32" data-testid="select-filter-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="asset">Assets</SelectItem>
                  <SelectItem value="liability">Liabilities</SelectItem>
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="expense">Expenses</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={expandAll} data-testid="button-expand-all">
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll} data-testid="button-collapse-all">
                Collapse All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border rounded-md overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted/50 text-sm font-medium border-b">
              <div className="col-span-6">Account</div>
              <div className="col-span-2 text-center">Type</div>
              <div className="col-span-1 text-center">Level</div>
              <div className="col-span-2 text-right">Balance</div>
              <div className="col-span-1"></div>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {rootAccounts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No accounts found. Click "New Account" to create one.
                </div>
              ) : (
                rootAccounts.map(account => renderAccountRow(account, 0))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Edit Account" : "New Account"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountCode">Account Number *</Label>
                <Input
                  id="accountCode"
                  value={formData.accountCode}
                  onChange={(e) => setFormData({ ...formData, accountCode: e.target.value })}
                  disabled={!!editingAccount}
                  placeholder="e.g., 1111"
                  required
                  data-testid="input-account-code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Account Type *</Label>
                <Select
                  value={formData.accountType}
                  onValueChange={(value) => setFormData({ ...formData, accountType: value as typeof formData.accountType })}
                >
                  <SelectTrigger data-testid="select-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="liability">Liability</SelectItem>
                    <SelectItem value="equity">Equity</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Account Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Cash on Hand"
                required
                data-testid="input-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">Level *</Label>
                <Select
                  value={String(formData.level)}
                  onValueChange={(value) => setFormData({ ...formData, level: parseInt(value) as 1 | 2 | 3 })}
                >
                  <SelectTrigger data-testid="select-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Level 1 (Main)</SelectItem>
                    <SelectItem value="2">Level 2 (Category)</SelectItem>
                    <SelectItem value="3">Level 3 (Sub-account)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentId">Parent Account</Label>
                <Select
                  value={formData.parentId}
                  onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                >
                  <SelectTrigger data-testid="select-parent">
                    <SelectValue placeholder="Select parent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None (Root Account)</SelectItem>
                    {parentAccountOptions.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.accountCode} - {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isPostable"
                checked={formData.isPostable}
                onCheckedChange={(checked) => setFormData({ ...formData, isPostable: checked as boolean })}
                data-testid="checkbox-postable"
              />
              <Label htmlFor="isPostable" className="font-normal">
                Postable (can receive journal entries)
              </Label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isPending}
                data-testid="button-save"
              >
                {isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingAccount ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
