"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import type { Task, TaskStatus } from "@/types"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { CheckCircle2, Circle, Clock, ArchiveIcon, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useSwipeable } from "react-swipeable"
import type React from "react"
import { useRef } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { MoreHorizontal, Calendar, MapPin, ArrowLeft, Pencil, Trash, LinkIcon } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Progress } from "@/components/ui/progress"
import { TaskDialog } from "@/components/task-dialog"

interface TaskCardProps {
  task: Task
  onEdit: () => void
  onDelete: () => void
  onArchive: () => void
  onStatusChange: (status: TaskStatus) => void
  projectId: string
  onUpdate?: (taskId: string, updatedTask: Partial<Task>) => void
  onDelete?: (taskId: string) => void
}

export function TaskCard({ task, onEdit, onDelete, onArchive, onStatusChange, projectId, onUpdate }: TaskCardProps) {
  const [showActions, setShowActions] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const statusIcon = {
    todo: <Circle className="h-5 w-5 text-muted-foreground" />,
    "in-progress": <Clock className="h-5 w-5 text-blue-500" />,
    done: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    blocked: <AlertCircle className="h-5 w-5 text-red-500" />,
  }

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => setShowActions(true),
    onSwipedRight: () => setShowActions(false),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  })

  const handleStatusChange = (status: TaskStatus) => {
    onStatusChange(status)
    setShowActions(false)
  }

  const toggleTaskCompletion = (e: React.MouseEvent) => {
    e.stopPropagation()
    onStatusChange(task.completed ? "todo" : "done")
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

  const completedSubtasks = task.subtasks.filter((st) => st.completed).length
  const totalSubtasks = task.subtasks.length
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

  return (
    <>
      <Card
        {...swipeHandlers}
        className={cn("relative cursor-pointer transition-all", task.completed && "opacity-60")}
        onClick={() => setIsSheetOpen(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => {}}
              onClick={toggleTaskCompletion}
              className="mt-1"
            />
            <div className="flex-1 space-y-2">
              <h3 className={cn("font-medium", task.completed && "line-through")}>{task.title}</h3>
              <div className="flex flex-wrap gap-2">
                <Badge className={priorityColors[task.priority]}>{priorityLabels[task.priority]}</Badge>
                {task.dueDate && (
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    Срок: {format(new Date(task.dueDate), "d MMM yyyy HH:mm", { locale: ru })}
                  </Badge>
                )}
                {task.location && (
                  <Badge variant="outline" className="gap-1">
                    <MapPin className="h-3 w-3" />
                    {task.location}
                  </Badge>
                )}
                {task.subtasks.length > 0 && (
                  <Badge variant="outline">
                    Подзадачи: {completedSubtasks}/{totalSubtasks}
                  </Badge>
                )}
                {task.tags && task.tags.length > 0 && (
                  <div className="flex gap-1">
                    {task.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DropdownMenu onOpenChange={(open) => open && setShowActions(false)}>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>Изменить</DropdownMenuItem>
                <DropdownMenuItem onClick={onArchive}>Архивировать</DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>{task.title}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
            <div className="flex gap-2">
              <Badge className={priorityColors[task.priority]}>{priorityLabels[task.priority]}</Badge>
              <Badge variant={task.completed ? "default" : "secondary"}>
                {task.completed ? "Выполнено" : "В процессе"}
              </Badge>
              {task.tags &&
                task.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
            </div>

            {task.dueDate && (
              <div>
                <div className="text-sm font-medium mb-1">Срок выполнения</div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(task.dueDate), "d MMMM yyyy HH:mm", { locale: ru })}
                </div>
              </div>
            )}

            {task.location && (
              <div>
                <div className="text-sm font-medium mb-1">Место</div>
                <div className="text-sm text-muted-foreground">
                  {task.location.startsWith("http") ? (
                    <a href={task.location} className="text-blue-500 underline">
                      [Подключиться к звонку]
                    </a>
                  ) : (
                    task.location
                  )}
                </div>
              </div>
            )}

            {task.description && (
              <div>
                <div className="text-sm font-medium mb-1">Описание</div>
                <div className="text-sm text-muted-foreground">{task.description}</div>
              </div>
            )}

            {task.subtasks.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Подзадачи</div>
                <Progress value={subtaskProgress} className="mb-2" />
                <div className="text-xs text-muted-foreground mb-3">
                  {completedSubtasks}/{totalSubtasks}
                </div>
                {task.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-2 py-1">
                    <Checkbox checked={subtask.completed} disabled />
                    <span className={cn("text-sm", subtask.completed && "line-through text-muted-foreground")}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onStatusChange(task.completed ? "todo" : "done")}>
              {task.completed ? "Не выполнено" : "Выполнено"}
            </Button>
            <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={onArchive}>
              <ArchiveIcon className="h-4 w-4" />
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <TaskDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} projectId={projectId} task={task} />
    </>
  )
}
