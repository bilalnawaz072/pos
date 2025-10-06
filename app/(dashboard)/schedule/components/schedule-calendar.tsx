"use client";

import { useTransition } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { EventResizeDoneArg } from '@fullcalendar/interaction';
import { EventInput, EventApi, EventClickArg } from '@fullcalendar/core';
import { Shift, Employee } from "@/lib/generated/prisma";
import { toast } from 'sonner';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ScheduleCalendarProps {
  initialShifts: (Shift & { employee: Employee })[];
  onSelectSlot: (start: Date, end: Date) => void;
  onEventClick: (info: EventClickArg) => void;
}

type UpdateInfo = {
  event: EventApi;
  revert: () => void;
};

export const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({ initialShifts, onSelectSlot, onEventClick }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const events: EventInput[] = initialShifts.map(shift => ({
    id: shift.id,
    title: `${shift.employee.firstName} ${shift.employee.lastName}`,
    start: shift.startTime,
    end: shift.endTime,
    extendedProps: {
      notes: shift.notes || 'No notes',
      employeeId: shift.employeeId,
    },
  }));

  const handleEventUpdate = (updateInfo: UpdateInfo) => {
    startTransition(async () => {
      try {
        await axios.patch(`/api/shifts/${updateInfo.event.id}`, {
          startTime: updateInfo.event.start,
          endTime: updateInfo.event.end,
        });
        toast.success("Shift updated successfully.");
        router.refresh();
      } catch (error) {
        toast.error("Failed to update shift.");
        updateInfo.revert();
      }
    });
  };

  return (
    <div className='p-4 bg-background rounded-lg border'>
      {isPending && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20"><p>Updating shift...</p></div>}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        editable={true}
        selectable={true}
        eventDrop={handleEventUpdate}
        eventResize={handleEventUpdate as (arg: EventResizeDoneArg) => void}
        select={(info) => onSelectSlot(info.start, info.end)}
        eventClick={onEventClick} // Handle clicks on existing events
        height="auto"
        // THIS IS NEW: Custom render function to add hover tooltips
        eventContent={(eventInfo) => {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="fc-event-main-frame w-full overflow-hidden">
                    <div className="fc-event-title-container">
                      <div className="fc-event-title fc-sticky">{eventInfo.event.title}</div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">{eventInfo.event.title}</p>
                  <p>{eventInfo.timeText}</p>
                  <p className="text-sm text-muted-foreground mt-2">{eventInfo.event.extendedProps.notes}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }}
      />
    </div>
  );
};