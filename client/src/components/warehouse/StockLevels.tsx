import { useState } from "react";
import { DataTable, type Column } from "@/components/layout/DataTable";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Package, AlertTriangle, DollarSign, ArrowUpDown } from "lucide-react";
import { mockProducts } from "@/lib/mockData";
import { cn } from "@/lib/utils";

type Product = typeof mockProducts[0];

export function StockLevels() {
  const [products] = useState(mockProducts);
  const [activeTab, setActiveTab] = useState("all");

  const lowStockProducts = products.filter(p => p.stock < p.minLevel);
  const totalValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const totalItems = products.reduce((sum, p) => sum + p.stock, 0);

  const getFilteredProducts = () => {
    switch (activeTab) {
      case "low":
        return lowStockProducts;
      case "optimal":
        return products.filter(p => p.stock >= p.minLevel && p.stock <= p.maxLevel);
      case "overstock":
        return products.filter(p => p.stock > p.maxLevel);
      default:
        return products;
    }
  };

  const columns: Column<Product>[] = [
    { key: "sku", header: "SKU", sortable: true },
    { key: "name", header: "Product", sortable: true },
    { key: "category", header: "Category", sortable: true },
    { 
      key: "stock", 
      header: "Current Stock", 
      sortable: true,
      className: "text-right",
      render: (item) => (
        <span className={cn(
          item.stock < item.minLevel && "text-red-600 dark:text-red-400 font-medium"
        )}>
          {item.stock} {item.uom}
        </span>
      )
    },
    { 
      key: "minLevel", 
      header: "Min", 
      sortable: true,
      className: "text-right"
    },
    { 
      key: "maxLevel", 
      header: "Max", 
      sortable: true,
      className: "text-right"
    },
    { 
      key: "value", 
      header: "Value", 
      sortable: true,
      className: "text-right",
      render: (item) => `$${(item.stock * item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    },
    { 
      key: "status", 
      header: "Status",
      render: (item) => {
        if (item.stock < item.minLevel) {
          return (
            <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-3 w-3" />
              <span className="text-sm">Low Stock</span>
            </div>
          );
        }
        if (item.stock > item.maxLevel) {
          return <span className="text-sm text-amber-600 dark:text-amber-400">Overstock</span>;
        }
        return <span className="text-sm text-green-600 dark:text-green-400">Optimal</span>;
      }
    },
  ];

  return (
    <div>
      <PageHeader
        title="Stock Levels"
        description="Real-time inventory overview and alerts"
        actions={
          <Button variant="outline" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        }
      />

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Products"
          value={products.length}
          icon={Package}
        />
        <StatCard
          title="Total Items"
          value={totalItems}
          icon={ArrowUpDown}
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStockProducts.length}
          icon={AlertTriangle}
        />
        <StatCard
          title="Total Value"
          value={`$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}`}
          icon={DollarSign}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all" data-testid="tab-all">
            All ({products.length})
          </TabsTrigger>
          <TabsTrigger value="low" data-testid="tab-low">
            Low Stock ({lowStockProducts.length})
          </TabsTrigger>
          <TabsTrigger value="optimal" data-testid="tab-optimal">
            Optimal ({products.filter(p => p.stock >= p.minLevel && p.stock <= p.maxLevel).length})
          </TabsTrigger>
          <TabsTrigger value="overstock" data-testid="tab-overstock">
            Overstock ({products.filter(p => p.stock > p.maxLevel).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <DataTable
            data={getFilteredProducts()}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Search products..."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
