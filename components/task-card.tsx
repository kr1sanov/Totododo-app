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
import { useProjects } from "@/hooks/use-projects"
import { TaskDialog } from "@/components/task-dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Progress } from "@/components/ui/progress"

interface Task {
  id: string
  title: string
  completed: boolean
  dueDate?: string
  location?: string
  priority: "low" | "medium" | "high"
  subtasks: { id: string; title: string; completed: boolean }[]
  description?: string
  tags?: string[]
}

interface TaskCardProps {
  task: Task
  projectId: string
}

export function TaskCard({ task, projectId }: TaskCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { updateTask, deleteTask, archiveTask } = useProjects()

  const toggleTaskCompletion = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateTask(projectId, {
      ...task,
      completed: !task.completed,
    })
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
      <Sheet>
        <SheetTrigger asChild>
          <Card
            className={cn(
              "overflow-hidden cursor-pointer hover:shadow-md transition-shadow",
              task.completed && "opacity-60",
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => {}}
                  onClick={toggleTaskCompletion}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={cn("font-medium", task.completed && "line-through")}>{task.title}</h3>
                    <Badge className={priorityColors[task.priority]}>{priorityLabels[task.priority]}</Badge>
                  </div>

                  {task.dueDate && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Срок: {format(new Date(task.dueDate), "d MMM yyyy HH:mm", { locale: ru })}
                    </div>
                  )}

                  {task.location && <div className="text-sm mt-1 truncate">{task.location}</div>}

                  {task.subtasks.length > 0 && (
                    <div className="text-sm mt-2">
                      Подзадачи: {completedSubtasks}/{totalSubtasks}
                    </div>
                  )}

                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {task.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
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
                    <DropdownMenuItem onClick={() => archiveTask(projectId, task.id)}>Архивировать</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => deleteTask(projectId, task.id)} className="text-destructive">
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
            <SheetTitle className="text-xl font-bold text-center">{task.title}</SheetTitle>
          </SheetHeader>

          <div className="space-y-6">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={priorityColors[task.priority]}>{priorityLabels[task.priority]}</Badge>
              <Badge variant={task.completed ? "outline" : "secondary"}>
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
              <div className="flex items-start gap-4">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <div className="font-medium">Срок выполнения</div>
                  <div>{format(new Date(task.dueDate), "d MMMM yyyy HH:mm", { locale: ru })}</div>
                </div>
              </div>
            )}

            {task.location && (
              <div className="flex items-start gap-4">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <div className="font-medium">Место</div>
                  <div>
                    {task.location.startsWith("http") ? (
                      <a
                        href={task.location}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline"
                      >
                        Подключиться к звонку
                      </a>
                    ) : (
                      task.location
                    )}
                  </div>
                </div>
              </div>
            )}

            {task.description && (
              <div className="pt-4 border-t">
                <div className="font-medium mb-2">Описание</div>
                <div className="whitespace-pre-wrap">{task.description}</div>
              </div>
            )}

            {task.subtasks.length > 0 && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Подзадачи</div>
                  <div className="text-sm text-muted-foreground">
                    {completedSubtasks}/{totalSubtasks}
                  </div>
                </div>
                <Progress value={subtaskProgress} className="mb-4" />
                <div className="space-y-2">
                  {task.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2">
                      <Checkbox checked={subtask.completed} />
                      <span className={cn(subtask.completed && "line-through text-muted-foreground")}>
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-2">
              <Button
                variant={task.completed ? "outline" : "default"}
                className="flex-1"
                onClick={() => updateTask(projectId, { ...task, completed: !task.completed })}
              >
                {task.completed ? "Не выполнено" : "Выполнено"}
              </Button>
              <Button variant="outline" size="icon" onClick={() => setIsDialogOpen(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => archiveTask(projectId, task.id)}>
                <Archive className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="icon" onClick={() => deleteTask(projectId, task.id)}>
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <TaskDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} projectId={projectId} task={task} />
    </>
  )
}
