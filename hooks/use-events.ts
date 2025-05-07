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

 const addEvent = async (event: Event) => {
  setEvents(prev => [...prev, event]) // МГНОВЕННО ДОБАВЛЯЕМ В ИНТЕРФЕЙС

  try {
    const res = await fetch('/api/events', {
      method: 'POST',
      body: JSON.stringify(event),
    })
    const saved = await res.json()

    // заменяем временное событие на настоящее
    setEvents(prev => prev.map(e => e.id === event.id ? saved : e))
  } catch (err) {
    console.error('Ошибка при создании события', err)
    // откатим если не удалось
    setEvents(prev => prev.filter(e => e.id !== event.id))
  }
}

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

const deleteEvent = async (id: string) => {
  const prevEvents = [...events] // запомним для отката
  setEvents(prev => prev.filter(e => e.id !== id)) // сразу удалим

  try {
    await fetch(`/api/events/${id}`, {
      method: 'DELETE'
    })
  } catch (err) {
    console.error('Ошибка при удалении', err)
    setEvents(prevEvents) // откат
  }
}

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
