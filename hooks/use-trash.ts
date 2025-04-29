"use client"

import { useState, useEffect } from "react"
import { getFromStorage, saveToStorage } from "@/lib/storage-utils"

interface StoredItem {
  id: string
  item: any // Replace 'any' with the actual type of your calendar item
}

export function useTrash() {
  const [trashedItems, setTrashedItems] = useState<StoredItem[]>([])

  useEffect(() => {
    // Загружаем удаленные элементы из localStorage
    const storedItems = getFromStorage("totododo-trash", [])
    setTrashedItems(storedItems)
  }, [])

  const restoreItem = (id: string) => {
    const itemToRestore = trashedItems.find((item) => item.id === id)

    if (itemToRestore) {
      // Восстанавливаем элемент в основной список
      const calendarItems = getFromStorage("totododo-calendar-items", [])
      calendarItems.push(itemToRestore.item)
      saveToStorage("totododo-calendar-items", calendarItems)

      // Удаляем из корзины
      const updatedItems = trashedItems.filter((item) => item.id !== id)
      setTrashedItems(updatedItems)
      saveToStorage("totododo-trash", updatedItems)
    }
  }

  const deleteItem = (id: string) => {
    // Удаляем элемент навсегда
    const updatedItems = trashedItems.filter((item) => item.id !== id)
    setTrashedItems(updatedItems)
    saveToStorage("totododo-trash", updatedItems)
  }

  return { trashedItems, restoreItem, deleteItem }
}
