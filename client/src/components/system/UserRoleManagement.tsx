import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  Building2,
  Key,
  UserCheck,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Company, UserCompanyRole } from "@shared/schema";

interface Role {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystemRole: boolean | null;
  permissions: string[];
  createdAt: Date | null;
}

const roleFormSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
  permissions: z.array(z.string()),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

const assignmentFormSchema = z.object({
  userId: z.string().min(1, "User is required"),
  companyId: z.string().min(1, "Company is required"),
  roleId: z.string().min(1, "Role is required"),
});

type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;

const availablePermissions = [
  { id: "read:customers", label: "Read Customers", category: "Sales" },
  { id: "write:customers", label: "Write Customers", category: "Sales" },
  { id: "read:sales_orders", label: "Read Sales Orders", category: "Sales" },
  { id: "write:sales_orders", label: "Write Sales Orders", category: "Sales" },
  { id: "read:invoices", label: "Read Invoices", category: "Sales" },
  { id: "write:invoices", label: "Write Invoices", category: "Sales" },
  
  { id: "read:products", label: "Read Products", category: "Warehouse" },
  { id: "write:products", label: "Write Products", category: "Warehouse" },
  { id: "read:stock", label: "Read Stock Levels", category: "Warehouse" },
  { id: "write:stock", label: "Manage Stock", category: "Warehouse" },
  { id: "read:movements", label: "Read Movements", category: "Warehouse" },
  { id: "write:movements", label: "Write Movements", category: "Warehouse" },
  
  { id: "read:accounts", label: "Read Chart of Accounts", category: "Financials" },
  { id: "write:accounts", label: "Write Chart of Accounts", category: "Financials" },
  { id: "read:journal", label: "Read Journal Entries", category: "Financials" },
  { id: "write:journal", label: "Write Journal Entries", category: "Financials" },
  { id: "read:payables", label: "Read Payables", category: "Financials" },
  { id: "write:payables", label: "Write Payables", category: "Financials" },
  { id: "read:receivables", label: "Read Receivables", category: "Financials" },
  { id: "write:receivables", label: "Write Receivables", category: "Financials" },
  
  { id: "read:employees", label: "Read Employees", category: "HR" },
  { id: "write:employees", label: "Write Employees", category: "HR" },
  { id: "read:payroll", label: "Read Payroll", category: "HR" },
  { id: "write:payroll", label: "Write Payroll", category: "HR" },
  
  { id: "admin:companies", label: "Manage Companies", category: "System" },
  { id: "admin:users", label: "Manage Users", category: "System" },
  { id: "admin:roles", label: "Manage Roles", category: "System" },
  { id: "*", label: "All Permissions (Super Admin)", category: "System" },
];

const permissionCategories = ["Sales", "Warehouse", "Financials", "HR", "System"];

interface User {
  id: string;
  email: string;
  displayName: string;
}

export function UserRoleManagement() {
  const { toast } = useToast();
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Role | UserCompanyRole | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
  });

  // Fetch companies
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  // Fetch users
  // const { data: users = [] } = useQuery<User[]>({
  //   queryKey: ["/api/users/e776519a-504e-4eee-8b2f-8b40f1d9b2a0/companies"],
  // });

  // Fetch user-company assignments
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<UserCompanyRole[]>({
    queryKey: ["/api/user-company-roles"],
  });

  // Mock users for demo
  const users: User[] = [
    { id: "user-admin", email: "admin@unanza.com", displayName: "Admin User" },
    { id: "user-sales", email: "sales@unanza.com", displayName: "Sales Manager" },
    { id: "user-warehouse", email: "warehouse@unanza.com", displayName: "Warehouse Lead" },
    { id: "user-finance", email: "finance@unanza.com", displayName: "Finance Officer" },
  ];

  const roleForm = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
    },
  });

  const assignmentForm = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      userId: "",
      companyId: "",
      roleId: "",
    },
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data: RoleFormValues) => {
      const response = await apiRequest("POST", "/api/roles", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({ title: "Role created successfully" });
      setIsRoleDialogOpen(false);
      roleForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RoleFormValues }) => {
      const response = await apiRequest("PATCH", `/api/roles/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({ title: "Role updated successfully" });
      setIsRoleDialogOpen(false);
      setEditingRole(null);
      roleForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({ title: "Role deleted successfully" });
      setDeleteConfirm(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: AssignmentFormValues) => {
      const response = await apiRequest("POST", "/api/user-company-roles", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-company-roles"] });
      toast({ title: "Role assigned successfully" });
      setIsAssignmentDialogOpen(false);
      assignmentForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete assignment mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/user-company-roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-company-roles"] });
      toast({ title: "Assignment removed successfully" });
      setDeleteConfirm(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    roleForm.reset({
      name: role.name,
      description: role.description || "",
      permissions: role.permissions || [],
    });
    setIsRoleDialogOpen(true);
  };

  const handleSubmitRole = (values: RoleFormValues) => {
    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data: values });
    } else {
      createRoleMutation.mutate(values);
    }
  };

  const handleSubmitAssignment = (values: AssignmentFormValues) => {
    createAssignmentMutation.mutate(values);
  };

  const handleOpenRoleDialog = () => {
    setEditingRole(null);
    roleForm.reset();
    setIsRoleDialogOpen(true);
  };

  const handleOpenAssignmentDialog = () => {
    assignmentForm.reset();
    setIsAssignmentDialogOpen(true);
  };

  const filteredAssignments = assignments.filter((assignment) => {
    if (!searchTerm) return true;
    const user = users.find((u) => u.id === assignment.userId);
    const company = companies.find((c) => c.id === assignment.companyId);
    const role = roles.find((r) => r.id === assignment.roleId);
    const searchLower = searchTerm.toLowerCase();
    return (
      user?.displayName.toLowerCase().includes(searchLower) ||
      user?.email.toLowerCase().includes(searchLower) ||
      company?.name.toLowerCase().includes(searchLower) ||
      role?.name.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            User & Role Management
          </h1>
          <p className="text-muted-foreground">
            Manage roles, permissions, and user-company access assignments
          </p>
        </div>
      </div>

      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList data-testid="tabs-view-selector">
          <TabsTrigger value="assignments" data-testid="tab-assignments">
            <UserCheck className="h-4 w-4 mr-2" />
            User Assignments
          </TabsTrigger>
          <TabsTrigger value="roles" data-testid="tab-roles">
            <Shield className="h-4 w-4 mr-2" />
            Roles & Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User-Company Role Assignments
                </CardTitle>
                <CardDescription>
                  Assign roles to users for specific companies
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assignments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-[200px]"
                    data-testid="input-search-assignments"
                  />
                </div>
                <Button onClick={handleOpenAssignmentDialog} data-testid="button-add-assignment">
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Role
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table data-testid="table-assignments">
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment) => {
                    const user = users.find((u) => u.id === assignment.userId);
                    const company = companies.find((c) => c.id === assignment.companyId);
                    const role = roles.find((r) => r.id === assignment.roleId);

                    return (
                      <TableRow key={assignment.id} data-testid={`row-assignment-${assignment.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                              {user?.displayName?.charAt(0) || "U"}
                            </div>
                            <div>
                              <p className="font-medium">{user?.displayName || assignment.userId}</p>
                              <p className="text-xs text-muted-foreground">{user?.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{company?.name || assignment.companyId}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            <Shield className="h-3 w-3 mr-1" />
                            {role?.name || assignment.roleId}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={assignment.isActive === true ? "default" : "secondary"}>
                            {assignment.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteConfirm(assignment)}
                            data-testid={`button-delete-assignment-${assignment.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredAssignments.length === 0 && !assignmentsLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? "No matching assignments found" : "No role assignments yet"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Roles & Permissions
                </CardTitle>
                <CardDescription>
                  Define roles with specific permission sets
                </CardDescription>
              </div>
              <Button onClick={handleOpenRoleDialog} data-testid="button-add-role">
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </CardHeader>
            <CardContent>
              <Table data-testid="table-roles">
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id} data-testid={`row-role-${role.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{role.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {role.description || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 flex-wrap">
                          {role.permissions?.slice(0, 3).map((perm) => (
                            <Badge key={perm} variant="secondary" className="text-xs">
                              {perm === "*" ? "All" : perm}
                            </Badge>
                          ))}
                          {role.permissions && role.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditRole(role)}
                            data-testid={`button-edit-role-${role.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteConfirm(role)}
                            disabled={role.isSystemRole === true}
                            data-testid={`button-delete-role-${role.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {roles.length === 0 && !rolesLoading && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No roles defined yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Role Form Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Edit Role" : "Create New Role"}
            </DialogTitle>
            <DialogDescription>
              {editingRole
                ? "Update the role details and permissions"
                : "Define a new role with specific permissions"}
            </DialogDescription>
          </DialogHeader>

          <Form {...roleForm}>
            <form onSubmit={roleForm.handleSubmit(handleSubmitRole)} className="space-y-6">
              <FormField
                control={roleForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Sales Manager"
                        {...field}
                        data-testid="input-role-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={roleForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Brief description of this role"
                        {...field}
                        data-testid="input-role-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={roleForm.control}
                name="permissions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permissions</FormLabel>
                    <FormDescription>
                      Select the permissions for this role
                    </FormDescription>
                    <div className="space-y-4 border rounded-md p-4 max-h-[300px] overflow-y-auto">
                      {permissionCategories.map((category) => (
                        <div key={category}>
                          <h4 className="font-medium text-sm mb-2">{category}</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {availablePermissions
                              .filter((p) => p.category === category)
                              .map((permission) => (
                                <div
                                  key={permission.id}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={permission.id}
                                    checked={field.value?.includes(permission.id)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      if (checked) {
                                        field.onChange([...current, permission.id]);
                                      } else {
                                        field.onChange(
                                          current.filter((p) => p !== permission.id)
                                        );
                                      }
                                    }}
                                    data-testid={`checkbox-permission-${permission.id}`}
                                  />
                                  <label
                                    htmlFor={permission.id}
                                    className="text-sm cursor-pointer"
                                  >
                                    {permission.label}
                                  </label>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRoleDialogOpen(false)}
                  data-testid="button-cancel-role"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                  data-testid="button-submit-role"
                >
                  {editingRole ? "Update Role" : "Create Role"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Assignment Form Dialog */}
      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role to User</DialogTitle>
            <DialogDescription>
              Grant a user access to a company with a specific role
            </DialogDescription>
          </DialogHeader>

          <Form {...assignmentForm}>
            <form onSubmit={assignmentForm.handleSubmit(handleSubmitAssignment)} className="space-y-4">
              <FormField
                control={assignmentForm.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-user">
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.displayName} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={assignmentForm.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-company">
                          <SelectValue placeholder="Select a company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name} ({company.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={assignmentForm.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-role">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAssignmentDialogOpen(false)}
                  data-testid="button-cancel-assignment"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createAssignmentMutation.isPending}
                  data-testid="button-submit-assignment"
                >
                  Assign Role
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this{" "}
              {"name" in (deleteConfirm || {}) ? "role" : "assignment"}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirm) {
                  if ("name" in deleteConfirm) {
                    deleteRoleMutation.mutate(deleteConfirm.id);
                  } else {
                    deleteAssignmentMutation.mutate(deleteConfirm.id);
                  }
                }
              }}
              disabled={deleteRoleMutation.isPending || deleteAssignmentMutation.isPending}
              data-testid="button-confirm-delete"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
