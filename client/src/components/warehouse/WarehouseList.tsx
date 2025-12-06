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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Download, Edit, Trash2, Warehouse, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV } from "@/lib/export";
import type { Warehouse as WarehouseType } from "@shared/schema";

export function WarehouseList() {
  const { activeCompany } = useAuth();
  const { toast } = useToast();
  const companyId = activeCompany?.id;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseType | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    warehouseType: "standard" as "standard" | "transit" | "virtual",
    address: "",
    city: "",
    state: "",
    country: "",
    allowNegativeStock: false,
  });

  const { data: warehouses = [], isLoading } = useQuery<WarehouseType[]>({
    queryKey: ["/api/companies", companyId, "warehouses"],
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", `/api/companies/${companyId}/warehouses`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "warehouses"] });
      toast({ title: "Warehouse created successfully" });
      setIsFormOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create warehouse", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<WarehouseType> }) => {
      const response = await apiRequest("PATCH", `/api/companies/${companyId}/warehouses/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "warehouses"] });
      toast({ title: "Warehouse updated successfully" });
      setIsFormOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update warehouse", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/companies/${companyId}/warehouses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "warehouses"] });
      toast({ title: "Warehouse deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete warehouse", variant: "destructive" });
    },
  });

  const handleOpenForm = (warehouse?: WarehouseType) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData({
        code: warehouse.code,
        name: warehouse.name,
        warehouseType: (warehouse.warehouseType as "standard" | "transit" | "virtual") || "standard",
        address: warehouse.address || "",
        city: warehouse.city || "",
        state: warehouse.state || "",
        country: warehouse.country || "",
        allowNegativeStock: warehouse.allowNegativeStock || false,
      });
    } else {
      setEditingWarehouse(null);
      setFormData({
        code: "",
        name: "",
        warehouseType: "standard",
        address: "",
        city: "",
        state: "",
        country: "",
        allowNegativeStock: false,
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWarehouse) {
      updateMutation.mutate({ id: editingWarehouse.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (warehouseId: string) => {
    if (confirm("Are you sure you want to delete this warehouse?")) {
      deleteMutation.mutate(warehouseId);
    }
  };

  const columns: Column<WarehouseType>[] = [
    { key: "code", header: "Code", sortable: true },
    { key: "name", header: "Name", sortable: true },
    { 
      key: "warehouseType", 
      header: "Type", 
      sortable: true,
      render: (item) => (
        <StatusBadge 
          status={(item.warehouseType || "standard") as "standard" | "transit" | "virtual"} 
        />
      ),
    },
    { key: "city", header: "City", sortable: true },
    { key: "state", header: "State" },
    { key: "country", header: "Country" },
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
    if (warehouses.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    exportToCSV(
      warehouses.map(w => ({
        code: w.code,
        name: w.name,
        type: w.warehouseType,
        city: w.city || "",
        state: w.state || "",
        country: w.country || "",
        status: w.isActive ? "Active" : "Inactive"
      })),
      [
        { key: "code", label: "Code" },
        { key: "name", label: "Name" },
        { key: "type", label: "Type" },
        { key: "city", label: "City" },
        { key: "state", label: "State" },
        { key: "country", label: "Country" },
        { key: "status", label: "Status" }
      ],
      "warehouses"
    );
    toast({ title: "Warehouses exported successfully" });
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
        title="Warehouses"
        description={`${warehouses.length} warehouse${warehouses.length !== 1 ? "s" : ""}`}
        actions={
          <>
            <Button variant="outline" onClick={handleExport} data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => handleOpenForm()} data-testid="button-new-warehouse">
              <Plus className="h-4 w-4 mr-2" />
              New Warehouse
            </Button>
          </>
        }
      />

      {warehouses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Warehouse className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No warehouses yet</h3>
          <p className="text-muted-foreground mb-4">Create your first warehouse to start managing inventory.</p>
          <Button onClick={() => handleOpenForm()} data-testid="button-create-first-warehouse">
            <Plus className="h-4 w-4 mr-2" />
            Create Warehouse
          </Button>
        </div>
      ) : (
        <DataTable
          data={warehouses}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search warehouses..."
        />
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingWarehouse ? "Edit Warehouse" : "New Warehouse"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="WH-001"
                  required
                  data-testid="input-warehouse-code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouseType">Type</Label>
                <Select
                  value={formData.warehouseType}
                  onValueChange={(value) => setFormData({ ...formData, warehouseType: value as "standard" | "transit" | "virtual" })}
                >
                  <SelectTrigger data-testid="select-warehouse-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="transit">Transit</SelectItem>
                    <SelectItem value="virtual">Virtual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Main Warehouse"
                required
                data-testid="input-warehouse-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main Street"
                data-testid="input-warehouse-address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="New York"
                  data-testid="input-warehouse-city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="NY"
                  data-testid="input-warehouse-state"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="US"
                maxLength={2}
                data-testid="input-warehouse-country"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="allowNegativeStock"
                checked={formData.allowNegativeStock}
                onCheckedChange={(checked) => setFormData({ ...formData, allowNegativeStock: checked as boolean })}
                data-testid="checkbox-allow-negative-stock"
              />
              <Label htmlFor="allowNegativeStock" className="cursor-pointer">Allow negative stock</Label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-warehouse"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingWarehouse ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
