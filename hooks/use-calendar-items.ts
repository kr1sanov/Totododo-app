"use client"

import { useState, useEffect } from "react"
import { getFromStorage, saveToStorage } from "@/lib/storage-utils"
import type { CalendarItem } from "@/types"

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
  const addItem = (item: CalendarItem) => {
    setItems((prevItems) => [...prevItems, item])
  }

  // Обновление существующего элемента
  const updateItem = (updatedItem: CalendarItem) => {
    setItems((prevItems) => prevItems.map((item) => (item.id === updatedItem.id ? updatedItem : item)))
  }

  // Удаление элемента (перемещение в корзину)
  const deleteItem = (id: string) => {
    const itemToDelete = items.find((item) => item.id === id)
    if (itemToDelete) {
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

      // Удаляем из основного списка
      setItems((prevItems) => prevItems.filter((item) => item.id !== id))
    }
  }

  // Архивирование элемента
  const archiveItem = (id: string) => {
    const itemToArchive = items.find((item) => item.id === id)
    if (itemToArchive) {
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

      // Удаляем из основного списка
      setItems((prevItems) => prevItems.filter((item) => item.id !== id))
    }
  }

  // Удаление повторяющегося элемента
  const deleteRecurringItem = (id: string, deleteAll: boolean) => {
    const itemToDelete = items.find((item) => item.id === id)

    if (!itemToDelete) return

    if (deleteAll) {
      // Находим все элементы с таким же заголовком и типом повторения
      const itemsToDelete = items.filter(
        (item) =>
          item.title === itemToDelete.title &&
          item.repeatType === itemToDelete.repeatType &&
          item.type === itemToDelete.type,
      )

      // Добавляем все в корзину
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

      // Удаляем все из основного списка
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
    } else {
      // Удаляем только выбранный элемент
      deleteItem(id)
    }
  }

  // Получение элементов по дате
  const getItemsByDate = (date: Date) => {
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
  }

  // Получение статистики
  const getStatistics = (startDate?: Date, endDate?: Date) => {
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
  }

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
