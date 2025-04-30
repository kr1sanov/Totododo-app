"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { CalendarItemCard } from "@/components/calendar-item-card"
import { format, addDays, isToday, isSameDay, subDays, addMonths, subMonths } from "date-fns"
import { ru } from "date-fns/locale"
import { useCalendarItems } from "@/hooks/use-calendar-items"

interface CalendarItem {
  id: string
  date: Date
  title: string
  description?: string
  // Add other properties as needed
}

interface CalendarTimelineProps {
  selectedDate: Date
  onCreateItem: (date: Date) => void
  onEditItem: (item: CalendarItem) => void
  forceUpdate?: boolean
  onCloseItemCard?: () => void
}

export function CalendarTimeline({
  selectedDate,
  onCreateItem,
  onEditItem,
  forceUpdate,
  onCloseItemCard,
}: CalendarTimelineProps) {
  const [dates, setDates] = useState<Date[]>([])
  const timelineRef = useRef<HTMLDivElement>(null)
  const topObserverRef = useRef<IntersectionObserver | null>(null)
  const bottomObserverRef = useRef<IntersectionObserver | null>(null)
  const loadMoreTopRef = useRef<HTMLDivElement>(null)
  const loadMoreBottomRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { getItemsByDate, updateItem, deleteItem, archiveItem, deleteRecurringItem } = useCalendarItems()

  // Генерируем начальные даты на 3 месяца вперед и 3 месяца назад от выбранной даты
  const generateInitialDates = useCallback(() => {
    const startDate = subMonths(selectedDate, 3)
    const endDate = addMonths(selectedDate, 3)

    const newDates = []
    let currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      newDates.push(new Date(currentDate))
      currentDate = addDays(currentDate, 1)
    }

    return newDates
  }, [selectedDate])

  // Инициализация дат
  useEffect(() => {
    setDates(generateInitialDates())
  }, [generateInitialDates])

  // Загрузка дополнительных дат при прокрутке вниз
  const loadMoreDates = useCallback(() => {
    if (isLoading) return

    setIsLoading(true)

    setTimeout(() => {
      setDates((prevDates) => {
        const lastDate = prevDates[prevDates.length - 1]
        const newDates = []

        let currentDate = addDays(lastDate, 1)
        for (let i = 0; i < 30; i++) {
          newDates.push(new Date(currentDate))
          currentDate = addDays(currentDate, 1)
        }

        return [...prevDates, ...newDates]
      })

      setIsLoading(false)
    }, 300)
  }, [isLoading])

  // Загрузка дополнительных дат при прокрутке вверх
  const loadPreviousDates = useCallback(() => {
    if (isLoading) return

    setIsLoading(true)

    setTimeout(() => {
      setDates((prevDates) => {
        const firstDate = prevDates[0]
        const newDates = []

        let currentDate = subDays(firstDate, 1)
        for (let i = 0; i < 30; i++) {
          newDates.unshift(new Date(currentDate))
          currentDate = subDays(currentDate, 1)
        }

        return [...newDates, ...prevDates]
      })

      // Сохраняем позицию прокрутки
      if (timelineRef.current) {
        const currentScroll = timelineRef.current.scrollTop

        setTimeout(() => {
          if (timelineRef.current) {
            timelineRef.current.scrollTop = currentScroll + 600
          }
        }, 10)
      }

      setIsLoading(false)
    }, 300)
  }, [isLoading])

  // Настройка Intersection Observer для бесконечной прокрутки вниз
  useEffect(() => {
    if (loadMoreBottomRef.current && !bottomObserverRef.current) {
      bottomObserverRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !isLoading) {
            loadMoreDates()
          }
        },
        { threshold: 0.1 },
      )

      bottomObserverRef.current.observe(loadMoreBottomRef.current)
    }

    return () => {
      if (bottomObserverRef.current) {
        bottomObserverRef.current.disconnect()
        bottomObserverRef.current = null
      }
    }
  }, [loadMoreDates, isLoading])

  // Настройка Intersection Observer для бесконечной прокрутки вверх
  useEffect(() => {
    if (loadMoreTopRef.current && !topObserverRef.current) {
      topObserverRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !isLoading) {
            loadPreviousDates()
          }
        },
        { threshold: 0.1 },
      )

      topObserverRef.current.observe(loadMoreTopRef.current)
    }

    return () => {
      if (topObserverRef.current) {
        topObserverRef.current.disconnect()
        topObserverRef.current = null
      }
    }
  }, [loadPreviousDates, isLoading])

  // Прокрутка к выбранной дате
  useEffect(() => {
    const dateIndex = dates.findIndex((date) => isSameDay(date, selectedDate))

    if (dateIndex !== -1) {
      // Прокрутка к выбранной дате с небольшой задержкой
      setTimeout(() => {
        const element = document.getElementById(`date-${selectedDate.toISOString().split("T")[0]}`)
        if (element && timelineRef.current) {
          timelineRef.current.scrollTo({
            top: element.offsetTop - 100,
            behavior: "smooth",
          })
        }
      }, 100)
    }
  }, [selectedDate, dates])

  // Мемоизируем функцию получения элементов для даты
  const getItemsForDate = useCallback(
    (date: Date) => {
      return getItemsByDate(date)
    },
    [getItemsByDate],
  )

  const isMonthStart = (date: Date, index: number) => {
    return index === 0 || date.getDate() === 1
  }

  // Используем пустую функцию как fallback для onClose, чтобы избежать ошибок
  const emptyOnClose = () => {}

  return (
    <div
      className="flex flex-col divide-y"
      ref={timelineRef}
      style={{ height: "calc(100vh - 120px)", overflowY: "auto" }}
    >
      <div ref={loadMoreTopRef} className="h-10 flex items-center justify-center text-muted-foreground">
        {isLoading ? "Загрузка..." : ""}
      </div>

      {dates.map((date, index) => {
        const dateItems = getItemsForDate(date)
        const isFirstOfMonth = isMonthStart(date, index)

        return (
          <div key={date.toISOString()} id={`date-${date.toISOString().split("T")[0]}`}>
            {isFirstOfMonth && (
              <div className="py-2 px-4 bg-muted/30 font-medium sticky top-0 z-10">
                {format(date, "LLLL yyyy", { locale: ru })}
              </div>
            )}
            <div className="flex">
              <div
                className={cn(
                  "w-16 py-4 px-2 text-center flex flex-col items-center justify-center",
                  isToday(date) && "bg-primary/10",
                  isSameDay(date, selectedDate) && "bg-primary/20",
                )}
              >
                <div className="text-lg font-bold">{date.getDate()}</div>
                <div className="text-xs text-muted-foreground">{format(date, "EEEEEE", { locale: ru })}</div>
              </div>

              <div className="flex-1 p-2">
                {dateItems.length > 0 ? (
                  <div className="space-y-2">
                    {dateItems.map((item) => (
                      <CalendarItemCard
                        key={item.id}
                        item={item}
                        onUpdate={updateItem}
                        onDelete={(id, deleteAll) => (deleteAll ? deleteRecurringItem(id, true) : deleteItem(id))}
                        onArchive={archiveItem}
                        onEdit={onEditItem}
                        onClose={onCloseItemCard || emptyOnClose}
                      />
                    ))}
                    <Button variant="ghost" size="sm" className="w-full text-base" onClick={() => onCreateItem(date)}>
                      <Plus className="h-5 w-5 mr-1" /> Добавить
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full h-16 border-dashed text-base"
                    onClick={() => onCreateItem(date)}
                  >
                    <Plus className="h-5 w-5 mr-1" /> Добавить
                  </Button>
                )}
              </div>
            </div>
          </div>
        )
      })}
      <div ref={loadMoreBottomRef} className="h-20 flex items-center justify-center text-muted-foreground">
        {isLoading ? "Загрузка..." : ""}
      </div>
    </div>
  )
}
