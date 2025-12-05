import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, Lock, User, AlertCircle } from "lucide-react";
import type { Company } from "@shared/schema";

export function Login() {
  const [, setLocation] = useLocation();
  const { login, isAuthenticated, isLoading: authLoading, error: authError } = useAuth();
  const { toast } = useToast();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [companyId, setCompanyId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showError, setShowError] = useState(false);

  const { data: companies = [], isLoading: companiesLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    if (authError) {
      setShowError(true);
    }
  }, [authError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowError(false);
    setIsSubmitting(true);

    try {
      const success = await login(username, password, companyId || undefined);
      if (success) {
        toast({
          title: "Welcome back",
          description: "You have been logged in successfully.",
        });
        setLocation("/");
      }
    } catch (error) {
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading && isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="w-10 h-10 text-primary" />
            <h1 className="text-3xl font-bold">Unanza</h1>
          </div>
          <p className="text-muted-foreground">Enterprise Resource Planning</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {showError && authError && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm" data-testid="error-login">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isSubmitting}
                    data-testid="input-username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isSubmitting}
                    data-testid="input-password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company (Optional)</Label>
                <Select 
                  value={companyId} 
                  onValueChange={setCompanyId}
                  disabled={companiesLoading || isSubmitting}
                >
                  <SelectTrigger data-testid="select-company">
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id} data-testid={`select-company-${company.id}`}>
                        <div className="flex items-center gap-2">
                          <span>{company.name}</span>
                          <span className="text-xs text-muted-foreground">({company.code})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Leave empty to use your default company
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || !username || !password}
                data-testid="button-login"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2 w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-center text-muted-foreground mb-2">Demo Credentials</p>
              <div className="text-xs text-center text-muted-foreground space-y-1">
                <p><strong>Admin:</strong> admin / admin123</p>
                <p><strong>Manager:</strong> john.manager / password</p>
                <p><strong>Accountant:</strong> jane.accountant / password</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
