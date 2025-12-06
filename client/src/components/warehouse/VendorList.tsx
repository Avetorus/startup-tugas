import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Plus, Download, Eye, Edit, Trash2, Building2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Vendor } from "@shared/schema";

export function VendorList() {
  const { activeCompany } = useAuth();
  const { toast } = useToast();
  const companyId = activeCompany?.id;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

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
    vendorType: "regular",
  });

  const { data: vendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/companies", companyId, "vendors"],
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", `/api/companies/${companyId}/vendors`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "vendors"] });
      toast({ title: "Vendor created successfully" });
      setIsFormOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create vendor", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Vendor> }) => {
      const response = await apiRequest("PATCH", `/api/companies/${companyId}/vendors/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "vendors"] });
      toast({ title: "Vendor updated successfully" });
      setIsFormOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update vendor", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/companies/${companyId}/vendors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "vendors"] });
      toast({ title: "Vendor deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete vendor", variant: "destructive" });
    },
  });

  const handleOpenForm = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({
        code: vendor.code,
        name: vendor.name,
        legalName: vendor.legalName || "",
        email: vendor.email || "",
        phone: vendor.phone || "",
        taxId: vendor.taxId || "",
        address: vendor.address || "",
        city: vendor.city || "",
        state: vendor.state || "",
        country: vendor.country || "",
        postalCode: vendor.postalCode || "",
        paymentTerms: vendor.paymentTerms || 30,
        vendorType: vendor.vendorType || "regular",
      });
    } else {
      setEditingVendor(null);
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
        vendorType: "regular",
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVendor) {
      updateMutation.mutate({ id: editingVendor.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleViewVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsDetailOpen(true);
  };

  const handleDelete = (vendorId: string) => {
    if (confirm("Are you sure you want to delete this vendor?")) {
      deleteMutation.mutate(vendorId);
    }
  };

  const columns: Column<Vendor>[] = [
    { key: "code", header: "Code", sortable: true },
    { key: "name", header: "Name", sortable: true },
    { key: "email", header: "Email", sortable: true },
    { key: "phone", header: "Phone" },
    { key: "city", header: "City" },
    { key: "country", header: "Country" },
    {
      key: "vendorType",
      header: "Type",
      render: (item) => (
        <span className="capitalize">{item.vendorType || "regular"}</span>
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
          <Button variant="ghost" size="icon" onClick={() => handleViewVendor(item)} data-testid={`button-view-${item.id}`}>
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
        title="Vendors"
        description={`${vendors.length} vendor${vendors.length !== 1 ? "s" : ""}`}
        actions={
          <>
            <Button variant="outline" data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => handleOpenForm()} data-testid="button-new-vendor">
              <Plus className="h-4 w-4 mr-2" />
              New Vendor
            </Button>
          </>
        }
      />

      {vendors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No vendors yet</h3>
          <p className="text-muted-foreground mb-4">Create your first vendor to start managing suppliers.</p>
          <Button onClick={() => handleOpenForm()} data-testid="button-create-first-vendor">
            <Plus className="h-4 w-4 mr-2" />
            Create Vendor
          </Button>
        </div>
      ) : (
        <DataTable
          data={vendors}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search vendors..."
          onRowClick={handleViewVendor}
        />
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVendor ? "Edit Vendor" : "New Vendor"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Vendor Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="VEND-001"
                  required
                  data-testid="input-vendor-code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendorType">Type</Label>
                <Select
                  value={formData.vendorType}
                  onValueChange={(value) => setFormData({ ...formData, vendorType: value })}
                >
                  <SelectTrigger data-testid="select-vendor-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="manufacturer">Manufacturer</SelectItem>
                    <SelectItem value="distributor">Distributor</SelectItem>
                    <SelectItem value="service">Service Provider</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Vendor Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Vendor name"
                required
                data-testid="input-vendor-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legalName">Legal Name</Label>
              <Input
                id="legalName"
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                placeholder="Legal entity name (optional)"
                data-testid="input-vendor-legal-name"
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
                  data-testid="input-vendor-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  data-testid="input-vendor-phone"
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
                data-testid="input-vendor-tax-id"
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
                data-testid="input-vendor-address"
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
                  data-testid="input-vendor-city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State"
                  data-testid="input-vendor-state"
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
                  data-testid="input-vendor-country"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="12345"
                  data-testid="input-vendor-postal-code"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms (days)</Label>
              <Input
                id="paymentTerms"
                type="number"
                min="0"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: parseInt(e.target.value) || 0 })}
                data-testid="input-vendor-payment-terms"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-vendor"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingVendor ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vendor Details</DialogTitle>
          </DialogHeader>
          {selectedVendor && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{selectedVendor.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Code</span>
                    <span className="font-medium">{selectedVendor.code}</span>
                  </div>
                  {selectedVendor.legalName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Legal Name</span>
                      <span className="font-medium">{selectedVendor.legalName}</span>
                    </div>
                  )}
                  {selectedVendor.email && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium">{selectedVendor.email}</span>
                    </div>
                  )}
                  {selectedVendor.phone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-medium">{selectedVendor.phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium capitalize">{selectedVendor.vendorType || "regular"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Terms</span>
                    <span className="font-medium">{selectedVendor.paymentTerms || 30} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <StatusBadge status={selectedVendor.isActive ? "active" : "inactive"} />
                  </div>
                </CardContent>
              </Card>
              {(selectedVendor.address || selectedVendor.city) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Address</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {selectedVendor.address && <div>{selectedVendor.address}</div>}
                    <div>
                      {[selectedVendor.city, selectedVendor.state, selectedVendor.postalCode]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                    {selectedVendor.country && <div>{selectedVendor.country}</div>}
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
