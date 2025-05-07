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
import { useCalendarItems } from "@/hooks/use-calendar-items"
import { toast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"

export function CalendarView() {
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false)
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false)
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedType, setSelectedType] = useState<"event" | "task" | null>(null)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const { today, goToToday } = useToday()
  const { items, addItem, updateItem, deleteItem, archiveItem, deleteRecurringItem } = useCalendarItems()
  const [forceUpdate, setForceUpdate] = useState(false)
  const [currentMonthLabel, setCurrentMonthLabel] = useState(format(new Date(), "LLLL yyyy", { locale: ru }))

  // Установка текущей даты при первой загрузке
  useEffect(() => {
    setSelectedDate(new Date())
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

  // Callback для обновления текущего месяца при прокрутке
  const handleMonthChange = useCallback((monthLabel: string) => {
    setCurrentMonthLabel(monthLabel)
  }, [])

  // Оптимистичное обновление при создании элемента
  const handleSaveItem = useCallback(
    (item: any) => {
      try {
        if (selectedItem) {
          // Create a copy of the item to avoid reference issues
          const updatedItem = { ...item }
          // Update state immediately for optimistic UI
          updateItem(updatedItem)

          toast({
            title: `${item.type === "event" ? "Событие" : "Задача"} обновлена`,
            description: "Изменения успешно сохранены",
          })
        } else {
          // Create a copy of the item with a new ID for optimistic UI
          const newItem = { ...item, id: Date.now().toString() }
          // Add to state immediately
          addItem(newItem)

          toast({
            title: `${item.type === "event" ? "Событие" : "Задача"} создана`,
            description: "Элемент успешно добавлен в календарь",
          })
        }
        // Force update the UI immediately
        setForceUpdate((prev) => !prev)
      } catch (error) {
        console.error("Error saving item:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось сохранить элемент",
          variant: "destructive",
        })
      }
    },
    [selectedItem, addItem, updateItem],
  )

  // Update the handleDeleteItem function
  const handleDeleteItem = useCallback(
    (id: string, deleteAll = false) => {
      try {
        // Delete immediately for optimistic UI
        if (deleteAll) {
          deleteRecurringItem(id, true)
        } else {
          deleteItem(id)
        }

        toast({
          title: "Элемент удален",
          description: "Элемент успешно удален из календаря",
        })

        // Force update the UI immediately
        setForceUpdate((prev) => !prev)
      } catch (error) {
        console.error("Error deleting item:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось удалить элемент",
          variant: "destructive",
        })
      }
    },
    [deleteItem, deleteRecurringItem],
  )

  // Обработчик архивирования
  const handleArchiveItem = useCallback(
    (id: string) => {
      try {
        // Архивируем элемент
        archiveItem(id)

        toast({
          title: "Элемент архивирован",
          description: "Элемент успешно перемещен в архив",
        })

        // Force update the UI immediately
        setForceUpdate((prev) => !prev)
      } catch (error) {
        console.error("Error archiving item:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось архивировать элемент",
          variant: "destructive",
        })
      }
    },
    [archiveItem],
  )

  // Функция для закрытия карточки элемента
  const handleCloseItemCard = useCallback(() => {
    // Принудительно обновляем состояние компонента при закрытии карточки
    setForceUpdate((prev) => !prev)
  }, [])

  // Обработчик для кнопки "Сегодня"
  const handleGoToToday = useCallback(() => {
    const today = new Date()
    setSelectedDate(today)
    goToToday()
  }, [goToToday])

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
            <Button variant="outline" size="sm" onClick={handleGoToToday} className="h-9">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Сегодня
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {isCalendarExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <CalendarHeader onDateSelect={handleDateSelect} selectedDate={selectedDate || today} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-[72px]">
        <CalendarTimeline
          selectedDate={selectedDate || today}
          onCreateItem={handleCreateItem}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
          onArchiveItem={handleArchiveItem}
          forceUpdate={forceUpdate}
          onCloseItemCard={handleCloseItemCard}
          items={items}
          onMonthChange={handleMonthChange}
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
          onArchive={handleArchiveItem}
          onDelete={handleDeleteItem}
        />
      )}
    </div>
  )
}
