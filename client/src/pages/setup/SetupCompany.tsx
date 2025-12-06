import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, Mail, Globe, Phone, AlertCircle, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface CompanySetupData {
  code: string;
  name: string;
  legalName?: string;
  taxId?: string;
  companyType: "holding" | "subsidiary" | "branch";
  currency: string;
  timezone: string;
  locale: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
}

const timezones = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (US)" },
  { value: "America/Chicago", label: "Central Time (US)" },
  { value: "America/Denver", label: "Mountain Time (US)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US)" },
  { value: "Europe/London", label: "London (UK)" },
  { value: "Europe/Paris", label: "Paris (France)" },
  { value: "Europe/Berlin", label: "Berlin (Germany)" },
  { value: "Asia/Tokyo", label: "Tokyo (Japan)" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Shanghai", label: "Shanghai (China)" },
  { value: "Australia/Sydney", label: "Sydney (Australia)" },
];

const currencies = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "CNY", label: "CNY - Chinese Yuan" },
  { value: "SGD", label: "SGD - Singapore Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "CHF", label: "CHF - Swiss Franc" },
  { value: "INR", label: "INR - Indian Rupee" },
];

export function SetupCompany() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const [companyData, setCompanyData] = useState<CompanySetupData>({
    code: "",
    name: "",
    legalName: "",
    taxId: "",
    companyType: "holding",
    currency: "USD",
    timezone: "UTC",
    locale: "en-US",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    phone: "",
    email: "",
    website: "",
  });

  const companyMutation = useMutation({
    mutationFn: async (data: CompanySetupData) => {
      const response = await apiRequest("POST", "/api/setup/company", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/setup/status"] });
      sessionStorage.setItem("setup_company_id", data.company.id);
      sessionStorage.setItem("setup_company_name", data.company.name);
      toast({
        title: "Company Created",
        description: `${data.company.name} has been set up successfully.`,
      });
      setLocation("/setup/admin-user");
    },
    onError: (err: any) => {
      const message = err?.message || "Failed to create company";
      setError(message);
      toast({
        variant: "destructive",
        title: "Setup Failed",
        description: message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!companyData.code.match(/^[A-Z0-9-]+$/)) {
      setError("Company code must be uppercase letters, numbers, and dashes only");
      return;
    }

    companyMutation.mutate(companyData);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="w-10 h-10 text-primary" />
            <h1 className="text-3xl font-bold">Unanza Setup</h1>
          </div>
          <p className="text-muted-foreground">Welcome! Let's get your ERP system configured.</p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 text-primary">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-primary text-primary-foreground">
              1
            </div>
            <span className="font-medium">Company</span>
          </div>
          <div className="w-12 h-0.5 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-muted">
              2
            </div>
            <span className="font-medium text-muted-foreground">Admin Account</span>
          </div>
          <div className="w-12 h-0.5 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-muted">
              3
            </div>
            <span className="font-medium text-muted-foreground">Complete</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Register Your Company</CardTitle>
            <CardDescription>
              Set up your holding company. This will be the top level of your organization hierarchy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm" data-testid="error-setup">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Company Code *</Label>
                  <Input
                    id="code"
                    placeholder="ACME-HQ"
                    value={companyData.code}
                    onChange={(e) => setCompanyData({ ...companyData, code: e.target.value.toUpperCase() })}
                    required
                    disabled={companyMutation.isPending}
                    data-testid="input-company-code"
                  />
                  <p className="text-xs text-muted-foreground">Uppercase, numbers, dashes only</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    placeholder="Acme Corporation"
                    value={companyData.name}
                    onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                    required
                    disabled={companyMutation.isPending}
                    data-testid="input-company-name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="legalName">Legal Name</Label>
                  <Input
                    id="legalName"
                    placeholder="Acme Corporation Ltd."
                    value={companyData.legalName}
                    onChange={(e) => setCompanyData({ ...companyData, legalName: e.target.value })}
                    disabled={companyMutation.isPending}
                    data-testid="input-legal-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input
                    id="taxId"
                    placeholder="12-3456789"
                    value={companyData.taxId}
                    onChange={(e) => setCompanyData({ ...companyData, taxId: e.target.value })}
                    disabled={companyMutation.isPending}
                    data-testid="input-tax-id"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency *</Label>
                  <Select
                    value={companyData.currency}
                    onValueChange={(v) => setCompanyData({ ...companyData, currency: v })}
                    disabled={companyMutation.isPending}
                  >
                    <SelectTrigger data-testid="select-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone *</Label>
                  <Select
                    value={companyData.timezone}
                    onValueChange={(v) => setCompanyData({ ...companyData, timezone: v })}
                    disabled={companyMutation.isPending}
                  >
                    <SelectTrigger data-testid="select-timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    placeholder="US"
                    maxLength={2}
                    value={companyData.country}
                    onChange={(e) => setCompanyData({ ...companyData, country: e.target.value.toUpperCase() })}
                    disabled={companyMutation.isPending}
                    data-testid="input-country"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="123 Business Ave"
                  value={companyData.address}
                  onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                  disabled={companyMutation.isPending}
                  data-testid="input-address"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="New York"
                    value={companyData.city}
                    onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                    disabled={companyMutation.isPending}
                    data-testid="input-city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    placeholder="NY"
                    value={companyData.state}
                    onChange={(e) => setCompanyData({ ...companyData, state: e.target.value })}
                    disabled={companyMutation.isPending}
                    data-testid="input-state"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    placeholder="10001"
                    value={companyData.postalCode}
                    onChange={(e) => setCompanyData({ ...companyData, postalCode: e.target.value })}
                    disabled={companyMutation.isPending}
                    data-testid="input-postal-code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="+1-555-000-0000"
                      value={companyData.phone}
                      onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                      className="pl-10"
                      disabled={companyMutation.isPending}
                      data-testid="input-phone"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="companyEmail"
                      type="email"
                      placeholder="contact@company.com"
                      value={companyData.email}
                      onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                      className="pl-10"
                      disabled={companyMutation.isPending}
                      data-testid="input-company-email"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://www.company.com"
                    value={companyData.website}
                    onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                    className="pl-10"
                    disabled={companyMutation.isPending}
                    data-testid="input-website"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={companyMutation.isPending || !companyData.code || !companyData.name}
                data-testid="button-create-company"
              >
                {companyMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Company...
                  </>
                ) : (
                  <>
                    Continue to Admin Setup
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
