"use server";

import { prisma } from "@/lib/prisma";
import { Product } from "@/lib/generated/prisma";

export async function findProductByBarcode(
  barcode: string
): Promise<Product | null> {
  if (!barcode) {
    return null;
  }

  try {
    // 1. FIRST, try to find a DeliOrder with this barcode (which is its ID)
    const deliOrder = await prisma.deliOrder.findUnique({
      where: { id: barcode, isFulfilled: false }, // Only find unfulfilled orders
      include: { baseProduct: true },
    });

    if (deliOrder) {
      // Mark it as fulfilled so it can't be scanned again
      await prisma.deliOrder.update({
        where: { id: barcode },
        data: { isFulfilled: true },
      });

      // Construct a temporary "Product" object to return to the cart.
      // It has the details of the base product but the specific price and weight of this order.
      // We set isWeighed to true so the cart logic handles it correctly.
      const temporaryProduct: Product = {
        ...deliOrder.baseProduct,
        price: deliOrder.totalPrice, // The FINAL price for the whole weight
        unit: 'each', // We are now selling it as one "each" unit
        isWeighed: true, // We use this flag to signal special cart handling
        // This is a temporary object, so some fields might be defaults
        stockQuantity: 1,
        cost: deliOrder.baseProduct.cost * deliOrder.weight, // Estimate cost
      };

      // Override the addItem logic for this special case by returning a custom object
      // The cart will see isWeighed and handle it based on weight.
      // We need to slightly adjust our cart logic for this.
      // Let's create a NEW product type that is a one-off.
      // For simplicity, let's just make it a weighed item where weight is 1 and price is total
      return { ...deliOrder.baseProduct, price: deliOrder.totalPrice, isWeighed: false };
    }

    // 2. If not a deli order, search for a regular product barcode
    const product = await prisma.product.findUnique({
      where: {
        barcode: barcode,
      },
    });

    return product;
  } catch (error) {
    console.error("Failed to find product:", error);
    return null;
  }
}