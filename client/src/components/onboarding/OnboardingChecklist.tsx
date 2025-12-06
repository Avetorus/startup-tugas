import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import { 
  CheckCircle2, 
  Building2, 
  Users, 
  FileSpreadsheet, 
  Warehouse, 
  UserCog, 
  Settings,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface Account {
  id: string;
}

interface WarehouseData {
  id: string;
}

interface Company {
  id: string;
}

interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  link: string;
  isComplete: boolean;
}

export function OnboardingChecklist() {
  const { activeCompanyId } = useCompany();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const isReady = isAuthenticated && !authLoading && !!activeCompanyId && !!user;

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: [`/api/companies/${activeCompanyId}/accounts`],
    enabled: isReady,
    staleTime: 30000,
  });

  const { data: warehouses = [] } = useQuery<WarehouseData[]>({
    queryKey: [`/api/companies/${activeCompanyId}/warehouses`],
    enabled: isReady,
    staleTime: 30000,
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    enabled: isReady,
    staleTime: 30000,
  });

  const { data: roles = [] } = useQuery<any[]>({
    queryKey: ["/api/roles"],
    enabled: isReady,
    staleTime: 30000,
  });

  if (!isReady) {
    return null;
  }

  const tasks: OnboardingTask[] = [
    {
      id: "chart-of-accounts",
      title: "Set up Chart of Accounts",
      description: "Define your company's financial accounts structure",
      icon: FileSpreadsheet,
      link: "/financials/accounts",
      isComplete: accounts.length > 0,
    },
    {
      id: "warehouses",
      title: "Create Warehouses",
      description: "Set up storage locations for inventory management",
      icon: Warehouse,
      link: "/warehouse/locations",
      isComplete: warehouses.length > 0,
    },
    {
      id: "users",
      title: "Add Team Members",
      description: "Invite users and assign roles",
      icon: Users,
      link: "/system/users",
      isComplete: false,
    },
    {
      id: "companies",
      title: "Add Subsidiaries/Branches",
      description: "Expand your company hierarchy",
      icon: Building2,
      link: "/system/companies",
      isComplete: companies.length > 1,
    },
    {
      id: "roles",
      title: "Configure User Roles",
      description: "Define permissions and access levels",
      icon: UserCog,
      link: "/system/users",
      isComplete: roles.length > 1,
    },
    {
      id: "settings",
      title: "Review Settings",
      description: "Configure company preferences and defaults",
      icon: Settings,
      link: "/system/settings",
      isComplete: false,
    },
  ];

  const completedCount = tasks.filter(t => t.isComplete).length;
  const progress = (completedCount / tasks.length) * 100;

  if (progress === 100) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Getting Started</CardTitle>
            <CardDescription>Complete these steps to set up your ERP system</CardDescription>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">{completedCount} of {tasks.length} completed</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tasks.map((task) => (
            <Link key={task.id} href={task.link}>
              <div 
                className={`flex items-start gap-3 p-4 border rounded-md cursor-pointer transition-colors ${
                  task.isComplete 
                    ? "bg-muted/50 opacity-60" 
                    : "hover-elevate"
                }`}
                data-testid={`onboarding-task-${task.id}`}
              >
                <div className={`p-2 rounded-md shrink-0 ${task.isComplete ? "bg-primary/20" : "bg-muted"}`}>
                  {task.isComplete ? (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  ) : (
                    <task.icon className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${task.isComplete ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {task.description}
                  </p>
                </div>
                {!task.isComplete && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
