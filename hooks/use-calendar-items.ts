"use client"

import { useState, useEffect, useCallback } from "react"
import { getFromStorage, saveToStorage } from "@/lib/storage-utils"
import { toast } from "@/components/ui/use-toast"

export interface CalendarItem {
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
  videoMeetingUrl?: string
  files?: { name: string; url: string }[]
  isAllDay?: boolean
  endDate?: string
}

export function useCalendarItems() {
  const [items, setItems] = useState<CalendarItem[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Загружаем элементы из localStorage при монтировании
  useEffect(() => {
    const storedItems = getFromStorage("totododo-calendar-items", [])
    setItems(storedItems)
    setIsInitialized(true)
  }, [])

  // Сохраняем элементы в localStorage при изменении
  useEffect(() => {
    if (isInitialized) {
      saveToStorage("totododo-calendar-items", items)
    }
  }, [items, isInitialized])

  // Добавление нового элемента
  const addItem = useCallback((item: CalendarItem) => {
    setItems((prevItems) => [...prevItems, item])

    toast({
      title: `${item.type === "event" ? "Событие" : "Задача"} создана`,
      description: `${item.type === "event" ? "Событие" : "Задача"} "${item.title}" успешно создана`,
    })
  }, [])

  // Обновление существующего элемента
  const updateItem = useCallback((updatedItem: CalendarItem) => {
    setItems((prevItems) => prevItems.map((item) => (item.id === updatedItem.id ? updatedItem : item)))

    toast({
      title: `${updatedItem.type === "event" ? "Событие" : "Задача"} обновлена`,
      description: `${updatedItem.type === "event" ? "Событие" : "Задача"} "${updatedItem.title}" успешно обновлена`,
    })
  }, [])

  // Удаление элемента (перемещение в корзину)
  const deleteItem = useCallback(
    (id: string, deleteAll = false) => {
      const itemToDelete = items.find((item) => item.id === id)

      if (itemToDelete) {
        // Оптимистичное обновление UI
        if (deleteAll && itemToDelete.repeatType !== "none") {
          // Удаляем все повторяющиеся элементы
          setItems((prevItems) =>
            prevItems.filter(
              (item) =>
                !(
                  item.title === itemToDelete.title &&
                  item.repeatType === itemToDelete.repeatType &&
                  item.type === itemToDelete.type
                ),
            ),
          )

          // Добавляем в корзину все повторяющиеся элементы
          const itemsToDelete = items.filter(
            (item) =>
              item.title === itemToDelete.title &&
              item.repeatType === itemToDelete.repeatType &&
              item.type === itemToDelete.type,
          )

          const trashedItems = getFromStorage("totododo-trash", [])
          itemsToDelete.forEach((item) => {
            trashedItems.push({
              id: item.id,
              title: item.title,
              type: item.type,
              deletedAt: new Date().toISOString(),
              item: item,
            })
          })
          saveToStorage("totododo-trash", trashedItems)

          toast({
            title: "Элементы удалены",
            description: `Все повторения "${itemToDelete.title}" перемещены в корзину`,
          })
        } else {
          // Удаляем только один элемент
          setItems((prevItems) => prevItems.filter((item) => item.id !== id))

          // Добавляем в корзину
          const trashedItems = getFromStorage("totododo-trash", [])
          trashedItems.push({
            id: itemToDelete.id,
            title: itemToDelete.title,
            type: itemToDelete.type,
            deletedAt: new Date().toISOString(),
            item: itemToDelete,
          })
          saveToStorage("totododo-trash", trashedItems)

          toast({
            title: `${itemToDelete.type === "event" ? "Событие" : "Задача"} удалена`,
            description: `${itemToDelete.type === "event" ? "Событие" : "Задача"} "${itemToDelete.title}" перемещена в корзину`,
          })
        }
      }
    },
    [items],
  )

  // Архивирование элемента
  const archiveItem = useCallback(
    (id: string) => {
      const itemToArchive = items.find((item) => item.id === id)

      if (itemToArchive) {
        // Оптимистичное обновление UI
        setItems((prevItems) => prevItems.filter((item) => item.id !== id))

        // Добавляем в архив
        const archivedItems = getFromStorage("totododo-archive", [])
        archivedItems.push({
          id: itemToArchive.id,
          title: itemToArchive.title,
          type: itemToArchive.type,
          archivedAt: new Date().toISOString(),
          item: itemToArchive,
        })
        saveToStorage("totododo-archive", archivedItems)

        toast({
          title: `${itemToArchive.type === "event" ? "Событие" : "Задача"} архивирована`,
          description: `${itemToArchive.type === "event" ? "Событие" : "Задача"} "${itemToArchive.title}" перемещена в архив`,
        })
      }
    },
    [items],
  )

  // Удаление повторяющегося элемента
  const deleteRecurringItem = useCallback(
    (id: string, deleteAll: boolean) => {
      deleteItem(id, deleteAll)
    },
    [deleteItem],
  )

  // Получение статистики
  const getStatistics = useCallback(
    (startDate?: Date, endDate?: Date) => {
      let filteredItems = [...items]

      // Фильтрация по диапазону дат, если указаны
      if (startDate && endDate) {
        const start = startDate.getTime()
        const end = endDate.getTime()

        filteredItems = filteredItems.filter((item) => {
          const itemTime = new Date(item.date).getTime()
          return itemTime >= start && itemTime <= end
        })
      }

      // Подсчет статистики
      const totalEvents = filteredItems.filter((item) => item.type === "event").length
      const totalTasks = filteredItems.filter((item) => item.type === "task").length
      const completedTasks = filteredItems.filter((item) => item.type === "task" && item.completed).length
      const pendingTasks = totalTasks - completedTasks

      // Подсчет просроченных задач
      const now = new Date().getTime()
      const overdueTasks = filteredItems.filter((item) => {
        if (item.type !== "task" || item.completed) return false
        const itemTime = new Date(item.date).getTime()
        return itemTime < now
      }).length

      // Статистика по приоритетам
      const highPriorityTasks = filteredItems.filter((item) => item.type === "task" && item.priority === "high").length
      const mediumPriorityTasks = filteredItems.filter(
        (item) => item.type === "task" && item.priority === "medium",
      ).length
      const lowPriorityTasks = filteredItems.filter((item) => item.type === "task" && item.priority === "low").length

      return {
        totalEvents,
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        highPriorityTasks,
        mediumPriorityTasks,
        lowPriorityTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      }
    },
    [items],
  )

  return {
    items,
    addItem,
    updateItem,
    deleteItem,
    archiveItem,
    deleteRecurringItem,
    getStatistics,
  }
}
