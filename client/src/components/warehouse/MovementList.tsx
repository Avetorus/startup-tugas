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
import { Plus, Download } from "lucide-react";
import { mockMovements, mockProducts, mockLocations } from "@/lib/mockData";

// type Movement = typeof mockMovements[0];

export type Movement = {
  id: string,
  type: "IN" | "OUT" | "TRANSFER",
  productId: string,
  productName: string,
  quantity: number,
  fromLocation: string | null,
  toLocation: string | null,
  date: string,
  reference: string,
};

export function MovementList() {
  const [movements, setMovements] = useState(mockMovements);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [formData, setFormData] = useState({
    type: "IN",
    productId: "",
    quantity: 1,
    fromLocation: "",
    toLocation: "",
    reference: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // todo: remove mock functionality
    const product = mockProducts.find(p => p.id === formData.productId);
    const newMovement: Movement = {
      id: `MOV-${String(movements.length + 1).padStart(3, "0")}`,
      type: formData.type as "IN" | "OUT" | "TRANSFER",
      productId: formData.productId,
      productName: product?.name || "",
      quantity: formData.quantity,
      fromLocation: formData.type === "IN" ? null : formData.fromLocation,
      toLocation: formData.type === "OUT" ? null : formData.toLocation,
      date: new Date().toISOString().split("T")[0],
      reference: formData.reference || "MANUAL",
    };
    setMovements([newMovement, ...movements]);
    console.log("Created movement:", newMovement);
    setIsFormOpen(false);
    setFormData({
      type: "IN",
      productId: "",
      quantity: 1,
      fromLocation: "",
      toLocation: "",
      reference: "",
    });
  };

  const columns: Column<Movement>[] = [
    { key: "id", header: "Movement ID", sortable: true },
    { 
      key: "type", 
      header: "Type",
      render: (item) => <StatusBadge status={item.type as StatusType} />
    },
    { key: "productName", header: "Product", sortable: true },
    { key: "quantity", header: "Qty", sortable: true, className: "text-right" },
    { 
      key: "fromLocation", 
      header: "From", 
      render: (item) => item.fromLocation || "-"
    },
    { 
      key: "toLocation", 
      header: "To", 
      render: (item) => item.toLocation || "-"
    },
    { key: "date", header: "Date", sortable: true },
    { key: "reference", header: "Reference" },
  ];

  return (
    <div>
      <PageHeader
        title="Stock Movements"
        description="Track all inventory movements"
        actions={
          <>
            <Button variant="outline" data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setIsFormOpen(true)} data-testid="button-new-movement">
              <Plus className="h-4 w-4 mr-2" />
              New Movement
            </Button>
          </>
        }
      />

      <DataTable
        data={movements}
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
            <div className="space-y-2">
              <Label htmlFor="type">Movement Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger data-testid="select-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">Stock In</SelectItem>
                  <SelectItem value="OUT">Stock Out</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                </SelectContent>
              </Select>
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
                  {mockProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
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
            {formData.type !== "IN" && (
              <div className="space-y-2">
                <Label htmlFor="fromLocation">From Location *</Label>
                <Select
                  value={formData.fromLocation}
                  onValueChange={(value) => setFormData({ ...formData, fromLocation: value })}
                >
                  <SelectTrigger data-testid="select-from">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockLocations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.code}>
                        {loc.code} - {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {formData.type !== "OUT" && (
              <div className="space-y-2">
                <Label htmlFor="toLocation">To Location *</Label>
                <Select
                  value={formData.toLocation}
                  onValueChange={(value) => setFormData({ ...formData, toLocation: value })}
                >
                  <SelectTrigger data-testid="select-to">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockLocations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.code}>
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
                placeholder="e.g., PO-001"
                data-testid="input-reference"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={!formData.productId} data-testid="button-save">
                Create Movement
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
