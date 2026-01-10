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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Download, Eye, Edit, Trash2, Package, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV } from "@/lib/export";
import { useMockData, type Product as GlobalProduct } from "@/lib/MockDataContext";

// Product display type matching the component's existing structure
interface ProductDisplay {
  id: string;
  companyId: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  uom: string;
  price: string;
  cost: string;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  isSellable: boolean;
  isPurchasable: boolean;
  isActive: boolean;
}

export function ProductList() {
  const { activeCompany } = useAuth();
  const { toast } = useToast();
  const { products: globalProducts, addProduct, updateProduct, deleteProduct } = useMockData();
  const companyId = activeCompany?.id;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDisplay | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductDisplay | null>(null);
  const [isLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Map global products to display format
  const products: ProductDisplay[] = globalProducts.map(p => ({
    id: p.id,
    companyId: p.companyId,
    sku: p.sku,
    name: p.name,
    description: p.description,
    category: p.category,
    uom: p.uom,
    price: p.sellingPrice.toString(),
    cost: p.costPrice.toString(),
    minStockLevel: p.reorderPoint,
    maxStockLevel: p.reorderPoint * 5,
    reorderPoint: p.reorderPoint,
    isSellable: true,
    isPurchasable: true,
    isActive: p.isActive,
  }));

  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    description: "",
    category: "",
    uom: "EA",
    price: "0",
    cost: "0",
    minStockLevel: 0,
    maxStockLevel: 0,
    reorderPoint: 0,
    isSellable: true,
    isPurchasable: true,
  });

  const handleOpenForm = (product?: ProductDisplay) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        sku: product.sku,
        name: product.name,
        description: product.description || "",
        category: product.category || "",
        uom: product.uom || "EA",
        price: product.price || "0",
        cost: product.cost || "0",
        minStockLevel: product.minStockLevel || 0,
        maxStockLevel: product.maxStockLevel || 0,
        reorderPoint: product.reorderPoint || 0,
        isSellable: product.isSellable ?? true,
        isPurchasable: product.isPurchasable ?? true,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        sku: "",
        name: "",
        description: "",
        category: "",
        uom: "EA",
        price: "0",
        cost: "0",
        minStockLevel: 0,
        maxStockLevel: 0,
        reorderPoint: 0,
        isSellable: true,
        isPurchasable: true,
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setTimeout(() => {
      if (editingProduct) {
        updateProduct(editingProduct.id, {
          sku: formData.sku,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          uom: formData.uom,
          costPrice: parseFloat(formData.cost) || 0,
          sellingPrice: parseFloat(formData.price) || 0,
          reorderPoint: formData.reorderPoint,
        });
        toast({ title: "Product updated successfully" });
      } else {
        addProduct({
          companyId: companyId || "comp-002",
          sku: formData.sku,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          uom: formData.uom,
          costPrice: parseFloat(formData.cost) || 0,
          sellingPrice: parseFloat(formData.price) || 0,
          reorderPoint: formData.reorderPoint,
          isActive: true,
        });
        toast({ title: "Product created successfully" });
      }
      setIsPending(false);
      setIsFormOpen(false);
    }, 500);
  };

  const handleViewProduct = (product: ProductDisplay) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  const handleDelete = (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProduct(productId);
      toast({ title: "Product deleted successfully" });
    }
  };

  const columns: Column<ProductDisplay>[] = [
    { key: "sku", header: "SKU", sortable: true },
    { key: "name", header: "Name", sortable: true },
    { key: "category", header: "Category", sortable: true },
    { key: "uom", header: "UOM" },
    { 
      key: "price", 
      header: "Price", 
      sortable: true,
      className: "text-right",
      render: (item) => `$${parseFloat(item.price || "0").toFixed(2)}`
    },
    { 
      key: "cost", 
      header: "Cost", 
      sortable: true,
      className: "text-right",
      render: (item) => `$${parseFloat(item.cost || "0").toFixed(2)}`
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
          <Button variant="ghost" size="icon" onClick={() => handleViewProduct(item)} data-testid={`button-view-${item.id}`}>
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
    if (products.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    exportToCSV(
      products.map(p => ({
        sku: p.sku,
        name: p.name,
        category: p.category || "",
        uom: p.uom,
        price: p.price,
        cost: p.cost,
        minStock: p.minStockLevel,
        reorderPoint: p.reorderPoint,
        status: p.isActive ? "Active" : "Inactive"
      })),
      [
        { key: "sku", label: "SKU" },
        { key: "name", label: "Name" },
        { key: "category", label: "Category" },
        { key: "uom", label: "UOM" },
        { key: "price", label: "Price (IDR)" },
        { key: "cost", label: "Cost (IDR)" },
        { key: "minStock", label: "Min Stock" },
        { key: "reorderPoint", label: "Reorder Point" },
        { key: "status", label: "Status" }
      ],
      "products"
    );
    toast({ title: "Products exported successfully" });
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
        title="Products"
        description={`${products.length} product${products.length !== 1 ? "s" : ""}`}
        actions={
          <>
            <Button variant="outline" onClick={handleExport} data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => handleOpenForm()} data-testid="button-new-product">
              <Plus className="h-4 w-4 mr-2" />
              New Product
            </Button>
          </>
        }
      />

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No products yet</h3>
          <p className="text-muted-foreground mb-4">Create your first product to start managing inventory.</p>
          <Button onClick={() => handleOpenForm()} data-testid="button-create-first-product">
            <Plus className="h-4 w-4 mr-2" />
            Create Product
          </Button>
        </div>
      ) : (
        <DataTable
          data={products}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search products..."
          onRowClick={handleViewProduct}
        />
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "New Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="PROD-001"
                  required
                  data-testid="input-product-sku"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category || "__none__"}
                  onValueChange={(value) => setFormData({ ...formData, category: value === "__none__" ? "" : value })}
                >
                  <SelectTrigger data-testid="select-product-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No Category</SelectItem>
                    <SelectItem value="Widgets">Widgets</SelectItem>
                    <SelectItem value="Components">Components</SelectItem>
                    <SelectItem value="Materials">Materials</SelectItem>
                    <SelectItem value="Assemblies">Assemblies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Product name"
                required
                data-testid="input-product-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                data-testid="input-product-description"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="uom">Unit of Measure</Label>
                <Select
                  value={formData.uom}
                  onValueChange={(value) => setFormData({ ...formData, uom: value })}
                >
                  <SelectTrigger data-testid="select-product-uom">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EA">Each (EA)</SelectItem>
                    <SelectItem value="BOX">Box (BOX)</SelectItem>
                    <SelectItem value="KG">Kilogram (KG)</SelectItem>
                    <SelectItem value="LB">Pound (LB)</SelectItem>
                    <SelectItem value="KIT">Kit (KIT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  data-testid="input-product-price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  data-testid="input-product-cost"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minStockLevel">Min Stock</Label>
                <Input
                  id="minStockLevel"
                  type="number"
                  min="0"
                  value={formData.minStockLevel}
                  onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) || 0 })}
                  data-testid="input-product-min-stock"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStockLevel">Max Stock</Label>
                <Input
                  id="maxStockLevel"
                  type="number"
                  min="0"
                  value={formData.maxStockLevel}
                  onChange={(e) => setFormData({ ...formData, maxStockLevel: parseInt(e.target.value) || 0 })}
                  data-testid="input-product-max-stock"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorderPoint">Reorder Point</Label>
                <Input
                  id="reorderPoint"
                  type="number"
                  min="0"
                  value={formData.reorderPoint}
                  onChange={(e) => setFormData({ ...formData, reorderPoint: parseInt(e.target.value) || 0 })}
                  data-testid="input-product-reorder-point"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isSellable"
                  checked={formData.isSellable}
                  onCheckedChange={(checked) => setFormData({ ...formData, isSellable: checked as boolean })}
                  data-testid="checkbox-is-sellable"
                />
                <Label htmlFor="isSellable" className="cursor-pointer">Sellable</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isPurchasable"
                  checked={formData.isPurchasable}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPurchasable: checked as boolean })}
                  data-testid="checkbox-is-purchasable"
                />
                <Label htmlFor="isPurchasable" className="cursor-pointer">Purchasable</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isPending}
                data-testid="button-save-product"
              >
                {isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingProduct ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{selectedProduct.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SKU</span>
                    <span className="font-medium">{selectedProduct.sku}</span>
                  </div>
                  {selectedProduct.category && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category</span>
                      <span className="font-medium">{selectedProduct.category}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unit</span>
                    <span className="font-medium">{selectedProduct.uom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-medium">${parseFloat(selectedProduct.price || "0").toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost</span>
                    <span className="font-medium">${parseFloat(selectedProduct.cost || "0").toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <StatusBadge status={selectedProduct.isActive ? "active" : "inactive"} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
