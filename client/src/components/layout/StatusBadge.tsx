import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusType = 
  | "draft" | "confirmed" | "delivered" | "invoiced" 
  | "paid" | "unpaid" | "partial" 
  | "ordered" | "received"
  | "picking" | "packing" | "shipped"
  | "active" | "inactive" | "pending" | "on-leave"
  | "approved" | "rejected"
  | "asset" | "liability" | "equity" | "revenue" | "expense"
  | "posted" | "IN" | "OUT" | "TRANSFER"
  | "vacation" | "sick" | "personal"
  | "present" | "absent"
  | "standard" | "transit" | "virtual"
  | "regular" | "wholesale" | "distributor";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusStyles: Record<StatusType, string> = {
  draft: "bg-muted text-muted-foreground",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  delivered: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  invoiced: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  unpaid: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  partial: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ordered: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  received: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  picking: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  packing: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  shipped: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  inactive: "bg-muted text-muted-foreground",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "on-leave": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  asset: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  liability: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  equity: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  revenue: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  expense: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  posted: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  IN: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  OUT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  TRANSFER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  vacation: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  sick: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  personal: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  present: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  absent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  standard: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  transit: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  virtual: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  regular: "bg-muted text-muted-foreground",
  wholesale: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  distributor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const displayText = status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ");
  
  return (
    <Badge 
      variant="secondary"
      className={cn("font-medium", statusStyles[status], className)}
    >
      {displayText}
    </Badge>
  );
}
