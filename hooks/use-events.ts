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

  const addEvent = useCallback(
    (event: Event) => {
      // Create a new array with the new event added
      const updatedEvents = [...events, event]
      // Update state immediately for optimistic UI
      setEvents(updatedEvents)
      // Save to localStorage
      saveToStorage("totododo-events", updatedEvents)

      return event
    },
    [events],
  )

  const updateEvent = useCallback(
    (updatedEvent: Event) => {
      // Create a new array with the updated event
      const updatedEvents = events.map((event) => (event.id === updatedEvent.id ? updatedEvent : event))
      // Update state immediately for optimistic UI
      setEvents(updatedEvents)
      // Save to localStorage
      saveToStorage("totododo-events", updatedEvents)

      return updatedEvent
    },
    [events],
  )

  const deleteEvent = useCallback(
    (id: string) => {
      const eventToDelete = events.find((event) => event.id === id)
      if (!eventToDelete) return null

      // Create a new array without the deleted event
      const updatedEvents = events.filter((event) => event.id !== id)
      // Update state immediately for optimistic UI
      setEvents(updatedEvents)

      // Add to trash
      const trashedItems = getFromStorage("totododo-trash", [])
      const trashItem = {
        ...eventToDelete,
        type: "events",
        deletedAt: new Date().toISOString(),
      }
      const updatedTrash = [...trashedItems, trashItem]

      // Save both updates to localStorage
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

      // Create a new array without the archived event
      const updatedEvents = events.filter((event) => event.id !== id)
      // Update state immediately for optimistic UI
      setEvents(updatedEvents)

      // Add to archive
      const archivedItems = getFromStorage("totododo-archive", [])
      const archiveItem = {
        ...eventToArchive,
        type: "events",
        archivedAt: new Date().toISOString(),
      }
      const updatedArchive = [...archivedItems, archiveItem]

      // Save both updates to localStorage
      saveToStorage("totododo-events", updatedEvents)
      saveToStorage("totododo-archive", updatedArchive)

      return eventToArchive
    },
    [events],
  )

  return { events, addEvent, updateEvent, deleteEvent, archiveEvent }
}
