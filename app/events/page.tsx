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

export default function EventsPage() {
  const { events, addEvent, updateEvent, deleteEvent, archiveEvent } = useEvents()
  const [newTitle, setNewTitle] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any | null>(null)

  const handleCreate = useCallback(() => {
    if (!newTitle.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название события",
        variant: "destructive",
      })
      return
    }

    // Создаем новое событие с минимальными данными
    const now = new Date()
    const endTime = new Date(now.getTime() + 60 * 60 * 1000) // +1 час

    const newEvent = {
      id: crypto.randomUUID(),
      title: newTitle,
      startDate: now.toISOString(),
      endDate: endTime.toISOString(),
      repeatType: "none",
    }

    // Оптимистично добавляем событие
    addEvent(newEvent)
    setNewTitle("")

    toast({
      title: "Событие создано",
      description: "Новое событие успешно добавлено",
    })
  }, [newTitle, addEvent])

  const handleEdit = useCallback((event: any) => {
    setEditingEvent(event)
    setIsDialogOpen(true)
  }, [])

  const handleUpdate = useCallback(
    (updatedEvent: any) => {
      // Оптимистично обновляем событие
      updateEvent(updatedEvent)
      setIsDialogOpen(false)
      setEditingEvent(null)

      toast({
        title: "Событие обновлено",
        description: "Изменения успешно сохранены",
      })
    },
    [updateEvent],
  )

  const handleDelete = useCallback(
    (id: string) => {
      // Оптимистично удаляем событие
      deleteEvent(id)

      toast({
        title: "Событие удалено",
        description: "Событие успешно удалено",
      })
    },
    [deleteEvent],
  )

  const handleArchive = useCallback(
    (id: string) => {
      // Оптимистично архивируем событие
      archiveEvent(id)

      toast({
        title: "Событие архивировано",
        description: "Событие перемещено в архив",
      })
    },
    [archiveEvent],
  )

  return (
    <main className="flex min-h-screen flex-col">
      <div className="p-4 border-b">
        <BackButton />
      </div>
      <div className="flex-1 overflow-auto pb-16">
        <div className="p-4 space-y-4">
          <Card className="p-4">
            <h2 className="text-lg font-medium mb-4">Создать новое событие</h2>
            <div className="flex space-x-2">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Название события"
                className="flex-1"
              />
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Создать
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
            <div className="text-center py-8 text-muted-foreground">
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
