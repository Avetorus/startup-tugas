import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings as SettingsIcon, Users, Shield, Palette, Bell, Save, Loader2 } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const mockRoles = [
  { id: "admin", name: "Administrator", users: 2, permissions: ["all"] },
  { id: "manager", name: "Manager", users: 5, permissions: ["read", "write", "approve"] },
  { id: "staff", name: "Staff", users: 12, permissions: ["read", "write"] },
  { id: "viewer", name: "Viewer", users: 8, permissions: ["read"] },
];

const permissionGroups = [
  { name: "Sales", permissions: ["View Orders", "Create Orders", "Edit Orders", "Delete Orders", "Approve Orders"] },
  { name: "Warehouse", permissions: ["View Products", "Manage Products", "View Stock", "Adjust Stock", "Manage POs"] },
  { name: "Financials", permissions: ["View Accounts", "Create Entries", "Post Entries", "View Reports"] },
  { name: "HR", permissions: ["View Employees", "Manage Employees", "Approve Leave", "Process Payroll"] },
];

const currencies = [
  { code: "IDR", name: "Indonesian Rupiah" },
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "MYR", name: "Malaysian Ringgit" },
  { code: "THB", name: "Thai Baht" },
];

const timezones = [
  { value: "Asia/Jakarta", label: "Jakarta (WIB)" },
  { value: "Asia/Makassar", label: "Makassar (WITA)" },
  { value: "Asia/Jayapura", label: "Jayapura (WIT)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "UTC", label: "UTC" },
];

export function Settings() {
  const { activeCompany, activeCompanyId, refreshContext } = useCompany();
  const { toast } = useToast();
  const queryClientInstance = useQueryClient();

  const [activeTab, setActiveTab] = useState("general");
  const [companyName, setCompanyName] = useState("");
  const [currency, setCurrency] = useState("IDR");
  const [timezone, setTimezone] = useState("Asia/Jakarta");
  const [locale, setLocale] = useState("id-ID");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [orderNotifications, setOrderNotifications] = useState(true);

  useEffect(() => {
    if (activeCompany) {
      setCompanyName(activeCompany.name || "");
      setCurrency(activeCompany.currency || "IDR");
      setTimezone(activeCompany.timezone || "Asia/Jakarta");
      setLocale(activeCompany.locale || "id-ID");
    }
  }, [activeCompany]);

  const updateCompanyMutation = useMutation({
    mutationFn: async (updates: { name?: string; currency?: string; timezone?: string; locale?: string }) => {
      if (!activeCompanyId) throw new Error("No active company");
      const response = await apiRequest("PATCH", `/api/companies/${activeCompanyId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Company settings have been updated successfully.",
      });
      queryClientInstance.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClientInstance.invalidateQueries({ queryKey: ["/api/session/context", activeCompanyId] });
      queryClientInstance.invalidateQueries({ queryKey: ["/api/companies/hierarchy"] });
      refreshContext();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateCompanyMutation.mutate({
      name: companyName,
      currency,
      timezone,
      locale,
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Preferences saved",
      description: "Notification preferences have been updated.",
    });
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description={`Manage settings for ${activeCompany?.name || "your company"}`}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="general" data-testid="tab-general">
            <SettingsIcon className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="roles" data-testid="tab-roles">
            <Shield className="h-4 w-4 mr-2" />
            Roles & Permissions
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" data-testid="tab-appearance">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Company Settings</CardTitle>
              <CardDescription>
                Configure settings for {activeCompany?.name || "your company"}
                {activeCompany?.companyType && (
                  <span className="ml-2 text-xs uppercase text-muted-foreground">
                    ({activeCompany.companyType})
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    data-testid="input-company-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger data-testid="select-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code} - {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger data-testid="select-timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Company Code</Label>
                  <Input
                    value={activeCompany?.code || ""}
                    disabled
                    className="bg-muted"
                    data-testid="input-company-code"
                  />
                  <p className="text-xs text-muted-foreground">Company code cannot be changed</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={handleSave} 
                  disabled={updateCompanyMutation.isPending}
                  data-testid="button-save-general"
                >
                  {updateCompanyMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Roles</CardTitle>
                <CardDescription>Manage user roles and their members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockRoles.map((role) => (
                    <div key={role.id} className="flex items-center justify-between p-3 border rounded-md hover-elevate">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{role.name}</p>
                          <p className="text-sm text-muted-foreground">{role.users} users</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" data-testid={`button-edit-role-${role.id}`}>
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Permissions Matrix</CardTitle>
                <CardDescription>Configure role permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {permissionGroups.map((group) => (
                    <div key={group.name} className="space-y-2">
                      <h4 className="font-medium text-sm">{group.name}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {group.permissions.map((perm) => (
                          <div key={perm} className="flex items-center gap-2">
                            <Checkbox id={perm} defaultChecked={Math.random() > 0.3} />
                            <Label htmlFor={perm} className="text-sm font-normal">
                              {perm}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive email notifications for important events</p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  data-testid="switch-email-notifications"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Low Stock Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified when products fall below minimum stock</p>
                </div>
                <Switch
                  checked={lowStockAlerts}
                  onCheckedChange={setLowStockAlerts}
                  data-testid="switch-low-stock"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Order Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive alerts for new orders and status changes</p>
                </div>
                <Switch
                  checked={orderNotifications}
                  onCheckedChange={setOrderNotifications}
                  data-testid="switch-order-notifications"
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveNotifications} data-testid="button-save-notifications">
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize the look and feel of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
                </div>
                <ThemeToggle />
              </div>
              <div className="p-4 border rounded-md bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  The theme will be applied across all pages and saved to your preferences.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
