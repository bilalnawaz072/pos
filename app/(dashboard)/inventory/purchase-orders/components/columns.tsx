"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export type PurchaseOrderColumn = {
  id: string;
  vendorName: string;
  status: string;
  totalCost: string;
  itemCount: number;
  createdAt: string;
};

export const columns: ColumnDef<PurchaseOrderColumn>[] = [
  {
    accessorKey: "vendorName",
    header: "Vendor",
    // This cell is now a link to the detail page
    cell: ({ row }) => (
      <Link href={`/inventory/purchase-orders/${row.original.id}`} className="font-medium text-primary hover:underline">
        {row.original.vendorName}
      </Link>
    ),
  },
  { 
    accessorKey: "status", 
    header: "Status",
    cell: ({ row }) => <Badge>{row.original.status}</Badge>
  },
  { accessorKey: "itemCount", header: "Items" },
  { accessorKey: "totalCost", header: "Total Cost" },
  { accessorKey: "createdAt", header: "Date Created" },
];