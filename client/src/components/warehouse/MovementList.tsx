import { useState } from "react";
import { DataTable, type Column } from "@/components/layout/DataTable";
import { StatusBadge, StatusType } from "@/components/layout/StatusBadge";
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
import { Plus, Download, Warehouse } from "lucide-react";
import { useMockData, type Movement } from "@/lib/MockDataContext";
import { useToast } from "@/hooks/use-toast";

// Display type for table
interface MovementDisplay extends Movement {
  productName: string;
  warehouseName: string;
  fromLocationCode: string;
  toLocationCode: string;
}

export function MovementList() {
  const { toast } = useToast();
  const {
    movements, products, warehouses, locations,
    addMovement, adjustStock
  } = useMockData();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");

  const [formData, setFormData] = useState({
    type: "RECEIVE" as Movement["type"],
    warehouseId: "",
    productId: "",
    quantity: 1,
    fromLocationId: "",
    toLocationId: "",
    reference: "",
    notes: "",
  });

  // Map movements to display format
  const movementsDisplay: MovementDisplay[] = movements.map(m => {
    const product = products.find(p => p.id === m.productId);
    const warehouse = warehouses.find(w => w.id === m.warehouseId);
    const fromLoc = locations.find(l => l.id === m.fromLocationId);
    const toLoc = locations.find(l => l.id === m.toLocationId);
    return {
      ...m,
      productName: product?.name || "Unknown",
      warehouseName: warehouse?.name || "Unknown",
      fromLocationCode: fromLoc?.code || "-",
      toLocationCode: toLoc?.code || "-",
    };
  });

  // Filter by warehouse
  const filteredMovements = selectedWarehouse === "all"
    ? movementsDisplay
    : movementsDisplay.filter(m => m.warehouseId === selectedWarehouse);

  // Sort by date descending
  const sortedMovements = [...filteredMovements].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Get locations for selected warehouse
  const locationsForWarehouse = locations.filter(l => l.warehouseId === formData.warehouseId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === formData.productId);
    
    // Create movement record
    addMovement({
      companyId: "comp-002",
      warehouseId: formData.warehouseId,
      type: formData.type,
      productId: formData.productId,
      quantity: formData.quantity,
      fromLocationId: formData.type === "RECEIVE" ? undefined : formData.fromLocationId,
      toLocationId: formData.type === "SHIP" ? undefined : formData.toLocationId,
      referenceType: "ADJUSTMENT",
      referenceId: formData.reference || `ADJ-${Date.now()}`,
      date: new Date().toISOString(),
      notes: formData.notes,
    });

    // Update stock levels based on movement type
    if (formData.type === "RECEIVE" && formData.toLocationId) {
      adjustStock(formData.warehouseId, formData.toLocationId, formData.productId, formData.quantity, "ADJUSTMENT", formData.reference);
    } else if (formData.type === "SHIP" && formData.fromLocationId) {
      adjustStock(formData.warehouseId, formData.fromLocationId, formData.productId, -formData.quantity, "ADJUSTMENT", formData.reference);
    } else if (formData.type === "TRANSFER" && formData.fromLocationId && formData.toLocationId) {
      // Decrease from source, increase at destination
      adjustStock(formData.warehouseId, formData.fromLocationId, formData.productId, -formData.quantity, "TRANSFER", formData.reference);
      adjustStock(formData.warehouseId, formData.toLocationId, formData.productId, formData.quantity, "TRANSFER", formData.reference);
    }

    toast({ title: `${formData.type} movement recorded successfully` });
    setIsFormOpen(false);
    setFormData({
      type: "RECEIVE",
      warehouseId: "",
      productId: "",
      quantity: 1,
      fromLocationId: "",
      toLocationId: "",
      reference: "",
      notes: "",
    });
  };

  const columns: Column<MovementDisplay>[] = [
    { key: "id", header: "Movement ID", sortable: true },
    { 
      key: "type", 
      header: "Type",
      render: (item) => <StatusBadge status={item.type as StatusType} />
    },
    { key: "productName", header: "Product", sortable: true },
    { key: "warehouseName", header: "Warehouse", sortable: true },
    { key: "quantity", header: "Qty", sortable: true, className: "text-right" },
    { 
      key: "fromLocationCode", 
      header: "From", 
      render: (item) => item.fromLocationCode
    },
    { 
      key: "toLocationCode", 
      header: "To", 
      render: (item) => item.toLocationCode
    },
    { 
      key: "date", 
      header: "Date", 
      sortable: true,
      render: (item) => new Date(item.date).toLocaleDateString()
    },
    { key: "referenceId", header: "Reference" },
  ];

  return (
    <div>
      <PageHeader
        title="Stock Movements"
        description="Track all inventory movements and transfers"
        actions={
          <div className="flex gap-2">
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger className="w-48" data-testid="select-warehouse-filter">
                <Warehouse className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Warehouses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {warehouses.map((wh) => (
                  <SelectItem key={wh.id} value={wh.id}>
                    {wh.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setIsFormOpen(true)} data-testid="button-new-movement">
              <Plus className="h-4 w-4 mr-2" />
              New Movement
            </Button>
          </div>
        }
      />

      <DataTable
        data={sortedMovements}
        columns={columns}
        searchKey="productName"
        searchPlaceholder="Search movements..."
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Stock Movement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Movement Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as Movement["type"] })}
                >
                  <SelectTrigger data-testid="select-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECEIVE">Receive (IN)</SelectItem>
                    <SelectItem value="SHIP">Ship (OUT)</SelectItem>
                    <SelectItem value="TRANSFER">Transfer</SelectItem>
                    <SelectItem value="ADJUST">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouse">Warehouse *</Label>
                <Select
                  value={formData.warehouseId}
                  onValueChange={(value) => setFormData({ ...formData, warehouseId: value, fromLocationId: "", toLocationId: "" })}
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="product">Product *</Label>
              <Select
                value={formData.productId}
                onValueChange={(value) => setFormData({ ...formData, productId: value })}
              >
                <SelectTrigger data-testid="select-product">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                required
                data-testid="input-quantity"
              />
            </div>
            {(formData.type === "SHIP" || formData.type === "TRANSFER") && (
              <div className="space-y-2">
                <Label htmlFor="fromLocation">From Location *</Label>
                <Select
                  value={formData.fromLocationId}
                  onValueChange={(value) => setFormData({ ...formData, fromLocationId: value })}
                  disabled={!formData.warehouseId}
                >
                  <SelectTrigger data-testid="select-from">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationsForWarehouse.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.code} - {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {(formData.type === "RECEIVE" || formData.type === "TRANSFER" || formData.type === "ADJUST") && (
              <div className="space-y-2">
                <Label htmlFor="toLocation">To Location *</Label>
                <Select
                  value={formData.toLocationId}
                  onValueChange={(value) => setFormData({ ...formData, toLocationId: value })}
                  disabled={!formData.warehouseId}
                >
                  <SelectTrigger data-testid="select-to">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationsForWarehouse.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.code} - {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="reference">Reference</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="e.g., PO-001, INV-001"
                data-testid="input-reference"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes"
                data-testid="input-notes"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!formData.productId || !formData.warehouseId} 
                data-testid="button-save"
              >
                Create Movement
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
