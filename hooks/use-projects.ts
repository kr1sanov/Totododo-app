"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import { sendNotification } from "@/lib/notifications"

export interface Subtask {
  id: string
  title: string
  description?: string
  dueDate?: string
  link?: string
  completed: boolean
  createdAt: string
}

export interface Task {
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

export interface Project {
  id: string
  name: string
  tasks: Task[]
  createdAt: string
}

export function useProjects(userId?: string) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Загрузка проектов из Supabase
  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    const loadProjects = async () => {
      try {
        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })

        if (projectsError) throw projectsError

        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", userId)

        if (tasksError) throw tasksError

        const projectsWithTasks = projectsData.map((project) => ({
          id: project.id,
          name: project.name,
          createdAt: project.created_at,
          tasks: tasksData
            .filter((task) => task.project_id === project.id)
            .map((task) => ({
              id: task.id,
              title: task.title,
              description: task.description || "",
              dueDate: task.due_date,
              priority: task.priority || "medium",
              completed: task.completed || false,
              location: task.location || "",
              subtasks: task.subtasks || [],
              createdAt: task.created_at,
              tags: task.tags || [],
            })),
        }))

        setProjects(projectsWithTasks)
        setIsInitialized(true)
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
    }

    loadProjects()

    // Подписка на изменения в реальном времени
    const projectsSubscription = supabase
      .channel("projects-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadProjects()
        }
      )
      .subscribe()

    const tasksSubscription = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadProjects()
        }
      )
      .subscribe()

    return () => {
      projectsSubscription.unsubscribe()
      tasksSubscription.unsubscribe()
    }
  }, [userId])

  const getProject = useCallback(
    (id: string) => {
      return projects.find((project) => project.id === id)
    },
    [projects]
  )

  const addProject = useCallback(
    async (project: Project) => {
      if (!userId) return null

      try {
        const { data, error } = await supabase
          .from("projects")
          .insert({
            id: project.id,
            user_id: userId,
            name: project.name,
            created_at: project.createdAt,
          })
          .select()
          .single()

        if (error) throw error

        const updatedProjects = [...projects, { ...project, tasks: [] }]
        setProjects(updatedProjects)

        toast({
          title: "Проект создан",
          description: `Проект "${project.name}" успешно создан`,
        })

        return data
      } catch (error) {
        console.error("Error adding project:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось создать проект",
          variant: "destructive",
        })
        return null
      }
    },
    [projects, userId]
  )

  const updateProject = useCallback(
    async (updatedProject: Project) => {
      if (!userId) return null

      try {
        const { error } = await supabase
          .from("projects")
          .update({
            name: updatedProject.name,
          })
          .eq("id", updatedProject.id)
          .eq("user_id", userId)

        if (error) throw error

        const updatedProjects = projects.map((project) =>
          project.id === updatedProject.id ? updatedProject : project
        )
        setProjects(updatedProjects)

        toast({
          title: "Проект обновлен",
          description: `Проект "${updatedProject.name}" успешно обновлен`,
        })

        return updatedProject
      } catch (error) {
        console.error("Error updating project:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось обновить проект",
          variant: "destructive",
        })
        return null
      }
    },
    [projects, userId]
  )

  const deleteProject = useCallback(
    async (id: string) => {
      if (!userId) return null

      const projectToDelete = projects.find((project) => project.id === id)
      if (!projectToDelete) return null

      try {
        const { error } = await supabase.from("projects").delete().eq("id", id).eq("user_id", userId)

        if (error) throw error

        const updatedProjects = projects.filter((project) => project.id !== id)
        setProjects(updatedProjects)

        toast({
          title: "Проект удален",
          description: `Проект "${projectToDelete.name}" успешно удален`,
        })

        return projectToDelete
      } catch (error) {
        console.error("Error deleting project:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось удалить проект",
          variant: "destructive",
        })
        return null
      }
    },
    [projects, userId]
  )

  const archiveProject = useCallback(
    async (id: string) => {
      if (!userId) return null

      const projectToArchive = projects.find((project) => project.id === id)
      if (!projectToArchive) return null

      try {
        const { error } = await supabase
          .from("projects")
          .update({ archived: true })
          .eq("id", id)
          .eq("user_id", userId)

        if (error) throw error

        const updatedProjects = projects.filter((project) => project.id !== id)
        setProjects(updatedProjects)

        toast({
          title: "Проект архивирован",
          description: `Проект "${projectToArchive.name}" перемещен в архив`,
        })

        return projectToArchive
      } catch (error) {
        console.error("Error archiving project:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось архивировать проект",
          variant: "destructive",
        })
        return null
      }
    },
    [projects, userId]
  )

  const addTask = useCallback(
    async (projectId: string, task: Task) => {
      if (!userId) return null

      const project = projects.find((p) => p.id === projectId)

      try {
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            id: task.id,
            user_id: userId,
            project_id: projectId,
            title: task.title,
            description: task.description,
            due_date: task.dueDate,
            priority: task.priority,
            completed: task.completed,
            location: task.location,
            subtasks: task.subtasks,
            tags: task.tags,
            created_at: task.createdAt,
          })
          .select()
          .single()

        if (error) throw error

        const updatedProjects = projects.map((p) => {
          if (p.id === projectId) {
            return { ...p, tasks: [...p.tasks, task] }
          }
          return p
        })
        setProjects(updatedProjects)

        toast({
          title: "Задача создана",
          description: `Задача "${task.title}" успешно создана`,
        })

        // Уведомление
        if (userId) {
          sendNotification(userId, "task_created", {
            title: task.title,
            project: project?.name,
            due_date: task.dueDate,
          })
        }

        return data
      } catch (error) {
        console.error("Error adding task:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось создать задачу",
          variant: "destructive",
        })
        return null
      }
    },
    [projects, userId]
  )

  const updateTask = useCallback(
    async (projectId: string, updatedTask: Task) => {
      if (!userId) return null

      const project = projects.find((p) => p.id === projectId)
      const prevTask = project?.tasks.find((t) => t.id === updatedTask.id)

      try {
        const { error } = await supabase
          .from("tasks")
          .update({
            title: updatedTask.title,
            description: updatedTask.description,
            due_date: updatedTask.dueDate,
            priority: updatedTask.priority,
            completed: updatedTask.completed,
            location: updatedTask.location,
            subtasks: updatedTask.subtasks,
            tags: updatedTask.tags,
          })
          .eq("id", updatedTask.id)
          .eq("user_id", userId)

        if (error) throw error

        const updatedProjects = projects.map((p) => {
          if (p.id === projectId) {
            return {
              ...p,
              tasks: p.tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
            }
          }
          return p
        })
        setProjects(updatedProjects)

        toast({
          title: "Задача обновлена",
          description: `Задача "${updatedTask.title}" успешно обновлена`,
        })

        // Уведомление при завершении
        if (userId && !prevTask?.completed && updatedTask.completed) {
          sendNotification(userId, "task_completed", {
            title: updatedTask.title,
            project: project?.name,
          })
        }

        return updatedTask
      } catch (error) {
        console.error("Error updating task:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось обновить задачу",
          variant: "destructive",
        })
        return null
      }
    },
    [projects, userId]
  )

  const deleteTask = useCallback(
    async (projectId: string, taskId: string) => {
      if (!userId) return null

      const project = projects.find((p) => p.id === projectId)
      const taskToDelete = project?.tasks.find((t) => t.id === taskId)

      if (!project || !taskToDelete) return null

      try {
        const { error } = await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", userId)

        if (error) throw error

        const updatedProjects = projects.map((p) => {
          if (p.id === projectId) {
            return { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }
          }
          return p
        })
        setProjects(updatedProjects)

        toast({
          title: "Задача удалена",
          description: `Задача "${taskToDelete.title}" успешно удалена`,
        })

        return taskToDelete
      } catch (error) {
        console.error("Error deleting task:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось удалить задачу",
          variant: "destructive",
        })
        return null
      }
    },
    [projects, userId]
  )

  const archiveTask = useCallback(
    async (projectId: string, taskId: string) => {
      if (!userId) return null

      const project = projects.find((p) => p.id === projectId)
      const taskToArchive = project?.tasks.find((t) => t.id === taskId)

      if (!project || !taskToArchive) return null

      try {
        const { error } = await supabase
          .from("tasks")
          .update({ archived: true })
          .eq("id", taskId)
          .eq("user_id", userId)

        if (error) throw error

        const updatedProjects = projects.map((p) => {
          if (p.id === projectId) {
            return { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }
          }
          return p
        })
        setProjects(updatedProjects)

        toast({
          title: "Задача архивирована",
          description: `Задача "${taskToArchive.title}" перемещена в архив`,
        })

        return taskToArchive
      } catch (error) {
        console.error("Error archiving task:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось архивировать задачу",
          variant: "destructive",
        })
        return null
      }
    },
    [projects, userId]
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
