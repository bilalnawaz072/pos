"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

export type AuditLogColumn = {
  id: string;
  action: string;
  details: string;
  entityId: string;
  entityType: string;
  createdAt: string;
};

export const columns: ColumnDef<AuditLogColumn>[] = [
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => <Badge variant="secondary">{row.original.action}</Badge>,
  },
  {
    accessorKey: "details",
    header: "Details",
  },
  {
    accessorKey: "entityType",
    header: "Entity Type",
  },
  {
    accessorKey: "createdAt",
    header: "Timestamp",
  },
];