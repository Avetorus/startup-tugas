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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Download, Edit, Trash2, Warehouse, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV } from "@/lib/export";
import { useMockData, type Warehouse as WarehouseType } from "@/lib/MockDataContext";

// Extended type for form display
interface WarehouseDisplay extends WarehouseType {
  warehouseType: "standard" | "transit" | "virtual";
  state: string | null;
  country: string | null;
  postalCode: string | null;
  allowNegativeStock: boolean;
  createdAt?: Date;
}

export function WarehouseList() {
  const { activeCompany } = useAuth();
  const { toast } = useToast();
  const { warehouses, addWarehouse, updateWarehouse, deleteWarehouse } = useMockData();
  const companyId = activeCompany?.id;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseDisplay | null>(null);
  const [isLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Map global warehouses to display format
  const warehouseList: WarehouseDisplay[] = warehouses.map(w => ({
    ...w,
    warehouseType: "standard" as const,
    state: null,
    country: null,
    postalCode: null,
    allowNegativeStock: false,
  }));

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

  const handleOpenForm = (warehouse?: WarehouseDisplay) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData({
        code: warehouse.code,
        name: warehouse.name,
        warehouseType: warehouse.warehouseType || "standard",
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
    setIsPending(true);

    setTimeout(() => {
      if (editingWarehouse) {
        // Update existing warehouse via global context
        updateWarehouse(editingWarehouse.id, {
          code: formData.code,
          name: formData.name,
          address: formData.address,
          city: formData.city,
        });
        toast({ title: "Warehouse updated successfully" });
      } else {
        // Create new warehouse via global context
        addWarehouse({
          companyId: companyId || "comp-002",
          code: formData.code,
          name: formData.name,
          address: formData.address,
          city: formData.city,
          isActive: true,
        });
        toast({ title: "Warehouse created successfully" });
      }
      setIsPending(false);
      setIsFormOpen(false);
    }, 500);
  };

  const handleDelete = (warehouseId: string) => {
    if (confirm("Are you sure you want to delete this warehouse?")) {
      deleteWarehouse(warehouseId);
      toast({ title: "Warehouse deleted successfully" });
    }
  };

  const columns: Column<WarehouseDisplay>[] = [
    { key: "code", header: "Code", sortable: true },
    { key: "name", header: "Name", sortable: true },
    { 
      key: "warehouseType", 
      header: "Type", 
      sortable: true,
      render: (item) => (
        <StatusBadge 
          status={item.warehouseType || "standard"} 
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
    if (warehouseList.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    exportToCSV(
      warehouseList.map(w => ({
        code: w.code,
        name: w.name,
        type: w.warehouseType || "standard",
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
        description={`${warehouseList.length} warehouse${warehouseList.length !== 1 ? "s" : ""}`}
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

      {warehouseList.length === 0 ? (
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
          data={warehouseList}
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
                disabled={isPending}
                data-testid="button-save-warehouse"
              >
                {isPending && (
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
