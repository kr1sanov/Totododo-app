"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, addMonths, subMonths, isToday, isSameDay } from "date-fns"
import { ru } from "date-fns/locale"
import { useMobile } from "@/hooks/use-mobile"

interface CalendarHeaderProps {
  onDateSelect: (date: Date) => void
  selectedDate: Date
}

export function CalendarHeader({ onDateSelect, selectedDate }: CalendarHeaderProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate))
  const isMobile = useMobile()

  // Update current month when selected date changes
  useEffect(() => {
    // Only update if the month is different
    if (
      currentMonth.getMonth() !== selectedDate.getMonth() ||
      currentMonth.getFullYear() !== selectedDate.getFullYear()
    ) {
      setCurrentMonth(new Date(selectedDate))
    }
  }, [selectedDate, currentMonth])

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

  const handleSelectDay = (day: number, monthOffset = 0) => {
    const newDate = new Date(year, month + monthOffset, day)
    onDateSelect(newDate)
  }

  return (
    <div className="p-4 border-b">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium">{format(currentMonth, "LLLL yyyy", { locale: ru })}</div>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth} aria-label="Предыдущий месяц">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth} aria-label="Следующий месяц">
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
            onClick={() => handleSelectDay(day, -1)}
          >
            {day}
          </Button>
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const currentDate = new Date(year, month, day)
          const isCurrentDay = isToday(currentDate)
          const isSelected = isSameDay(currentDate, selectedDate)

          return (
            <Button
              key={`current-${day}`}
              variant="ghost"
              className={cn(
                "h-8 w-full p-0",
                isCurrentDay && "bg-primary/10",
                isSelected && "bg-primary text-primary-foreground",
              )}
              onClick={() => handleSelectDay(day)}
            >
              {day}
            </Button>
          )
        })}

        {nextMonthDays.map((day) => (
          <Button
            key={`next-${day}`}
            variant="ghost"
            className="h-8 w-full p-0 text-muted-foreground opacity-50"
            onClick={() => handleSelectDay(day, 1)}
          >
            {day}
          </Button>
        ))}
      </div>
    </div>
  )
}
