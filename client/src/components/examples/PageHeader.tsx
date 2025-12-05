import { PageHeader } from "../layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";

export default function PageHeaderExample() {
  return (
    <PageHeader 
      title="Sales Orders" 
      description="Manage and track all sales orders"
      actions={
        <>
          <Button variant="outline" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button data-testid="button-new-order">
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </>
      }
    />
  );
}
