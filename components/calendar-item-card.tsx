"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Calendar, MapPin, ArrowLeft, Pencil, Trash, Archive } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

interface CalendarItem {
  id: string
  type: "task" | "event"
  title: string
  date: string
  startTime?: string
  endTime?: string
  location?: string
  description?: string
  completed?: boolean
  priority?: "low" | "medium" | "high"
  repeatType: "none" | "daily" | "weekly" | "monthly"
}

interface CalendarItemCardProps {
  item: CalendarItem
  onUpdate: (item: CalendarItem) => void
  onDelete: (id: string, deleteAll?: boolean) => void
  onArchive: (id: string) => void
  onEdit: (item: CalendarItem) => void
  onClose: () => void
}

export function CalendarItemCard({ item, onUpdate, onDelete, onArchive, onEdit, onClose }: CalendarItemCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const router = useRouter()

  const toggleTaskCompletion = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (item.type === "task") {
      onUpdate({
        ...item,
        completed: !item.completed,
      })
    }
  }

  const priorityColors = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  }

  const priorityLabels = {
    low: "Низкий",
    medium: "Средний",
    high: "Высокий",
  }

  const handleDelete = () => {
    if (item.repeatType !== "none") {
      setIsDeleteDialogOpen(true)
    } else {
      onDelete(item.id)
      setIsSheetOpen(false)
      onClose()
    }
  }

  const handleCloseSheet = () => {
    setIsSheetOpen(false)
    onClose()
  }

  const handleBack = () => {
    handleCloseSheet()
    router.back()
  }

  return (
    <>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Card
            className={cn(
              "overflow-hidden cursor-pointer hover:shadow-md transition-shadow",
              item.type === "task" && item.completed && "opacity-60",
              item.type === "event" ? "border-l-4 border-l-primary" : "",
              item.type === "task" && item.priority === "high" ? "border-l-4 border-l-red-500" : "",
              item.type === "task" && item.priority === "medium" ? "border-l-4 border-l-yellow-500" : "",
              item.type === "task" && item.priority === "low" ? "border-l-4 border-l-blue-500" : "",
            )}
            onClick={() => setIsSheetOpen(true)}
          >
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                {item.type === "task" && (
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => {}}
                    onClick={toggleTaskCompletion}
                    className="mt-1 h-5 w-5"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={cn("font-medium", item.type === "task" && item.completed && "line-through")}>
                      {item.title}
                    </h3>
                    {item.type === "task" && item.priority && (
                      <Badge className={priorityColors[item.priority]}>{priorityLabels[item.priority]}</Badge>
                    )}
                    {item.type === "event" && (
                      <Badge variant="outline" className="bg-primary/10">
                        {item.startTime} - {item.endTime}
                      </Badge>
                    )}
                  </div>

                  {item.location && (
                    <div className="text-sm mt-1 truncate flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {item.location}
                    </div>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="-mr-2" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="h-5 w-5" />
                      <span className="sr-only">Действия</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => onEdit(item)}>Изменить</DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        onArchive(item.id)
                        onClose()
                      }}
                    >
                      Архивировать
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
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
            <Button variant="ghost" size="icon" className="absolute left-0 top-0 h-14 w-14" onClick={handleBack}>
              <ArrowLeft className="h-8 w-8" />
            </Button>
            <SheetTitle className="text-xl font-bold text-center">{item.title}</SheetTitle>
          </SheetHeader>

          <div className="space-y-6">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="capitalize">
                {item.type === "event" ? "Событие" : "Задача"}
              </Badge>

              {item.type === "task" && item.priority && (
                <Badge className={priorityColors[item.priority]}>{priorityLabels[item.priority]}</Badge>
              )}

              {item.type === "task" && (
                <Badge variant={item.completed ? "outline" : "secondary"}>
                  {item.completed ? "Выполнено" : "В процессе"}
                </Badge>
              )}

              {item.repeatType !== "none" && (
                <Badge variant="outline">
                  {item.repeatType === "daily"
                    ? "Ежедневно"
                    : item.repeatType === "weekly"
                      ? "Еженедельно"
                      : "Ежемесячно"}
                </Badge>
              )}
            </div>

            <div className="flex items-start gap-4">
              <Calendar className="h-6 w-6 text-primary mt-0.5" />
              <div>
                <div className="font-medium">Дата</div>
                <div>{format(new Date(item.date), "d MMMM yyyy", { locale: ru })}</div>
                {item.type === "event" && (
                  <div className="text-muted-foreground">
                    {item.startTime} - {item.endTime}
                  </div>
                )}
              </div>
            </div>

            {item.location && (
              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 text-primary mt-0.5" />
                <div>
                  <div className="font-medium">Место</div>
                  <div>
                    {item.location.startsWith("http") ? (
                      <a
                        href={item.location}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline"
                      >
                        Подключиться к звонку
                      </a>
                    ) : (
                      item.location
                    )}
                  </div>
                </div>
              </div>
            )}

            {item.description && (
              <div className="pt-4 border-t">
                <div className="font-medium mb-2">Описание</div>
                <div className="whitespace-pre-wrap">{item.description}</div>
              </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-4">
              {item.type === "task" && (
                <Button
                  variant={item.completed ? "outline" : "default"}
                  className="flex-1 py-7 text-base"
                  onClick={() => {
                    onUpdate({ ...item, completed: !item.completed })
                    onClose()
                  }}
                >
                  {item.completed ? "Не выполнено" : "Выполнено"}
                </Button>
              )}
              <Button
                variant="outline"
                size="lg"
                className="p-7"
                onClick={() => {
                  setIsSheetOpen(false)
                  onEdit(item)
                }}
              >
                <Pencil className="h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="p-7"
                onClick={() => {
                  onArchive(item.id)
                  handleCloseSheet()
                }}
              >
                <Archive className="h-6 w-6" />
              </Button>
              <Button variant="destructive" size="lg" className="p-7" onClick={handleDelete}>
                <Trash className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удаление повторяющегося элемента</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Этот элемент является частью повторяющейся серии. Что вы хотите удалить?</p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="default"
              onClick={() => {
                onDelete(item.id, false)
                setIsDeleteDialogOpen(false)
                setIsSheetOpen(false)
                onClose()
              }}
            >
              Только этот элемент
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(item.id, true)
                setIsDeleteDialogOpen(false)
                setIsSheetOpen(false)
                onClose()
              }}
            >
              Все повторения
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
