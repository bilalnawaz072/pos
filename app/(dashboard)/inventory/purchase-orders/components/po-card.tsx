"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PurchaseOrder, Vendor, PurchaseOrderItem, PurchaseOrderStatus } from "@/lib/generated/prisma";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Truck, XCircle, Undo2 } from "lucide-react"; // Import Undo2 icon
import { formatCurrency } from "@/lib/utils";
import { updatePOStatus } from "@/app/actions/updatePOStatus";
import { cn } from "@/lib/utils";

type FullPO = PurchaseOrder & { vendor: Vendor; items: PurchaseOrderItem[] };

interface POCardProps {
  purchaseOrder: FullPO;
}

export const POCard: React.FC<POCardProps> = ({ purchaseOrder }) => {
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: PurchaseOrderStatus, event: Event) => {
    // Stop the Link from navigating when we click a menu item
    event.preventDefault(); 
    
    startTransition(async () => {
      const result = await updatePOStatus(purchaseOrder.id, newStatus);
      if (result.success) {
        toast.success(`Order marked as ${newStatus.toLowerCase().replace('_', ' ')}.`);
      } else {
        toast.error(result.error || "Failed to update status.");
      }
    });
  };

  const totalCost = purchaseOrder.items.reduce((sum, item) => sum + (item.costPerItem * item.quantityOrdered), 0);

  return (
    <Card className={cn("hover:bg-accent transition-colors relative", isPending && "opacity-50 pointer-events-none")}>
        {/* The Dropdown Menu button is on the highest layer (z-20) */}
        <div className="absolute top-2 right-2 z-20">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {purchaseOrder.status === "PENDING" && (
                        <DropdownMenuItem onSelect={(e) => handleStatusChange("ORDERED", e)}>
                            <Truck className="mr-2 h-4 w-4" />
                            <span>Mark as Ordered</span>
                        </DropdownMenuItem>
                    )}
                    {purchaseOrder.status !== "CANCELLED" && purchaseOrder.status !== "RECEIVED" && (
                       <DropdownMenuItem onSelect={(e) => handleStatusChange("CANCELLED", e)} className="text-destructive">
                            <XCircle className="mr-2 h-4 w-4" />
                            <span>Cancel Order</span>
                        </DropdownMenuItem>
                    )}
                    {/* NEW: Add option to re-open a cancelled order */}
                    {purchaseOrder.status === "CANCELLED" && (
                        <DropdownMenuItem onSelect={(e) => handleStatusChange("PENDING", e)}>
                            <Undo2 className="mr-2 h-4 w-4" />
                            <span>Re-open Order</span>
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

        {/* The Card content has no z-index, it's the base layer */}
        <CardHeader>
            <CardTitle className="text-base pr-6">{purchaseOrder.vendor.name}</CardTitle>
            <CardDescription>{new Date(purchaseOrder.createdAt).toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
            <p>{purchaseOrder.items.length} line item(s)</p>
        </CardContent>
        <CardFooter>
            <p className="font-semibold">{formatCurrency(totalCost)}</p>
        </CardFooter>
        
        {/* The invisible link covers everything and is on a middle layer (z-10) */}
        <Link href={`/inventory/purchase-orders/${purchaseOrder.id}`} className="absolute inset-0 z-10">
            <span className="sr-only">View Details for this Purchase Order</span>
        </Link>
    </Card>
  );
};