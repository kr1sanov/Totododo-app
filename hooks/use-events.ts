"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { getFromStorage, saveToStorage } from "@/lib/storage-utils"
import { toast } from "@/components/ui/use-toast"
import type { Event } from "@/types"

function requireUserId(userId?: string) {
  if (!userId) {
    throw new Error("AUTH_REQUIRED")
  }

  return userId
}

function normalizeEvent(event: Record<string, any>): Event {
  return {
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
  }
}

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

      setEvents((data ?? []).map(normalizeEvent))
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
      const userId = requireUserId(resolvedUserId)

      try {
        const now = new Date().toISOString()
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
            created_at: event.createdAt ?? now,
            updated_at: event.updatedAt ?? now,
          })
          .select()
          .single()

        if (error || !data) {
          throw error ?? new Error("Не удалось сохранить событие")
        }

        const savedEvent = normalizeEvent(data)
        setEvents((currentEvents) => [...currentEvents, savedEvent])

        toast({
          title: "Событие создано",
          description: `Событие "${savedEvent.title}" успешно создано`,
        })

        return savedEvent
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
      const userId = requireUserId(resolvedUserId)

      try {
        const now = new Date().toISOString()
        const { data, error } = await supabase
          .from("events")
          .upsert({
            id: updatedEvent.id,
            user_id: userId,
            title: updatedEvent.title,
            start_date: updatedEvent.startDate,
            end_date: updatedEvent.endDate,
            location: updatedEvent.location,
            description: updatedEvent.description,
            repeat_type: updatedEvent.repeatType,
            created_at: updatedEvent.createdAt,
            updated_at: now,
          })
          .select()
          .single()

        if (error || !data) {
          throw error ?? new Error("Не удалось обновить событие")
        }

        const savedEvent = normalizeEvent(data)
        setEvents((currentEvents) => currentEvents.map((event) => (event.id === savedEvent.id ? savedEvent : event)))

        toast({
          title: "Событие обновлено",
          description: `Событие "${updatedEvent.title}" успешно обновлено`,
        })

        return savedEvent
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
      const userId = requireUserId(resolvedUserId)

      try {
        const { error } = await supabase.from("events").delete().eq("id", id).eq("user_id", userId)

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
        throw new Error("EVENT_NOT_FOUND")
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
