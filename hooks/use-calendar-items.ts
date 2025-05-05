"use client"

import { useState, useEffect, useCallback } from "react"
import { getFromStorage, saveToStorage } from "@/lib/storage-utils"

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
  const addItem = useCallback(
    (item: CalendarItem) => {
      // Create a new array with the item added for optimistic UI
      const updatedItems = [...items, item]
      // Update state immediately
      setItems(updatedItems)
      // Save to localStorage
      saveToStorage("totododo-calendar-items", updatedItems)

      return item
    },
    [items],
  )

  // Обновление существующего элемента
  const updateItem = useCallback(
    (updatedItem: CalendarItem) => {
      // Create a new array with the item updated for optimistic UI
      const updatedItems = items.map((item) => (item.id === updatedItem.id ? updatedItem : item))
      // Update state immediately
      setItems(updatedItems)
      // Save to localStorage
      saveToStorage("totododo-calendar-items", updatedItems)

      return updatedItem
    },
    [items],
  )

  // Удаление элемента (перемещение в корзину)
  const deleteItem = useCallback(
    (id: string, deleteAll = false) => {
      const itemToDelete = items.find((item) => item.id === id)

      if (itemToDelete) {
        let updatedItems

        if (deleteAll && itemToDelete.repeatType !== "none") {
          // Delete all recurring items - create a new array for optimistic UI
          updatedItems = items.filter(
            (item) =>
              !(
                item.title === itemToDelete.title &&
                item.repeatType === itemToDelete.repeatType &&
                item.type === itemToDelete.type
              ),
          )

          // Update state immediately
          setItems(updatedItems)

          // Add to trash all recurring items
          const itemsToDelete = items.filter(
            (item) =>
              item.title === itemToDelete.title &&
              item.repeatType === itemToDelete.repeatType &&
              item.type === itemToDelete.type,
          )

          const trashedItems = getFromStorage("totododo-trash", [])
          const updatedTrash = [...trashedItems]

          itemsToDelete.forEach((item) => {
            updatedTrash.push({
              id: item.id,
              title: item.title,
              type: item.type,
              deletedAt: new Date().toISOString(),
              item: item,
            })
          })

          // Save to localStorage
          saveToStorage("totododo-calendar-items", updatedItems)
          saveToStorage("totododo-trash", updatedTrash)
        } else {
          // Delete single item - create a new array for optimistic UI
          updatedItems = items.filter((item) => item.id !== id)
          // Update state immediately
          setItems(updatedItems)

          // Add to trash
          const trashedItems = getFromStorage("totododo-trash", [])
          const updatedTrash = [
            ...trashedItems,
            {
              id: itemToDelete.id,
              title: itemToDelete.title,
              type: itemToDelete.type,
              deletedAt: new Date().toISOString(),
              item: itemToDelete,
            },
          ]

          // Save to localStorage
          saveToStorage("totododo-calendar-items", updatedItems)
          saveToStorage("totododo-trash", updatedTrash)
        }

        return itemToDelete
      }

      return null
    },
    [items],
  )

  // Архивирование элемента
  const archiveItem = useCallback(
    (id: string) => {
      const itemToArchive = items.find((item) => item.id === id)

      if (itemToArchive) {
        // Create a new array without the archived item for optimistic UI
        const updatedItems = items.filter((item) => item.id !== id)
        // Update state immediately
        setItems(updatedItems)

        // Add to archive
        const archivedItems = getFromStorage("totododo-archive", [])
        const updatedArchive = [
          ...archivedItems,
          {
            id: itemToArchive.id,
            title: itemToArchive.title,
            type: itemToArchive.type,
            archivedAt: new Date().toISOString(),
            item: itemToArchive,
          },
        ]

        // Save to localStorage
        saveToStorage("totododo-calendar-items", updatedItems)
        saveToStorage("totododo-archive", updatedArchive)

        return itemToArchive
      }

      return null
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

  // Получение элементов по дате
  const getItemsByDate = useCallback(
    (date: Date) => {
      const dateString = date.toISOString().split("T")[0]

      return items.filter((item) => {
        const itemDate = new Date(item.date).toISOString().split("T")[0]

        // Проверяем повторяющиеся элементы
        if (item.repeatType !== "none") {
          const itemDateObj = new Date(item.date)
          const targetDate = new Date(date)

          if (item.repeatType === "daily") {
            return true
          } else if (item.repeatType === "weekly") {
            return itemDateObj.getDay() === targetDate.getDay()
          } else if (item.repeatType === "monthly") {
            return itemDateObj.getDate() === targetDate.getDate()
          }
        }

        // Для обычных элементов проверяем точное совпадение даты
        return itemDate === dateString
      })
    },
    [items],
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
    getItemsByDate,
    getStatistics,
  }
}
