"use server";

import { logAudit } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";

export async function breakCase(
  caseProductId: string,
  numberOfCases: number
): Promise<{ success: boolean; error?: string }> {
  if (!caseProductId || !numberOfCases || numberOfCases <= 0) {
    return { success: false, error: "Invalid input." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Get the case product and ensure it's valid
      const caseProduct = await tx.product.findUnique({
        where: { id: caseProductId },
      });

      if (!caseProduct || !caseProduct.containsProductId || !caseProduct.caseUnitCount) {
        throw new Error("Selected product is not a valid case product.");
      }
      if (caseProduct.stockQuantity < numberOfCases) {
        throw new Error("Insufficient stock of cases to break.");
      }

     

      // 2. Decrement stock of the case product
      await tx.product.update({
        where: { id: caseProductId },
        data: { stockQuantity: { decrement: numberOfCases } },
      });
      // A more advanced system would also decrement from case lots (FEFO)

      // 3. Determine the number of eaches to create
      const numberOfEaches = numberOfCases * caseProduct.caseUnitCount;

      // 4. Create a new inventory lot for the 'each' product
      await tx.inventoryLot.create({
        data: {
          productId: caseProduct.containsProductId,
          quantityReceived: numberOfEaches,
          quantityRemaining: numberOfEaches,
          // Expiration date could be inherited from the case lot in a future step
        },
      });

      // 5. Increment the total stock of the 'each' product
      await tx.product.update({
        where: { id: caseProduct.containsProductId },
        data: { stockQuantity: { increment: numberOfEaches } },
      });

      // ADD THIS LOGGING CALL (inside the transaction)
      await logAudit({
        action: 'INVENTORY_CASE_BREAK',
        details: `Broke ${numberOfCases} case(s) of "${caseProduct.name}" into ${numberOfEaches} units.`,
        entityId: caseProduct.id,
        entityType: 'Product',
    });
    });

    return { success: true };
  } catch (error) {
    console.error("Case break failed:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred." };
  }
}