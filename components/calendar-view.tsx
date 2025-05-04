"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CalendarIcon, ChevronDown, ChevronUp, Plus } from "lucide-react"
import { CalendarHeader } from "@/components/calendar-header"
import { CalendarTimeline } from "@/components/calendar-timeline"
import { ItemTypeDialog } from "@/components/item-type-dialog"
import { CalendarItemDialog } from "@/components/calendar-item-dialog"
import { useToday } from "@/hooks/use-today"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { useCalendarItems } from "@/hooks/use-calendar-items"
import { toast } from "@/components/ui/use-toast"

export function CalendarView() {
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false)
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false)
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedType, setSelectedType] = useState<"event" | "task" | null>(null)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const { today, goToToday } = useToday()
  const { items, addItem, updateItem, deleteItem, archiveItem, deleteRecurringItem, getItemsByDate } =
    useCalendarItems()
  const [forceUpdate, setForceUpdate] = useState(false)
  const [currentMonthLabel, setCurrentMonthLabel] = useState("")
  const timelineRef = useRef<HTMLDivElement>(null)

  // Обновляем текущий месяц при прокрутке
  useEffect(() => {
    const updateCurrentMonth = () => {
      if (timelineRef.current) {
        const monthHeaders = timelineRef.current.querySelectorAll("[data-month-header]")
        if (monthHeaders.length === 0) return

        let currentHeader = monthHeaders[0]
        const scrollTop = timelineRef.current.scrollTop

        for (let i = 0; i < monthHeaders.length; i++) {
          const header = monthHeaders[i] as HTMLElement
          if (header.offsetTop <= scrollTop + 100) {
            currentHeader = header
          } else {
            break
          }
        }

        setCurrentMonthLabel(currentHeader.getAttribute("data-month-label") || "")
      }
    }

    const timelineElement = timelineRef.current
    if (timelineElement) {
      timelineElement.addEventListener("scroll", updateCurrentMonth)
      updateCurrentMonth() // Инициализация

      return () => {
        timelineElement.removeEventListener("scroll", updateCurrentMonth)
      }
    }
  }, [])

  const toggleCalendar = () => {
    setIsCalendarExpanded(!isCalendarExpanded)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleCreateItem = (date: Date) => {
    setSelectedDate(date)
    setSelectedItem(null)
    setIsTypeDialogOpen(true)
  }

  const handleTypeSelect = (type: "event" | "task") => {
    setSelectedType(type)
    setIsTypeDialogOpen(false)
    setIsItemDialogOpen(true)
  }

  const handleEditItem = (item: any) => {
    setSelectedItem(item)
    setSelectedType(item.type)
    setSelectedDate(new Date(item.date))
    setIsItemDialogOpen(true)
  }

  // Оптимистичное обновление при создании элемента
  const handleSaveItem = useCallback(
    (item: any) => {
      if (selectedItem) {
        // Оптимистичное обновление при редактировании
        const updatedItem = { ...item }
        updateItem(updatedItem)
        toast({
          title: `${item.type === "event" ? "Событие" : "Задача"} обновлена`,
          description: "Изменения успешно сохранены",
        })
      } else {
        // Оптимистичное обновление при создании
        const newItem = { ...item, id: Date.now().toString() }
        addItem(newItem)
        toast({
          title: `${item.type === "event" ? "Событие" : "Задача"} создана`,
          description: "Элемент успешно добавлен в календарь",
        })
      }
      // Немедленно обновляем интерфейс
      setForceUpdate((prev) => !prev)
    },
    [selectedItem, addItem, updateItem],
  )

  // Оптимистичное обновление при удалении элемента
  const handleDeleteItem = useCallback(
    (id: string, deleteAll = false) => {
      deleteItem(id, deleteAll)
      toast({
        title: "Элемент удален",
        description: "Элемент успешно удален из календаря",
      })
      setForceUpdate((prev) => !prev)
    },
    [deleteItem],
  )

  // Функция для закрытия карточки элемента
  const handleCloseItemCard = useCallback(() => {
    // Принудительно обновляем состояние компонента при закрытии карточки
    setForceUpdate((prev) => !prev)
  }, [])

  // Обработчик для кнопки "Сегодня"
  const handleGoToToday = () => {
    goToToday()
    setSelectedDate(new Date())
    // Прокрутка к сегодняшнему дню
    if (timelineRef.current) {
      const todayElement = document.getElementById(`date-${new Date().toISOString().split("T")[0]}`)
      if (todayElement) {
        timelineRef.current.scrollTo({
          top: todayElement.offsetTop - 100,
          behavior: "smooth",
        })
      }
    }
  }

  return (
    <div className="flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-30 bg-background">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <div className="flex items-center">
              <h2 className="text-lg font-medium">
                {currentMonthLabel || format(selectedDate || today, "LLLL yyyy", { locale: ru })}
              </h2>
              <Button variant="ghost" size="icon" onClick={toggleCalendar} className="ml-1 h-12 w-12">
                {isCalendarExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleGoToToday} className="h-12 w-12">
              <CalendarIcon className="h-6 w-6" />
              <span className="sr-only">Сегодня</span>
            </Button>
          </div>
        </div>

        {isCalendarExpanded && <CalendarHeader onDateSelect={handleDateSelect} selectedDate={selectedDate || today} />}
      </div>

      <div className="mt-[72px]" ref={timelineRef}>
        <CalendarTimeline
          selectedDate={selectedDate || today}
          onCreateItem={handleCreateItem}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
          forceUpdate={forceUpdate}
          onCloseItemCard={handleCloseItemCard}
        />
      </div>

      <Button
        className="fixed bottom-24 right-4 rounded-full shadow-lg z-10 w-16 h-16 p-0"
        onClick={() => handleCreateItem(selectedDate || today)}
      >
        <Plus className="h-10 w-10 font-bold" strokeWidth={3} />
      </Button>

      <ItemTypeDialog
        isOpen={isTypeDialogOpen}
        onClose={() => setIsTypeDialogOpen(false)}
        onSelectType={handleTypeSelect}
      />

      {selectedType && (
        <CalendarItemDialog
          isOpen={isItemDialogOpen}
          onClose={() => {
            setIsItemDialogOpen(false)
            // Обновляем интерфейс при закрытии диалога
            setForceUpdate((prev) => !prev)
          }}
          date={selectedDate || today}
          type={selectedType}
          item={selectedItem || undefined}
          onSave={handleSaveItem}
        />
      )}
    </div>
  )
}
