import { prisma } from "@/lib/prisma";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { ScheduleClient } from "./components/schedule-client";

// The CSS imports are no longer needed here, so they have been removed.
// The FullCalendar component will manage its own styles.

export default async function SchedulePage() {
  // Fetch all shifts, not just upcoming ones, for the calendar view
  const [shifts, employees] = await Promise.all([
    prisma.shift.findMany({
      include: {
        employee: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    }),
    prisma.employee.findMany({
        where: { isActive: true },
        orderBy: { firstName: 'asc' }
    }),
  ]);

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Heading title="Employee Schedule" description="Manage shifts for your team. Drag, drop, and resize shifts to make changes." />
        <Separator />
        <ScheduleClient initialShifts={shifts} employees={employees} />
      </div>
    </div>
  );
}