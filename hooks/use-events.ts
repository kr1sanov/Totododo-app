"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"

export interface Event {
  id: string
  title: string
  startDate: string
  endDate: string
  location?: string
  description?: string
  repeatType: "none" | "daily" | "weekly" | "monthly"
}

export function useEvents(userId?: string) {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    const loadEvents = async () => {
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("user_id", userId)
          .order("start_date", { ascending: true })

        if (error) throw error

        const eventsData = data.map((event) => ({
          id: event.id,
          title: event.title,
          startDate: event.start_date,
          endDate: event.end_date,
          location: event.location || "",
          description: event.description || "",
          repeatType: event.repeat_type || "none",
        }))

        setEvents(eventsData)
      } catch (error) {
        console.error("Error loading events:", error)
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить события",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadEvents()

    const subscription = supabase
      .channel("events-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadEvents()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  const addEvent = useCallback(
    async (event: Event) => {
      if (!userId) return null

      try {
        const { data, error } = await supabase
          .from("events")
          .insert({
            id: event.id,
            user_id: userId,
            title: event.title,
            start_date: event.startDate,
            end_date: event.endDate,
            location: event.location,
            description: event.description,
            repeat_type: event.repeatType,
          })
          .select()
          .single()

        if (error) throw error

        setEvents([...events, event])

        toast({
          title: "Событие создано",
          description: `Событие "${event.title}" успешно создано`,
        })

        return data
      } catch (error) {
        console.error("Error adding event:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось создать событие",
          variant: "destructive",
        })
        return null
      }
    },
    [events, userId]
  )

  const updateEvent = useCallback(
    async (updatedEvent: Event) => {
      if (!userId) return null

      try {
        const { error } = await supabase
          .from("events")
          .update({
            title: updatedEvent.title,
            start_date: updatedEvent.startDate,
            end_date: updatedEvent.endDate,
            location: updatedEvent.location,
            description: updatedEvent.description,
            repeat_type: updatedEvent.repeatType,
          })
          .eq("id", updatedEvent.id)
          .eq("user_id", userId)

        if (error) throw error

        setEvents(events.map((event) => (event.id === updatedEvent.id ? updatedEvent : event)))

        toast({
          title: "Событие обновлено",
          description: `Событие "${updatedEvent.title}" успешно обновлено`,
        })

        return updatedEvent
      } catch (error) {
        console.error("Error updating event:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось обновить событие",
          variant: "destructive",
        })
        return null
      }
    },
    [events, userId]
  )

  const deleteEvent = useCallback(
    async (id: string) => {
      if (!userId) return null

      const eventToDelete = events.find((event) => event.id === id)
      if (!eventToDelete) return null

      try {
        const { error } = await supabase.from("events").delete().eq("id", id).eq("user_id", userId)

        if (error) throw error

        setEvents(events.filter((event) => event.id !== id))

        toast({
          title: "Событие удалено",
          description: `Событие "${eventToDelete.title}" успешно удалено`,
        })

        return eventToDelete
      } catch (error) {
        console.error("Error deleting event:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось удалить событие",
          variant: "destructive",
        })
        return null
      }
    },
    [events, userId]
  )

  return {
    events,
    isLoading,
    addEvent,
    updateEvent,
    deleteEvent,
  }
}
