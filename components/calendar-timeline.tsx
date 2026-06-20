"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { CalendarItemCard } from "@/components/calendar-item-card"
import { format, addDays, isToday, isSameDay, startOfDay, subDays, addMonths, subMonths } from "date-fns"
import { ru } from "date-fns/locale"

interface CalendarTimelineProps {
  selectedDate: Date
  onCreateItem: (date: Date) => void
  onEditItem: (item: any) => void
  onUpdateItem: (item: any) => void
  onDeleteItem: (id: string, deleteAll: boolean) => void
  forceUpdate?: boolean
  onCloseItemCard?: () => void
  items: any[]
  onMonthChange?: (monthLabel: string) => void
  onArchiveItem?: (id: string) => void
  onVisibleDateChange?: (date: Date) => void
}

function buildDateRange(centerDate: Date) {
  const startDate = subMonths(centerDate, 6)
  const endDate = addMonths(centerDate, 6)
  const nextDates: Date[] = []
  let currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    nextDates.push(new Date(currentDate))
    currentDate = addDays(currentDate, 1)
  }

  return nextDates
}

export function CalendarTimeline(props: CalendarTimelineProps) {
  const {
    selectedDate,
    onCreateItem,
    onEditItem,
    onUpdateItem,
    onDeleteItem,
    forceUpdate,
    onCloseItemCard,
    items,
    onMonthChange,
    onArchiveItem,
    onVisibleDateChange,
  } = props

  const [dates, setDates] = useState<Date[]>(() => buildDateRange(selectedDate))
  const timelineRef = useRef<HTMLDivElement>(null)
  const topObserverRef = useRef<IntersectionObserver | null>(null)
  const bottomObserverRef = useRef<IntersectionObserver | null>(null)
  const loadMoreTopRef = useRef<HTMLDivElement>(null)
  const loadMoreBottomRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const isInitialScrollRef = useRef(true)
  const lastVisibleMonthRef = useRef("")
  const lastVisibleDateRef = useRef("")
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const selectedDateRef = useRef(startOfDay(selectedDate))
  const pendingScrollTargetRef = useRef<string | null>(null)

  // Генерируем начальные даты
  const generateInitialDates = useCallback(() => {
    return buildDateRange(selectedDate)
  }, [selectedDate])

  // Инициализация дат
  useEffect(() => {
    selectedDateRef.current = startOfDay(selectedDate)
  }, [selectedDate])

  // Загрузка дополнительных дат при прокрутке вниз
  const loadMoreDates = useCallback(() => {
    if (isLoading) return

    setIsLoading(true)

    setTimeout(() => {
      setDates((prevDates) => {
        if (prevDates.length === 0) return generateInitialDates()

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
  }, [isLoading, generateInitialDates])

  // Загрузка дополнительных дат при прокрутке вверх
  const loadPreviousDates = useCallback(() => {
    if (isLoading) return

    setIsLoading(true)

    setTimeout(() => {
      setDates((prevDates) => {
        if (prevDates.length === 0) return generateInitialDates()

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
  }, [isLoading, generateInitialDates])

  // Настройка Intersection Observer для бесконечной прокрутки вниз
  useEffect(() => {
    if (!loadMoreBottomRef.current || bottomObserverRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          loadMoreDates()
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(loadMoreBottomRef.current)
    bottomObserverRef.current = observer

    return () => {
      if (bottomObserverRef.current) {
        bottomObserverRef.current.disconnect()
        bottomObserverRef.current = null
      }
    }
  }, [loadMoreDates, isLoading])

  // Настройка Intersection Observer для бесконечной прокрутки вверх
  useEffect(() => {
    if (!loadMoreTopRef.current || topObserverRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          loadPreviousDates()
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(loadMoreTopRef.current)
    topObserverRef.current = observer

    return () => {
      if (topObserverRef.current) {
        topObserverRef.current.disconnect()
        topObserverRef.current = null
      }
    }
  }, [loadPreviousDates, isLoading])

  // Обновление видимого месяца при прокрутке
  useEffect(() => {
    const timeline = timelineRef.current
    if (!timeline) return

    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      scrollTimeoutRef.current = setTimeout(() => {
        if (!timeline) return

        // Находим все заголовки месяцев
        const daySections = timeline.querySelectorAll<HTMLElement>("[data-date-anchor]")
        if (daySections.length > 0 && onVisibleDateChange) {
          const timelineRect = timeline.getBoundingClientRect()
          const threshold = timelineRect.top + 180
          let visibleSection = daySections[0]

          for (const section of daySections) {
            const rect = section.getBoundingClientRect()
            if (rect.top <= threshold) {
              visibleSection = section
            } else {
              break
            }
          }

          const visibleDateValue = visibleSection.getAttribute("data-date-value")
          if (visibleDateValue && visibleDateValue !== lastVisibleDateRef.current) {
            lastVisibleDateRef.current = visibleDateValue
            const nextVisibleDate = new Date(visibleDateValue)
            if (!isSameDay(nextVisibleDate, selectedDateRef.current)) {
              onVisibleDateChange(nextVisibleDate)
            }
          }
        }

        if (!onMonthChange) return

        const monthHeaders = timeline.querySelectorAll("[data-month-header]")
        if (monthHeaders.length === 0) return

        // Определяем видимую область
        const scrollTop = timeline.scrollTop
        const clientHeight = timeline.clientHeight
        const viewportMiddle = scrollTop + clientHeight / 2

        // Находим ближайший к центру экрана заголовок месяца
        let closestHeader = null
        let minDistance = Number.POSITIVE_INFINITY

        for (let i = 0; i < monthHeaders.length; i++) {
          const header = monthHeaders[i]
          const rect = header.getBoundingClientRect()
          const headerMiddle = rect.top + rect.height / 2 + scrollTop - timeline.offsetTop
          const distance = Math.abs(headerMiddle - viewportMiddle)

          if (distance < minDistance) {
            closestHeader = header
            minDistance = distance
          }
        }

        if (closestHeader) {
          const monthLabel = closestHeader.getAttribute("data-month-label")
          if (monthLabel && monthLabel !== lastVisibleMonthRef.current) {
            lastVisibleMonthRef.current = monthLabel
            onMonthChange(monthLabel)
          }
        }
      }, 100)
    }

    // Добавляем обработчик скролла
    timeline.addEventListener("scroll", handleScroll)

    // Вызываем обработчик один раз после монтирования для установки начального месяца
    setTimeout(handleScroll, 300)

    return () => {
      timeline.removeEventListener("scroll", handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [onMonthChange, onVisibleDateChange])

  const ensureDateInRange = useCallback(
    (targetDate: Date) => {
      const targetTime = startOfDay(targetDate).getTime()

      setDates((prevDates) => {
        if (prevDates.length === 0) {
          return generateInitialDates()
        }

        const firstDate = startOfDay(prevDates[0]).getTime()
        const lastDate = startOfDay(prevDates[prevDates.length - 1]).getTime()

        if (targetTime >= firstDate && targetTime <= lastDate) {
          return prevDates
        }

        return buildDateRange(targetDate)
      })
    },
    [generateInitialDates],
  )

  const scrollToDate = useCallback(
    (targetDate: Date, behavior: ScrollBehavior) => {
      const targetDateString = startOfDay(targetDate).toISOString().split("T")[0]
      const targetElement = timelineRef.current?.querySelector<HTMLElement>(`#date-${targetDateString}`)

      if (targetElement && timelineRef.current) {
        timelineRef.current.scrollTo({
          top: Math.max(targetElement.offsetTop - 96, 0),
          behavior,
        })
        pendingScrollTargetRef.current = null
        return true
      }

      pendingScrollTargetRef.current = targetDateString
      ensureDateInRange(targetDate)
      return false
    },
    [ensureDateInRange],
  )

  // Первоначальная прокрутка к выбранной дате
  useEffect(() => {
    if (dates.length === 0 || !timelineRef.current || !isInitialScrollRef.current) return

    const hasScrolled = scrollToDate(selectedDate, "auto")

    if (hasScrolled) {
      setTimeout(() => {
        isInitialScrollRef.current = false
      }, 50)
    }
  }, [dates, scrollToDate, selectedDate])

  // Прокрутка к новой выбранной дате
  useEffect(() => {
    if (dates.length === 0 || !timelineRef.current || isInitialScrollRef.current) return

    if (pendingScrollTargetRef.current) {
      const pendingElement = timelineRef.current.querySelector<HTMLElement>(`#date-${pendingScrollTargetRef.current}`)
      if (pendingElement) {
        timelineRef.current.scrollTo({
          top: Math.max(pendingElement.offsetTop - 96, 0),
          behavior: "auto",
        })
        pendingScrollTargetRef.current = null
        return
      }
    }

    scrollToDate(selectedDate, "smooth")
  }, [selectedDate, dates.length, scrollToDate])

  // Получение элементов для даты
  const getItemsForDate = useCallback(
    (date: Date) => {
      if (!items || items.length === 0) return []

      const dateString = date.toISOString().split("T")[0]
      const result = []

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (!item || !item.date) continue

        try {
          const itemDate = new Date(item.date).toISOString().split("T")[0]

          // Проверяем повторяющиеся элементы
          if (item.repeatType && item.repeatType !== "none") {
            const itemDateObj = new Date(item.date)
            const targetDate = new Date(date)

            if (item.repeatType === "daily") {
              result.push(item)
              continue
            }

            if (item.repeatType === "weekly" && itemDateObj.getDay() === targetDate.getDay()) {
              result.push(item)
              continue
            }

            if (item.repeatType === "monthly" && itemDateObj.getDate() === targetDate.getDate()) {
              result.push(item)
              continue
            }
          }

          // Для обычных элементов проверяем точное совпадение даты
          if (itemDate === dateString) {
            result.push(item)
          }
        } catch (error) {
          console.error("Error processing item date:", error)
        }
      }

      return result
    },
    [items],
  )

  const isMonthStart = (date: Date, index: number) => {
    return index === 0 || date.getDate() === 1
  }

  // Используем пустую функцию как fallback для onClose, чтобы избежать ошибок
  const emptyOnClose = () => {}

  // Обработчик архивирования
  const handleArchive = useCallback(
    (id: string) => {
      onArchiveItem?.(id)
    },
    [onArchiveItem],
  )

  // Обработчик удаления
  const handleDelete = useCallback(
    (id: string, deleteAll: boolean) => {
      onDeleteItem(id, deleteAll)
    },
    [onDeleteItem],
  )

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
        const monthLabel = format(date, "LLLL yyyy", { locale: ru })
        const dateKey = date.toISOString()
        const dateId = `date-${date.toISOString().split("T")[0]}`
        const isCurrentDay = isToday(date)
        const isSelectedDay = isSameDay(date, selectedDate)

        return (
          <div key={dateKey} id={dateId} data-date-anchor data-date-value={date.toISOString()}>
            {isFirstOfMonth && (
              <div
                className="py-2 px-4 bg-muted/30 font-medium sticky top-0 z-10"
                data-month-header
                data-month-label={monthLabel}
              >
                {monthLabel}
              </div>
            )}
            <div className="flex">
              <div
                className={cn(
                  "w-16 py-4 px-2 text-center flex flex-col items-center justify-center",
                  isCurrentDay && "bg-primary/10",
                  isSelectedDay && "bg-primary/20",
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
                        key={`${item.id}-${forceUpdate}`}
                        item={item}
                        onUpdate={onUpdateItem}
                        onDelete={handleDelete}
                        onArchive={handleArchive}
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
