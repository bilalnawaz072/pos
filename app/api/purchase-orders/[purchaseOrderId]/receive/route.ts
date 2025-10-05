import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PurchaseOrderItem } from '@/lib/generated/prisma';

interface ReceivedItem {
  id: string; // This is the PurchaseOrderItem ID
  productId: string;
  quantityReceivedNow: number;
  expirationDate?: string;
}

export async function POST(
  req: Request,
  { params }: { params: { purchaseOrderId: string } }
) {
  try {
    const body = await req.json();
    const { itemsToReceive }: { itemsToReceive: ReceivedItem[] } = body;

    if (!itemsToReceive || itemsToReceive.length === 0) {
      return new NextResponse('No items to receive', { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Process each item received
      for (const item of itemsToReceive) {
        if (item.quantityReceivedNow > 0) {
          // A. Update the PO Item with the newly received quantity
          await tx.purchaseOrderItem.update({
            where: { id: item.id },
            data: { quantityReceived: { increment: item.quantityReceivedNow } },
          });

          // B. Create a new InventoryLot for this batch
          await tx.inventoryLot.create({
            data: {
              productId: item.productId,
              quantityReceived: item.quantityReceivedNow,
              quantityRemaining: item.quantityReceivedNow,
              expirationDate: item.expirationDate ? new Date(item.expirationDate) : null,
            },
          });

          // C. Update the total stock on the master Product record
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { increment: item.quantityReceivedNow } },
          });
        }
      }

      // 2. After processing all items, check and update the overall PO status
      const updatedPOItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: params.purchaseOrderId },
      });

      const isFullyReceived = updatedPOItems.every(
        (item) => item.quantityReceived >= item.quantityOrdered
      );
      
      let newStatus: "RECEIVED" | "PARTIALLY_RECEIVED" = "PARTIALLY_RECEIVED";
      if (isFullyReceived) {
          newStatus = "RECEIVED";
      }

      await tx.purchaseOrder.update({
        where: { id: params.purchaseOrderId },
        data: { status: newStatus, receivedAt: new Date() },
      });
    });
    
    return NextResponse.json({ message: 'Stock received successfully' });
  } catch (error) {
    console.error('[PO_RECEIVE_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}