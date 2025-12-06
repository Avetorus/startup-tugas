import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, User, Lock, Mail, AlertCircle, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SetupStatus {
  isInitialized: boolean;
  needsCompanySetup: boolean;
  needsAdminSetup: boolean;
  pendingCompany: { id: string; code: string; name: string } | null;
  stats: { companyCount: number; userCount: number };
}

interface AdminSetupData {
  companyId: string;
  username: string;
  password: string;
  email: string;
  fullName: string;
}

export function SetupAdminUser() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupComplete, setSetupComplete] = useState(false);

  const { data: setupStatus, isLoading } = useQuery<SetupStatus>({
    queryKey: ["/api/setup/status"],
    retry: false,
  });

  const [adminData, setAdminData] = useState<AdminSetupData>({
    companyId: "",
    username: "",
    password: "",
    email: "",
    fullName: "",
  });

  // Get company name from API or fallback to sessionStorage
  const companyName = setupStatus?.pendingCompany?.name || 
    sessionStorage.getItem("setup_company_name") || 
    "your company";

  useEffect(() => {
    if (!isLoading && setupStatus) {
      if (setupStatus.needsCompanySetup) {
        setLocation("/setup/company");
      } else if (setupStatus.isInitialized && !setupStatus.needsAdminSetup) {
        setLocation("/login");
      } else if (setupStatus.pendingCompany && !adminData.companyId) {
        // Hydrate company ID from API when available
        setAdminData(prev => ({ ...prev, companyId: setupStatus.pendingCompany!.id }));
      }
    }
  }, [setupStatus, isLoading, setLocation, adminData.companyId]);

  const adminMutation = useMutation({
    mutationFn: async (data: AdminSetupData) => {
      const response = await apiRequest("POST", "/api/setup/admin", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/setup/status"] });
      sessionStorage.removeItem("setup_company_id");
      sessionStorage.removeItem("setup_company_name");
      setSetupComplete(true);
      toast({
        title: "Setup Complete",
        description: data.message || "You can now log in with your credentials.",
      });
    },
    onError: (err: any) => {
      const message = err?.message || "Failed to create admin account";
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

    if (adminData.password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (adminData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    adminMutation.mutate(adminData);
  };

  const handleGoToLogin = () => {
    setLocation("/login");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (setupComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Building2 className="w-10 h-10 text-primary" />
              <h1 className="text-3xl font-bold">Unanza Setup</h1>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-primary/20 text-primary">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="font-medium">Company</span>
            </div>
            <div className="w-12 h-0.5 bg-border" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-primary/20 text-primary">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="font-medium">Admin Account</span>
            </div>
            <div className="w-12 h-0.5 bg-border" />
            <div className="flex items-center gap-2 text-primary">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-primary text-primary-foreground">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="font-medium">Complete</span>
            </div>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Setup Complete!</CardTitle>
              <CardDescription>
                Your ERP system is now ready to use. You can log in with your Super Admin credentials.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium">Next Steps:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                    <span>Set up your chart of accounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                    <span>Create warehouses and inventory locations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                    <span>Add team members and assign roles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                    <span>Configure subsidiaries and branches</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleGoToLogin}
                className="w-full"
                data-testid="button-go-to-login"
              >
                Go to Login
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-primary/20 text-primary">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="font-medium">Company</span>
          </div>
          <div className="w-12 h-0.5 bg-border" />
          <div className="flex items-center gap-2 text-primary">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-primary text-primary-foreground">
              2
            </div>
            <span className="font-medium">Admin Account</span>
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
            <CardTitle>Create Super Admin Account</CardTitle>
            <CardDescription>
              Set up the first administrator account for {companyName}.
              This account will have full system access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm" data-testid="error-admin">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    value={adminData.fullName}
                    onChange={(e) => setAdminData({ ...adminData, fullName: e.target.value })}
                    className="pl-10"
                    required
                    disabled={adminMutation.isPending}
                    data-testid="input-fullname"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@company.com"
                    value={adminData.email}
                    onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                    className="pl-10"
                    required
                    disabled={adminMutation.isPending}
                    data-testid="input-admin-email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    placeholder="admin"
                    value={adminData.username}
                    onChange={(e) => setAdminData({ ...adminData, username: e.target.value })}
                    className="pl-10"
                    required
                    disabled={adminMutation.isPending}
                    data-testid="input-admin-username"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min 8 characters"
                      value={adminData.password}
                      onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                      className="pl-10"
                      required
                      disabled={adminMutation.isPending}
                      data-testid="input-password"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      disabled={adminMutation.isPending}
                      data-testid="input-confirm-password"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={adminMutation.isPending || !adminData.username || !adminData.password || !adminData.email || !adminData.fullName}
                data-testid="button-create-admin"
              >
                {adminMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Complete Setup
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
