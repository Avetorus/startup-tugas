import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  subtitle?: string;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, subtitle, className }: StatCardProps) {
  const formattedValue = typeof value === "number" 
    ? value.toLocaleString("en-US", { 
        style: title.toLowerCase().includes("value") || title.toLowerCase().includes("total") || title.toLowerCase().includes("sales") || title.toLowerCase().includes("receivable") || title.toLowerCase().includes("payable")
          ? "currency" 
          : "decimal",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    : value;

  return (
    <Card className={cn("", className)} data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-2xl font-semibold mt-1">{formattedValue}</p>
            {(trend !== undefined || subtitle) && (
              <div className="flex items-center gap-1 mt-1">
                {trend !== undefined && (
                  <>
                    {trend >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
                    )}
                    <span className={cn(
                      "text-xs font-medium",
                      trend >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {trend >= 0 ? "+" : ""}{trend.toFixed(1)}%
                    </span>
                  </>
                )}
                {subtitle && (
                  <span className="text-xs text-muted-foreground ml-1">{subtitle}</span>
                )}
              </div>
            )}
          </div>
          <div className="p-3 rounded-md bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
