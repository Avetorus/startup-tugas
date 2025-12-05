import { StatCard } from "../layout/StatCard";
import { DollarSign } from "lucide-react";

export default function StatCardExample() {
  return (
    <StatCard 
      title="Total Sales" 
      value={156000} 
      icon={DollarSign} 
      trend={12.5}
      subtitle="vs last month"
    />
  );
}
