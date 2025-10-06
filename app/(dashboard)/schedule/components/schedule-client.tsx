"use client";

import { useState } from "react";
import { Shift, Employee } from "@/lib/generated/prisma";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ShiftForm } from "./shift-form";
import { ScheduleCalendar } from "./schedule-calendar";
import { EventClickArg } from "@fullcalendar/core";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";

interface ScheduleClientProps {
  initialShifts: (Shift & { employee: Employee })[];
  employees: Employee[];
}

export const ScheduleClient: React.FC<ScheduleClientProps> = ({ initialShifts, employees }) => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  const handleCreateNew = () => {
    setSelectedShift(null); // Ensure we are in "create" mode
    setIsModalOpen(true);
  };

  const handleSelectSlot = (start: Date, end: Date) => {
    // Create a partial shift object for the form
    setSelectedShift({ startTime: start, endTime: end } as Shift);
    setIsModalOpen(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const shiftId = clickInfo.event.id;
    const fullShift = initialShifts.find(s => s.id === shiftId);
    if (fullShift) {
      setSelectedShift(fullShift);
      // For this example, we'll open the edit modal directly.
      // A Popover with "Edit" and "Delete" buttons would also be a great choice here.
      setIsModalOpen(true);
    }
  };

  const handleDeleteShift = async () => {
    if (!selectedShift) return;
    try {
      await axios.delete(`/api/shifts/${selectedShift.id}`);
      toast.success("Shift deleted.");
      setIsAlertOpen(false);
      setSelectedShift(null);
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete shift.");
    }
  };

  return (
    <>
      {/* Edit/Create Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selectedShift?.id ? "Edit Shift" : "Create New Shift"}</DialogTitle></DialogHeader>
          <ShiftForm
            employees={employees}
            initialData={selectedShift}
            onCancel={() => setIsModalOpen(false)}
            onSuccess={() => setIsModalOpen(false)}
            onDelete={() => {
              setIsModalOpen(false);
              setIsAlertOpen(true);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>
            Are you sure?
          </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this shift. This action cannot be undone.
            </AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>
            Cancel
          </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteShift}>
              Delete Shift
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex justify-end mb-4">
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" /> Add Shift
        </Button>
      </div>

      <ScheduleCalendar
        initialShifts={initialShifts}
        onSelectSlot={handleSelectSlot}
        onEventClick={handleEventClick}
      />
    </>
  );
};