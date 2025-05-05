"use client"

import { useState, useEffect, useCallback } from "react"
import { getFromStorage, saveToStorage } from "@/lib/storage-utils"

export interface ArchivedItem {
  id: string
  title: string
  type: string
  archivedAt: string
  item: any
}

export function useArchive() {
  const [archivedItems, setArchivedItems] = useState<ArchivedItem[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Load archived items from localStorage
  useEffect(() => {
    const storedItems = getFromStorage("totododo-archive", [])
    setArchivedItems(storedItems)
    setIsInitialized(true)
  }, [])

  // Save archived items to localStorage when they change
  useEffect(() => {
    if (isInitialized) {
      saveToStorage("totododo-archive", archivedItems)
    }
  }, [archivedItems, isInitialized])

  // Restore an item from archive
  const restoreItem = useCallback(
    (id: string) => {
      const itemToRestore = archivedItems.find((item) => item.id === id)

      if (itemToRestore) {
        // Optimistic update - remove from archive immediately
        const updatedArchivedItems = archivedItems.filter((item) => item.id !== id)
        setArchivedItems(updatedArchivedItems)

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

        // Save updated archive
        saveToStorage("totododo-archive", updatedArchivedItems)

        return itemToRestore
      }

      return null
    },
    [archivedItems],
  )

  // Delete an item permanently from archive
  const deleteItem = useCallback(
    (id: string) => {
      const itemToDelete = archivedItems.find((item) => item.id === id)

      if (itemToDelete) {
        // Optimistic update - remove from archive immediately
        const updatedArchivedItems = archivedItems.filter((item) => item.id !== id)
        setArchivedItems(updatedArchivedItems)

        // Save updated archive
        saveToStorage("totododo-archive", updatedArchivedItems)

        return itemToDelete
      }

      return null
    },
    [archivedItems],
  )

  return {
    archivedItems,
    restoreItem,
    deleteItem,
  }
}
