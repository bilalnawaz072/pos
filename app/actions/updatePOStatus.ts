"use server";

import { prisma } from "@/lib/prisma";
import { PurchaseOrderStatus } from "@/lib/generated/prisma";
import { revalidatePath } from "next/cache";

export async function updatePOStatus(
  purchaseOrderId: string,
  newStatus: PurchaseOrderStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const dataToUpdate: { status: PurchaseOrderStatus; orderedAt?: Date } = {
      status: newStatus,
    };

    // If we are marking the order as "Ordered", set the orderedAt timestamp.
    if (newStatus === "ORDERED") {
      dataToUpdate.orderedAt = new Date();
    }

    await prisma.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: dataToUpdate,
    });

    // Refresh the data on the purchase orders page
    revalidatePath("/inventory/purchase-orders");
    return { success: true };
  } catch (error) {
    console.error("Failed to update PO status:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}