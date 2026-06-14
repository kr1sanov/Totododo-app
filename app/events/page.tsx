"use client"

import { useState, useCallback } from "react"
import { useEvents } from "@/hooks/use-events"
import { EventCard } from "@/components/event-card"
import { BottomNavigation } from "@/components/bottom-navigation"
import { BackButton } from "@/components/back-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EventDialog } from "@/components/event-dialog"
import { Card } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Plus } from "lucide-react"
import type { Event } from "@/types"

export default function EventsPage() {
  const { events, addEvent, updateEvent, deleteEvent, archiveEvent } = useEvents()
  const [newTitle, setNewTitle] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = useCallback(async () => {
    if (!newTitle.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название события",
        variant: "destructive",
      })
      return
    }

    if (isCreating) return

    // Создаем новое событие с минимальными данными
    const now = new Date()
    const endTime = new Date(now.getTime() + 60 * 60 * 1000) // +1 час

    const newEvent: Event = {
      id: crypto.randomUUID(),
      title: newTitle,
      startDate: now.toISOString(),
      endDate: endTime.toISOString(),
      repeatType: "none",
    }

    setIsCreating(true)
    try {
      await addEvent(newEvent)
      setNewTitle("")
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать событие. Пожалуйста, попробуйте снова.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }, [newTitle, addEvent, isCreating])

  const handleEdit = useCallback((event: Event) => {
    setEditingEvent(event)
    setIsDialogOpen(true)
  }, [])

  const handleUpdate = useCallback(
    async (updatedEvent: Event) => {
      await updateEvent(updatedEvent)
      setIsDialogOpen(false)
      setEditingEvent(null)
    },
    [updateEvent],
  )

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteEvent(id)
    },
    [deleteEvent],
  )

  const handleArchive = useCallback(
    async (id: string) => {
      await archiveEvent(id)
    },
    [archiveEvent],
  )

  return (
    <main className="flex min-h-screen flex-col">
      <div className="border-b border-white/5 bg-background/70 px-4 py-4 backdrop-blur-xl">
        <BackButton />
        <div className="mt-4">
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Workspace</div>
          <h1 className="mt-2 text-2xl font-semibold">События</h1>
          <p className="mt-1 text-sm text-muted-foreground">Планируй встречи и держи расписание под контролем.</p>
        </div>
      </div>
      <div className="flex-1 overflow-auto pb-24">
        <div className="p-4 space-y-4">
          <Card className="border-white/10 bg-card/80 p-4 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <h2 className="text-lg font-medium mb-4">Создать новое событие</h2>
            <div className="flex gap-2">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Название события"
                className="h-11 flex-1"
              />
              <Button onClick={handleCreate} className="h-11" disabled={!newTitle.trim() || isCreating}>
                <Plus className="h-4 w-4 mr-2" />
                {isCreating ? "Создание..." : "Создать"}
              </Button>
            </div>
          </Card>

          {events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="relative group">
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-card/40 py-10 text-center text-muted-foreground backdrop-blur-sm">
              У вас пока нет событий. Создайте новое событие.
            </div>
          )}
        </div>
      </div>

      {editingEvent && (
        <EventDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false)
            setEditingEvent(null)
          }}
          date={new Date(editingEvent.startDate)}
          event={editingEvent}
          onSave={handleUpdate}
        />
      )}

      <BottomNavigation activeTab="calendar" />
    </main>
  )
}
