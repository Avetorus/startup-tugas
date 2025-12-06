import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, ChevronDown, Check, ChevronRight, Globe, Building, GitBranch } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import type { Company, CompanyHierarchyNode } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const companyTypeIcons: Record<string, typeof Building2> = {
  holding: Globe,
  subsidiary: Building,
  branch: GitBranch,
  division: Building2,
};

const companyTypeColors: Record<string, string> = {
  holding: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  subsidiary: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  branch: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  division: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

interface HierarchyItemProps {
  node: CompanyHierarchyNode;
  onSelect: (company: Company) => void;
  activeCompanyId: string | null;
  depth?: number;
}

function HierarchyItem({ node, onSelect, activeCompanyId, depth = 0 }: HierarchyItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isActive = node.company.id === activeCompanyId;
  const Icon = companyTypeIcons[node.company.companyType] || Building2;

  return (
    <div className="w-full">
      <DropdownMenuItem
        className={cn(
          "flex items-center gap-2 cursor-pointer w-full",
          isActive && "bg-accent"
        )}
        style={{ paddingLeft: `${(depth * 16) + 8}px` }}
        onClick={() => onSelect(node.company)}
        data-testid={`dropdown-company-${node.company.id}`}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-accent rounded"
            data-testid={`button-expand-${node.company.id}`}
          >
            <ChevronRight 
              className={cn(
                "h-3 w-3 transition-transform",
                isExpanded && "rotate-90"
              )} 
            />
          </button>
        ) : (
          <span className="w-4" />
        )}
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="truncate font-medium" data-testid={`text-company-name-${node.company.id}`}>
            {node.company.name}
          </span>
          <Badge 
            variant="secondary" 
            className={cn("text-xs shrink-0", companyTypeColors[node.company.companyType])}
          >
            {node.company.companyType}
          </Badge>
          <Badge variant="outline" className="text-xs shrink-0">
            {node.company.currency}
          </Badge>
        </div>
        {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
      </DropdownMenuItem>
      
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <HierarchyItem
              key={child.company.id}
              node={child}
              onSelect={onSelect}
              activeCompanyId={activeCompanyId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CompanySwitcher() {
  const { activeCompany, activeCompanyId, userCompanies, switchCompany, isLoading } = useCompany();
  const [open, setOpen] = useState(false);

  // Fetch company hierarchy
  const { data: hierarchy = [] } = useQuery<CompanyHierarchyNode[]>({
    queryKey: ["/api/companies/hierarchy"],
  });

  const handleSelect = async (company: Company) => {
    if (company.id !== activeCompanyId) {
      await switchCompany(company.id);
    }
    setOpen(false);
  };

  const ActiveIcon = activeCompany?.companyType 
    ? companyTypeIcons[activeCompany.companyType] || Building2
    : Building2;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="min-w-[200px] justify-between gap-2"
          disabled={isLoading}
          data-testid="button-company-switcher"
        >
          <div className="flex items-center gap-2 min-w-0">
            <ActiveIcon className="h-4 w-4 shrink-0" />
            <span className="truncate" data-testid="text-active-company">
              {activeCompany?.name || "Select Company"}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-[350px] max-h-[400px] overflow-y-auto"
        data-testid="dropdown-company-list"
      >
        <DropdownMenuLabel className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Switch Company
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {hierarchy.length > 0 ? (
          hierarchy.map((node) => (
            <HierarchyItem
              key={node.company.id}
              node={node}
              onSelect={handleSelect}
              activeCompanyId={activeCompanyId}
            />
          ))
        ) : (
          userCompanies.map((company) => {
            const Icon = companyTypeIcons[company.companyType] || Building2;
            const isActive = company.id === activeCompanyId;
            
            return (
              <DropdownMenuItem
                key={company.id}
                className={cn(
                  "flex items-center gap-2 cursor-pointer",
                  isActive && "bg-accent"
                )}
                onClick={() => handleSelect(company)}
                data-testid={`dropdown-company-${company.id}`}
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 truncate">{company.name}</span>
                <Badge 
                  variant="secondary" 
                  className={cn("text-xs", companyTypeColors[company.companyType])}
                >
                  {company.companyType}
                </Badge>
                {isActive && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            );
          })
        )}
        
        {userCompanies.length === 0 && hierarchy.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No companies available
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact version for sidebar
export function CompanySwitcherCompact() {
  const { activeCompany, activeCompanyId, userCompanies, switchCompany, isLoading } = useCompany();
  const [open, setOpen] = useState(false);

  const handleSelect = async (company: Company) => {
    if (company.id !== activeCompanyId) {
      await switchCompany(company.id);
    }
    setOpen(false);
  };

  const ActiveIcon = activeCompany?.companyType 
    ? companyTypeIcons[activeCompany.companyType] || Building2
    : Building2;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          disabled={isLoading}
          data-testid="button-company-switcher-compact"
        >
          <ActiveIcon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        side="right"
        className="w-[280px]"
        data-testid="dropdown-company-list-compact"
      >
        <DropdownMenuLabel>Switch Company</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userCompanies.map((company) => {
          const Icon = companyTypeIcons[company.companyType] || Building2;
          const isActive = company.id === activeCompanyId;
          
          return (
            <DropdownMenuItem
              key={company.id}
              className={cn("flex items-center gap-2", isActive && "bg-accent")}
              onClick={() => handleSelect(company)}
              data-testid={`dropdown-company-compact-${company.id}`}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 truncate">{company.name}</span>
              {isActive && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
