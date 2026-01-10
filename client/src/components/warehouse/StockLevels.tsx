import { useState } from "react";
import { DataTable, type Column } from "@/components/layout/DataTable";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Package, AlertTriangle, DollarSign, ArrowUpDown, Warehouse } from "lucide-react";
import { useMockData, type StockLevel } from "@/lib/MockDataContext";
import { cn } from "@/lib/utils";

// Display type for table
interface StockLevelDisplay extends StockLevel {
  productName: string;
  productSku: string;
  warehouseName: string;
  locationCode: string;
  costPrice: number;
  uom: string;
}

export function StockLevels() {
  const { stockLevels, products, warehouses, locations } = useMockData();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");

  console.log("StockLevels render - stockLevels:", stockLevels.length, "items", stockLevels.map(s => `${s.productId}:${s.quantity}`));

  // Map stock levels to display format
  const stockLevelsDisplay: StockLevelDisplay[] = stockLevels.map(sl => {
    const product = products.find(p => p.id === sl.productId);
    const warehouse = warehouses.find(w => w.id === sl.warehouseId);
    const location = locations.find(l => l.id === sl.locationId);
    return {
      ...sl,
      productName: product?.name || "Unknown Product",
      productSku: product?.sku || "",
      warehouseName: warehouse?.name || "Unknown",
      locationCode: location?.code || "Unknown",
      costPrice: product?.costPrice || 0,
      uom: product?.uom || "EA",
    };
  });

  // Filter by warehouse
  const filteredByWarehouse = selectedWarehouse === "all"
    ? stockLevelsDisplay
    : stockLevelsDisplay.filter(sl => sl.warehouseId === selectedWarehouse);

  const lowStockItems = filteredByWarehouse.filter(sl => sl.quantity < sl.minLevel);
  const totalValue = filteredByWarehouse.reduce((sum, sl) => sum + (sl.quantity * sl.costPrice), 0);
  const totalItems = filteredByWarehouse.reduce((sum, sl) => sum + sl.quantity, 0);

  const getFilteredStockLevels = () => {
    switch (activeTab) {
      case "low":
        return lowStockItems;
      case "optimal":
        return filteredByWarehouse.filter(sl => sl.quantity >= sl.minLevel && sl.quantity <= sl.maxLevel);
      case "overstock":
        return filteredByWarehouse.filter(sl => sl.quantity > sl.maxLevel);
      default:
        return filteredByWarehouse;
    }
  };

  const columns: Column<StockLevelDisplay>[] = [
    { key: "productSku", header: "SKU", sortable: true },
    { key: "productName", header: "Product", sortable: true },
    { key: "warehouseName", header: "Warehouse", sortable: true },
    { key: "locationCode", header: "Location", sortable: true },
    { 
      key: "quantity", 
      header: "Current Stock", 
      sortable: true,
      className: "text-right",
      render: (item) => (
        <span className={cn(
          item.quantity < item.minLevel && "text-red-600 dark:text-red-400 font-medium"
        )}>
          {item.quantity} {item.uom}
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
      render: (item) => `$${(item.quantity * item.costPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    },
    { 
      key: "status", 
      header: "Status",
      render: (item) => {
        if (item.quantity < item.minLevel) {
          return (
            <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-3 w-3" />
              <span className="text-sm">Low Stock</span>
            </div>
          );
        }
        if (item.quantity > item.maxLevel) {
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
        description="Real-time inventory overview by warehouse location"
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
          </div>
        }
      />

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Stock Entries"
          value={filteredByWarehouse.length}
          icon={Package}
        />
        <StatCard
          title="Total Items"
          value={totalItems}
          icon={ArrowUpDown}
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStockItems.length}
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
            All ({filteredByWarehouse.length})
          </TabsTrigger>
          <TabsTrigger value="low" data-testid="tab-low">
            Low Stock ({lowStockItems.length})
          </TabsTrigger>
          <TabsTrigger value="optimal" data-testid="tab-optimal">
            Optimal ({filteredByWarehouse.filter(sl => sl.quantity >= sl.minLevel && sl.quantity <= sl.maxLevel).length})
          </TabsTrigger>
          <TabsTrigger value="overstock" data-testid="tab-overstock">
            Overstock ({filteredByWarehouse.filter(sl => sl.quantity > sl.maxLevel).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <DataTable
            data={getFilteredStockLevels()}
            columns={columns}
            searchKey="productName"
            searchPlaceholder="Search products..."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
