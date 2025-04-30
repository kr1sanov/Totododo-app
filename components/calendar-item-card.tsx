"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, MapPin, ArrowLeft, Pencil, Trash } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { useMobile } from "@/hooks/use-mobile"

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
  onDelete: (id: string) => void
  onEdit: (item: CalendarItem) => void
}

export function CalendarItemCard({ item, onUpdate, onDelete, onEdit }: CalendarItemCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const router = useRouter()
  const isMobile = useMobile()

  const toggleTaskCompletion = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (item.type === "task") {
        onUpdate({
          ...item,
          completed: !item.completed,
        })
      }
    },
    [item, onUpdate],
  )

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

  const handleDelete = useCallback(() => {
    if (item.repeatType !== "none") {
      setIsDeleteDialogOpen(true)
    } else {
      onDelete(item.id)
      setIsSheetOpen(false)
    }
  }, [item.id, item.repeatType, onDelete])

  const handleCloseSheet = useCallback(() => {
    setIsSheetOpen(false)
  }, [])

  const handleBack = useCallback(() => {
    handleCloseSheet()
    router.back()
  }, [handleCloseSheet, router])

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
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Изменить
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      <Trash className="h-4 w-4 mr-2" />
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
              {/* Обновим компонент CalendarItemDialog для работы с Zustand: */}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить повторения?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(item.id)
                setIsDeleteDialogOpen(false)
                setIsSheetOpen(false)
              }}
            >
              Удалить все
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
