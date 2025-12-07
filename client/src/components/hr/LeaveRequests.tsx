import { useState } from "react";
import { DataTable, type Column } from "@/components/layout/DataTable";
import { StatusBadge, StatusType } from "@/components/layout/StatusBadge";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Download, CheckCircle, XCircle } from "lucide-react";
import { mockLeaveRequests, mockEmployees } from "@/lib/mockData";

type LeaveRequest = typeof mockLeaveRequests[0];

export function LeaveRequests() {
  const [requests, setRequests] = useState(mockLeaveRequests);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: "",
    type: "vacation",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const employee = mockEmployees.find(e => e.id === formData.employeeId);
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // todo: remove mock functionality
    const newRequest: LeaveRequest = {
      id: `LR-${String(requests.length + 1).padStart(3, "0")}`,
      employeeId: formData.employeeId,
      employeeName: employee?.name || "",
      type: formData.type as "vacation" | "sick" | "personal",
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: "pending",
      days,
    };
    setRequests([newRequest, ...requests]);
    console.log("Created leave request:", newRequest);
    setIsFormOpen(false);
    setFormData({ employeeId: "", type: "vacation", startDate: "", endDate: "", reason: "" });
  };

  const handleApprove = (requestId: string) => {
    setRequests(requests.map(r => 
      r.id === requestId ? { ...r, status: "approved" } : r
    ));
    console.log("Approved leave request:", requestId);
  };

  const handleReject = (requestId: string) => {
    setRequests(requests.map(r => 
      r.id === requestId ? { ...r, status: "rejected" } : r
    ));
    console.log("Rejected leave request:", requestId);
  };

  const columns: Column<LeaveRequest>[] = [
    { key: "id", header: "Request #", sortable: true },
    { key: "employeeName", header: "Employee", sortable: true },
    { 
      key: "type", 
      header: "Type",
      render: (item) => <StatusBadge status={item.type as StatusType} />
    },
    { key: "startDate", header: "Start Date", sortable: true },
    { key: "endDate", header: "End Date", sortable: true },
    { key: "days", header: "Days", className: "text-center" },
    { 
      key: "status", 
      header: "Status",
      render: (item) => <StatusBadge status={item.status as "pending" | "approved" | "rejected"} />
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (item) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {item.status === "pending" && (
            <>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleApprove(item.id)}
                className="text-green-600 hover:text-green-700"
                data-testid={`button-approve-${item.id}`}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleReject(item.id)}
                className="text-red-600 hover:text-red-700"
                data-testid={`button-reject-${item.id}`}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Leave Requests"
        description="Manage employee leave requests"
        actions={
          <>
            <Button variant="outline" data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setIsFormOpen(true)} data-testid="button-new-request">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </>
        }
      />

      <DataTable
        data={requests}
        columns={columns}
        searchKey="employeeName"
        searchPlaceholder="Search requests..."
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Leave Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee *</Label>
              <Select
                value={formData.employeeId}
                onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
              >
                <SelectTrigger data-testid="select-employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {mockEmployees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Leave Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger data-testid="select-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  data-testid="input-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  data-testid="input-end-date"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={2}
                data-testid="textarea-reason"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!formData.employeeId || !formData.startDate || !formData.endDate}
                data-testid="button-submit"
              >
                Submit Request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
