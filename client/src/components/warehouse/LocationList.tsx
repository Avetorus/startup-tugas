import { useState } from "react";
import { DataTable, type Column } from "@/components/layout/DataTable";
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
import { Progress } from "@/components/ui/progress";
import { Plus, Download, Edit, Trash2, ArrowRightLeft } from "lucide-react";
import { useMockData, type Location } from "@/lib/MockDataContext";
import { useToast } from "@/hooks/use-toast";

// Display type with warehouse/zone names
interface LocationDisplay extends Location {
  warehouseName: string;
  zoneName: string;
  used: number;
}

export function LocationList() {
  const { toast } = useToast();
  const { 
    locations, warehouses, zones, products, stockLevels,
    addLocation, updateLocation, deleteLocation
  } = useMockData();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationDisplay | null>(null);

  const [formData, setFormData] = useState({
    warehouseId: "",
    zoneId: "",
    code: "",
    name: "",
    type: "bin" as Location["type"],
    capacity: 100,
  });

  // Map locations with warehouse/zone names and calculate used capacity
  const locationsDisplay: LocationDisplay[] = locations.map(loc => {
    const warehouse = warehouses.find(w => w.id === loc.warehouseId);
    const zone = zones.find(z => z.id === loc.zoneId);
    const stockAtLoc = stockLevels.filter(s => s.locationId === loc.id);
    const usedQty = stockAtLoc.reduce((sum, s) => sum + s.quantity, 0);
    return {
      ...loc,
      warehouseName: warehouse?.name || "Unknown",
      zoneName: zone?.name || "Unknown",
      used: Math.min(usedQty, loc.capacity), // Cap at capacity for display
    };
  });

  const [transferData, setTransferData] = useState({
    productId: "",
    fromLocation: "",
    toLocation: "",
    quantity: 1,
  });

  const handleOpenForm = (location?: LocationDisplay) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        warehouseId: location.warehouseId,
        zoneId: location.zoneId,
        code: location.code,
        name: location.name,
        type: location.type,
        capacity: location.capacity,
      });
    } else {
      setEditingLocation(null);
      setFormData({
        warehouseId: warehouses[0]?.id || "",
        zoneId: "",
        code: "",
        name: "",
        type: "bin",
        capacity: 100,
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLocation) {
      updateLocation(editingLocation.id, {
        warehouseId: formData.warehouseId,
        zoneId: formData.zoneId,
        code: formData.code,
        name: formData.name,
        type: formData.type,
        capacity: formData.capacity,
      });
      toast({ title: "Location updated successfully" });
    } else {
      addLocation({
        companyId: "comp-002",
        warehouseId: formData.warehouseId,
        zoneId: formData.zoneId,
        code: formData.code,
        name: formData.name,
        type: formData.type,
        capacity: formData.capacity,
        isActive: true,
      });
      toast({ title: "Location created successfully" });
    }
    setIsFormOpen(false);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Stock transferred successfully" });
    setIsTransferOpen(false);
    setTransferData({ productId: "", fromLocation: "", toLocation: "", quantity: 1 });
  };

  const handleDeleteLoc = (locationId: string) => {
    if (confirm("Are you sure you want to delete this location?")) {
      deleteLocation(locationId);
      toast({ title: "Location deleted successfully" });
    }
  };

  // Get zones for selected warehouse
  const zonesForWarehouse = zones.filter(z => z.warehouseId === formData.warehouseId);

  const columns: Column<LocationDisplay>[] = [
    { key: "code", header: "Code", sortable: true },
    { key: "warehouseName", header: "Warehouse", sortable: true },
    { key: "zoneName", header: "Zone", sortable: true },
    { key: "name", header: "Name", sortable: true },
    { key: "type", header: "Type", sortable: true },
    { 
      key: "capacity", 
      header: "Capacity", 
      sortable: true,
      className: "text-right"
    },
    { 
      key: "used", 
      header: "Utilization",
      render: (item) => (
        <div className="flex items-center gap-2">
          <Progress value={(item.used / item.capacity) * 100} className="w-20 h-2" />
          <span className="text-sm text-muted-foreground">{Math.round((item.used / item.capacity) * 100)}%</span>
        </div>
      )
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
          <Button variant="ghost" size="icon" onClick={() => handleDeleteLoc(item.id)} data-testid={`button-delete-${item.id}`}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Warehouse Locations"
        description="Manage bins, racks, and storage areas"
        actions={
          <>
            <Button variant="outline" onClick={() => setIsTransferOpen(true)} data-testid="button-transfer">
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Transfer Stock
            </Button>
            <Button variant="outline" data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => handleOpenForm()} data-testid="button-new-location">
              <Plus className="h-4 w-4 mr-2" />
              New Location
            </Button>
          </>
        }
      />

      <DataTable
        data={locationsDisplay}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Search locations..."
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLocation ? "Edit Location" : "New Location"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="warehouse">Warehouse *</Label>
                <Select
                  value={formData.warehouseId}
                  onValueChange={(value) => setFormData({ ...formData, warehouseId: value, zoneId: "" })}
                >
                  <SelectTrigger data-testid="select-warehouse">
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zone">Zone *</Label>
                <Select
                  value={formData.zoneId}
                  onValueChange={(value) => setFormData({ ...formData, zoneId: value })}
                  disabled={!formData.warehouseId}
                >
                  <SelectTrigger data-testid="select-zone">
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {zonesForWarehouse.map((z) => (
                      <SelectItem key={z.id} value={z.id}>
                        {z.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Location Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., A-01-01"
                  required
                  data-testid="input-code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="input-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as Location["type"] })}
                >
                  <SelectTrigger data-testid="select-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bin">Bin</SelectItem>
                    <SelectItem value="rack">Rack</SelectItem>
                    <SelectItem value="shelf">Shelf</SelectItem>
                    <SelectItem value="bulk">Bulk Storage</SelectItem>
                    <SelectItem value="floor">Floor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                  data-testid="input-capacity"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button type="submit" data-testid="button-save">
                {editingLocation ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Transfer Stock</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTransfer} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product *</Label>
              <Select
                value={transferData.productId}
                onValueChange={(value) => setTransferData({ ...transferData, productId: value })}
              >
                <SelectTrigger data-testid="select-transfer-product">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.stockQuantity} available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from">From Location *</Label>
                <Select
                  value={transferData.fromLocation}
                  onValueChange={(value) => setTransferData({ ...transferData, fromLocation: value })}
                >
                  <SelectTrigger data-testid="select-from-location">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.code}>
                        {loc.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="to">To Location *</Label>
                <Select
                  value={transferData.toLocation}
                  onValueChange={(value) => setTransferData({ ...transferData, toLocation: value })}
                >
                  <SelectTrigger data-testid="select-to-location">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.code}>
                        {loc.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={transferData.quantity}
                onChange={(e) => setTransferData({ ...transferData, quantity: parseInt(e.target.value) || 1 })}
                required
                data-testid="input-transfer-quantity"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsTransferOpen(false)} data-testid="button-cancel-transfer">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!transferData.productId || !transferData.fromLocation || !transferData.toLocation}
                data-testid="button-confirm-transfer"
              >
                Transfer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
