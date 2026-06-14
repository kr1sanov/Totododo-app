"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { EventDialog } from "@/components/event-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Calendar, MapPin, Clock, ArrowLeft, Pencil, Trash } from "lucide-react"
import { useEvents } from "@/hooks/use-events"
import { ru } from "date-fns/locale"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { toast } from "@/components/ui/use-toast"
import type { Event as CalendarEvent } from "@/types"

interface EventCardProps {
  event: CalendarEvent
  onClose?: () => void
}

export function EventCard({ event, onClose }: EventCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false) // Add loading state
  const { deleteEvent, archiveEvent } = useEvents()

  const startDate = new Date(event.startDate)
  const endDate = new Date(event.endDate)

  const formatTime = (date: Date) => {
    return format(date, "HH:mm")
  }

  const formatFullDate = (date: Date) => {
    return format(date, "d MMMM yyyy", { locale: ru })
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (isSubmitting) return // Prevent multiple clicks

    setIsSubmitting(true)

    try {
      await deleteEvent(event.id)
      onClose && onClose()

      toast({
        title: "Событие удалено",
        description: "Событие успешно удалено",
      })
    } catch (error) {
      console.error("Error deleting event:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить событие",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (isSubmitting) return // Prevent multiple clicks

    setIsSubmitting(true)

    try {
      await archiveEvent(event.id)
      onClose && onClose()

      toast({
        title: "Событие архивировано",
        description: "Событие успешно перемещено в архив",
      })
    } catch (error) {
      console.error("Error archiving event:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось архивировать событие",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Card className="overflow-hidden border-white/10 bg-card/80 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15 hover:shadow-[0_24px_70px_-28px_rgba(0,0,0,0.7)] backdrop-blur-xl">
            <CardContent className="p-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium">{event.title}</h3>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {formatTime(startDate)} - {formatTime(endDate)}
                  </div>
                  {event.location && <div className="text-sm mt-1 truncate">{event.location}</div>}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="-mr-2" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Действия</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>Изменить</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleArchive}>Архивировать</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl border-t border-white/10 bg-background/95 backdrop-blur-xl">
          <SheetHeader className="relative mb-4 border-b border-white/10 pb-4 text-left">
            <Button variant="ghost" size="icon" className="absolute left-0 top-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <SheetTitle className="text-xl font-bold text-center">{event.title}</SheetTitle>
          </SheetHeader>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <div className="font-medium">{formatFullDate(startDate)}</div>
                <div className="text-muted-foreground">
                  {formatTime(startDate)} - {formatTime(endDate)}
                </div>
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-4">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <div className="font-medium">Место</div>
                  <div>
                    {event.location.startsWith("http") ? (
                      <a
                        href={event.location}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline"
                      >
                        Подключиться к звонку
                      </a>
                    ) : (
                      event.location
                    )}
                  </div>
                </div>
              </div>
            )}

            {event.repeatType !== "none" && (
              <div className="flex items-start gap-4">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <div className="font-medium">Повторяется</div>
                  <div>
                    {event.repeatType === "daily" && "Каждый день"}
                    {event.repeatType === "weekly" && "Каждую неделю"}
                    {event.repeatType === "monthly" && "Каждый месяц"}
                  </div>
                </div>
              </div>
            )}

            {event.description && (
              <div className="pt-4 border-t">
                <div className="font-medium mb-2">Описание</div>
                <div className="whitespace-pre-wrap">{event.description}</div>
              </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsDialogOpen(true)}
                disabled={isSubmitting}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Редактировать
              </Button>
              <Button variant="destructive" size="icon" onClick={handleDelete} disabled={isSubmitting}>
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <EventDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} date={startDate} event={event} />
    </>
  )
}
