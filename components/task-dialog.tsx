"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, Tag, X } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useProjects } from "@/hooks/use-projects"
import { SubtaskItem } from "@/components/subtask-item"
import { Badge } from "@/components/ui/badge"

interface Subtask {
  id: string
  title: string
  description?: string
  dueDate?: string
  link?: string
  completed: boolean
  createdAt: string
}

interface Task {
  id: string
  title: string
  description?: string
  dueDate?: string
  priority: "low" | "medium" | "high"
  completed: boolean
  location?: string
  subtasks: Subtask[]
  createdAt: string
  tags?: string[]
}

interface TaskDialogProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  task?: Task
}

export function TaskDialog({ isOpen, onClose, projectId, task }: TaskDialogProps) {
  const [title, setTitle] = useState(task?.title || "")
  const [description, setDescription] = useState(task?.description || "")
  const [dueDate, setDueDate] = useState<Date | undefined>(task?.dueDate ? new Date(task.dueDate) : undefined)
  const [priority, setPriority] = useState<"low" | "medium" | "high">(task?.priority || "medium")
  const [location, setLocation] = useState(task?.location || "")
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks || [])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [tags, setTags] = useState<string[]>(task?.tags || [])
  const [newTag, setNewTag] = useState("")

  const [dueDateOpen, setDueDateOpen] = useState(false)

  const { addTask, updateTask } = useProjects()

  // Сбрасываем форму при открытии диалога
  useEffect(() => {
    if (isOpen) {
      if (task) {
        setTitle(task.title)
        setDescription(task.description || "")
        setDueDate(task.dueDate ? new Date(task.dueDate) : undefined)
        setPriority(task.priority)
        setLocation(task.location || "")
        setSubtasks(task.subtasks || [])
        setTags(task.tags || [])
      } else {
        setTitle("")
        setDescription("")
        setDueDate(undefined)
        setPriority("medium")
        setLocation("")
        setSubtasks([])
        setTags([])
      }
      setNewSubtaskTitle("")
      setNewTag("")
    }
  }, [isOpen, task])

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      setSubtasks([
        ...subtasks,
        {
          id: Date.now().toString(),
          title: newSubtaskTitle,
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ])
      setNewSubtaskTitle("")
    }
  }

  const handleUpdateSubtask = (updatedSubtask: Subtask) => {
    setSubtasks(subtasks.map((st) => (st.id === updatedSubtask.id ? updatedSubtask : st)))
  }

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id))
  }

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleSubmit = () => {
    if (!title.trim()) return

    const taskData: Task = {
      id: task?.id || Date.now().toString(),
      title,
      description,
      dueDate: dueDate?.toISOString(),
      priority,
      completed: task?.completed || false,
      location,
      subtasks,
      createdAt: task?.createdAt || new Date().toISOString(),
      tags,
    }

    if (task) {
      updateTask(projectId, taskData)
    } else {
      addTask(projectId, taskData)
    }

    onClose()
  }

  const handleTimeChange = () => {
    if (!dueDate) return

    // Создаем временный input для выбора времени
    const input = document.createElement("input")
    input.type = "time"

    // Устанавливаем текущее значение
    input.value = format(dueDate, "HH:mm")

    // Добавляем обработчик изменения
    input.onchange = (e) => {
      const [hours, minutes] = (e.target as HTMLInputElement).value.split(":").map(Number)

      const newDate = new Date(dueDate)
      newDate.setHours(hours, minutes)
      setDueDate(newDate)
    }

    // Стилизуем и добавляем в DOM
    input.style.position = "fixed"
    input.style.opacity = "0"
    document.body.appendChild(input)

    // Открываем диалог выбора времени
    input.showPicker()

    // Удаляем после закрытия
    input.addEventListener("blur", () => {
      document.body.removeChild(input)
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Редактировать задачу" : "Новая задача"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Название задачи</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название задачи"
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label>Срок выполнения</Label>
            <div className="flex gap-2 flex-wrap">
              <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("justify-start text-left font-normal flex-1", !dueDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "d MMM yyyy", { locale: ru }) : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => {
                      if (date) {
                        // Сохраняем текущее время или устанавливаем 12:00
                        const newDate = new Date(date)
                        if (dueDate) {
                          newDate.setHours(dueDate.getHours(), dueDate.getMinutes())
                        } else {
                          newDate.setHours(12, 0)
                        }
                        setDueDate(newDate)
                      } else {
                        setDueDate(undefined)
                      }
                      setDueDateOpen(false)
                    }}
                    locale={ru}
                  />
                </PopoverContent>
              </Popover>

              {dueDate && (
                <Button variant="outline" onClick={handleTimeChange} className="w-[120px]">
                  {format(dueDate, "HH:mm")}
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Приоритет</Label>
            <RadioGroup value={priority} onValueChange={(value) => setPriority(value as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="low" id="low" />
                <Label htmlFor="low">Низкий</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium">Средний</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="high" />
                <Label htmlFor="high">Высокий</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location">Локация или ссылка на встречу</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Локация или ссылка на встречу"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание"
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label>Теги</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Новый тег"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddTag()
                  }
                }}
              />
              <Button type="button" size="icon" onClick={handleAddTag}>
                <Tag className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Подзадачи</Label>
            <div className="space-y-2">
              {subtasks.map((subtask) => (
                <SubtaskItem
                  key={subtask.id}
                  subtask={subtask}
                  onUpdate={handleUpdateSubtask}
                  onDelete={handleDeleteSubtask}
                />
              ))}
              <div className="flex gap-2">
                <Input
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Новая подзадача"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddSubtask()
                    }
                  }}
                />
                <Button type="button" size="icon" onClick={handleAddSubtask}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отменить
          </Button>
          <Button onClick={handleSubmit}>{task ? "Сохранить" : "Добавить задачу"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
