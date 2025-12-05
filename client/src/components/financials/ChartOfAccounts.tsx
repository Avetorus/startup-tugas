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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Download,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  FileText,
  Layers,
} from "lucide-react";
import { mockAccounts, type ChartOfAccountsEntry } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const accountTypeColors: Record<string, string> = {
  asset: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  liability: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  equity: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  revenue: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  expense: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

export function ChartOfAccounts() {
  const [accounts, setAccounts] = useState<ChartOfAccountsEntry[]>(mockAccounts);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartOfAccountsEntry | null>(null);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set(["1000", "2000", "3000", "4000", "5000"]));
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    type: "asset" as "asset" | "liability" | "equity" | "revenue" | "expense",
    level: 3 as 1 | 2 | 3,
    parentId: "",
    isPostable: true,
  });

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

  const handleOpenForm = (account?: ChartOfAccountsEntry) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        id: account.id,
        name: account.name,
        type: account.type,
        level: account.level,
        parentId: account.parentId || "",
        isPostable: account.isPostable,
      });
    } else {
      setEditingAccount(null);
      setFormData({ id: "", name: "", type: "asset", level: 3, parentId: "", isPostable: true });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccount) {
      setAccounts(accounts.map(a =>
        a.id === editingAccount.id ? { ...a, ...formData, parentId: formData.parentId || null } : a
      ));
      console.log("Updated account:", editingAccount.id);
    } else {
      const newAccount: ChartOfAccountsEntry = {
        ...formData,
        parentId: formData.parentId || null,
        balance: 0,
      };
      setAccounts([...accounts, newAccount].sort((a, b) => a.id.localeCompare(b.id)));
      console.log("Created account:", newAccount);
    }
    setIsFormOpen(false);
  };

  const handleDeleteAccount = (accountId: string) => {
    const hasChildren = accounts.some(a => a.parentId === accountId);
    if (hasChildren) {
      alert("Cannot delete account with child accounts");
      return;
    }
    setAccounts(accounts.filter(a => a.id !== accountId));
    console.log("Deleted account:", accountId);
  };

  const getChildAccounts = (parentId: string | null): ChartOfAccountsEntry[] => {
    return accounts.filter(a => a.parentId === parentId);
  };

  const calculateBalance = (account: ChartOfAccountsEntry): number => {
    if (account.isPostable) {
      return account.balance;
    }
    const children = accounts.filter(a => a.parentId === account.id);
    return children.reduce((sum, child) => sum + calculateBalance(child), 0);
  };

  const filteredAccounts = useMemo(() => {
    let filtered = accounts;
    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.id.includes(searchTerm)
      );
    }
    if (filterType !== "all") {
      filtered = filtered.filter(a => a.type === filterType);
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
    accounts.filter(a => a.type === "asset" && a.isPostable).reduce((sum, a) => sum + a.balance, 0),
    [accounts]
  );
  const totalLiabilities = useMemo(() =>
    accounts.filter(a => a.type === "liability" && a.isPostable).reduce((sum, a) => sum + a.balance, 0),
    [accounts]
  );
  const totalEquity = useMemo(() =>
    accounts.filter(a => a.type === "equity" && a.isPostable).reduce((sum, a) => sum + a.balance, 0),
    [accounts]
  );
  const totalRevenue = useMemo(() =>
    accounts.filter(a => a.type === "revenue" && a.isPostable).reduce((sum, a) => sum + a.balance, 0),
    [accounts]
  );
  const totalExpenses = useMemo(() =>
    accounts.filter(a => a.type === "expense" && a.isPostable).reduce((sum, a) => sum + a.balance, 0),
    [accounts]
  );

  const renderAccountRow = (account: ChartOfAccountsEntry, depth: number = 0) => {
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
            <span className="font-mono text-sm w-14 shrink-0">{account.id}</span>
            <span className="truncate">{account.name}</span>
            {account.isPostable && (
              <Badge variant="outline" className="text-xs shrink-0">Postable</Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Badge className={cn("text-xs capitalize", accountTypeColors[account.type])}>
              {account.type}
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
                disabled={hasChildren}
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
      a.id,
      a.name,
      a.type.charAt(0).toUpperCase() + a.type.slice(1),
      a.level,
      a.parentId || "",
      calculateBalance(a),
      a.isPostable ? "Yes" : "No"
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chart_of_accounts.csv";
    a.click();
    console.log("Exported Chart of Accounts to CSV");
  };

  const handleExportJSON = () => {
    const jsonData = accounts.map(a => ({
      accountCode: a.id,
      accountName: a.name,
      accountType: a.type.charAt(0).toUpperCase() + a.type.slice(1),
      level: a.level,
      parentAccountCode: a.parentId,
      balance: calculateBalance(a),
      isPostable: a.isPostable
    }));

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chart_of_accounts.json";
    a.click();
    console.log("Exported Chart of Accounts to JSON");
  };

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
              {rootAccounts.map(account => renderAccountRow(account, 0))}
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
                <Label htmlFor="id">Account Number *</Label>
                <Input
                  id="id"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  disabled={!!editingAccount}
                  placeholder="e.g., 1111"
                  required
                  data-testid="input-id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Account Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as typeof formData.type })}
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
                    <SelectItem value="">None (Root Account)</SelectItem>
                    {parentAccountOptions.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.id} - {account.name}
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
              <Button type="submit" data-testid="button-save">
                {editingAccount ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
