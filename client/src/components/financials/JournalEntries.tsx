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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Download, CheckCircle } from "lucide-react";
import { mockJournalEntries, mockAccounts } from "@/lib/mockData";

type JournalEntry = typeof mockJournalEntries[0];

export function JournalEntries() {
  const [entries, setEntries] = useState(mockJournalEntries);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [formData, setFormData] = useState({
    description: "",
    debitAccount: "",
    creditAccount: "",
    amount: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // todo: remove mock functionality
    const newEntry: JournalEntry = {
      id: `JE-${String(entries.length + 1).padStart(3, "0")}`,
      date: new Date().toISOString().split("T")[0],
      status: "draft",
      ...formData,
    };
    setEntries([newEntry, ...entries]);
    console.log("Created journal entry:", newEntry);
    setIsFormOpen(false);
    setFormData({ description: "", debitAccount: "", creditAccount: "", amount: 0 });
  };

  const handlePost = (entryId: string) => {
    setEntries(entries.map(e => 
      e.id === entryId ? { ...e, status: "posted" } : e
    ));
    console.log("Posted journal entry:", entryId);
  };

  const getAccountName = (accountId: string) => {
    return mockAccounts.find(a => a.id === accountId)?.name || accountId;
  };

  const columns: Column<JournalEntry>[] = [
    { key: "id", header: "Entry #", sortable: true },
    { key: "date", header: "Date", sortable: true },
    { key: "description", header: "Description", sortable: true },
    { 
      key: "debitAccount", 
      header: "Debit", 
      render: (item) => getAccountName(item.debitAccount)
    },
    { 
      key: "creditAccount", 
      header: "Credit", 
      render: (item) => getAccountName(item.creditAccount)
    },
    { 
      key: "amount", 
      header: "Amount", 
      sortable: true,
      className: "text-right",
      render: (item) => `$${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    },
    { 
      key: "status", 
      header: "Status",
      render: (item) => <StatusBadge status={item.status as "posted" | "draft"} />
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (item) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {item.status === "draft" && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handlePost(item.id)}
              data-testid={`button-post-${item.id}`}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Post
            </Button>
          )}
        </div>
      ),
    },
  ];

  const isValid = formData.description && formData.debitAccount && formData.creditAccount && formData.amount > 0;

  return (
    <div>
      <PageHeader
        title="Journal Entries"
        description="Record and manage accounting entries"
        actions={
          <>
            <Button variant="outline" data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setIsFormOpen(true)} data-testid="button-new-entry">
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </Button>
          </>
        }
      />

      <DataTable
        data={entries}
        columns={columns}
        searchKey="description"
        searchPlaceholder="Search entries..."
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Journal Entry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                required
                data-testid="textarea-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="debitAccount">Debit Account *</Label>
                <Select
                  value={formData.debitAccount}
                  onValueChange={(value) => setFormData({ ...formData, debitAccount: value })}
                >
                  <SelectTrigger data-testid="select-debit">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.id} - {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditAccount">Credit Account *</Label>
                <Select
                  value={formData.creditAccount}
                  onValueChange={(value) => setFormData({ ...formData, creditAccount: value })}
                >
                  <SelectTrigger data-testid="select-credit">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.id} - {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount || ""}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                required
                data-testid="input-amount"
              />
            </div>
            <div className="p-3 bg-muted/50 rounded-md text-sm">
              <p className="text-muted-foreground">
                Debits must equal credits for the entry to be valid.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={!isValid} data-testid="button-save">
                Create Entry
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
