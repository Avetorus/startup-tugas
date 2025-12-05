import { useState } from "react";
import { DataTable, type Column } from "@/components/layout/DataTable";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
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
import { Plus, Download, Edit, Trash2 } from "lucide-react";
import { mockAccounts } from "@/lib/mockData";

type Account = typeof mockAccounts[0];

export function ChartOfAccounts() {
  const [accounts, setAccounts] = useState(mockAccounts);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    type: "asset",
  });

  const handleOpenForm = (account?: Account) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        id: account.id,
        name: account.name,
        type: account.type,
      });
    } else {
      setEditingAccount(null);
      setFormData({ id: "", name: "", type: "asset" });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccount) {
      setAccounts(accounts.map(a => 
        a.id === editingAccount.id ? { ...a, ...formData } : a
      ));
      console.log("Updated account:", editingAccount.id);
    } else {
      // todo: remove mock functionality
      const newAccount: Account = {
        ...formData,
        balance: 0,
        parent: null,
      };
      setAccounts([...accounts, newAccount]);
      console.log("Created account:", newAccount);
    }
    setIsFormOpen(false);
  };

  const handleDeleteAccount = (accountId: string) => {
    setAccounts(accounts.filter(a => a.id !== accountId));
    console.log("Deleted account:", accountId);
  };

  const columns: Column<Account>[] = [
    { key: "id", header: "Account #", sortable: true },
    { key: "name", header: "Account Name", sortable: true },
    { 
      key: "type", 
      header: "Type",
      render: (item) => <StatusBadge status={item.type as "asset" | "liability" | "equity" | "revenue" | "expense"} />
    },
    { 
      key: "balance", 
      header: "Balance", 
      sortable: true,
      className: "text-right",
      render: (item) => `$${item.balance.toLocaleString()}`
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (item) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => handleOpenForm(item)} data-testid={`button-edit-${item.id}`}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDeleteAccount(item.id)} data-testid={`button-delete-${item.id}`}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const totalAssets = accounts.filter(a => a.type === "asset").reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = accounts.filter(a => a.type === "liability").reduce((sum, a) => sum + a.balance, 0);
  const totalEquity = accounts.filter(a => a.type === "equity").reduce((sum, a) => sum + a.balance, 0);

  return (
    <div>
      <PageHeader
        title="Chart of Accounts"
        description="Manage your accounting structure"
        actions={
          <>
            <Button variant="outline" data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => handleOpenForm()} data-testid="button-new-account">
              <Plus className="h-4 w-4 mr-2" />
              New Account
            </Button>
          </>
        }
      />

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 border rounded-md">
          <p className="text-sm text-muted-foreground">Total Assets</p>
          <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">${totalAssets.toLocaleString()}</p>
        </div>
        <div className="p-4 border rounded-md">
          <p className="text-sm text-muted-foreground">Total Liabilities</p>
          <p className="text-2xl font-semibold text-red-600 dark:text-red-400">${totalLiabilities.toLocaleString()}</p>
        </div>
        <div className="p-4 border rounded-md">
          <p className="text-sm text-muted-foreground">Total Equity</p>
          <p className="text-2xl font-semibold text-purple-600 dark:text-purple-400">${totalEquity.toLocaleString()}</p>
        </div>
      </div>

      <DataTable
        data={accounts}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Search accounts..."
      />

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
                  required
                  data-testid="input-id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Account Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
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
                required
                data-testid="input-name"
              />
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
