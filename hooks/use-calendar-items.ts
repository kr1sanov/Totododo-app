"use client"

import { useState, useEffect, useCallback } from "react"
import { getFromStorage, saveToStorage } from "@/lib/storage-utils"

// Define the CalendarItem type
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
  createdAt: string
}

export function useCalendarItems() {
  const [items, setItems] = useState<CalendarItem[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Load items from localStorage on mount
  useEffect(() => {
    try {
      const storedItems = getFromStorage("totododo-calendar-items", [])
      setItems(storedItems)
      setIsInitialized(true)
    } catch (error) {
      console.error("Error loading calendar items:", error)
      // Fallback to empty array
      setItems([])
      setIsInitialized(true)
    }
  }, [])

  // Save items to localStorage when they change
  useEffect(() => {
    if (isInitialized) {
      try {
        saveToStorage("totododo-calendar-items", items)
        setLastUpdate(new Date())
      } catch (error) {
        console.error("Error saving calendar items:", error)
      }
    }
  }, [items, isInitialized])

  // Add new item
  const addItem = useCallback((item: CalendarItem) => {
    setItems((prevItems) => {
      // Validate item before adding
      if (!item.id || !item.title || !item.date) {
        console.error("Invalid item:", item)
        return prevItems
      }
      return [...prevItems, item]
    })
  }, [])

  // Update existing item
  const updateItem = useCallback((updatedItem: CalendarItem) => {
    setItems((prevItems) => {
      // Validate item before updating
      if (!updatedItem.id || !updatedItem.title || !updatedItem.date) {
        console.error("Invalid item:", updatedItem)
        return prevItems
      }
      return prevItems.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    })
  }, [])

  // Delete item (move to trash)
  const deleteItem = useCallback(
    (id: string) => {
      const itemToDelete = items.find((item) => item.id === id)
      if (itemToDelete) {
        try {
          // Add to trash
          const trashedItems = getFromStorage("totododo-trash", [])
          trashedItems.push({
            id: itemToDelete.id,
            title: itemToDelete.title,
            type: itemToDelete.type,
            deletedAt: new Date().toISOString(),
            item: itemToDelete,
          })
          saveToStorage("totododo-trash", trashedItems)

          // Remove from main list
          setItems((prevItems) => prevItems.filter((item) => item.id !== id))
        } catch (error) {
          console.error("Error deleting item:", error)
        }
      }
    },
    [items],
  )

  // Archive item
  const archiveItem = useCallback(
    (id: string) => {
      const itemToArchive = items.find((item) => item.id === id)
      if (itemToArchive) {
        try {
          // Add to archive
          const archivedItems = getFromStorage("totododo-archive", [])
          archivedItems.push({
            id: itemToArchive.id,
            title: itemToArchive.title,
            type: itemToArchive.type,
            archivedAt: new Date().toISOString(),
            item: itemToArchive,
          })
          saveToStorage("totododo-archive", archivedItems)

          // Remove from main list
          setItems((prevItems) => prevItems.filter((item) => item.id !== id))
        } catch (error) {
          console.error("Error archiving item:", error)
        }
      }
    },
    [items],
  )

  // Delete recurring item
  const deleteRecurringItem = useCallback(
    (id: string, deleteAll: boolean) => {
      const itemToDelete = items.find((item) => item.id === id)

      if (!itemToDelete) return

      try {
        if (deleteAll) {
          // Find all items with the same title and repeat type
          const itemsToDelete = items.filter(
            (item) =>
              item.title === itemToDelete.title &&
              item.repeatType === itemToDelete.repeatType &&
              item.type === itemToDelete.type,
          )

          // Add all to trash
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

          // Remove all from main list
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
          // Delete only selected item
          deleteItem(id)
        }
      } catch (error) {
        console.error("Error deleting recurring item:", error)
      }
    },
    [items, deleteItem],
  )

  // Get items by date
  const getItemsByDate = useCallback(
    (date: Date) => {
      const dateString = date.toISOString().split("T")[0]

      return items.filter((item) => {
        const itemDate = new Date(item.date).toISOString().split("T")[0]

        // Check recurring items
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

        // For regular items check exact date match
        return itemDate === dateString
      })
    },
    [items],
  )

  // Get statistics
  const getStatistics = useCallback(
    (startDate?: Date, endDate?: Date) => {
      let filteredItems = [...items]

      // Filter by date range if specified
      if (startDate && endDate) {
        const start = startDate.getTime()
        const end = endDate.getTime()

        filteredItems = filteredItems.filter((item) => {
          const itemTime = new Date(item.date).getTime()
          return itemTime >= start && itemTime <= end
        })
      }

      // Calculate statistics
      const totalEvents = filteredItems.filter((item) => item.type === "event").length
      const totalTasks = filteredItems.filter((item) => item.type === "task").length
      const completedTasks = filteredItems.filter((item) => item.type === "task" && item.completed).length
      const pendingTasks = totalTasks - completedTasks

      // Count overdue tasks
      const now = new Date().getTime()
      const overdueTasks = filteredItems.filter((item) => {
        if (item.type !== "task" || item.completed) return false
        const itemTime = new Date(item.date).getTime()
        return itemTime < now
      }).length

      // Statistics by priority
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

  // Always return a valid object with all methods
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
