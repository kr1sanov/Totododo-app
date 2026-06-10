"use client"

import { useState, useEffect, useCallback } from "react"
import { getFromStorage, saveToStorage } from "@/lib/storage-utils"

export interface Event {
  id: string
  title: string
  startDate: string
  endDate: string
  location?: string
  description?: string
  repeatType: "none" | "daily" | "weekly" | "monthly"
}

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    const storedEvents = getFromStorage("totododo-events", [])
    setEvents(storedEvents)
  }, [])

  useEffect(() => {
    if (events.length > 0) {
      saveToStorage("totododo-events", events)
    }
  }, [events])

  const addEvent = useCallback(
    (event: Event) => {
      const updatedEvents = [...events, event]
      setEvents(updatedEvents)
      saveToStorage("totododo-events", updatedEvents)
      return event
    },
    [events],
  )

  const updateEvent = useCallback(
    (updatedEvent: Event) => {
      const updatedEvents = events.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event
      )
      setEvents(updatedEvents)
      saveToStorage("totododo-events", updatedEvents)
      return updatedEvent
    },
    [events],
  )

  const deleteEvent = useCallback(
    (id: string) => {
      const eventToDelete = events.find((event) => event.id === id)
      if (!eventToDelete) return null

      const updatedEvents = events.filter((event) => event.id !== id)
      setEvents(updatedEvents)

      const trashedItems = getFromStorage("totododo-trash", [])
      const trashItem = {
        ...eventToDelete,
        type: "events",
        deletedAt: new Date().toISOString(),
      }
      const updatedTrash = [...trashedItems, trashItem]

      saveToStorage("totododo-events", updatedEvents)
      saveToStorage("totododo-trash", updatedTrash)

      return eventToDelete
    },
    [events],
  )

  const archiveEvent = useCallback(
    (id: string) => {
      const eventToArchive = events.find((event) => event.id === id)
      if (!eventToArchive) return null

      const updatedEvents = events.filter((event) => event.id !== id)
      setEvents(updatedEvents)

      const archivedItems = getFromStorage("totododo-archive", [])
      const archiveItem = {
        ...eventToArchive,
        type: "events",
        archivedAt: new Date().toISOString(),
      }
      const updatedArchive = [...archivedItems, archiveItem]

      saveToStorage("totododo-events", updatedEvents)
      saveToStorage("totododo-archive", updatedArchive)

      return eventToArchive
    },
    [events],
  )

  return { events, addEvent, updateEvent, deleteEvent, archiveEvent }
}
