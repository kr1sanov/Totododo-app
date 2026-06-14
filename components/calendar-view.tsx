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
  // Состояния
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false)
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false)
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedType, setSelectedType] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [forceUpdate, setForceUpdate] = useState(false)
  const [currentMonthLabel, setCurrentMonthLabel] = useState("")

  // Хуки
  const { today, goToToday } = useToday()
  const { items, addItem, updateItem, deleteItem, archiveItem, deleteRecurringItem } = useCalendarItems()

  // Установка текущей даты и месяца при первой загрузке
  useEffect(() => {
    const now = new Date()
    setSelectedDate(now)
    setCurrentMonthLabel(format(now, "LLLL yyyy", { locale: ru }))
  }, [])

  // Обработчики
  const toggleCalendar = () => {
    setIsCalendarExpanded(!isCalendarExpanded)
  }

  const handleDateSelect = (date) => {
    setSelectedDate(date)
  }

  const handleCreateItem = (date) => {
    setSelectedDate(date)
    setSelectedItem(null)
    setIsTypeDialogOpen(true)
  }

  const handleTypeSelect = (type) => {
    setSelectedType(type)
    setIsTypeDialogOpen(false)
    setIsItemDialogOpen(true)
  }

  const handleEditItem = (item) => {
    setSelectedItem(item)
    setSelectedType(item.type)
    setSelectedDate(new Date(item.date))
    setIsItemDialogOpen(true)
  }

  // Callback для обновления текущего месяца при прокрутке
  const handleMonthChange = useCallback((monthLabel) => {
    setCurrentMonthLabel(monthLabel)
  }, [])

  // Оптимистичное обновление при создании элемента
  const handleSaveItem = useCallback(
    (item) => {
      try {
        if (selectedItem) {
          // Обновляем существующий элемент
          const updatedItem = { ...item }
          updateItem(updatedItem)

          toast({
            title: `${item.type === "event" ? "Событие" : "Задача"} обновлена`,
            description: "Изменения успешно сохранены",
          })
        } else {
          // Создаем новый элемент
          const newItem = { ...item, id: Date.now().toString() }
          addItem(newItem)

          toast({
            title: `${item.type === "event" ? "Событие" : "Задача"} создана`,
            description: "Элемент успешно добавлен в календарь",
          })
        }
        // Обновляем UI
        setForceUpdate(!forceUpdate)
      } catch (error) {
        console.error("Error saving item:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось сохранить элемент",
          variant: "destructive",
        })
      }
    },
    [selectedItem, addItem, updateItem, forceUpdate],
  )

  // Обработчик удаления
  const handleDeleteItem = useCallback(
    (id, deleteAll) => {
      try {
        if (deleteAll) {
          deleteRecurringItem(id, true)
        } else {
          deleteItem(id)
        }

        toast({
          title: "Элемент удален",
          description: "Элемент успешно удален из календаря",
        })

        setForceUpdate(!forceUpdate)
      } catch (error) {
        console.error("Error deleting item:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось удалить элемент",
          variant: "destructive",
        })
      }
    },
    [deleteItem, deleteRecurringItem, forceUpdate],
  )

  // Обработчик архивирования
  const handleArchiveItem = useCallback(
    (id) => {
      try {
        archiveItem(id)

        toast({
          title: "Элемент архивирован",
          description: "Элемент успешно перемещен в архив",
        })

        setForceUpdate(!forceUpdate)
      } catch (error) {
        console.error("Error archiving item:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось архивировать элемент",
          variant: "destructive",
        })
      }
    },
    [archiveItem, forceUpdate],
  )

  // Функция для закрытия карточки элемента
  const handleCloseItemCard = useCallback(() => {
    setForceUpdate(!forceUpdate)
  }, [forceUpdate])

  // Обработчик для кнопки "Сегодня"
  const handleGoToToday = useCallback(() => {
    const now = new Date()
    setSelectedDate(now)
    goToToday()
  }, [goToToday])

  // Закрытие диалога создания/редактирования
  const handleCloseItemDialog = useCallback(() => {
    setIsItemDialogOpen(false)
    setForceUpdate(!forceUpdate)
  }, [forceUpdate])

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
          onClose={handleCloseItemDialog}
          date={selectedDate || today}
          type={selectedType}
          item={selectedItem}
          onSave={handleSaveItem}
          onArchive={handleArchiveItem}
          onDelete={handleDeleteItem}
        />
      )}
    </div>
  )
}
