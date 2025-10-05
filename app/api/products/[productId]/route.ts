import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma';
import { logAudit } from '@/lib/audit-log';

export async function PATCH(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    if (!params.productId) {
      return new NextResponse('Product ID is required', { status: 400 });
    }

    const body = await req.json();
    const product = await prisma.product.update({
      where: { id: params.productId },
      data: { ...body },
    });
    return NextResponse.json(product);
  } catch (error) {
    console.error('[PRODUCT_PATCH]', error);

    // THIS IS THE FIX:
    // We are adding the same robust check for a unique constraint violation (P2002).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new NextResponse('A product with this SKU or Barcode already exists.', {
        status: 409, // 409 Conflict
      });
    }

    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// The DELETE function remains the same
export async function DELETE(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const product = await prisma.product.delete({
      where: { id: params.productId },
    });

    // ADD THIS LOGGING CALL
    await logAudit({
      action: 'PRODUCT_DELETE',
      details: `Product "${product.name}" (SKU: ${product.sku}) was deleted.`,
      entityId: product.id,
      entityType: 'Product',
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('[PRODUCT_DELETE]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}