import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronRight,
  ChevronDown,
  Globe,
  Building,
  GitBranch,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Company, CompanyHierarchyNode } from "@shared/schema";
import { COMPANY_TYPES, COMPANY_LEVELS } from "@shared/schema";
import { cn } from "@/lib/utils";

// Strict 3-level hierarchy: Holding (level 1) -> Subsidiary (level 2) -> Branch (level 3)
const companyFormSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  code: z.string().min(1, "Company code is required").max(10, "Max 10 characters"),
  companyType: z.enum([COMPANY_TYPES.HOLDING, COMPANY_TYPES.SUBSIDIARY, COMPANY_TYPES.BRANCH]),
  parentId: z.string().nullable(),
  taxId: z.string().optional(),
  registrationNumber: z.string().optional(),
  currency: z.string().min(3, "Currency code required").max(3, "3-letter code"),
  fiscalYearEnd: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
}).refine((data) => {
  // Holding company must have no parent
  if (data.companyType === COMPANY_TYPES.HOLDING && data.parentId) {
    return false;
  }
  // Subsidiary and Branch must have a parent
  if ((data.companyType === COMPANY_TYPES.SUBSIDIARY || data.companyType === COMPANY_TYPES.BRANCH) && !data.parentId) {
    return false;
  }
  return true;
}, {
  message: "Holding has no parent; Subsidiary/Branch must have a parent",
  path: ["parentId"],
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

const companyTypeIcons: Record<string, typeof Building2> = {
  holding: Globe,
  subsidiary: Building,
  branch: GitBranch,
};

const companyTypeColors: Record<string, string> = {
  holding: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  subsidiary: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  branch: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
};

// Company type descriptions for the UI
const companyTypeDescriptions: Record<string, string> = {
  holding: "Level 1: Top-level entity that owns subsidiaries. Can consolidate all data.",
  subsidiary: "Level 2: Owned by a Holding. Can have Branches and consolidate their data.",
  branch: "Level 3: Operational unit owned by a Subsidiary. Can only see its own data.",
};

interface HierarchyTreeProps {
  nodes: CompanyHierarchyNode[];
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
  depth?: number;
}

function HierarchyTree({ nodes, onEdit, onDelete, depth = 0 }: HierarchyTreeProps) {
  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <HierarchyNode 
          key={node.company.id} 
          node={node} 
          onEdit={onEdit}
          onDelete={onDelete}
          depth={depth} 
        />
      ))}
    </div>
  );
}

interface HierarchyNodeProps {
  node: CompanyHierarchyNode;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
  depth: number;
}

function HierarchyNode({ node, onEdit, onDelete, depth }: HierarchyNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const Icon = companyTypeIcons[node.company.companyType] || Building2;

  return (
    <div>
      <div 
        className="flex items-center gap-2 p-2 rounded-md hover-elevate group"
        style={{ marginLeft: `${depth * 24}px` }}
        data-testid={`company-node-${node.company.id}`}
      >
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-accent rounded"
            data-testid={`button-toggle-${node.company.id}`}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        
        <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate" data-testid={`text-company-${node.company.id}`}>
              {node.company.name}
            </span>
            <Badge variant="outline" className="text-xs shrink-0">
              {node.company.code}
            </Badge>
            <Badge 
              variant="secondary" 
              className={cn("text-xs shrink-0", companyTypeColors[node.company.companyType])}
            >
              {node.company.companyType}
            </Badge>
            {node.company.currency !== "USD" && (
              <Badge variant="outline" className="text-xs shrink-0">
                {node.company.currency}
              </Badge>
            )}
          </div>
          {node.company.city && node.company.country && (
            <p className="text-xs text-muted-foreground truncate">
              {node.company.city}, {node.company.country}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(node.company)}
            data-testid={`button-edit-${node.company.id}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(node.company)}
            disabled={hasChildren}
            data-testid={`button-delete-${node.company.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <HierarchyTree 
          nodes={node.children} 
          onEdit={onEdit}
          onDelete={onDelete}
          depth={depth + 1} 
        />
      )}
    </div>
  );
}

export function CompanyManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Company | null>(null);

  // Fetch all companies
  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  // Fetch company hierarchy
  const { data: hierarchy = [] } = useQuery<CompanyHierarchyNode[]>({
    queryKey: ["/api/companies/hierarchy"],
  });

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      code: "",
      companyType: "subsidiary",
      parentId: null,
      currency: "USD",
      taxId: "",
      registrationNumber: "",
      fiscalYearEnd: "12-31",
      address: "",
      city: "",
      country: "",
      phone: "",
      email: "",
      website: "",
    },
  });

  // Create company mutation
  const createMutation = useMutation({
    mutationFn: async (data: CompanyFormValues) => {
      const response = await apiRequest("POST", "/api/companies", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "Company created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update company mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CompanyFormValues }) => {
      const response = await apiRequest("PATCH", `/api/companies/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "Company updated successfully" });
      setIsDialogOpen(false);
      setEditingCompany(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete company mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/companies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "Company deleted successfully" });
      setDeleteConfirm(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    form.reset({
      name: company.name,
      code: company.code,
      companyType: company.companyType as "holding" | "subsidiary" | "branch",
      parentId: company.parentId,
      currency: company.currency,
      taxId: company.taxId || "",
      registrationNumber: "",
      fiscalYearEnd: "12-31",
      address: company.address || "",
      city: company.city || "",
      country: company.country || "",
      phone: company.phone || "",
      email: company.email || "",
      website: company.website || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (company: Company) => {
    setDeleteConfirm(company);
  };

  const handleSubmit = (values: CompanyFormValues) => {
    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpenDialog = () => {
    setEditingCompany(null);
    form.reset();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            Company Management
          </h1>
          <p className="text-muted-foreground">
            Manage your organization's company structure and hierarchy
          </p>
        </div>
        <Button onClick={handleOpenDialog} data-testid="button-add-company">
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      <Tabs defaultValue="hierarchy" className="space-y-4">
        <TabsList data-testid="tabs-view-selector">
          <TabsTrigger value="hierarchy" data-testid="tab-hierarchy">
            <GitBranch className="h-4 w-4 mr-2" />
            Hierarchy View
          </TabsTrigger>
          <TabsTrigger value="list" data-testid="tab-list">
            <Building2 className="h-4 w-4 mr-2" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hierarchy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Organization Structure
              </CardTitle>
              <CardDescription>
                Visual representation of your company hierarchy
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hierarchy.length > 0 ? (
                <HierarchyTree 
                  nodes={hierarchy} 
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ) : isLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mb-2 opacity-50" />
                  <p>No companies found</p>
                  <Button variant="outline" className="mt-4" onClick={handleOpenDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Company
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>All Companies</CardTitle>
              <CardDescription>
                Complete list of all companies in your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table data-testid="table-companies">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => {
                    const Icon = companyTypeIcons[company.companyType] || Building2;
                    return (
                      <TableRow key={company.id} data-testid={`row-company-${company.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{company.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{company.code}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary"
                            className={companyTypeColors[company.companyType]}
                          >
                            {company.companyType}
                          </Badge>
                        </TableCell>
                        <TableCell>{company.currency}</TableCell>
                        <TableCell>
                          {company.city && company.country 
                            ? `${company.city}, ${company.country}`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={company.isActive ? "default" : "secondary"}>
                            {company.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(company)}
                              data-testid={`button-edit-list-${company.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(company)}
                              data-testid={`button-delete-list-${company.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {companies.length === 0 && !isLoading && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No companies found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Company Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCompany ? "Edit Company" : "Add New Company"}
            </DialogTitle>
            <DialogDescription>
              {editingCompany 
                ? "Update the company information below"
                : "Fill in the details to create a new company"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Acme Corporation" 
                          {...field} 
                          data-testid="input-company-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="ACME" 
                          maxLength={10}
                          {...field} 
                          data-testid="input-company-code"
                        />
                      </FormControl>
                      <FormDescription>Short identifier (max 10 chars)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="companyType"
                  render={({ field }) => {
                    // Watch company type to filter parent options
                    const selectedType = field.value;
                    return (
                      <FormItem>
                        <FormLabel>Company Type</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Reset parent when type changes
                            if (value === COMPANY_TYPES.HOLDING) {
                              form.setValue("parentId", null);
                            }
                          }} 
                          value={field.value}
                          data-testid="select-company-type"
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={COMPANY_TYPES.HOLDING}>
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Holding Company (Level 1)
                              </div>
                            </SelectItem>
                            <SelectItem value={COMPANY_TYPES.SUBSIDIARY}>
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                Subsidiary (Level 2)
                              </div>
                            </SelectItem>
                            <SelectItem value={COMPANY_TYPES.BRANCH}>
                              <div className="flex items-center gap-2">
                                <GitBranch className="h-4 w-4" />
                                Branch (Level 3)
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {selectedType && companyTypeDescriptions[selectedType]}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="parentId"
                  render={({ field }) => {
                    const selectedType = form.watch("companyType");
                    const isHolding = selectedType === COMPANY_TYPES.HOLDING;
                    
                    // Filter parent options based on company type
                    // Subsidiary can only have Holding parent (level 1)
                    // Branch can only have Subsidiary parent (level 2)
                    const filteredParents = companies.filter(c => {
                      if (c.id === editingCompany?.id) return false;
                      if (selectedType === COMPANY_TYPES.SUBSIDIARY) {
                        return c.companyType === COMPANY_TYPES.HOLDING;
                      }
                      if (selectedType === COMPANY_TYPES.BRANCH) {
                        return c.companyType === COMPANY_TYPES.SUBSIDIARY;
                      }
                      return false;
                    });

                    return (
                      <FormItem>
                        <FormLabel>Parent Company</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "__none__" ? null : value)} 
                          value={field.value || "__none__"}
                          disabled={isHolding}
                          data-testid="select-parent-company"
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={isHolding ? "N/A for Holding" : "Select parent"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isHolding ? (
                              <SelectItem value="__none__">No Parent (Root)</SelectItem>
                            ) : (
                              <>
                                {filteredParents.length === 0 ? (
                                  <SelectItem value="__none__" disabled>
                                    {selectedType === COMPANY_TYPES.SUBSIDIARY 
                                      ? "No Holdings available" 
                                      : "No Subsidiaries available"}
                                  </SelectItem>
                                ) : (
                                  filteredParents.map(company => (
                                    <SelectItem key={company.id} value={company.id}>
                                      <div className="flex items-center gap-2">
                                        {company.name}
                                        <Badge variant="outline" className="text-xs ml-2">
                                          {company.code}
                                        </Badge>
                                      </div>
                                    </SelectItem>
                                  ))
                                )}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {isHolding 
                            ? "Holdings are root entities with no parent" 
                            : selectedType === COMPANY_TYPES.SUBSIDIARY 
                              ? "Select the Holding company that owns this subsidiary"
                              : "Select the Subsidiary that owns this branch"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              {/* Hierarchy rules info */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>3-Level Hierarchy Rules:</strong> Holding (Level 1) can have Subsidiaries. 
                  Subsidiaries (Level 2) belong to a Holding and can have Branches. 
                  Branches (Level 3) belong to a Subsidiary and cannot have children.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="USD" 
                          maxLength={3}
                          {...field} 
                          data-testid="input-currency"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax ID</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="XX-XXXXXXX" 
                          {...field} 
                          data-testid="input-tax-id"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="registrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration No.</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Business reg number" 
                          {...field} 
                          data-testid="input-registration"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Street address" 
                        className="resize-none"
                        {...field} 
                        data-testid="input-address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="City" 
                          {...field} 
                          data-testid="input-city"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Country" 
                          {...field} 
                          data-testid="input-country"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+1 (555) 000-0000" 
                          {...field} 
                          data-testid="input-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="info@company.com" 
                          {...field} 
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input 
                          type="url"
                          placeholder="https://company.com" 
                          {...field} 
                          data-testid="input-website"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {editingCompany ? "Update Company" : "Create Company"}
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
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteConfirm?.name}"? 
              This action cannot be undone.
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
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
              disabled={deleteMutation.isPending}
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
