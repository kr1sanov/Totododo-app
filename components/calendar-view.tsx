"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { CalendarIcon, ChevronDown, ChevronUp, Plus } from "lucide-react"
import { CalendarHeader } from "@/components/calendar-header"
import { CalendarTimeline } from "@/components/calendar-timeline"
import { ItemTypeDialog } from "@/components/item-type-dialog"
import { CalendarItemDialog } from "@/components/calendar-item-dialog"
import { useToday } from "@/hooks/use-today"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { useCalendarItems, type CalendarItem } from "@/hooks/use-calendar-items"

export function CalendarView() {
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false)
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false)
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedType, setSelectedType] = useState<"event" | "task" | null>(null)
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null)
  const { today, goToToday } = useToday()
  const { addItem, updateItem } = useCalendarItems()
  const [forceUpdate, setForceUpdate] = useState(false)

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

  const handleEditItem = (item: CalendarItem) => {
    setSelectedItem(item)
    setSelectedType(item.type)
    setSelectedDate(new Date(item.date))
    setIsItemDialogOpen(true)
  }

  // Мемоизируем функцию для избежания перерендеров
  const handleSaveItem = useCallback(
    (item: CalendarItem) => {
      if (selectedItem) {
        updateItem(item)
      } else {
        addItem(item)
      }
      // Немедленно обновляем интерфейс после создания/редактирования
      setForceUpdate((prev) => !prev)
    },
    [selectedItem, addItem, updateItem],
  )

  // Функция для закрытия карточки элемента
  const handleCloseItemCard = useCallback(() => {
    // Принудительно обновляем состояние компонента при закрытии карточки
    setForceUpdate((prev) => !prev)
  }, [])

  return (
    <div className="flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-30 bg-background">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <div className="flex items-center">
              <h2 className="text-lg font-medium">{format(selectedDate || today, "LLLL", { locale: ru })}</h2>
              <Button variant="ghost" size="icon" onClick={toggleCalendar} className="ml-1">
                {isCalendarExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={goToToday} className="h-10 w-10">
              <CalendarIcon className="h-5 w-5" />
              <span className="sr-only">Сегодня</span>
            </Button>
          </div>
        </div>

        {isCalendarExpanded && <CalendarHeader onDateSelect={handleDateSelect} selectedDate={selectedDate || today} />}
      </div>

      <div className="mt-[72px]">
        <CalendarTimeline
          selectedDate={selectedDate || today}
          onCreateItem={handleCreateItem}
          onEditItem={handleEditItem}
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
