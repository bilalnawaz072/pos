"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { addDays, format } from "date-fns"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useRouter, useSearchParams } from "next/navigation"

export function DateRangePicker({
    className,
}: React.HTMLAttributes<HTMLDivElement>) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const [date, setDate] = React.useState<DateRange | undefined>({
        from: from ? new Date(from) : addDays(new Date(), -7),
        to: to ? new Date(to) : new Date(),
    })

    React.useEffect(() => {
        if (date?.from && date?.to) {
            const url = new URL(window.location.href)
            url.searchParams.set('from', format(date.from, 'yyyy-MM-dd'))
            url.searchParams.set('to', format(date.to, 'yyyy-MM-dd'))
            router.push(url.toString())
        }
    }, [date, router])

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                        pagedNavigation
                        showOutsideDays={false} // Hide days from adjacent months
                        // Ensure range is rendered as a continuous selection
                        modifiers={{
                            rangeStart: date?.from,
                            rangeEnd: date?.to,
                        }}
                        modifiersClassNames={{
                            rangeStart: "range-start",
                            rangeEnd: "range-end",
                            rangeMiddle: "range-middle",
                        }}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}