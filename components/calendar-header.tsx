"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, addMonths, subMonths } from "date-fns"
import { ru } from "date-fns/locale"

interface CalendarHeaderProps {
  onDateSelect: (date: Date) => void
  selectedDate: Date
}

export function CalendarHeader({ onDateSelect, selectedDate }: CalendarHeaderProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate))

  const daysOfWeek = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"]

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay()
    return day === 0 ? 6 : day - 1 // Adjust for Monday as first day of week
  }

  const getPreviousMonthDays = (year: number, month: number) => {
    const firstDay = getFirstDayOfMonth(year, month)
    const prevMonthDays = []

    if (firstDay > 0) {
      const daysInPrevMonth = getDaysInMonth(year, month - 1)
      for (let i = 0; i < firstDay; i++) {
        prevMonthDays.unshift(daysInPrevMonth - i)
      }
    }

    return prevMonthDays
  }

  const getNextMonthDays = (year: number, month: number, daysInMonth: number, firstDay: number) => {
    const totalCells = 42 // 6 rows x 7 days
    const remainingCells = totalCells - (firstDay + daysInMonth)
    const nextMonthDays = []

    for (let i = 1; i <= remainingCells; i++) {
      nextMonthDays.push(i)
    }

    return nextMonthDays
  }

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const prevMonthDays = getPreviousMonthDays(year, month)
  const nextMonthDays = getNextMonthDays(year, month, daysInMonth, firstDay)

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const isToday = (day: number) => {
    const today = new Date()
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  }

  const isSelected = (day: number) => {
    return day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear()
  }

  return (
    <div className="p-4 border-b">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium">{format(currentMonth, "LLLL yyyy", { locale: ru })}</div>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-xs text-muted-foreground py-1">
            {day}
          </div>
        ))}

        {prevMonthDays.map((day) => (
          <Button
            key={`prev-${day}`}
            variant="ghost"
            className="h-8 w-full p-0 text-muted-foreground opacity-50"
            onClick={() => onDateSelect(new Date(year, month - 1, day))}
          >
            {day}
          </Button>
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
          <Button
            key={`current-${day}`}
            variant="ghost"
            className={cn(
              "h-8 w-full p-0",
              isToday(day) && "bg-primary/10",
              isSelected(day) && "bg-primary text-primary-foreground",
            )}
            onClick={() => onDateSelect(new Date(year, month, day))}
          >
            {day}
          </Button>
        ))}

        {nextMonthDays.map((day) => (
          <Button
            key={`next-${day}`}
            variant="ghost"
            className="h-8 w-full p-0 text-muted-foreground opacity-50"
            onClick={() => onDateSelect(new Date(year, month + 1, day))}
          >
            {day}
          </Button>
        ))}
      </div>
    </div>
  )
}
