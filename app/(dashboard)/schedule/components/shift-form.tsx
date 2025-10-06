"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { Employee, Shift } from "@/lib/generated/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash } from "lucide-react";

interface ShiftFormProps {
  employees: Employee[];
  initialData?: Partial<Shift> | null;
  onCancel: () => void;
  onSuccess: () => void;
  onDelete: () => void; // Add delete handler
}

const formatForInput = (date: Date) => {
    const d = new Date(date);
    const timezoneOffset = d.getTimezoneOffset() * 60000;
    const localDate = new Date(d.getTime() - timezoneOffset);
    return localDate.toISOString().slice(0, 16);
};

export const ShiftForm: React.FC<ShiftFormProps> = ({ employees, initialData, onCancel, onSuccess, onDelete }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isEditMode = !!initialData?.id;

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: {
      employeeId: initialData?.employeeId || "",
      startTime: initialData?.startTime ? formatForInput(initialData.startTime) : "",
      endTime: initialData?.endTime ? formatForInput(initialData.endTime) : "",
      notes: initialData?.notes || "",
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (isEditMode) {
        await axios.patch(`/api/shifts/${initialData!.id}`, data);
        toast.success("Shift updated.");
      } else {
        await axios.post("/api/shifts", data);
        toast.success("Shift created.");
      }
      router.refresh();
      onSuccess();
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <Controller name="employeeId" control={control} rules={{ required: true }} render={({ field }) => (
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <SelectTrigger><SelectValue placeholder="Select an employee" /></SelectTrigger>
            <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
          </Select>
      )} />
      {errors.employeeId && <p className="text-sm text-destructive mt-1">An employee must be selected.</p>}

      <div className="grid grid-cols-2 gap-4">
        <div><Label>Start Time</Label><Input type="datetime-local" {...register("startTime", { required: true })} />{errors.startTime && <p className="text-sm text-destructive mt-1">Start time is required.</p>}</div>
        <div><Label>End Time</Label><Input type="datetime-local" {...register("endTime", { required: true })} />{errors.endTime && <p className="text-sm text-destructive mt-1">End time is required.</p>}</div>
      </div>
      <Textarea {...register("notes")} placeholder="Optional notes for the shift..." />
      <div className="pt-6 flex items-center justify-between w-full">
        <div>
          {isEditMode && (
            <Button type="button" variant="destructive" size="icon" onClick={onDelete} disabled={loading}>
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="space-x-2">
            <Button disabled={loading} variant="outline" onClick={onCancel} type="button">Cancel</Button>
            <Button disabled={loading} type="submit">{isEditMode ? "Save Changes" : "Create Shift"}</Button>
        </div>
      </div>
    </form>
  );
};