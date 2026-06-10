"use client"

import { useState } from "react"
import { useProjects } from "@/hooks/use-projects"
import { useAuth } from "@/contexts/auth-context"
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
  const { user } = useAuth()
  const { projects, getProject, addTask, updateTask, deleteTask, archiveTask } = useProjects(user?.id)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [statusFilter, setStatusFilter] = useState<TaskStatus | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const project = getProject(projectId)

  if (!project) {
    return (
      <div className="p-4">
        <BackButton />
        <div className="mt-4">Проект не найден</div>
      </div>
    )
  }

  const filteredTasks = project.tasks.filter(
    (task) => statusFilter === null || task.status === statusFilter
  )

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
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <BackButton />
        <Button
          onClick={() => setIsTaskDialogOpen(true)}
          size="icon"
          className="h-10 w-10 rounded-full"
          aria-label="Add task"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <h1 className="text-2xl font-bold mb-2">{project.name}</h1>
      {project.description && (
        <p className="text-muted-foreground mb-4">{project.description}</p>
      )}

      <ProjectStatistics project={project} />

      <TaskFilter
        currentFilter={statusFilter}
        onFilterChange={setStatusFilter}
        availableTags={allTags}
      />

      <div className="space-y-2 mt-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={() => handleEditTask(task)}
              onDelete={() => handleDeleteTask(task.id)}
              onArchive={() => handleArchiveTask(task.id)}
              onStatusChange={(status) => handleStatusChange(task, status)}
            />
          ))
        ) : (
          <p className="text-muted-foreground text-center py-8">
            {statusFilter
              ? `Нет задач со статусом ${statusFilter}`
              : "Нет задач. Создайте свою первую задачу!"}
          </p>
        )}
      </div>

      <TaskDialog
        isOpen={isTaskDialogOpen}
        onOpenChange={(open) => !open && setIsTaskDialogOpen(false)}
        onSubmit={handleCreateTask}
        projectId={projectId}
        availableTags={allTags}
        isSubmitting={isSubmitting}
      />

      {editingTask && (
        <TaskDialog
          isOpen={!!editingTask}
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
