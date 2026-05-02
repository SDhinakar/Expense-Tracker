"use client"

import * as React from "react"
import { format, endOfDay } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DateRangePicker({
  className,
  date,
  setDate,
}: {
  className?: string
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
}) {
  // Normalize: ensure the `to` date is always end-of-day so records
  // created at any time on the end date are included in queries.
  function handleSelect(range: DateRange | undefined) {
    if (!range) {
      setDate(undefined)
      return
    }
    setDate({
      from: range.from,
      to: range.to ? endOfDay(range.to) : undefined,
    })
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-full sm:w-[260px] justify-start text-left font-normal glass border-white/5 h-11 rounded-xl",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-primary shrink-0" />
              <span className="truncate">
                {date?.from ? (
                  date.to ? (
                    <>{format(date.from, "LLL dd, y")} &ndash; {format(date.to, "LLL dd, y")}</>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  "Pick a date"
                )}
              </span>
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0 glass border-white/10" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
