import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ShoppingCart,
  Users,
  Truck,
  FileText,
  Package,
  MapPin,
  BarChart3,
  ArrowRightLeft,
  ClipboardList,
  BookOpen,
  CreditCard,
  Receipt,
  PieChart,
  UserCircle,
  Clock,
  Calendar,
  Wallet,
  Building2,
  Store,
  Settings,
  ChevronDown,
  LayoutDashboard,
  Globe,
  Shield,
  GitMerge,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

interface MenuGroup {
  label: string;
  icon: React.ElementType;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    label: "Sales",
    icon: ShoppingCart,
    items: [
      { title: "Sales Orders", url: "/sales/orders", icon: ShoppingCart },
      { title: "Customers", url: "/sales/customers", icon: Users },
      { title: "Deliveries", url: "/sales/deliveries", icon: Truck },
      { title: "Invoices", url: "/sales/invoices", icon: FileText },
    ],
  },
  {
    label: "Warehouse",
    icon: Package,
    items: [
      { title: "Warehouses", url: "/warehouse/warehouses", icon: Building2 },
      { title: "Products", url: "/warehouse/products", icon: Package },
      { title: "Locations", url: "/warehouse/locations", icon: MapPin },
      { title: "Stock Levels", url: "/warehouse/stock", icon: BarChart3 },
      { title: "Movements", url: "/warehouse/movements", icon: ArrowRightLeft },
      { title: "Purchase Orders", url: "/warehouse/purchase-orders", icon: ClipboardList },
      { title: "Vendors", url: "/warehouse/vendors", icon: Building2 },
    ],
  },
  {
    label: "Financials",
    icon: CreditCard,
    items: [
      { title: "Journal Entries", url: "/financials/journal", icon: BookOpen },
      { title: "Chart of Accounts", url: "/financials/accounts", icon: PieChart },
      { title: "Accounts Receivable", url: "/financials/receivables", icon: Receipt },
      { title: "Accounts Payable", url: "/financials/payables", icon: CreditCard },
    ],
  },
  {
    label: "Human Resources",
    icon: UserCircle,
    items: [
      { title: "Employees", url: "/hr/employees", icon: UserCircle },
      { title: "Attendance", url: "/hr/attendance", icon: Clock },
      { title: "Leave Requests", url: "/hr/leave", icon: Calendar },
      { title: "Payroll", url: "/hr/payroll", icon: Wallet },
    ],
  },
  {
    label: "System",
    icon: Settings,
    items: [
      { title: "Companies", url: "/system/companies", icon: Globe },
      { title: "Users & Roles", url: "/system/users", icon: Shield },
      { title: "Inter-Company", url: "/system/intercompany", icon: GitMerge },
      { title: "Vendor Portal", url: "/system/vendors", icon: Building2 },
      { title: "Customer Portal", url: "/system/customer-portal", icon: Store },
      { title: "Settings", url: "/system/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const [openGroups, setOpenGroups] = useState<string[]>(["Sales"]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground font-bold text-lg">
            U
          </div>
          <span className="font-semibold text-lg" data-testid="text-app-name">Unanza</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/"}>
                  <Link href="/" data-testid="link-dashboard">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/reports"}>
                  <Link href="/reports" data-testid="link-reports">
                    <PieChart className="h-4 w-4" />
                    <span>Reports</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/reports/consolidation"}>
                  <Link href="/reports/consolidation" data-testid="link-consolidation">
                    <Building2 className="h-4 w-4" />
                    <span>Consolidation</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {menuGroups.map((group) => (
          <Collapsible
            key={group.label}
            open={openGroups.includes(group.label)}
            onOpenChange={() => toggleGroup(group.label)}
          >
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer flex items-center justify-between gap-2 px-2 py-1.5 hover-elevate rounded-md">
                  <div className="flex items-center gap-2">
                    <group.icon className="h-4 w-4" />
                    <span>{group.label}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      openGroups.includes(group.label) && "rotate-180"
                    )}
                  />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton
                          asChild
                          isActive={location === item.url}
                        >
                          <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              AD
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="text-user-name">Admin User</p>
            <p className="text-xs text-muted-foreground truncate">admin@unanza.com</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
