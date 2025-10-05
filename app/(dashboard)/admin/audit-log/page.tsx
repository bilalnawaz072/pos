import { prisma } from "@/lib/prisma";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/app/(dashboard)/employees/components/data-table";
import { columns, AuditLogColumn } from "./components/columns";
import { format } from "date-fns";

export default async function AuditLogPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  const formattedData: AuditLogColumn[] = logs.map((log) => ({
    id: log.id,
    action: log.action,
    details: log.details,
    entityId: log.entityId,
    entityType: log.entityType,
    createdAt: format(log.createdAt, "MMMM d, yyyy 'at' hh:mm a"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Heading
          title="Audit Log"
          description="A record of all critical events in the system."
        />
        <Separator />
        <DataTable columns={columns} data={formattedData} />
      </div>
    </div>
  );
}