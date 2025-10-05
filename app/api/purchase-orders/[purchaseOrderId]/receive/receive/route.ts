import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit-log';

// Defines the shape of the items we expect in the request body
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

    // Use a database transaction to ensure all updates succeed or none do
    await prisma.$transaction(async (tx) => {
      // 1. Process each item that was received in the shipment
      for (const item of itemsToReceive) {
        // Only process items where a quantity was actually entered
        if (item.quantityReceivedNow > 0) {
          // A. Update the PurchaseOrderItem with the newly received quantity
          await tx.purchaseOrderItem.update({
            where: { id: item.id },
            data: { quantityReceived: { increment: item.quantityReceivedNow } },
          });

          // B. Create a new InventoryLot for this batch, including its expiration date
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
      
      const newStatus = isFullyReceived ? "RECEIVED" : "PARTIALLY_RECEIVED";

      await tx.purchaseOrder.update({
        where: { id: params.purchaseOrderId },
        data: { status: newStatus, receivedAt: new Date() },
      });
    });
    
    // 3. After the transaction is successful, create an audit log
    const totalItemsReceived = itemsToReceive.reduce((sum, item) => sum + item.quantityReceivedNow, 0);
    await logAudit({
        action: 'STOCK_RECEIVE',
        details: `Received ${totalItemsReceived} total units for Purchase Order ID: ${params.purchaseOrderId}.`,
        entityId: params.purchaseOrderId,
        entityType: 'PurchaseOrder',
    });
    
    return NextResponse.json({ message: 'Stock received successfully' });
  } catch (error) {
    console.error('[PO_RECEIVE_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}