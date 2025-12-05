import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import type { mockCustomers, mockProducts, mockSalesOrders } from "@/lib/mockData";

type Customer = typeof mockCustomers[0];
type Product = typeof mockProducts[0];
type SalesOrder = typeof mockSalesOrders[0];

interface OrderLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  tax: number;
  total: number;
}

interface SalesOrderFormProps {
  order?: SalesOrder | null;
  customers: Customer[];
  products: Product[];
  onSubmit: (order: Partial<SalesOrder>) => void;
  onCancel: () => void;
}

export function SalesOrderForm({ order, customers, products, onSubmit, onCancel }: SalesOrderFormProps) {
  const [customerId, setCustomerId] = useState(order?.customerId || "");
  const [lines, setLines] = useState<OrderLine[]>([
    // todo: remove mock functionality - initial empty line
    { id: "1", productId: "", productName: "", quantity: 1, price: 0, tax: 0, total: 0 },
  ]);

  const handleAddLine = () => {
    const newLine: OrderLine = {
      id: String(Date.now()),
      productId: "",
      productName: "",
      quantity: 1,
      price: 0,
      tax: 0,
      total: 0,
    };
    setLines([...lines, newLine]);
  };

  const handleRemoveLine = (id: string) => {
    if (lines.length > 1) {
      setLines(lines.filter((l) => l.id !== id));
    }
  };

  const handleLineChange = (id: string, field: keyof OrderLine, value: string | number) => {
    setLines(lines.map((line) => {
      if (line.id !== id) return line;

      const updated = { ...line, [field]: value };

      if (field === "productId") {
        const product = products.find((p) => p.id === value);
        if (product) {
          updated.productName = product.name;
          updated.price = product.price;
        }
      }

      if (field === "quantity" || field === "price" || field === "tax" || field === "productId") {
        const subtotal = updated.quantity * updated.price;
        updated.total = subtotal + (subtotal * updated.tax / 100);
      }

      return updated;
    }));
  };

  const subtotal = lines.reduce((sum, line) => sum + (line.quantity * line.price), 0);
  const totalTax = lines.reduce((sum, line) => sum + (line.quantity * line.price * line.tax / 100), 0);
  const grandTotal = subtotal + totalTax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      customerId,
      total: grandTotal,
      items: lines.filter(l => l.productId).length,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="customer">Customer *</Label>
          <Select value={customerId} onValueChange={setCustomerId} required>
            <SelectTrigger data-testid="select-customer">
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Order Lines</Label>
          <Button type="button" variant="outline" size="sm" onClick={handleAddLine} data-testid="button-add-line">
            <Plus className="h-4 w-4 mr-1" />
            Add Line
          </Button>
        </div>

        <div className="border rounded-md divide-y">
          <div className="grid grid-cols-12 gap-2 p-3 bg-muted/50 text-sm font-medium">
            <div className="col-span-4">Product</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-1 text-center">Tax %</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-1"></div>
          </div>

          {lines.map((line, index) => (
            <div key={line.id} className="grid grid-cols-12 gap-2 p-3 items-center">
              <div className="col-span-4">
                <Select
                  value={line.productId}
                  onValueChange={(value) => handleLineChange(line.id, "productId", value)}
                >
                  <SelectTrigger data-testid={`select-product-${index}`}>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (${product.price})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  min="1"
                  value={line.quantity}
                  onChange={(e) => handleLineChange(line.id, "quantity", parseInt(e.target.value) || 1)}
                  className="text-center"
                  data-testid={`input-quantity-${index}`}
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={line.price}
                  onChange={(e) => handleLineChange(line.id, "price", parseFloat(e.target.value) || 0)}
                  className="text-right"
                  data-testid={`input-price-${index}`}
                />
              </div>
              <div className="col-span-1">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={line.tax}
                  onChange={(e) => handleLineChange(line.id, "tax", parseFloat(e.target.value) || 0)}
                  className="text-center"
                  data-testid={`input-tax-${index}`}
                />
              </div>
              <div className="col-span-2 text-right font-medium">
                ${line.total.toFixed(2)}
              </div>
              <div className="col-span-1 text-right">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveLine(line.id)}
                  disabled={lines.length === 1}
                  data-testid={`button-remove-line-${index}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <div className="w-64 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>${totalTax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold pt-2 border-t">
            <span>Total</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
          Cancel
        </Button>
        <Button type="submit" disabled={!customerId} data-testid="button-save-order">
          {order ? "Update Order" : "Create Order"}
        </Button>
      </div>
    </form>
  );
}
