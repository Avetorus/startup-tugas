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
import { Plus, Download, Eye, Edit, Trash2, AlertTriangle, Package } from "lucide-react";
import { mockProducts } from "@/lib/mockData";
import { cn } from "@/lib/utils";

type Product = typeof mockProducts[0];

export function ProductList() {
  const [products, setProducts] = useState(mockProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "",
    uom: "EA",
    price: 0,
    minLevel: 0,
    maxLevel: 0,
    location: "",
  });

  const handleOpenForm = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        sku: product.sku,
        name: product.name,
        category: product.category,
        uom: product.uom,
        price: product.price,
        minLevel: product.minLevel,
        maxLevel: product.maxLevel,
        location: product.location,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        sku: "",
        name: "",
        category: "",
        uom: "EA",
        price: 0,
        minLevel: 0,
        maxLevel: 0,
        location: "",
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      setProducts(products.map(p => 
        p.id === editingProduct.id ? { ...p, ...formData } : p
      ));
      console.log("Updated product:", editingProduct.id);
    } else {
      // todo: remove mock functionality
      const newProduct: Product = {
        id: `P${String(products.length + 1).padStart(3, "0")}`,
        stock: 0,
        ...formData,
      };
      setProducts([newProduct, ...products]);
      console.log("Created product:", newProduct);
    }
    setIsFormOpen(false);
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId));
    console.log("Deleted product:", productId);
  };

  const isLowStock = (product: Product) => product.stock < product.minLevel;

  const columns: Column<Product>[] = [
    { key: "sku", header: "SKU", sortable: true },
    { key: "name", header: "Name", sortable: true },
    { key: "category", header: "Category", sortable: true },
    { key: "uom", header: "UOM" },
    { 
      key: "price", 
      header: "Price", 
      sortable: true,
      className: "text-right",
      render: (item) => `$${item.price.toFixed(2)}`
    },
    { 
      key: "stock", 
      header: "Stock", 
      sortable: true,
      className: "text-right",
      render: (item) => (
        <div className={cn(
          "flex items-center justify-end gap-2",
          isLowStock(item) && "text-red-600 dark:text-red-400"
        )}>
          {isLowStock(item) && <AlertTriangle className="h-3 w-3" />}
          {item.stock}
        </div>
      )
    },
    { key: "location", header: "Location" },
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
          <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(item.id)} data-testid={`button-delete-${item.id}`}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const lowStockCount = products.filter(isLowStock).length;

  return (
    <div>
      <PageHeader
        title="Products"
        description={`${products.length} products${lowStockCount > 0 ? `, ${lowStockCount} low stock` : ""}`}
        actions={
          <>
            <Button variant="outline" data-testid="button-export">
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

      <DataTable
        data={products}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Search products..."
        onRowClick={handleViewProduct}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "New Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                  data-testid="input-sku"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Widgets">Widgets</SelectItem>
                    <SelectItem value="Components">Components</SelectItem>
                    <SelectItem value="Materials">Materials</SelectItem>
                    <SelectItem value="Assemblies">Assemblies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="input-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uom">Unit of Measure</Label>
                <Select
                  value={formData.uom}
                  onValueChange={(value) => setFormData({ ...formData, uom: value })}
                >
                  <SelectTrigger data-testid="select-uom">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EA">Each (EA)</SelectItem>
                    <SelectItem value="BOX">Box (BOX)</SelectItem>
                    <SelectItem value="KG">Kilogram (KG)</SelectItem>
                    <SelectItem value="KIT">Kit (KIT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  required
                  data-testid="input-price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minLevel">Min Stock Level</Label>
                <Input
                  id="minLevel"
                  type="number"
                  min="0"
                  value={formData.minLevel}
                  onChange={(e) => setFormData({ ...formData, minLevel: parseInt(e.target.value) || 0 })}
                  data-testid="input-min-level"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxLevel">Max Stock Level</Label>
                <Input
                  id="maxLevel"
                  type="number"
                  min="0"
                  value={formData.maxLevel}
                  onChange={(e) => setFormData({ ...formData, maxLevel: parseInt(e.target.value) || 0 })}
                  data-testid="input-max-level"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="location">Default Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., A-01-01"
                  data-testid="input-location"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button type="submit" data-testid="button-save">
                {editingProduct ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-20 h-20 rounded-md bg-muted">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold" data-testid="text-product-name">{selectedProduct.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedProduct.sku}</p>
                  <p className="text-lg font-semibold mt-2">${selectedProduct.price.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{selectedProduct.category}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Unit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{selectedProduct.uom}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Stock Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Current Stock</span>
                    <span className={cn(
                      "font-semibold",
                      isLowStock(selectedProduct) && "text-red-600 dark:text-red-400"
                    )}>
                      {selectedProduct.stock} {selectedProduct.uom}
                    </span>
                  </div>
                  {isLowStock(selectedProduct) && (
                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Below minimum stock level</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min Level</span>
                    <span>{selectedProduct.minLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Level</span>
                    <span>{selectedProduct.maxLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span>{selectedProduct.location}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Stock Value</span>
                    <span className="font-semibold">
                      ${(selectedProduct.stock * selectedProduct.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
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
