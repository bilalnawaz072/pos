import { prisma } from "@/lib/prisma";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Product } from "@/lib/generated/prisma";

export async function LowStockAlert() {
  // Fetch all products that have a reorder threshold set
  const productsWithThresholds = await prisma.product.findMany({
    where: {
      reorderThreshold: {
        not: null,
      },
    },
  });

  // Filter in code to find products at or below their threshold
  const lowStockProducts = productsWithThresholds.filter(
    (p) => p.stockQuantity <= (p.reorderThreshold ?? 0)
  );

  if (lowStockProducts.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Reorder Alert ({lowStockProducts.length} items)</AlertTitle>
      <AlertDescription>
        The following products have reached their reorder threshold: {lowStockProducts.map(p => `"${p.name}" (${p.stockQuantity})`).join(', ')}.
        <Link href="/inventory" className="font-bold underline ml-2">
           Manage Inventory
        </Link>
      </AlertDescription>
    </Alert>
  );
}