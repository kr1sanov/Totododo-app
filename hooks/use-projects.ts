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
    projectId,
    createdAt: value.createdAt ? String(value.createdAt) : new Date().toISOString(),
    updatedAt: value.updatedAt ? String(value.updatedAt) : value.createdAt ? String(value.createdAt) : new Date().toISOString(),
    dueDate: value.dueDate ? String(value.dueDate) : undefined,
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
  }
}

function normalizeProject(project: Record<string, unknown>): Project {
  const projectId = String(project.id)
  const tasks = Array.isArray(project.tasks)
    ? project.tasks.map((task) => normalizeTask(task, projectId)).filter(Boolean) as Task[]
    : []

  return {
    id: projectId,
    name: String(project.name ?? "Без названия"),
    description: project.description ? String(project.description) : undefined,
    tasks,
    createdAt: project.created_at ? String(project.created_at) : new Date().toISOString(),
    updatedAt: project.updated_at ? String(project.updated_at) : undefined,
    userId: project.user_id ? String(project.user_id) : undefined,
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
        .select("*")
        .eq("user_id", user.id)
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
      .channel("projects-changes")
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
          description: newProject.description,
          tasks: [],
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
        const { error } = await supabase
          .from("projects")
          .update({
            name: updatedProject.name,
            description: updatedProject.description,
            tasks: updatedProject.tasks,
            updated_at: updatedProject.updatedAt,
          })
          .eq("id", projectId)
          .eq("user_id", user.id)

        if (error) {
          throw error
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
      const project = getProject(projectId)
      if (!project) {
        return null
      }

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

      await updateProject(projectId, {
        tasks: [...project.tasks, newTask],
      })

      toast({
        title: "Задача создана",
        description: `Задача "${newTask.title}" добавлена`,
      })

      return newTask
    },
    [getProject, updateProject],
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

      await updateProject(projectId, {
        tasks: project.tasks.map((task) => (task.id === taskId ? updatedTask : task)),
      })

      return updatedTask
    },
    [getProject, updateProject],
  )

  const deleteTask = useCallback(
    async (projectId: string, taskId: string) => {
      const project = getProject(projectId)
      if (!project) {
        return null
      }

      await updateProject(projectId, {
        tasks: project.tasks.filter((task) => task.id !== taskId),
      })

      toast({
        title: "Задача удалена",
        description: "Задача успешно удалена",
      })

      return taskId
    },
    [getProject, updateProject],
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
