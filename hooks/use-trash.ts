"use client"

import { useState, useEffect, useCallback } from "react"
import { getFromStorage, saveToStorage } from "@/lib/storage-utils"

export interface TrashedItem {
  id: string
  title: string
  type: string
  deletedAt: string
  item: any
}

export function useTrash() {
  const [trashedItems, setTrashedItems] = useState<TrashedItem[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Load trashed items from localStorage
  useEffect(() => {
    const storedItems = getFromStorage("totododo-trash", [])
    setTrashedItems(storedItems)
    setIsInitialized(true)
  }, [])

  // Save trashed items to localStorage when they change
  useEffect(() => {
    if (isInitialized) {
      saveToStorage("totododo-trash", trashedItems)
    }
  }, [trashedItems, isInitialized])

  // Restore an item from trash
  const restoreItem = useCallback(
    (id: string) => {
      const itemToRestore = trashedItems.find((item) => item.id === id)

      if (itemToRestore) {
        // Optimistic update - remove from trash immediately
        const updatedTrashedItems = trashedItems.filter((item) => item.id !== id)
        setTrashedItems(updatedTrashedItems)

        // Restore to original location based on type
        if (itemToRestore.type === "projects") {
          const projects = getFromStorage("totododo-projects", [])
          const updatedProjects = [...projects, itemToRestore.item]
          saveToStorage("totododo-projects", updatedProjects)
        } else if (itemToRestore.type === "tasks") {
          const projects = getFromStorage("totododo-projects", [])
          const updatedProjects = projects.map((project: any) => {
            if (project.id === itemToRestore.item.projectId) {
              return {
                ...project,
                tasks: [...project.tasks, itemToRestore.item],
              }
            }
            return project
          })
          saveToStorage("totododo-projects", updatedProjects)
        } else if (itemToRestore.type === "event" || itemToRestore.type === "task") {
          const calendarItems = getFromStorage("totododo-calendar-items", [])
          const updatedCalendarItems = [...calendarItems, itemToRestore.item]
          saveToStorage("totododo-calendar-items", updatedCalendarItems)
        }

        // Save updated trash
        saveToStorage("totododo-trash", updatedTrashedItems)

        return itemToRestore
      }

      return null
    },
    [trashedItems],
  )

  // Delete an item permanently from trash
  const deleteItem = useCallback(
    (id: string) => {
      const itemToDelete = trashedItems.find((item) => item.id === id)

      if (itemToDelete) {
        // Optimistic update - remove from trash immediately
        const updatedTrashedItems = trashedItems.filter((item) => item.id !== id)
        setTrashedItems(updatedTrashedItems)

        // Save updated trash
        saveToStorage("totododo-trash", updatedTrashedItems)

        return itemToDelete
      }

      return null
    },
    [trashedItems],
  )

  // Empty the trash completely
  const emptyTrash = useCallback(() => {
    // Optimistic update - clear trash immediately
    setTrashedItems([])

    // Save empty trash
    saveToStorage("totododo-trash", [])
  }, [])

  return {
    trashedItems,
    restoreItem,
    deleteItem,
    emptyTrash,
  }
}
