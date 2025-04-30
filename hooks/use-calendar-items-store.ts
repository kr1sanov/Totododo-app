"use client"

import { useStore } from "zustand"
import { useEffect } from "react"
import { calendarItemStore } from "@/lib/store"
import { supabase } from "@/lib/supabase"

export function useCalendarItemsStore() {
  const store = useStore(calendarItemStore)

  useEffect(() => {
    // Загрузка календарных событий при монтировании компонента
    const loadCalendarItems = async () => {
      const { data, error } = await supabase.from("calendar_items").select("*").order("start_time", { ascending: true })

      if (error) {
        console.error("Error loading calendar items:", error)
        return
      }

      calendarItemStore.getState().setCalendarItems(data)
    }

    loadCalendarItems()

    // Подписка на изменения в реальном времени
    const subscription = supabase
      .channel("calendar_items")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "calendar_items",
        },
        (payload) => {
          const newItem = payload.new
          calendarItemStore.getState().addCalendarItem(newItem)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "calendar_items",
        },
        (payload) => {
          const updatedItem = payload.new
          calendarItemStore.getState().updateCalendarItem(updatedItem.id, updatedItem)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "calendar_items",
        },
        (payload) => {
          const deletedItemId = payload.old.id
          calendarItemStore.getState().removeCalendarItem(deletedItemId)
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return store
}
