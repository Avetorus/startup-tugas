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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Download, Eye, Edit, Trash2, Users, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV } from "@/lib/export";
import { useMockData, type Customer } from "@/lib/MockDataContext";

// Display type for table
interface CustomerDisplay {
  id: string;
  companyId: string;
  code: string;
  name: string;
  legalName?: string;
  email: string;
  phone: string;
  taxId?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  paymentTerms: number;
  creditLimit: string;
  customerType?: string;
  isActive: boolean;
}

export function CustomerList() {
  const { activeCompany } = useAuth();
  const { toast } = useToast();
  const { customers: globalCustomers, addCustomer, updateCustomer, deleteCustomer } = useMockData();
  const companyId = activeCompany?.id;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerDisplay | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDisplay | null>(null);
  const [isPending, setIsPending] = useState(false);
  const isLoading = false;

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    legalName: "",
    email: "",
    phone: "",
    taxId: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    paymentTerms: 30,
    creditLimit: "0",
    customerType: "regular",
  });

  // Map global customers to display format
  const customers: CustomerDisplay[] = globalCustomers.map(c => ({
    id: c.id,
    companyId: c.companyId,
    code: c.code,
    name: c.name,
    email: c.email,
    phone: c.phone,
    address: c.address,
    city: c.city,
    state: c.state,
    country: c.country,
    postalCode: c.postalCode,
    paymentTerms: c.paymentTerms,
    creditLimit: String(c.creditLimit),
    customerType: "regular",
    isActive: c.isActive,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setTimeout(() => {
      if (editingCustomer) {
        updateCustomer(editingCustomer.id, {
          code: formData.code,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          postalCode: formData.postalCode,
          paymentTerms: formData.paymentTerms,
          creditLimit: parseFloat(formData.creditLimit) || 0,
        });
        toast({ title: "Customer updated successfully" });
      } else {
        addCustomer({
          companyId: companyId || "comp-002",
          code: formData.code,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          postalCode: formData.postalCode,
          paymentTerms: formData.paymentTerms,
          creditLimit: parseFloat(formData.creditLimit) || 0,
          isActive: true,
        });
        toast({ title: "Customer created successfully" });
      }
      setIsPending(false);
      setIsFormOpen(false);
    }, 500);
  };

  const handleDelete = (customerId: string) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      deleteCustomer(customerId);
      toast({ title: "Customer deleted successfully" });
    }
  };

  const handleOpenForm = (customer?: CustomerDisplay) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        code: customer.code,
        name: customer.name,
        legalName: customer.legalName || "",
        email: customer.email || "",
        phone: customer.phone || "",
        taxId: customer.taxId || "",
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "",
        country: customer.country || "",
        postalCode: customer.postalCode || "",
        paymentTerms: customer.paymentTerms || 30,
        creditLimit: customer.creditLimit || "0",
        customerType: customer.customerType || "regular",
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        code: "",
        name: "",
        legalName: "",
        email: "",
        phone: "",
        taxId: "",
        address: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
        paymentTerms: 30,
        creditLimit: "0",
        customerType: "regular",
      });
    }
    setIsFormOpen(true);
  };

  const handleViewCustomer = (customer: CustomerDisplay) => {
    setSelectedCustomer(customer);
    setIsDetailOpen(true);
  };

  const columns: Column<CustomerDisplay>[] = [
    { key: "code", header: "Code", sortable: true },
    { key: "name", header: "Name", sortable: true },
    { key: "email", header: "Email", sortable: true },
    { key: "phone", header: "Phone" },
    { key: "city", header: "City" },
    { key: "country", header: "Country" },
    {
      key: "customerType",
      header: "Type",
      render: (item) => (
        <span className="capitalize">{item.customerType || "regular"}</span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (item) => (
        <StatusBadge status={item.isActive ? "active" : "inactive"} />
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (item) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => handleViewCustomer(item)} data-testid={`button-view-${item.id}`}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleOpenForm(item)} data-testid={`button-edit-${item.id}`}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} data-testid={`button-delete-${item.id}`}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleExport = () => {
    if (customers.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    exportToCSV(
      customers.map(c => ({
        code: c.code,
        name: c.name,
        email: c.email || "",
        phone: c.phone || "",
        city: c.city || "",
        country: c.country || "",
        type: c.customerType,
        paymentTerms: c.paymentTerms,
        creditLimit: c.creditLimit,
        status: c.isActive ? "Active" : "Inactive"
      })),
      [
        { key: "code", label: "Code" },
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "city", label: "City" },
        { key: "country", label: "Country" },
        { key: "type", label: "Type" },
        { key: "paymentTerms", label: "Payment Terms" },
        { key: "creditLimit", label: "Credit Limit (IDR)" },
        { key: "status", label: "Status" }
      ],
      "customers"
    );
    toast({ title: "Customers exported successfully" });
  };

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
        title="Customers"
        description={`${customers.length} customer${customers.length !== 1 ? "s" : ""}`}
        actions={
          <>
            <Button variant="outline" onClick={handleExport} data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => handleOpenForm()} data-testid="button-new-customer">
              <Plus className="h-4 w-4 mr-2" />
              New Customer
            </Button>
          </>
        }
      />

      {customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No customers yet</h3>
          <p className="text-muted-foreground mb-4">Create your first customer to start tracking sales.</p>
          <Button onClick={() => handleOpenForm()} data-testid="button-create-first-customer">
            <Plus className="h-4 w-4 mr-2" />
            Create Customer
          </Button>
        </div>
      ) : (
        <DataTable
          data={customers}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search customers..."
          onRowClick={handleViewCustomer}
        />
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Edit Customer" : "New Customer"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Customer Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="CUST-001"
                  required
                  data-testid="input-customer-code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerType">Type</Label>
                <Select
                  value={formData.customerType}
                  onValueChange={(value) => setFormData({ ...formData, customerType: value })}
                >
                  <SelectTrigger data-testid="select-customer-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="wholesale">Wholesale</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Customer Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Customer name"
                required
                data-testid="input-customer-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legalName">Legal Name</Label>
              <Input
                id="legalName"
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                placeholder="Legal entity name (optional)"
                data-testid="input-customer-legal-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  data-testid="input-customer-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  data-testid="input-customer-phone"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID</Label>
              <Input
                id="taxId"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="Tax identification number"
                data-testid="input-customer-tax-id"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address"
                rows={2}
                data-testid="input-customer-address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                  data-testid="input-customer-city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State"
                  data-testid="input-customer-state"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="US"
                  maxLength={2}
                  data-testid="input-customer-country"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="12345"
                  data-testid="input-customer-postal-code"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms (days)</Label>
                <Input
                  id="paymentTerms"
                  type="number"
                  min="0"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: parseInt(e.target.value) || 0 })}
                  data-testid="input-customer-payment-terms"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditLimit">Credit Limit</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                  data-testid="input-customer-credit-limit"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isPending}
                data-testid="button-save-customer"
              >
                {isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingCustomer ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{selectedCustomer.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Code</span>
                    <span className="font-medium">{selectedCustomer.code}</span>
                  </div>
                  {selectedCustomer.legalName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Legal Name</span>
                      <span className="font-medium">{selectedCustomer.legalName}</span>
                    </div>
                  )}
                  {selectedCustomer.email && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium">{selectedCustomer.email}</span>
                    </div>
                  )}
                  {selectedCustomer.phone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-medium">{selectedCustomer.phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium capitalize">{selectedCustomer.customerType || "regular"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Terms</span>
                    <span className="font-medium">{selectedCustomer.paymentTerms || 30} days</span>
                  </div>
                  {selectedCustomer.creditLimit && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Credit Limit</span>
                      <span className="font-medium">${parseFloat(selectedCustomer.creditLimit).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <StatusBadge status={selectedCustomer.isActive ? "active" : "inactive"} />
                  </div>
                </CardContent>
              </Card>
              {(selectedCustomer.address || selectedCustomer.city) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Address</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {selectedCustomer.address && <div>{selectedCustomer.address}</div>}
                    <div>
                      {[selectedCustomer.city, selectedCustomer.state, selectedCustomer.postalCode]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                    {selectedCustomer.country && <div>{selectedCustomer.country}</div>}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
