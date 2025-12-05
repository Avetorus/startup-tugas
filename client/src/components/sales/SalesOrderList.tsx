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
import { Plus, Download, Eye, Edit, Trash2 } from "lucide-react";
import { mockSalesOrders, mockCustomers, mockProducts } from "@/lib/mockData";
import { SalesOrderForm } from "./SalesOrderForm";
import { SalesOrderDetail } from "./SalesOrderDetail";

type SalesOrder = typeof mockSalesOrders[0];

export function SalesOrderList() {
  const [orders, setOrders] = useState(mockSalesOrders);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);

  const handleCreateOrder = (orderData: Partial<SalesOrder>) => {
    // todo: remove mock functionality
    const newOrder: SalesOrder = {
      id: `SO-${String(orders.length + 1).padStart(3, "0")}`,
      customerId: orderData.customerId || "",
      customerName: mockCustomers.find(c => c.id === orderData.customerId)?.name || "",
      date: new Date().toISOString().split("T")[0],
      status: "draft",
      total: orderData.total || 0,
      items: orderData.items || 0,
    };
    setOrders([newOrder, ...orders]);
    setIsFormOpen(false);
    console.log("Created order:", newOrder);
  };

  const handleViewOrder = (order: SalesOrder) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleEditOrder = (order: SalesOrder) => {
    setEditingOrder(order);
    setIsFormOpen(true);
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders(orders.filter(o => o.id !== orderId));
    console.log("Deleted order:", orderId);
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setOrders(orders.map(o => 
      o.id === orderId ? { ...o, status: newStatus } : o
    ));
    console.log("Status changed:", orderId, newStatus);
  };

  const handleExport = () => {
    // todo: remove mock functionality
    const csv = [
      ["Order ID", "Customer", "Date", "Status", "Total", "Items"].join(","),
      ...orders.map(o => [o.id, o.customerName, o.date, o.status, o.total, o.items].join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sales_orders.csv";
    a.click();
    console.log("Exported orders to CSV");
  };

  const columns: Column<SalesOrder>[] = [
    { key: "id", header: "Order ID", sortable: true },
    { key: "customerName", header: "Customer", sortable: true },
    { key: "date", header: "Date", sortable: true },
    { 
      key: "status", 
      header: "Status",
      render: (item) => <StatusBadge status={item.status as "draft" | "confirmed" | "delivered" | "invoiced"} />
    },
    { key: "items", header: "Items", sortable: true, className: "text-center" },
    { 
      key: "total", 
      header: "Total", 
      sortable: true,
      className: "text-right",
      render: (item) => `$${item.total.toLocaleString()}`
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (item) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleViewOrder(item)}
            data-testid={`button-view-${item.id}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleEditOrder(item)}
            data-testid={`button-edit-${item.id}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleDeleteOrder(item.id)}
            data-testid={`button-delete-${item.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Sales Orders"
        description="Manage and track all sales orders"
        actions={
          <>
            <Button variant="outline" onClick={handleExport} data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => { setEditingOrder(null); setIsFormOpen(true); }} data-testid="button-new-order">
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </>
        }
      />

      <DataTable
        data={orders}
        columns={columns}
        searchKey="customerName"
        searchPlaceholder="Search by customer..."
        onRowClick={handleViewOrder}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOrder ? "Edit Sales Order" : "New Sales Order"}</DialogTitle>
          </DialogHeader>
          <SalesOrderForm
            order={editingOrder}
            customers={mockCustomers}
            products={mockProducts}
            onSubmit={handleCreateOrder}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sales Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <SalesOrderDetail
              order={selectedOrder}
              onStatusChange={handleStatusChange}
              onClose={() => setIsDetailOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
