"use client"

import { useState, useEffect } from "react"
import { getFromStorage, saveToStorage } from "@/lib/storage-utils"
import type { StoredItem } from "@/types"

export function useArchive() {
  const [archivedItems, setArchivedItems] = useState<StoredItem[]>([])

  useEffect(() => {
    // Загружаем архивированные элементы из localStorage
    const storedItems = getFromStorage("totododo-archive", [])
    setArchivedItems(storedItems)
  }, [])

  const restoreItem = (id: string) => {
    const itemToRestore = archivedItems.find((item) => item.id === id)

    if (itemToRestore) {
      // Восстанавливаем элемент в основной список
      const calendarItems = getFromStorage("totododo-calendar-items", [])
      calendarItems.push(itemToRestore.item)
      saveToStorage("totododo-calendar-items", calendarItems)

      // Удаляем из архива
      const updatedItems = archivedItems.filter((item) => item.id !== id)
      setArchivedItems(updatedItems)
      saveToStorage("totododo-archive", updatedItems)
    }
  }

  const deleteItem = (id: string) => {
    const itemToDelete = archivedItems.find((item) => item.id === id)

    if (itemToDelete) {
      // Добавляем в корзину
      const trashedItems = getFromStorage("totododo-trash", [])
      trashedItems.push({
        ...itemToDelete,
        deletedAt: new Date().toISOString(),
      })
      saveToStorage("totododo-trash", trashedItems)

      // Удаляем из архива
      const updatedItems = archivedItems.filter((item) => item.id !== id)
      setArchivedItems(updatedItems)
      saveToStorage("totododo-archive", updatedItems)
    }
  }

  return { archivedItems, restoreItem, deleteItem }
}
