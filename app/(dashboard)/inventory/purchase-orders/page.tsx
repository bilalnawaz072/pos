import { prisma } from '@/lib/prisma';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { PurchaseOrderStatus, PurchaseOrder, Vendor, PurchaseOrderItem } from "@/lib/generated/prisma";
import { POCard } from "./components/po-card";

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
          <Heading title={`Purchase Orders (${purchaseOrders.length})`} description="Create and manage orders for your vendors." />
          <Link href="/inventory/purchase-orders/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add New PO
            </Button>
          </Link>
        </div>
        <Separator />
        
        {/* THIS IS THE FIX: We replace the horizontal flex scroll with a responsive grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {statuses.map(status => (
            <div key={status}>
              <h2 className="text-lg font-semibold mb-2 px-1 capitalize flex items-center">
                {status.replace('_', ' ').toLowerCase()}
                <span className="ml-2 text-sm font-normal text-muted-foreground bg-muted h-6 w-6 rounded-full flex items-center justify-center">
                  {(groupedPOs[status] || []).length}
                </span>
              </h2>
              <div className="space-y-4 h-full rounded-lg">
                {(groupedPOs[status] || []).map(po => (
                  <POCard key={po.id} purchaseOrder={po} />
                ))}
                {(!groupedPOs[status] || groupedPOs[status].length === 0) && (
                  <div className="p-4 text-center text-sm text-muted-foreground border-2 border-dashed rounded-lg h-24 flex items-center justify-center">
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