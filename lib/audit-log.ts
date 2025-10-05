import { prisma } from "@/lib/prisma";

interface LogEntry {
  action: string;
  details: string;
  entityId: string;
  entityType: string;
}

export async function logAudit(entry: LogEntry) {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        details: entry.details,
        entityId: entry.entityId,
        entityType: entry.entityType,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}