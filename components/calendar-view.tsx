"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CalendarIcon, ChevronDown, ChevronUp, Plus } from "lucide-react"
import { CalendarHeader } from "@/components/calendar-header"
import { CalendarTimeline } from "@/components/calendar-timeline"
import { ItemTypeDialog } from "@/components/item-type-dialog"
import { CalendarItemDialog } from "@/components/calendar-item-dialog"
import { useToday } from "@/hooks/use-today"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { useCalendarStore } from "@/lib/store"
import { useMobile } from "@/hooks/use-mobile"

export function CalendarView() {
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false)
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false)
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedType, setSelectedType] = useState<"event" | "task" | null>(null)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)

  // Используем Zustand хранилище для календарных элементов
  const { items, addItem, updateItem, removeItem, fetchItems, setupItemsSubscription } = useCalendarStore()

  // Используем хуки
  const { today, goToToday } = useToday()
  const isMobile = useMobile()

  // Загружаем элементы календаря и настраиваем подписку при монтировании
  useEffect(() => {
    fetchItems()

    // Настраиваем подписку на изменения в реальном времени
    const unsubscribe = setupItemsSubscription()

    // Отписываемся при размонтировании
    return () => {
      unsubscribe()
    }
  }, [fetchItems, setupItemsSubscription])

  const toggleCalendar = () => {
    setIsCalendarExpanded(!isCalendarExpanded)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    // Auto-collapse calendar on mobile after date selection
    if (isMobile) {
      setIsCalendarExpanded(false)
    }
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

  // Мемоизированная функция для сохранения элементов
  const handleSaveItem = useCallback(
    (item: any) => {
      try {
        if (selectedItem) {
          updateItem(item.id, item)
        } else {
          addItem(item)
        }
        setIsItemDialogOpen(false)
      } catch (error) {
        console.error("Error saving item:", error)
      }
    },
    [selectedItem, addItem, updateItem],
  )

  return (
    <div className="flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-30 bg-background">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <div className="flex items-center">
              <h2 className="text-lg font-medium">{format(selectedDate || today, "LLLL", { locale: ru })}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCalendar}
                className="ml-1"
                aria-label={isCalendarExpanded ? "Скрыть календарь" : "Показать календарь"}
              >
                {isCalendarExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={goToToday} className="h-10 w-10" aria-label="Сегодня">
              <CalendarIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {isCalendarExpanded && <CalendarHeader onDateSelect={handleDateSelect} selectedDate={selectedDate} />}
      </div>

      <div className="mt-[72px]">
        <CalendarTimeline
          selectedDate={selectedDate}
          onCreateItem={handleCreateItem}
          onEditItem={handleEditItem}
          items={items}
          onUpdateItem={updateItem}
          onDeleteItem={removeItem}
        />
      </div>

      <Button
        className="fixed bottom-24 right-4 rounded-full shadow-lg z-10 w-16 h-16 p-0"
        onClick={() => handleCreateItem(selectedDate)}
        aria-label="Создать новый элемент"
      >
        <Plus className="h-8 w-8 font-bold" strokeWidth={3} />
      </Button>

      <ItemTypeDialog
        isOpen={isTypeDialogOpen}
        onClose={() => setIsTypeDialogOpen(false)}
        onSelectType={handleTypeSelect}
      />

      {selectedType && (
        <CalendarItemDialog
          isOpen={isItemDialogOpen}
          onClose={() => setIsItemDialogOpen(false)}
          date={selectedDate}
          type={selectedType}
          item={selectedItem || undefined}
          onSave={handleSaveItem}
        />
      )}
    </div>
  )
}
