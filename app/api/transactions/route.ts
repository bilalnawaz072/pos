import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CartItem } from '@/app/store/use-cart-store';
import { logAudit } from '@/lib/audit-log';
import { formatCurrency } from '@/lib/utils';

interface RequestBody {
  cartItems: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  tenderType: 'CASH' | 'CARD';
  amountTendered?: number;
  originalTransactionId?: string;
  customerId?: string;
}

export async function POST(req: Request) {
  try {
    const body: RequestBody = await req.json();
    const { cartItems, subtotal, tax, total, tenderType, amountTendered, originalTransactionId, customerId } = body;
    const isRefund = total < 0;

    const newTransaction = await prisma.$transaction(async (tx) => {
      const createdTransaction = await tx.transaction.create({
        data: {
          subtotal,
          tax,
          total,
          tenderType,
          amountTendered,
          changeGiven: amountTendered && !isRefund ? amountTendered - total : 0,
          customerId: customerId,
          items: {
            create: cartItems.map((item) => ({
              productId: item.product.id,
              name: item.product.name,
              price: item.product.price,
              cost: item.product.cost, // THIS IS THE NEW LINE
              quantity: item.quantity,
              weight: item.weight,
              discountAmount: item.discountApplied,
            })),
          },
        },
      });

      if (isRefund && originalTransactionId) {
        await tx.transaction.update({ where: { id: originalTransactionId }, data: { refundedById: createdTransaction.id } });
      }

      

      if (!isRefund && customerId) {
        const pointsToAdd = Math.floor(total);
        if (pointsToAdd > 0) {
          await tx.customer.update({
            where: { id: customerId },
            data: { loyaltyPoints: { increment: pointsToAdd } },
          });
        }
      }

      await logAudit({
        action: 'TRANSACTION_REFUND',
        details: `Refund of ${formatCurrency(Math.abs(total))} processed for original transaction ${originalTransactionId}.`,
        entityId: createdTransaction.id,
        entityType: 'Transaction',
    });

      for (const item of cartItems) {
        if (item.product.isWeighed) continue;
        const stockUpdateOperation = isRefund ? 'increment' : 'decrement';
        const quantity = Math.abs(item.quantity);
        await tx.product.update({
          where: { id: item.product.id },
          data: { stockQuantity: { [stockUpdateOperation]: quantity } },
        });
      }

      return createdTransaction;
    });

    const message = isRefund ? "Refund completed" : "Sale completed";
    return NextResponse.json({ message, transaction: newTransaction });
  } catch (error) {
    console.error('[TRANSACTION_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}