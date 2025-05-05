"use client"

import { useState } from "react"
import { useProjects } from "@/hooks/use-projects"
import { TaskCard } from "@/components/task-card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { TaskDialog } from "@/components/task-dialog"
import { BackButton } from "@/components/back-button"
import type { Task, TaskStatus, Tag } from "@/types"
import { TaskFilter } from "@/components/task-filter"
import { useToast } from "@/hooks/use-toast"
import { ProjectStatistics } from "@/components/project-statistics"

interface ProjectDetailsProps {
  projectId: string
}

export function ProjectDetails({ projectId }: ProjectDetailsProps) {
  const { projects, getProject, addTask, updateTask, deleteTask, archiveTask } = useProjects()
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [statusFilter, setStatusFilter] = useState<TaskStatus | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const project = getProject(projectId)

  // If project doesn't exist, show loading or not found message
  if (!project) {
    return (
      <div className="p-4">
        <BackButton />
        <div className="mt-4">Проект не найден</div>
      </div>
    )
  }

  const filteredTasks = project.tasks.filter((task) => statusFilter === null || task.status === statusFilter)

  // Collect all unique tags from tasks
  const allTags = project.tasks
    .filter((task) => task.tags && task.tags.length > 0)
    .flatMap((task) => task.tags || [])
    .reduce((unique: Tag[], tag) => {
      if (!unique.some((t) => t.id === tag.id)) {
        unique.push(tag)
      }
      return unique
    }, [])

  const handleCreateTask = async (task: Task) => {
    setIsSubmitting(true)

    try {
      // Add task with optimistic update
      await addTask(projectId, task)
      setIsTaskDialogOpen(false)
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать задачу. Пожалуйста, попробуйте снова.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateTask = async (task: Task) => {
    setIsSubmitting(true)

    try {
      // Update task with optimistic update
      await updateTask(projectId, task)
      setEditingTask(null)
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить задачу. Пожалуйста, попробуйте снова.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      // Delete task with optimistic update
      await deleteTask(projectId, taskId)
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить задачу. Пожалуйста, попробуйте снова.",
        variant: "destructive",
      })
    }
  }

  const handleArchiveTask = async (taskId: string) => {
    try {
      // Archive task with optimistic update
      await archiveTask(projectId, taskId)
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось архивировать задачу. Пожалуйста, попробуйте снова.",
        variant: "destructive",
      })
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
  }

  const handleStatusChange = async (task: Task, status: TaskStatus) => {
    try {
      // Update task status with optimistic update
      await updateTask(projectId, { ...task, status })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус задачи. Пожалуйста, попробуйте снова.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <BackButton />
        <div className="flex gap-2">
          <TaskFilter onFilterChange={setStatusFilter} currentFilter={statusFilter} />
          <Button
            onClick={() => setIsTaskDialogOpen(true)}
            size="icon"
            className="h-10 w-10 rounded-full"
            aria-label="Add task"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        {project.description && <p className="text-muted-foreground">{project.description}</p>}
      </div>

      <ProjectStatistics projectId={projectId} />

      <div className="space-y-3">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              projectId={projectId}
              onEdit={() => handleEditTask(task)}
              onDelete={() => handleDeleteTask(task.id)}
              onArchive={() => handleArchiveTask(task.id)}
              onStatusChange={(status) => handleStatusChange(task, status)}
            />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {statusFilter ? `Нет задач со статусом ${statusFilter}` : "Нет задач. Создайте свою первую задачу!"}
          </div>
        )}
      </div>

      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        onSubmit={handleCreateTask}
        projectId={projectId}
        availableTags={allTags}
        isSubmitting={isSubmitting}
      />

      {editingTask && (
        <TaskDialog
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          onSubmit={handleUpdateTask}
          task={editingTask}
          projectId={projectId}
          availableTags={allTags}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  )
}
