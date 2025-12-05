import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  ArrowLeftRight,
  Plus,
  Eye,
  FileCheck,
  XCircle,
  Building2,
  Package,
  DollarSign,
  Truck,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCompany } from "@/contexts/CompanyContext";
import type { Company, Warehouse, Product } from "@shared/schema";

interface IntercoTransaction {
  id: string;
  transactionNumber: string;
  transactionType: string;
  sourceCompanyId: string;
  targetCompanyId: string;
  amount: string;
  currency: string;
  status: string;
  transactionDate: Date | null;
  description: string | null;
  referenceNumber: string | null;
  createdAt: Date | null;
}

interface IntercoStockTransfer {
  id: string;
  transferNumber: string;
  sourceCompanyId: string;
  targetCompanyId: string;
  sourceWarehouseId: string;
  targetWarehouseId: string;
  status: string;
  transferDate: Date | null;
  totalValue: string;
  sourceSalesOrderId: string | null;
  targetPurchaseOrderId: string | null;
  createdAt: Date | null;
}
import { cn } from "@/lib/utils";

const transactionFormSchema = z.object({
  transactionType: z.enum(["sale", "purchase", "service", "dividend", "loan"]),
  sourceCompanyId: z.string().min(1, "Source company required"),
  targetCompanyId: z.string().min(1, "Target company required"),
  amount: z.string().min(1, "Amount required"),
  currency: z.string().default("USD"),
  description: z.string().optional(),
  referenceNumber: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

const stockTransferFormSchema = z.object({
  sourceCompanyId: z.string().min(1, "Source company required"),
  targetCompanyId: z.string().min(1, "Target company required"),
  sourceWarehouseId: z.string().min(1, "Source warehouse required"),
  targetWarehouseId: z.string().min(1, "Target warehouse required"),
  productId: z.string().min(1, "Product required"),
  quantity: z.string().min(1, "Quantity required"),
  unitCost: z.string().min(1, "Unit cost required"),
  notes: z.string().optional(),
});

type StockTransferFormValues = z.infer<typeof stockTransferFormSchema>;

const transactionTypeColors: Record<string, string> = {
  sale: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  purchase: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  service: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  dividend: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  loan: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  in_transit: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  received: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
};

export function InterCompanyTransactions() {
  const { toast } = useToast();
  const { activeCompanyId } = useCompany();
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<IntercoTransaction | null>(null);
  const [selectedTransfer, setSelectedTransfer] = useState<IntercoStockTransfer | null>(null);

  // Fetch companies
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  // Fetch warehouses
  const { data: warehouses = [] } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  // Fetch products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch inter-company transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<IntercoTransaction[]>({
    queryKey: ["/api/interco-transactions"],
  });

  // Fetch inter-company stock transfers
  const { data: stockTransfers = [], isLoading: transfersLoading } = useQuery<IntercoStockTransfer[]>({
    queryKey: ["/api/interco-stock-transfers"],
  });

  const transactionForm = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      transactionType: "sale",
      sourceCompanyId: activeCompanyId || "",
      targetCompanyId: "",
      amount: "",
      currency: "USD",
      description: "",
      referenceNumber: "",
    },
  });

  const stockTransferForm = useForm<StockTransferFormValues>({
    resolver: zodResolver(stockTransferFormSchema),
    defaultValues: {
      sourceCompanyId: activeCompanyId || "",
      targetCompanyId: "",
      sourceWarehouseId: "",
      targetWarehouseId: "",
      productId: "",
      quantity: "",
      unitCost: "",
      notes: "",
    },
  });

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (data: TransactionFormValues) => {
      const response = await apiRequest("POST", "/api/interco-transactions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interco-transactions"] });
      toast({ title: "Inter-company transaction created" });
      setIsTransactionDialogOpen(false);
      transactionForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Create stock transfer mutation
  const createTransferMutation = useMutation({
    mutationFn: async (data: StockTransferFormValues) => {
      const response = await apiRequest("POST", "/api/interco-stock-transfers", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interco-stock-transfers"] });
      toast({ title: "Stock transfer created" });
      setIsTransferDialogOpen(false);
      stockTransferForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Approve transaction mutation
  const approveTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/interco-transactions/${id}`, {
        status: "approved",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interco-transactions"] });
      toast({ title: "Transaction approved" });
      setSelectedTransaction(null);
    },
  });

  // Complete transfer mutation
  const completeTransferMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/interco-stock-transfers/${id}`, {
        status: "received",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interco-stock-transfers"] });
      toast({ title: "Transfer marked as received" });
      setSelectedTransfer(null);
    },
  });

  const handleSubmitTransaction = (values: TransactionFormValues) => {
    createTransactionMutation.mutate(values);
  };

  const handleSubmitTransfer = (values: StockTransferFormValues) => {
    createTransferMutation.mutate(values);
  };

  const getCompanyName = (id: string) => {
    return companies.find((c) => c.id === id)?.name || id;
  };

  const getWarehouseName = (id: string) => {
    return warehouses.find((w) => w.id === id)?.name || id;
  };

  const getProductName = (id: string) => {
    return products.find((p) => p.id === id)?.name || id;
  };

  const filteredTransactions = transactions.filter((t) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      t.transactionNumber?.toLowerCase().includes(searchLower) ||
      getCompanyName(t.sourceCompanyId).toLowerCase().includes(searchLower) ||
      getCompanyName(t.targetCompanyId).toLowerCase().includes(searchLower)
    );
  });

  const filteredTransfers = stockTransfers.filter((t) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      t.transferNumber?.toLowerCase().includes(searchLower) ||
      getCompanyName(t.sourceCompanyId).toLowerCase().includes(searchLower) ||
      getCompanyName(t.targetCompanyId).toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            Inter-Company Transactions
          </h1>
          <p className="text-muted-foreground">
            Manage transactions and stock transfers between companies
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="outline" 
            onClick={() => setIsTransferDialogOpen(true)}
            data-testid="button-new-transfer"
          >
            <Truck className="h-4 w-4 mr-2" />
            Stock Transfer
          </Button>
          <Button 
            onClick={() => setIsTransactionDialogOpen(true)}
            data-testid="button-new-transaction"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Transaction
          </Button>
        </div>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList data-testid="tabs-view-selector">
          <TabsTrigger value="transactions" data-testid="tab-transactions">
            <DollarSign className="h-4 w-4 mr-2" />
            Financial Transactions
          </TabsTrigger>
          <TabsTrigger value="transfers" data-testid="tab-transfers">
            <Package className="h-4 w-4 mr-2" />
            Stock Transfers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5" />
                  Inter-Company Financial Transactions
                </CardTitle>
                <CardDescription>
                  Sales, purchases, services, and other financial flows between entities
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[200px]"
                  data-testid="input-search-transactions"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table data-testid="table-transactions">
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Source Company</TableHead>
                    <TableHead>Target Company</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                      <TableCell className="font-medium">
                        {transaction.transactionNumber}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={transactionTypeColors[transaction.transactionType]}
                        >
                          {transaction.transactionType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {getCompanyName(transaction.sourceCompanyId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {getCompanyName(transaction.targetCompanyId)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {transaction.currency} {parseFloat(transaction.amount).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={statusColors[transaction.status]}
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transaction.transactionDate 
                          ? format(new Date(transaction.transactionDate), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setSelectedTransaction(transaction)}
                            data-testid={`button-view-${transaction.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {transaction.status === "pending" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => approveTransactionMutation.mutate(transaction.id)}
                              data-testid={`button-approve-${transaction.id}`}
                            >
                              <FileCheck className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTransactions.length === 0 && !transactionsLoading && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No inter-company transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Inter-Company Stock Transfers
                </CardTitle>
                <CardDescription>
                  Inventory movements between company warehouses
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transfers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[200px]"
                  data-testid="input-search-transfers"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table data-testid="table-transfers">
                <TableHeader>
                  <TableRow>
                    <TableHead>Transfer #</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransfers.map((transfer) => (
                    <TableRow key={transfer.id} data-testid={`row-transfer-${transfer.id}`}>
                      <TableCell className="font-medium">
                        {transfer.transferNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {getCompanyName(transfer.sourceCompanyId)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {getWarehouseName(transfer.sourceWarehouseId)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {getCompanyName(transfer.targetCompanyId)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {getWarehouseName(transfer.targetWarehouseId)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${parseFloat(transfer.totalValue).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={statusColors[transfer.status]}
                        >
                          {transfer.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transfer.transferDate 
                          ? format(new Date(transfer.transferDate), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setSelectedTransfer(transfer)}
                            data-testid={`button-view-transfer-${transfer.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {transfer.status === "in_transit" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => completeTransferMutation.mutate(transfer.id)}
                              data-testid={`button-receive-${transfer.id}`}
                            >
                              <FileCheck className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTransfers.length === 0 && !transfersLoading && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No stock transfers found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Transaction Dialog */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Inter-Company Transaction</DialogTitle>
            <DialogDescription>
              Record a financial transaction between two companies
            </DialogDescription>
          </DialogHeader>

          <Form {...transactionForm}>
            <form onSubmit={transactionForm.handleSubmit(handleSubmitTransaction)} className="space-y-4">
              <FormField
                control={transactionForm.control}
                name="transactionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-transaction-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sale">Sale</SelectItem>
                        <SelectItem value="purchase">Purchase</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="dividend">Dividend</SelectItem>
                        <SelectItem value="loan">Loan</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={transactionForm.control}
                  name="sourceCompanyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Company</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-source-company">
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="targetCompanyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Company</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-target-company">
                            <SelectValue placeholder="Select target" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies
                            .filter((c) => c.id !== transactionForm.watch("sourceCompanyId"))
                            .map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={transactionForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          data-testid="input-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-currency">
                            <SelectValue placeholder="USD" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="JPY">JPY</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={transactionForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Transaction details..."
                        className="resize-none"
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTransactionDialogOpen(false)}
                  data-testid="button-cancel-transaction"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createTransactionMutation.isPending}
                  data-testid="button-submit-transaction"
                >
                  Create Transaction
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Stock Transfer Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Inter-Company Stock Transfer</DialogTitle>
            <DialogDescription>
              Transfer inventory between company warehouses
            </DialogDescription>
          </DialogHeader>

          <Form {...stockTransferForm}>
            <form onSubmit={stockTransferForm.handleSubmit(handleSubmitTransfer)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={stockTransferForm.control}
                  name="sourceCompanyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Company</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-transfer-source-company">
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={stockTransferForm.control}
                  name="targetCompanyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Company</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-transfer-target-company">
                            <SelectValue placeholder="Select target" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies
                            .filter((c) => c.id !== stockTransferForm.watch("sourceCompanyId"))
                            .map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={stockTransferForm.control}
                  name="sourceWarehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Warehouse</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-source-warehouse">
                            <SelectValue placeholder="Select warehouse" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {warehouses.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={stockTransferForm.control}
                  name="targetWarehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Warehouse</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-target-warehouse">
                            <SelectValue placeholder="Select warehouse" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {warehouses.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={stockTransferForm.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-product">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={stockTransferForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          data-testid="input-quantity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={stockTransferForm.control}
                  name="unitCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Cost</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          data-testid="input-unit-cost"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={stockTransferForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Transfer notes..."
                        className="resize-none"
                        {...field}
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTransferDialogOpen(false)}
                  data-testid="button-cancel-transfer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createTransferMutation.isPending}
                  data-testid="button-submit-transfer"
                >
                  Create Transfer
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Transaction Number</p>
                  <p className="font-medium">{selectedTransaction.transactionNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge className={transactionTypeColors[selectedTransaction.transactionType]}>
                    {selectedTransaction.transactionType}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Source Company</p>
                  <p className="font-medium">{getCompanyName(selectedTransaction.sourceCompanyId)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Target Company</p>
                  <p className="font-medium">{getCompanyName(selectedTransaction.targetCompanyId)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium font-mono">
                    {selectedTransaction.currency} {parseFloat(selectedTransaction.amount).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={statusColors[selectedTransaction.status]}>
                    {selectedTransaction.status}
                  </Badge>
                </div>
              </div>
              {selectedTransaction.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p>{selectedTransaction.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer Detail Dialog */}
      <Dialog open={!!selectedTransfer} onOpenChange={() => setSelectedTransfer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Details</DialogTitle>
          </DialogHeader>
          {selectedTransfer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Transfer Number</p>
                  <p className="font-medium">{selectedTransfer.transferNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={statusColors[selectedTransfer.status]}>
                    {selectedTransfer.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">From</p>
                  <p className="font-medium">{getCompanyName(selectedTransfer.sourceCompanyId)}</p>
                  <p className="text-sm text-muted-foreground">
                    {getWarehouseName(selectedTransfer.sourceWarehouseId)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">To</p>
                  <p className="font-medium">{getCompanyName(selectedTransfer.targetCompanyId)}</p>
                  <p className="text-sm text-muted-foreground">
                    {getWarehouseName(selectedTransfer.targetWarehouseId)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="font-medium font-mono">
                  ${parseFloat(selectedTransfer.totalValue).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
