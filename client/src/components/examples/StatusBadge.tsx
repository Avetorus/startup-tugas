import { StatusBadge } from "../layout/StatusBadge";

export default function StatusBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2">
      <StatusBadge status="draft" />
      <StatusBadge status="confirmed" />
      <StatusBadge status="delivered" />
      <StatusBadge status="invoiced" />
      <StatusBadge status="paid" />
      <StatusBadge status="unpaid" />
      <StatusBadge status="partial" />
      <StatusBadge status="active" />
      <StatusBadge status="pending" />
    </div>
  );
}
