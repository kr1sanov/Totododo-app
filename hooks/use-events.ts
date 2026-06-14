"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { getFromStorage, saveToStorage } from "@/lib/storage-utils"
import { toast } from "@/components/ui/use-toast"
import type { Event } from "@/types"

function addArchivedEvent(event: Event) {
  const archivedItems = getFromStorage("totododo-archive", [] as unknown[])
  saveToStorage("totododo-archive", [
    ...archivedItems,
    {
      id: event.id,
      title: event.title,
      type: "event",
      archivedAt: new Date().toISOString(),
      item: event,
    },
  ])
}

export function useEvents(userId?: string) {
  const { user } = useAuth()
  const resolvedUserId = userId ?? user?.id
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadEvents = useCallback(async () => {
    if (!resolvedUserId) {
      setEvents([])
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", resolvedUserId)
        .eq("is_archived", false)
        .eq("is_deleted", false)
        .order("start_date", { ascending: true })

      if (error) {
        throw error
      }

      setEvents(
        (data ?? []).map((event) => ({
          id: event.id,
          title: event.title,
          startDate: event.start_date,
          endDate: event.end_date,
          location: event.location || undefined,
          description: event.description || undefined,
          repeatType: event.repeat_type || "none",
          createdAt: event.created_at,
          updatedAt: event.updated_at,
          isArchived: event.is_archived,
          isDeleted: event.is_deleted,
        })),
      )
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
  }, [resolvedUserId])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  useEffect(() => {
    if (!resolvedUserId) {
      return
    }

    const subscription = supabase
      .channel("events-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
          filter: `user_id=eq.${resolvedUserId}`,
        },
        () => {
          loadEvents()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [loadEvents, resolvedUserId])

  const addEvent = useCallback(
    async (event: Event) => {
      if (!resolvedUserId) {
        return null
      }

      try {
        const { data, error } = await supabase
          .from("events")
          .insert({
            id: event.id,
            user_id: resolvedUserId,
            title: event.title,
            start_date: event.startDate,
            end_date: event.endDate,
            location: event.location,
            description: event.description,
            repeat_type: event.repeatType,
            created_at: event.createdAt,
            updated_at: event.updatedAt,
          })
          .select()
          .single()

        if (error) {
          throw error
        }

        setEvents((currentEvents) => [...currentEvents, event])

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
        throw error
      }
    },
    [resolvedUserId],
  )

  const updateEvent = useCallback(
    async (updatedEvent: Event) => {
      if (!resolvedUserId) {
        return null
      }

      try {
        const { data, error } = await supabase
          .from("events")
          .upsert({
            id: updatedEvent.id,
            user_id: resolvedUserId,
            title: updatedEvent.title,
            start_date: updatedEvent.startDate,
            end_date: updatedEvent.endDate,
            location: updatedEvent.location,
            description: updatedEvent.description,
            repeat_type: updatedEvent.repeatType,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error || !data) {
          throw error ?? new Error("Не удалось обновить событие")
        }

        setEvents((currentEvents) =>
          currentEvents.map((event) => (event.id === updatedEvent.id ? updatedEvent : event)),
        )

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
        throw error
      }
    },
    [resolvedUserId],
  )

  const deleteEvent = useCallback(
    async (id: string) => {
      if (!resolvedUserId) {
        return null
      }

      try {
        const { error } = await supabase.from("events").delete().eq("id", id).eq("user_id", resolvedUserId)

        if (error) {
          throw error
        }

        setEvents((currentEvents) => currentEvents.filter((event) => event.id !== id))

        return id
      } catch (error) {
        console.error("Error deleting event:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось удалить событие",
          variant: "destructive",
        })
        throw error
      }
    },
    [resolvedUserId],
  )

  const archiveEvent = useCallback(
    async (id: string) => {
      const event = events.find((currentEvent) => currentEvent.id === id)
      if (!event) {
        return null
      }

      addArchivedEvent(event)
      await deleteEvent(id)
      return event
    },
    [deleteEvent, events],
  )

  return {
    events,
    isLoading,
    addEvent,
    updateEvent,
    deleteEvent,
    archiveEvent,
  }
}
