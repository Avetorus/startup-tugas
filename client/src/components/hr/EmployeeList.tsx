import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable, type Column } from "@/components/layout/DataTable";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Download, Eye, Edit, Trash2 } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { exportToCSV } from "@/lib/export";
import type { Employee, InsertEmployee } from "@shared/schema";

export function EmployeeList() {
  const { activeCompany } = useCompany();
  const { toast } = useToast();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    position: "",
    status: "active",
  });

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/companies", activeCompany?.id, "employees"],
    enabled: !!activeCompany?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<InsertEmployee>) => {
      const employeeCode = `E${String(Date.now()).slice(-6)}`;
      return apiRequest("POST", `/api/companies/${activeCompany?.id}/employees`, {
        ...data,
        employeeCode,
        companyId: activeCompany?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "employees"] });
      toast({ title: "Employee created successfully" });
      setIsFormOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create employee", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Employee> }) => {
      return apiRequest("PATCH", `/api/companies/${activeCompany?.id}/employees/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "employees"] });
      toast({ title: "Employee updated successfully" });
      setIsFormOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update employee", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/companies/${activeCompany?.id}/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", activeCompany?.id, "employees"] });
      toast({ title: "Employee deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete employee", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      department: "",
      position: "",
      status: "active",
    });
    setEditingEmployee(null);
  };

  const handleOpenForm = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        email: employee.email || "",
        department: employee.department || "",
        position: employee.position || "",
        status: employee.status || "active",
      });
    } else {
      resetForm();
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDetailOpen(true);
  };

  const handleDeleteEmployee = (employeeId: string) => {
    deleteMutation.mutate(employeeId);
  };

  
  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const columns: Column<Employee>[] = [
    { 
      key: "name", 
      header: "Employee", 
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials(item.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground">{item.email}</p>
          </div>
        </div>
      )
    },
    { key: "department", header: "Department", sortable: true },
    { key: "position", header: "Position", sortable: true },
    { 
      key: "status", 
      header: "Status",
      render: (item) => <StatusBadge status={item.status as "active" | "on-leave" | "inactive"} />
    },
    { 
      key: "hireDate", 
      header: "Hire Date", 
      sortable: true,
      render: (item) => item.hireDate ? new Date(item.hireDate).toLocaleDateString() : "-"
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (item) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => handleViewEmployee(item)} data-testid={`button-view-${item.id}`}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleOpenForm(item)} data-testid={`button-edit-${item.id}`}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleDeleteEmployee(item.id)} 
            disabled={deleteMutation.isPending}
            data-testid={`button-delete-${item.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleExport = () => {
    if (employees.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    exportToCSV(
      employees.map(e => ({
        code: e.employeeCode,
        name: e.name,
        email: e.email || "",
        department: e.department || "",
        position: e.position || "",
        hireDate: e.hireDate ? new Date(e.hireDate).toLocaleDateString("id-ID") : "",
        salary: e.salary,
        status: e.status
      })),
      [
        { key: "code", label: "Employee Code" },
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "department", label: "Department" },
        { key: "position", label: "Position" },
        { key: "hireDate", label: "Hire Date" },
        { key: "salary", label: "Base Salary (IDR)" },
        { key: "status", label: "Status" }
      ],
      "employees"
    );
    toast({ title: "Employees exported successfully" });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Employees" description="Manage employee directory" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Manage employee directory"
        actions={
          <>
            <Button variant="outline" onClick={handleExport} data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => handleOpenForm()} data-testid="button-new-employee">
              <Plus className="h-4 w-4 mr-2" />
              New Employee
            </Button>
          </>
        }
      />

      <DataTable
        data={employees}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Search employees..."
        onRowClick={handleViewEmployee}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? "Edit Employee" : "New Employee"}</DialogTitle>
            <DialogDescription>
              {editingEmployee ? "Update the employee details below." : "Add a new employee to the directory."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="input-employee-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="input-employee-email"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  data-testid="input-employee-department"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  data-testid="input-employee-position"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger data-testid="select-employee-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-leave">On Leave</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!formData.name || createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-employee"
              >
                {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : (editingEmployee ? "Update" : "Create")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
            <DialogDescription>
              View employee information for {selectedEmployee?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {getInitials(selectedEmployee.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold" data-testid="text-employee-name">{selectedEmployee.name}</h3>
                  <p className="text-muted-foreground">{selectedEmployee.position || "No position"}</p>
                  <StatusBadge status={selectedEmployee.status as "active" | "on-leave" | "inactive"} />
                </div>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Email</span>
                    <span data-testid="text-employee-email">{selectedEmployee.email || "-"}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Phone</span>
                    <span>{selectedEmployee.phone || "-"}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Employment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Employee Code</span>
                    <span>{selectedEmployee.employeeCode}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Department</span>
                    <span>{selectedEmployee.department || "-"}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Hire Date</span>
                    <span data-testid="text-employee-hire-date">
                      {selectedEmployee.hireDate ? new Date(selectedEmployee.hireDate).toLocaleDateString() : "-"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)} data-testid="button-close-detail">
                  Close
                </Button>
                <Button onClick={() => { setIsDetailOpen(false); handleOpenForm(selectedEmployee); }} data-testid="button-edit-from-detail">
                  Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
