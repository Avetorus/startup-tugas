import { DataTable, type Column } from "../layout/DataTable";
import { StatusBadge } from "../layout/StatusBadge";
import { mockSalesOrders } from "@/lib/mockData";

type SalesOrder = typeof mockSalesOrders[0];

const columns: Column<SalesOrder>[] = [
  { key: "id", header: "Order ID", sortable: true },
  { key: "customerName", header: "Customer", sortable: true },
  { key: "date", header: "Date", sortable: true },
  { 
    key: "status", 
    header: "Status",
    render: (item) => <StatusBadge status={item.status as "draft" | "confirmed" | "delivered" | "invoiced"} />
  },
  { 
    key: "total", 
    header: "Total", 
    sortable: true,
    className: "text-right",
    render: (item) => `$${item.total.toLocaleString()}`
  },
];

export default function DataTableExample() {
  return (
    <DataTable
      data={mockSalesOrders}
      columns={columns}
      searchKey="customerName"
      searchPlaceholder="Search orders..."
      selectable
      onRowClick={(item) => console.log("Clicked:", item.id)}
    />
  );
}
