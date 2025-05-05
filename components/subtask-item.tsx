"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Pencil, Check, X, Calendar, LinkIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface Subtask {
  id: string
  title: string
  description?: string
  dueDate?: string
  link?: string
  completed: boolean
}

interface SubtaskItemProps {
  subtask: Subtask
  onUpdate: (subtask: Subtask) => void
  onDelete: (id: string) => void
}

export function SubtaskItem({ subtask, onUpdate, onDelete }: SubtaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(subtask.title)
  const [editDescription, setEditDescription] = useState(subtask.description || "")
  const [editDueDate, setEditDueDate] = useState<Date | undefined>(
    subtask.dueDate ? new Date(subtask.dueDate) : undefined,
  )
  const [editLink, setEditLink] = useState(subtask.link || "")
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleToggleComplete = () => {
    // Optimistic update for completion status
    const updatedSubtask = {
      ...subtask,
      completed: !subtask.completed,
    }

    // Call the update function immediately
    onUpdate(updatedSubtask)
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditTitle(subtask.title)
    setEditDescription(subtask.description || "")
    setEditDueDate(subtask.dueDate ? new Date(subtask.dueDate) : undefined)
    setEditLink(subtask.link || "")
  }

  const handleSave = () => {
    if (editTitle.trim()) {
      setIsSubmitting(true)

      // Create updated subtask for optimistic update
      const updatedSubtask = {
        ...subtask,
        title: editTitle,
        description: editDescription || undefined,
        dueDate: editDueDate?.toISOString(),
        link: editLink || undefined,
      }

      // Call the update function immediately
      onUpdate(updatedSubtask)

      // Exit edit mode
      setIsEditing(false)
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleDeleteSubtask = () => {
    // Call the delete function immediately for optimistic update
    onDelete(subtask.id)
  }

  return (
    <div className="border rounded-md p-3">
      {isEditing ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox checked={subtask.completed} onCheckedChange={handleToggleComplete} />
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="flex-1"
              autoFocus
              placeholder="Название подзадачи"
            />
          </div>

          <Textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Описание"
            rows={2}
          />

          <div className="flex items-center gap-2">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("justify-start text-left font-normal", !editDueDate && "text-muted-foreground")}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {editDueDate ? format(editDueDate, "d MMM yyyy", { locale: ru }) : "Срок"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={editDueDate}
                  onSelect={(date) => {
                    setEditDueDate(date)
                    setIsCalendarOpen(false)
                  }}
                  locale={ru}
                />
              </PopoverContent>
            </Popover>

            {editDueDate && (
              <Button variant="ghost" size="icon" onClick={() => setEditDueDate(undefined)}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
            <Input
              value={editLink}
              onChange={(e) => setEditLink(e.target.value)}
              placeholder="Ссылка"
              className="flex-1"
            />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSubmitting}>
              <X className="h-4 w-4 mr-1" />
              Отмена
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!editTitle.trim() || isSubmitting}>
              <Check className="h-4 w-4 mr-1" />
              {isSubmitting ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox checked={subtask.completed} onCheckedChange={handleToggleComplete} />
            <span className={`flex-1 ${subtask.completed ? "line-through text-muted-foreground" : "font-medium"}`}>
              {subtask.title}
            </span>
            <Button variant="ghost" size="icon" onClick={handleEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDeleteSubtask}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {subtask.description && <div className="ml-6 text-sm text-muted-foreground">{subtask.description}</div>}

          <div className="ml-6 flex flex-wrap gap-3 text-xs">
            {subtask.dueDate && (
              <div className="flex items-center text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                {format(new Date(subtask.dueDate), "d MMM yyyy", { locale: ru })}
              </div>
            )}

            {subtask.link && (
              <a
                href={subtask.link.startsWith("http") ? subtask.link : `https://${subtask.link}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-500 hover:underline"
              >
                <LinkIcon className="h-3 w-3 mr-1" />
                Ссылка
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
