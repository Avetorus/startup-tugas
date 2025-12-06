import { useEffect } from "react";
import { useLocation, Route, Switch, Redirect } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Building2, Lock } from "lucide-react";
import { SetupCompany } from "./setup/SetupCompany";
import { SetupAdminUser } from "./setup/SetupAdminUser";

interface SetupStatus {
  isInitialized: boolean;
  needsCompanySetup: boolean;
  needsAdminSetup: boolean;
  stats: { companyCount: number; userCount: number };
}

function SetupLocked() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocation("/login");
    }, 3000);
    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center max-w-md p-8">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Setup Complete</h1>
        <p className="text-muted-foreground mb-4">
          The system has already been initialized. You will be redirected to the login page.
        </p>
        <p className="text-sm text-muted-foreground">
          Redirecting in 3 seconds...
        </p>
      </div>
    </div>
  );
}

function SetupRouter({ status }: { status: SetupStatus }) {
  const [location] = useLocation();

  if (status.isInitialized && !status.needsAdminSetup) {
    return <SetupLocked />;
  }

  if (status.needsCompanySetup) {
    if (location !== "/setup/company" && location !== "/setup") {
      return <Redirect to="/setup/company" />;
    }
  } else if (status.needsAdminSetup) {
    if (location !== "/setup/admin-user") {
      return <Redirect to="/setup/admin-user" />;
    }
  }

  return (
    <Switch>
      <Route path="/setup/company" component={SetupCompany} />
      <Route path="/setup/admin-user" component={SetupAdminUser} />
      <Route path="/setup">
        {status.needsCompanySetup ? (
          <Redirect to="/setup/company" />
        ) : status.needsAdminSetup ? (
          <Redirect to="/setup/admin-user" />
        ) : (
          <SetupLocked />
        )}
      </Route>
    </Switch>
  );
}

export function Setup() {
  const { data: setupStatus, isLoading: statusLoading } = useQuery<SetupStatus>({
    queryKey: ["/api/setup/status"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Checking system status...</p>
        </div>
      </div>
    );
  }

  if (!setupStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-xl font-semibold mb-2">Unable to check system status</h1>
          <p className="text-muted-foreground">Please refresh the page to try again.</p>
        </div>
      </div>
    );
  }

  return <SetupRouter status={setupStatus} />;
}
