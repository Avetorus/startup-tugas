import { useState } from "react";
import { DataTable, type Column } from "@/components/layout/DataTable";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Download, Book, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useMockData, type JournalEntry, type JournalLine } from "@/lib/MockDataContext";
import { cn } from "@/lib/utils";

// Display type for table
interface JournalDisplay extends JournalEntry {
  totalDebit: number;
  totalCredit: number;
}

export function JournalEntries() {
  const { journalEntries, addJournalEntry, accounts } = useMockData();
  const [selectedEntry, setSelectedEntry] = useState<JournalDisplay | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  
  const [formData, setFormData] = useState({
    description: "",
    debitAccountId: "",
    creditAccountId: "",
    amount: 0,
  });

  // Map journal entries to display format
  const entriesDisplay: JournalDisplay[] = journalEntries.map(entry => ({
    ...entry,
    totalDebit: entry.lines.reduce((sum, line) => sum + line.debit, 0),
    totalCredit: entry.lines.reduce((sum, line) => sum + line.credit, 0),
  }));

  const handleViewEntry = (entry: JournalDisplay) => {
    setSelectedEntry(entry);
    setIsDetailOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.debitAccountId || !formData.creditAccountId || formData.amount <= 0) return;
    
    const debitAccount = accounts.find(a => a.id === formData.debitAccountId);
    const creditAccount = accounts.find(a => a.id === formData.creditAccountId);
    
    addJournalEntry({
      companyId: "comp-002",
      date: new Date().toISOString().split("T")[0],
      description: formData.description,
      referenceType: "ADJUST",
      referenceId: `manual-${Date.now()}`,
      status: "draft",
      lines: [
        { 
          accountId: formData.debitAccountId, 
          accountCode: debitAccount?.accountCode || "", 
          accountName: debitAccount?.name || "", 
          debit: formData.amount, 
          credit: 0 
        },
        { 
          accountId: formData.creditAccountId, 
          accountCode: creditAccount?.accountCode || "", 
          accountName: creditAccount?.name || "", 
          debit: 0, 
          credit: formData.amount 
        },
      ]
    });
    
    setIsFormOpen(false);
    setFormData({ description: "", debitAccountId: "", creditAccountId: "", amount: 0 });
  };

  const handleExport = () => {
    console.log("Exporting journal entries:", entriesDisplay);
  };

  // Filter by reference type
  const getFilteredEntries = () => {
    switch (activeTab) {
      case "PO":
        return entriesDisplay.filter(e => e.referenceType === "PO");
      case "SO":
        return entriesDisplay.filter(e => e.referenceType === "SO");
      case "PMT":
        return entriesDisplay.filter(e => e.referenceType === "PMT");
      case "ADJUST":
        return entriesDisplay.filter(e => e.referenceType === "ADJUST");
      default:
        return entriesDisplay;
    }
  };

  // Calculate totals
  const totalDebits = entriesDisplay.reduce((sum, e) => sum + e.totalDebit, 0);
  const totalCredits = entriesDisplay.reduce((sum, e) => sum + e.totalCredit, 0);

  const columns: Column<JournalDisplay>[] = [
    { key: "entryNumber", header: "Entry #", sortable: true },
    { 
      key: "date", 
      header: "Date", 
      sortable: true,
      render: (item) => new Date(item.date).toLocaleDateString()
    },
    { key: "description", header: "Description", sortable: true },
    { 
      key: "referenceType", 
      header: "Type",
      render: (item) => (
        <span className={cn(
          "px-2 py-1 rounded text-xs font-medium",
          item.referenceType === "PO" && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
          item.referenceType === "SO" && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
          item.referenceType === "PMT" && "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
          item.referenceType === "ADJUST" && "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
        )}>
          {item.referenceType}
        </span>
      )
    },
    { 
      key: "totalDebit", 
      header: "Debit",
      className: "text-right",
      render: (item) => `$${item.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    },
    { 
      key: "totalCredit", 
      header: "Credit",
      className: "text-right",
      render: (item) => `$${item.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    },
    { 
      key: "status", 
      header: "Status",
      render: (item) => <StatusBadge status={item.status as "posted" | "draft"} />
    },
  ];

  const isFormValid = formData.description && formData.debitAccountId && formData.creditAccountId && formData.amount > 0;

  return (
    <div>
      <PageHeader
        title="Journal Entries"
        description="View all journal entries from transactions and manual adjustments"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <StatCard
          title="Total Entries"
          value={entriesDisplay.length.toString()}
          icon={Book}
        />
        <StatCard
          title="Total Debits"
          value={`$${totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={ArrowUpRight}
        />
        <StatCard
          title="Total Credits"
          value={`$${totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={ArrowDownLeft}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All ({entriesDisplay.length})</TabsTrigger>
          <TabsTrigger value="PO">Purchases ({entriesDisplay.filter(e => e.referenceType === "PO").length})</TabsTrigger>
          <TabsTrigger value="SO">Sales ({entriesDisplay.filter(e => e.referenceType === "SO").length})</TabsTrigger>
          <TabsTrigger value="PMT">Payments ({entriesDisplay.filter(e => e.referenceType === "PMT").length})</TabsTrigger>
          <TabsTrigger value="ADJUST">Adjustments ({entriesDisplay.filter(e => e.referenceType === "ADJUST").length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {entriesDisplay.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Book className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Journal Entries Yet</h3>
            <p className="text-muted-foreground mb-4">
              Journal entries will appear here when you complete transactions like receiving POs, delivering SOs, or recording payments.
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Manual Entry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          data={getFilteredEntries()}
          columns={columns}
          searchKey="description"
          searchPlaceholder="Search entries..."
          onRowClick={handleViewEntry}
        />
      )}

      {/* Entry Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Journal Entry Details</DialogTitle>
            <DialogDescription>
              Entry {selectedEntry?.entryNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Entry Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Entry Number</span>
                      <span className="font-medium">{selectedEntry.entryNumber}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Date</span>
                      <span>{new Date(selectedEntry.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Reference Type</span>
                      <span>{selectedEntry.referenceType}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Status</span>
                      <span className="capitalize">{selectedEntry.status}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedEntry.description}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Journal Lines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md divide-y">
                    <div className="grid grid-cols-4 gap-2 p-3 bg-muted/50 text-sm font-medium">
                      <div>Account Code</div>
                      <div>Account Name</div>
                      <div className="text-right">Debit</div>
                      <div className="text-right">Credit</div>
                    </div>
                    {selectedEntry.lines.map((line, index) => (
                      <div key={index} className="grid grid-cols-4 gap-2 p-3 text-sm">
                        <div className="text-muted-foreground">{line.accountCode}</div>
                        <div>{line.accountName}</div>
                        <div className="text-right">{line.debit > 0 ? `$${line.debit.toFixed(2)}` : "-"}</div>
                        <div className="text-right">{line.credit > 0 ? `$${line.credit.toFixed(2)}` : "-"}</div>
                      </div>
                    ))}
                    <div className="grid grid-cols-4 gap-2 p-3 bg-muted/50 text-sm font-semibold">
                      <div></div>
                      <div>Total</div>
                      <div className="text-right">${selectedEntry.totalDebit.toFixed(2)}</div>
                      <div className="text-right">${selectedEntry.totalCredit.toFixed(2)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Entry Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Manual Journal Entry</DialogTitle>
            <DialogDescription>
              Create a manual adjustment entry
            </DialogDescription>
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
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="debitAccount">Debit Account *</Label>
                <Select
                  value={formData.debitAccountId}
                  onValueChange={(value) => setFormData({ ...formData, debitAccountId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.accountCode} - {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditAccount">Credit Account *</Label>
                <Select
                  value={formData.creditAccountId}
                  onValueChange={(value) => setFormData({ ...formData, creditAccountId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.accountCode} - {account.name}
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
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!isFormValid}>
                Create Entry
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
