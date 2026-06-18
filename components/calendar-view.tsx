"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { CalendarIcon, ChevronDown, ChevronUp, Plus } from "lucide-react"
import { CalendarHeader } from "@/components/calendar-header"
import { CalendarTimeline } from "@/components/calendar-timeline"
import { ItemTypeDialog } from "@/components/item-type-dialog"
import { CalendarItemDialog } from "@/components/calendar-item-dialog"
import { useToday } from "@/hooks/use-today"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { useEvents } from "@/hooks/use-events"
import { useProjects } from "@/hooks/use-projects"
import { toast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import type { Event, Task } from "@/types"

interface CalendarItem {
  id: string
  type: "task" | "event"
  title: string
  date: string
  startTime?: string
  endTime?: string
  location?: string
  description?: string
  completed?: boolean
  priority?: "low" | "medium" | "high"
  repeatType: "none" | "daily" | "weekly" | "monthly"
  files?: { name: string; url: string }[]
  isAllDay?: boolean
  endDate?: string
  projectId?: string
  createdAt?: string
}

function getTimeLabel(value?: string) {
  if (!value) return undefined
  return format(new Date(value), "HH:mm")
}

function mergeDateAndTime(dateValue: string, timeValue?: string) {
  const date = new Date(dateValue)
  if (!timeValue) {
    return date.toISOString()
  }

  const [hours, minutes] = timeValue.split(":").map(Number)
  date.setHours(hours || 0, minutes || 0, 0, 0)
  return date.toISOString()
}

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
  const { events, addEvent, updateEvent, deleteEvent, archiveEvent } = useEvents()
  const { projects, addProject, addTask, updateTask, deleteTask, archiveTask } = useProjects()

  const items = useMemo<CalendarItem[]>(() => {
    const projectTasks = projects.flatMap((project) =>
      project.tasks.map((task) => ({
        id: task.id,
        type: "task" as const,
        title: task.title,
        date: task.dueDate || task.createdAt,
        location: task.location,
        description: task.description,
        completed: task.completed,
        priority: task.priority,
        repeatType: "none" as const,
        files: task.files,
        projectId: project.id,
        createdAt: task.createdAt,
      })),
    )

    const calendarEvents = events.map((event) => ({
      id: event.id,
      type: "event" as const,
      title: event.title,
      date: event.startDate,
      startTime: getTimeLabel(event.startDate),
      endTime: getTimeLabel(event.endDate),
      location: event.location,
      description: event.description,
      repeatType: event.repeatType,
      endDate: event.endDate,
      isAllDay: false,
      createdAt: event.createdAt,
    }))

    return [...projectTasks, ...calendarEvents]
  }, [events, projects])

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
    async (item: CalendarItem) => {
      try {
        if (item.type === "event") {
          const startDate = mergeDateAndTime(item.date, item.startTime)
          const endDate = item.endDate
            ? mergeDateAndTime(item.endDate, item.endTime)
            : new Date(new Date(startDate).getTime() + 60 * 60 * 1000).toISOString()
          const eventData: Event = {
            id: selectedItem?.id || item.id || crypto.randomUUID(),
            title: item.title,
            startDate,
            endDate,
            location: item.location,
            description: item.description,
            repeatType: item.repeatType,
          }

          if (selectedItem) {
            await updateEvent(eventData)
          } else {
            await addEvent(eventData)
          }
        } else {
          let projectId = item.projectId || projects[0]?.id

          if (!projectId) {
            const inboxProject = await addProject("Inbox")
            projectId = inboxProject?.id
          }

          if (!projectId) {
            throw new Error("Не удалось определить проект для задачи")
          }

          const taskData: Task = {
            id: selectedItem?.id || item.id || crypto.randomUUID(),
            title: item.title,
            description: item.description,
            status: item.completed ? "done" : "todo",
            projectId,
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            dueDate: mergeDateAndTime(item.date, item.startTime),
            priority: item.priority || "medium",
            tags: [],
            completed: Boolean(item.completed),
            subtasks: [],
            location: item.location,
            files: item.files || [],
          }

          if (selectedItem) {
            await updateTask(projectId, taskData.id, taskData)
          } else {
            await addTask(projectId, taskData)
          }
        }

        toast({
          title: `${item.type === "event" ? "Событие" : "Задача"} ${selectedItem ? "обновлена" : "создана"}`,
          description: "Изменения сохранены в облаке",
        })

        // Обновляем UI
        setForceUpdate(!forceUpdate)
      } catch (error) {
        console.error("Error saving item:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось сохранить элемент",
          variant: "destructive",
        })
        throw error
      }
    },
    [addEvent, addProject, addTask, forceUpdate, projects, selectedItem, updateEvent, updateTask],
  )

  const handleUpdateItem = useCallback(
    async (item: CalendarItem) => {
      try {
        if (item.type === "event") {
          await updateEvent({
            id: item.id,
            title: item.title,
            startDate: mergeDateAndTime(item.date, item.startTime),
            endDate: item.endDate ? mergeDateAndTime(item.endDate, item.endTime) : mergeDateAndTime(item.date),
            location: item.location,
            description: item.description,
            repeatType: item.repeatType,
          })
        } else if (item.projectId) {
          await updateTask(item.projectId, item.id, {
            title: item.title,
            description: item.description,
            dueDate: mergeDateAndTime(item.date, item.startTime),
            priority: item.priority || "medium",
            completed: Boolean(item.completed),
            status: item.completed ? "done" : "todo",
            location: item.location,
            files: item.files || [],
          })
        }

        setForceUpdate((current) => !current)
      } catch (error) {
        console.error("Error updating item:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось обновить элемент",
          variant: "destructive",
        })
      }
    },
    [updateEvent, updateTask],
  )

  // Обработчик удаления
  const handleDeleteItem = useCallback(
    async (id, deleteAll) => {
      try {
        const item = items.find((currentItem) => currentItem.id === id)
        if (!item) {
          return
        }

        if (item.type === "event") {
          await deleteEvent(id)
        } else if (item.projectId) {
          await deleteTask(item.projectId, id)
        } else {
          throw new Error("Не удалось определить проект задачи")
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
    [deleteEvent, deleteTask, forceUpdate, items],
  )

  // Обработчик архивирования
  const handleArchiveItem = useCallback(
    async (id) => {
      try {
        const item = items.find((currentItem) => currentItem.id === id)
        if (!item) {
          return
        }

        if (item.type === "event") {
          await archiveEvent(id)
        } else if (item.projectId) {
          await archiveTask(item.projectId, id)
        } else {
          throw new Error("Не удалось определить проект задачи")
        }

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
    [archiveEvent, archiveTask, forceUpdate, items],
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
          onUpdateItem={handleUpdateItem}
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
          projects={projects.map((project) => ({ id: project.id, name: project.title }))}
        />
      )}
    </div>
  )
}
