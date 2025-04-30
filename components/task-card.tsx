"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import { TaskDialog } from "./task-dialog"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  temp_id?: string
  title: string
  description?: string
  completed: boolean
  isPending?: boolean
}

interface TaskCardProps {
  task: Task
  onUpdate: (data: { title?: string; description?: string; completed?: boolean }) => void
  onDelete: () => void
}

export function TaskCard({ task, onUpdate, onDelete }: TaskCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleToggleComplete = () => {
    onUpdate({ completed: !task.completed })
  }

  const handleUpdate = (data: { title: string; description?: string }) => {
    onUpdate(data)
    setIsEditDialogOpen(false)
  }

  return (
    <Card
      className={cn(
        "transition-opacity",
        task.isPending ? "opacity-70" : "opacity-100",
        task.completed ? "bg-muted/50" : "",
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.completed}
            onCheckedChange={handleToggleComplete}
            className="mt-1"
            disabled={task.isPending}
          />
          <div className="flex-1 min-w-0">
            <h3 className={cn("font-medium break-words", task.completed ? "line-through text-muted-foreground" : "")}>
              {task.title}
            </h3>
            {task.description && (
              <p className={cn("text-sm text-muted-foreground mt-1 break-words", task.completed ? "line-through" : "")}>
                {task.description}
              </p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)} disabled={task.isPending}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} disabled={task.isPending}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>
        {task.isPending && <div className="text-xs text-muted-foreground mt-2">Синхронизация...</div>}
      </CardContent>

      <TaskDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdate}
        defaultValues={{
          title: task.title,
          description: task.description,
        }}
        mode="edit"
      />
    </Card>
  )
}
