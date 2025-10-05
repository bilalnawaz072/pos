"use server";

import { prisma } from "@/lib/prisma";
import { DeliOrder } from "@/lib/generated/prisma";

export async function createDeliOrder(
    productId: string,
    weight: number
): Promise<{ order: DeliOrder | null; error?: string }> {
    if (!productId || !weight || weight <= 0) {
        return { order: null, error: "Invalid product or weight." };
    }

    try {
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product || !product.isWeighed) {
            return { order: null, error: "Product not found or is not a weighed item." };
        }

        const totalPrice = product.price * weight;

        const deliOrder = await prisma.deliOrder.create({
            data: {
                baseProductId: productId,
                weight: weight,
                totalPrice: totalPrice,
            },
            include: {
                baseProduct: true,
            },
        });

        return { order: deliOrder };
    } catch (error) {
        console.error("Failed to create deli order:", error);
        return { order: null, error: "An unexpected error occurred." };
    }
}