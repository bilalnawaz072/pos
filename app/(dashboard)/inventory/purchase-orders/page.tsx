import { prisma } from "@/lib/prisma";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { PurchaseOrderStatus, PurchaseOrder, Vendor, PurchaseOrderItem } from "@/lib/generated/prisma";
import { POCard } from "./components/po-card"; // Import our new component

type FullPO = PurchaseOrder & { vendor: Vendor; items: PurchaseOrderItem[] };

export default async function PurchaseOrdersPage() {
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    include: {
      vendor: true,
      items: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const groupedPOs = purchaseOrders.reduce((acc, po) => {
    const status = po.status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(po);
    return acc;
  }, {} as Record<PurchaseOrderStatus, FullPO[]>);

  const statuses: PurchaseOrderStatus[] = ["PENDING", "ORDERED", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"];

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <Heading title={`Purchase Orders (${purchaseOrders.length})`} description="Manage orders for your vendors." />
          <Link href="/inventory/purchase-orders/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add New PO
            </Button>
          </Link>
        </div>
        <Separator />
        
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {statuses.map(status => (
            <div key={status} className="flex-shrink-0 w-80">
              <h2 className="text-lg font-semibold mb-2 px-1 capitalize">{status.replace('_', ' ').toLowerCase()}</h2>
              <div className="space-y-4">
                {(groupedPOs[status] || []).map(po => (
                  <POCard key={po.id} purchaseOrder={po} />
                ))}
                {(!groupedPOs[status] || groupedPOs[status].length === 0) && (
                  <div className="p-4 text-center text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                    No orders in this stage.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}