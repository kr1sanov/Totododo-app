"use client"

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

interface EventCardProps {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { deleteEvent, archiveEvent } = useEvents()

  const startDate = new Date(event.startDate)
  const endDate = new Date(event.endDate)

  const formatTime = (date: Date) => {
    return format(date, "HH:mm")
  }

  const formatFullDate = (date: Date) => {
    return format(date, "d MMMM yyyy", { locale: ru })
  }

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium">{event.title}</h3>
                  <div className="text-sm text-muted-foreground">
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
                    <DropdownMenuItem onClick={() => archiveEvent(event.id)}>Архивировать</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => deleteEvent(event.id)} className="text-destructive">
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-xl">
          <SheetHeader className="text-left border-b pb-4 mb-4 relative">
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
              <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Редактировать
              </Button>
              <Button variant="destructive" size="icon" onClick={() => deleteEvent(event.id)}>
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
