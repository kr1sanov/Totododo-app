"use client"

import { useState, useEffect } from "react"
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
    // Load events from localStorage
    const storedEvents = getFromStorage("totododo-events", [])
    setEvents(storedEvents)
  }, [])

  useEffect(() => {
    // Save events to localStorage whenever they change
    if (events.length > 0) {
      saveToStorage("totododo-events", events)
    }
  }, [events])

  const addEvent = (event: Event) => {
    // Создаем новое событие и добавляем его к существующим
    setEvents((prevEvents) => [...prevEvents, event])
  }

  const updateEvent = (updatedEvent: Event) => {
    setEvents((prevEvents) => prevEvents.map((event) => (event.id === updatedEvent.id ? updatedEvent : event)))
  }

  const deleteEvent = (id: string) => {
    const eventToDelete = events.find((event) => event.id === id)
    if (eventToDelete) {
      // Add to trash
      const trashedItems = getFromStorage("totododo-trash", [])
      trashedItems.push({
        ...eventToDelete,
        type: "events",
        deletedAt: new Date().toISOString(),
      })
      saveToStorage("totododo-trash", trashedItems)

      // Remove from events
      setEvents((prevEvents) => prevEvents.filter((event) => event.id !== id))
    }
  }

  const archiveEvent = (id: string) => {
    const eventToArchive = events.find((event) => event.id === id)
    if (eventToArchive) {
      // Add to archive
      const archivedItems = getFromStorage("totododo-archive", [])
      archivedItems.push({
        ...eventToArchive,
        type: "events",
        archivedAt: new Date().toISOString(),
      })
      saveToStorage("totododo-archive", archivedItems)

      // Remove from events
      setEvents((prevEvents) => prevEvents.filter((event) => event.id !== id))
    }
  }

  return { events, addEvent, updateEvent, deleteEvent, archiveEvent }
}
