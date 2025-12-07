import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "react-hot-toast";

type LeaveRequest = {
  id: number;
  employee_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string; // API returns string, we cast later
};

export default function LeaveRequests() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hr/leave-requests");
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      toast.error("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (id: number, status: "approved" | "rejected") => {
    try {
      const res = await fetch(`/api/hr/leave-requests/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      toast.success("Status updated");

      // Refresh data
      fetchRequests();
    } catch (err) {
      toast.error("Error updating status");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Leave Requests</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {requests.map((req) => (
            <TableRow key={req.id}>
              <TableCell>{req.employee_name}</TableCell>
              <TableCell>{req.leave_type}</TableCell>
              <TableCell>
                {req.start_date} → {req.end_date}
              </TableCell>
              <TableCell>{req.reason}</TableCell>

              <TableCell>
                {/* FIX: CAST STRING TO StatusType */}
                <StatusBadge status={req.status as any} />
              </TableCell>

              <TableCell className="text-right space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={req.status !== "pending"}
                  onClick={() => updateStatus(req.id, "approved")}
                >
                  Approve
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  disabled={req.status !== "pending"}
                  onClick={() => updateStatus(req.id, "rejected")}
                >
                  Reject
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {requests.length === 0 && !loading && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                No leave requests found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
