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
import { mockLocations, mockProducts } from "@/lib/mockData";

type Location = typeof mockLocations[0];

export function LocationList() {
  const [locations, setLocations] = useState(mockLocations);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    zone: "",
    type: "bin",
    capacity: 100,
  });

  const [transferData, setTransferData] = useState({
    productId: "",
    fromLocation: "",
    toLocation: "",
    quantity: 1,
  });

  const handleOpenForm = (location?: Location) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        code: location.code,
        name: location.name,
        zone: location.zone,
        type: location.type,
        capacity: location.capacity,
      });
    } else {
      setEditingLocation(null);
      setFormData({
        code: "",
        name: "",
        zone: "",
        type: "bin",
        capacity: 100,
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLocation) {
      setLocations(locations.map(l => 
        l.id === editingLocation.id ? { ...l, ...formData } : l
      ));
      console.log("Updated location:", editingLocation.id);
    } else {
      // todo: remove mock functionality
      const newLocation: Location = {
        id: `LOC-${String(locations.length + 1).padStart(3, "0")}`,
        used: 0,
        ...formData,
      };
      setLocations([...locations, newLocation]);
      console.log("Created location:", newLocation);
    }
    setIsFormOpen(false);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Transfer:", transferData);
    setIsTransferOpen(false);
    setTransferData({ productId: "", fromLocation: "", toLocation: "", quantity: 1 });
  };

  const handleDeleteLocation = (locationId: string) => {
    setLocations(locations.filter(l => l.id !== locationId));
    console.log("Deleted location:", locationId);
  };

  const columns: Column<Location>[] = [
    { key: "code", header: "Code", sortable: true },
    { key: "name", header: "Name", sortable: true },
    { key: "zone", header: "Zone", sortable: true },
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
          <Button variant="ghost" size="icon" onClick={() => handleDeleteLocation(item.id)} data-testid={`button-delete-${item.id}`}>
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
        data={locations}
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
                <Label htmlFor="zone">Zone</Label>
                <Input
                  id="zone"
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  placeholder="e.g., Zone A"
                  data-testid="input-zone"
                />
              </div>
              <div className="col-span-2 space-y-2">
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
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger data-testid="select-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bin">Bin</SelectItem>
                    <SelectItem value="rack">Rack</SelectItem>
                    <SelectItem value="shelf">Shelf</SelectItem>
                    <SelectItem value="bulk">Bulk Storage</SelectItem>
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
                  {mockProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.stock} available)
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
