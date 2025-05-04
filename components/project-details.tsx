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
import { Skeleton } from "@/components/ui/skeleton"
import { ProjectStatistics } from "@/components/project-statistics"

interface ProjectDetailsProps {
  projectId: string
}

export function ProjectDetails({ projectId }: ProjectDetailsProps) {
  const { projects, tasks, isLoading, addTask, updateTask, deleteTask, archiveTask } = useProjects()
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [statusFilter, setStatusFilter] = useState<TaskStatus | null>(null)
  const { toast } = useToast()

  const project = projects.find((p) => p.id === projectId)
  const projectTasks = tasks.filter(
    (task) =>
      task.projectId === projectId &&
      !task.isArchived &&
      !task.isDeleted &&
      (statusFilter === null || task.status === statusFilter),
  )

  // Collect all unique tags from tasks
  const allTags = tasks
    .filter((task) => task.projectId === projectId && task.tags && task.tags.length > 0)
    .flatMap((task) => task.tags || [])
    .reduce((unique: Tag[], tag) => {
      if (!unique.some((t) => t.id === tag.id)) {
        unique.push(tag)
      }
      return unique
    }, [])

  const handleCreateTask = async (task: Task) => {
    try {
      await addTask(task)
      toast({
        title: "Task created",
        description: "Your task has been created successfully.",
      })
      setIsTaskDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateTask = async (task: Task) => {
    try {
      await updateTask(task)
      toast({
        title: "Task updated",
        description: "Your task has been updated successfully.",
      })
      setEditingTask(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId)
      toast({
        title: "Task deleted",
        description: "Your task has been moved to trash.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleArchiveTask = async (taskId: string) => {
    try {
      await archiveTask(taskId)
      toast({
        title: "Task archived",
        description: "Your task has been archived.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <Skeleton className="h-24 w-full" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!project) {
    return <div className="p-4">Project not found</div>
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
        {projectTasks.length > 0 ? (
          projectTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={() => handleEditTask(task)}
              onDelete={() => handleDeleteTask(task.id)}
              onArchive={() => handleArchiveTask(task.id)}
              onStatusChange={(status) => handleUpdateTask({ ...task, status })}
            />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {statusFilter ? `No ${statusFilter} tasks found` : "No tasks yet. Create your first task!"}
          </div>
        )}
      </div>

      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        onSubmit={handleCreateTask}
        projectId={projectId}
        availableTags={allTags}
      />

      {editingTask && (
        <TaskDialog
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          onSubmit={handleUpdateTask}
          task={editingTask}
          projectId={projectId}
          availableTags={allTags}
        />
      )}
    </div>
  )
}
