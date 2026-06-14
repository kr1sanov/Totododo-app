"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { getFromStorage, saveToStorage } from "@/lib/storage-utils"
import { toast } from "@/components/ui/use-toast"
import type { Project, Tag, Task, TaskStatus, Subtask } from "@/types"

function normalizeTag(tag: unknown): Tag | null {
  if (!tag || typeof tag !== "object") {
    return null
  }

  const value = tag as Partial<Tag>
  if (!value.id || !value.name || !value.color) {
    return null
  }

  return {
    id: String(value.id),
    name: String(value.name),
    color: String(value.color),
  }
}

function normalizeSubtask(subtask: unknown): Subtask | null {
  if (!subtask || typeof subtask !== "object") {
    return null
  }

  const value = subtask as Partial<Subtask>
  if (!value.id || !value.title) {
    return null
  }

  return {
    id: String(value.id),
    title: String(value.title),
    completed: Boolean(value.completed),
    description: value.description ? String(value.description) : undefined,
    dueDate: value.dueDate ? String(value.dueDate) : undefined,
    link: value.link ? String(value.link) : undefined,
    createdAt: value.createdAt ? String(value.createdAt) : undefined,
  }
}

function normalizeTask(task: unknown, projectId: string): Task | null {
  if (!task || typeof task !== "object") {
    return null
  }

  const value = task as Record<string, unknown>
  if (!value.id || !value.title) {
    return null
  }

  const completed = Boolean(value.completed)
  const rawStatus = typeof value.status === "string" ? value.status : undefined
  const createdAt = value.createdAt ?? value.created_at
  const updatedAt = value.updatedAt ?? value.updated_at ?? createdAt
  const dueDate = value.dueDate ?? value.due_date
  const taskProjectId = value.projectId ?? value.project_id ?? projectId
  const status: TaskStatus =
    rawStatus === "todo" || rawStatus === "in-progress" || rawStatus === "done" || rawStatus === "blocked"
      ? rawStatus
      : completed
        ? "done"
        : "todo"

  return {
    id: String(value.id),
    title: String(value.title),
    description: value.description ? String(value.description) : undefined,
    status,
    projectId: String(taskProjectId),
    createdAt: createdAt ? String(createdAt) : new Date().toISOString(),
    updatedAt: updatedAt ? String(updatedAt) : new Date().toISOString(),
    dueDate: dueDate ? String(dueDate) : undefined,
    priority: value.priority === "low" || value.priority === "high" ? value.priority : "medium",
    tags: Array.isArray(value.tags) ? value.tags.map(normalizeTag).filter(Boolean) as Tag[] : [],
    completed,
    subtasks: Array.isArray(value.subtasks)
      ? value.subtasks.map(normalizeSubtask).filter(Boolean) as Subtask[]
      : [],
    location: value.location ? String(value.location) : undefined,
    files: Array.isArray(value.files)
      ? value.files
          .filter((file): file is { name: string; url: string } => {
            return Boolean(file && typeof file === "object" && "name" in file && "url" in file)
          })
          .map((file) => ({ name: String(file.name), url: String(file.url) }))
      : [],
    isArchived: Boolean(value.isArchived ?? value.is_archived),
    isDeleted: Boolean(value.isDeleted ?? value.is_deleted),
  }
}

function normalizeProject(project: Record<string, unknown>): Project {
  const projectId = String(project.id)
  const tasks = Array.isArray(project.tasks)
    ? (project.tasks.map((task) => normalizeTask(task, projectId)).filter(Boolean) as Task[]).filter(
        (task) => !task.isArchived && !task.isDeleted,
      )
    : []

  return {
    id: projectId,
    name: String(project.name ?? "Без названия"),
    description: project.description ? String(project.description) : undefined,
    tasks,
    createdAt: project.created_at ? String(project.created_at) : new Date().toISOString(),
    updatedAt: project.updated_at ? String(project.updated_at) : undefined,
    userId: project.user_id ? String(project.user_id) : undefined,
    isArchived: Boolean(project.is_archived),
    isDeleted: Boolean(project.is_deleted),
  }
}

function addArchivedItem(id: string, title: string, type: string, item: unknown) {
  const archivedItems = getFromStorage("totododo-archive", [] as unknown[])
  saveToStorage("totododo-archive", [
    ...archivedItems,
    {
      id,
      title,
      type,
      archivedAt: new Date().toISOString(),
      item,
    },
  ])
}

export function useProjects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadProjects = useCallback(async () => {
    if (!user?.id) {
      setProjects([])
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*, tasks(*, subtasks(*))")
        .eq("user_id", user.id)
        .eq("is_archived", false)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })

      if (error) {
        throw error
      }

      setProjects((data ?? []).map((project) => normalizeProject(project)))
    } catch (error) {
      console.error("Error loading projects:", error)
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить проекты",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  useEffect(() => {
    if (!user?.id) {
      return
    }

    const channel = supabase
      .channel(`projects-changes-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadProjects()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadProjects, user?.id])

  useEffect(() => {
    if (!user?.id) {
      return
    }

    const channel = supabase
      .channel(`tasks-changes-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
        },
        () => {
          loadProjects()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadProjects, user?.id])

  const getProject = useCallback(
    (projectId: string) => {
      return projects.find((project) => project.id === projectId)
    },
    [projects],
  )

  const addProject = useCallback(
    async (name: string) => {
      if (!user?.id) {
        return null
      }

      const now = new Date().toISOString()
      const newProject: Project = {
        id: crypto.randomUUID(),
        name: name.trim(),
        tasks: [],
        createdAt: now,
        updatedAt: now,
        userId: user.id,
      }

      try {
        const { error } = await supabase.from("projects").insert({
          id: newProject.id,
          name: newProject.name,
          created_at: newProject.createdAt,
          updated_at: newProject.updatedAt,
          user_id: user.id,
        })

        if (error) {
          throw error
        }

        setProjects((currentProjects) => [...currentProjects, newProject])

        toast({
          title: "Проект создан",
          description: `Проект "${newProject.name}" успешно создан`,
        })

        return newProject
      } catch (error) {
        console.error("Error adding project:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось создать проект",
          variant: "destructive",
        })
        throw error
      }
    },
    [user?.id],
  )

  const updateProject = useCallback(
    async (projectId: string, updates: Partial<Project>) => {
      if (!user?.id) {
        return null
      }

      const currentProject = projects.find((project) => project.id === projectId)
      if (!currentProject) {
        return null
      }

      const updatedProject: Project = {
        ...currentProject,
        ...updates,
        id: currentProject.id,
        tasks: updates.tasks ?? currentProject.tasks,
        updatedAt: new Date().toISOString(),
      }

      try {
        const { data, error } = await supabase
          .from("projects")
          .update({
            name: updatedProject.name,
            updated_at: updatedProject.updatedAt,
          })
          .eq("id", projectId)
          .eq("user_id", user.id)
          .select("id")
          .single()

        if (error || !data) {
          throw error ?? new Error("Не удалось сохранить проект")
        }

        setProjects((currentProjects) =>
          currentProjects.map((project) => (project.id === projectId ? updatedProject : project)),
        )

        return updatedProject
      } catch (error) {
        console.error("Error updating project:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось обновить проект",
          variant: "destructive",
        })
        throw error
      }
    },
    [projects, user?.id],
  )

  const deleteProject = useCallback(
    async (projectId: string) => {
      if (!user?.id) {
        return null
      }

      try {
        const { error } = await supabase.from("projects").delete().eq("id", projectId).eq("user_id", user.id)

        if (error) {
          throw error
        }

        setProjects((currentProjects) => currentProjects.filter((project) => project.id !== projectId))

        toast({
          title: "Проект удален",
          description: "Проект успешно удален",
        })

        return projectId
      } catch (error) {
        console.error("Error deleting project:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось удалить проект",
          variant: "destructive",
        })
        throw error
      }
    },
    [user?.id],
  )

  const archiveProject = useCallback(
    async (projectId: string) => {
      const project = getProject(projectId)
      if (!project) {
        return null
      }

      addArchivedItem(project.id, project.name, "projects", project)
      await deleteProject(projectId)
      return project
    },
    [deleteProject, getProject],
  )

  const addTask = useCallback(
    async (projectId: string, task: Omit<Task, "id" | "createdAt" | "updatedAt"> | Task) => {
      if (!user?.id) {
        return null
      }

      const project = getProject(projectId)

      const now = new Date().toISOString()
      const newTask: Task = {
        ...task,
        id: "id" in task && task.id ? task.id : crypto.randomUUID(),
        projectId,
        createdAt: "createdAt" in task && task.createdAt ? task.createdAt : now,
        updatedAt: now,
        status: task.status ?? (task.completed ? "done" : "todo"),
        completed: task.completed ?? task.status === "done",
        priority: task.priority ?? "medium",
        subtasks: task.subtasks ?? [],
        tags: task.tags ?? [],
      }

      try {
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            id: newTask.id,
            project_id: projectId,
            title: newTask.title,
            description: newTask.description,
            due_date: newTask.dueDate,
            priority: newTask.priority,
            completed: newTask.completed,
            location: newTask.location,
            created_at: newTask.createdAt,
            updated_at: newTask.updatedAt,
          })
          .select()
          .single()

        if (error || !data) {
          throw error ?? new Error("Не удалось сохранить задачу")
        }

        if (newTask.subtasks.length > 0) {
          const { error: subtasksError } = await supabase.from("subtasks").insert(
            newTask.subtasks.map((subtask) => ({
              id: subtask.id,
              task_id: newTask.id,
              title: subtask.title,
              completed: subtask.completed,
              created_at: subtask.createdAt ?? now,
              updated_at: now,
            })),
          )

          if (subtasksError) {
            throw subtasksError
          }
        }

        setProjects((currentProjects) =>
          currentProjects.map((currentProject) =>
            currentProject.id === projectId
              ? { ...currentProject, tasks: [...currentProject.tasks, newTask] }
              : currentProject,
          ),
        )

        if (!project) {
          await loadProjects()
        }
      } catch (error) {
        console.error("Error adding task:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось создать задачу",
          variant: "destructive",
        })
        throw error
      }

      toast({
        title: "Задача создана",
        description: `Задача "${newTask.title}" добавлена`,
      })

      return newTask
    },
    [getProject, loadProjects, user?.id],
  )

  const updateTask = useCallback(
    async (projectId: string, taskId: string, updates: Partial<Task>) => {
      const project = getProject(projectId)
      if (!project) {
        return null
      }

      const currentTask = project.tasks.find((task) => task.id === taskId)
      if (!currentTask) {
        return null
      }

      const updatedTask: Task = {
        ...currentTask,
        ...updates,
        id: currentTask.id,
        projectId,
        updatedAt: new Date().toISOString(),
      }

      if (updates.status) {
        updatedTask.completed = updates.status === "done"
      }

      try {
        const { data, error } = await supabase
          .from("tasks")
          .update({
            title: updatedTask.title,
            description: updatedTask.description,
            due_date: updatedTask.dueDate,
            priority: updatedTask.priority,
            completed: updatedTask.completed,
            location: updatedTask.location,
            updated_at: updatedTask.updatedAt,
          })
          .eq("id", taskId)
          .eq("project_id", projectId)
          .select("id")
          .single()

        if (error || !data) {
          throw error ?? new Error("Не удалось обновить задачу")
        }

        const { error: deleteSubtasksError } = await supabase.from("subtasks").delete().eq("task_id", taskId)
        if (deleteSubtasksError) {
          throw deleteSubtasksError
        }

        if (updatedTask.subtasks.length > 0) {
          const { error: subtasksError } = await supabase.from("subtasks").insert(
            updatedTask.subtasks.map((subtask) => ({
              id: subtask.id,
              task_id: taskId,
              title: subtask.title,
              completed: subtask.completed,
              created_at: subtask.createdAt ?? updatedTask.updatedAt,
              updated_at: updatedTask.updatedAt,
            })),
          )

          if (subtasksError) {
            throw subtasksError
          }
        }

        setProjects((currentProjects) =>
          currentProjects.map((currentProject) =>
            currentProject.id === projectId
              ? {
                  ...currentProject,
                  tasks: currentProject.tasks.map((task) => (task.id === taskId ? updatedTask : task)),
                }
              : currentProject,
          ),
        )
      } catch (error) {
        console.error("Error updating task:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось обновить задачу",
          variant: "destructive",
        })
        throw error
      }

      return updatedTask
    },
    [getProject],
  )

  const deleteTask = useCallback(
    async (projectId: string, taskId: string) => {
      const project = getProject(projectId)
      if (!project) {
        return null
      }

      try {
        const { error } = await supabase.from("tasks").delete().eq("id", taskId).eq("project_id", projectId)

        if (error) {
          throw error
        }

        setProjects((currentProjects) =>
          currentProjects.map((currentProject) =>
            currentProject.id === projectId
              ? { ...currentProject, tasks: currentProject.tasks.filter((task) => task.id !== taskId) }
              : currentProject,
          ),
        )
      } catch (error) {
        console.error("Error deleting task:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось удалить задачу",
          variant: "destructive",
        })
        throw error
      }

      toast({
        title: "Задача удалена",
        description: "Задача успешно удалена",
      })

      return taskId
    },
    [getProject],
  )

  const archiveTask = useCallback(
    async (projectId: string, taskId: string) => {
      const project = getProject(projectId)
      const task = project?.tasks.find((projectTask) => projectTask.id === taskId)
      if (!project || !task) {
        return null
      }

      addArchivedItem(task.id, task.title, "tasks", task)
      await deleteTask(projectId, taskId)
      return task
    },
    [deleteTask, getProject],
  )

  return {
    projects,
    isLoading,
    getProject,
    addProject,
    updateProject,
    deleteProject,
    archiveProject,
    addTask,
    updateTask,
    deleteTask,
    archiveTask,
  }
}
