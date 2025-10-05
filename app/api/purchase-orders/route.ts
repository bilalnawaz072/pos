import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      include: {
        vendor: true,
        // THIS IS THE FIX: We need to also include the 'product' inside each 'item'.
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(purchaseOrders);
  } catch (error) {
    console.error('[PURCHASE_ORDERS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { vendorId, items, status } = body;

    if (!vendorId || !items || items.length === 0) {
      return new NextResponse('Vendor and at least one item are required', { status: 400 });
    }

    const newPurchaseOrder = await prisma.purchaseOrder.create({
      data: {
        vendorId,
        status,
        items: {
          create: items.map((item: { productId: string, quantityOrdered: number, costPerItem: number }) => ({
            productId: item.productId,
            quantityOrdered: item.quantityOrdered,
            costPerItem: item.costPerItem,
          })),
        },
      },
    });

    return NextResponse.json(newPurchaseOrder);
  } catch (error) {
    console.error('[PURCHASE_ORDERS_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}