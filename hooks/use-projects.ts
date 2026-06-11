"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
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
  user_id: string
}

export function useProjects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load projects from Supabase
  const loadProjects = useCallback(async () => {
    if (!user?.telegramId) {
      setProjects([])
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.telegramId)
        .order('created_at', { ascending: true })

      if (error) throw error

      const parsedProjects = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        tasks: row.tasks || [],
        createdAt: row.created_at,
        user_id: row.user_id
      }))

      setProjects(parsedProjects)
    } catch (error) {
      console.error('Error loading projects:', error)
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить проекты",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user?.telegramId) return

    const channel = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${user.telegramId}`
        },
        () => {
          loadProjects()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, loadProjects])

  const getProject = useCallback(
    (projectId: string) => {
      return projects.find((p) => p.id === projectId)
    },
    [projects]
  )

  const addProject = useCallback(
    async (name: string) => {
      if (!user?.telegramId) return

      const newProject: Project = {
        id: crypto.randomUUID(),
        name,
        tasks: [],
        createdAt: new Date().toISOString(),
        user_id: user.telegramId.toString()
      }

      try {
        const { error } = await supabase
          .from('projects')
          .insert({
            id: newProject.id,
            name: newProject.name,
            tasks: newProject.tasks,
            created_at: newProject.createdAt,
            user_id: newProject.user_id
          })

        if (error) throw error

        toast({
          title: "Проект создан",
          description: `Проект "${name}" успешно создан`,
        })
      } catch (error) {
        console.error('Error adding project:', error)
        toast({
          title: "Ошибка",
          description: "Не удалось создать проект",
          variant: "destructive",
        })
      }
    },
    [user]
  )

  const updateProject = useCallback(
    async (projectId: string, updates: Partial<Project>) => {
      if (!user?.telegramId) return

      try {
        const { error } = await supabase
          .from('projects')
          .update({
            name: updates.name,
            tasks: updates.tasks,
          })
          .eq('id', projectId)
          .eq('user_id', user.telegramId)

        if (error) throw error

        toast({
          title: "Проект обновлен",
          description: "Изменения сохранены",
        })
      } catch (error) {
        console.error('Error updating project:', error)
        toast({
          title: "Ошибка",
          description: "Не удалось обновить проект",
          variant: "destructive",
        })
      }
    },
    [user]
  )

  const deleteProject = useCallback(
    async (projectId: string) => {
      if (!user?.telegramId) return

      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectId)
          .eq('user_id', user.telegramId)

        if (error) throw error

        toast({
          title: "Проект удален",
          description: "Проект успешно удален",
        })
      } catch (error) {
        console.error('Error deleting project:', error)
        toast({
          title: "Ошибка",
          description: "Не удалось удалить проект",
          variant: "destructive",
        })
      }
    },
    [user]
  )

  const addTask = useCallback(
    async (
      projectId: string,
      task: Omit<Task, "id" | "createdAt">
    ) => {
      const project = getProject(projectId)
      if (!project || !user?.telegramId) return

      const newTask: Task = {
        ...task,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      }

      const updatedTasks = [...project.tasks, newTask]

      try {
        const { error } = await supabase
          .from('projects')
          .update({ tasks: updatedTasks })
          .eq('id', projectId)
          .eq('user_id', user.telegramId)

        if (error) throw error

        toast({
          title: "Задача создана",
          description: `Задача "${task.title}" добавлена`,
        })

        if (user.telegramId) {
          sendNotification(
            user.telegramId.toString(),
            `Создана новая задача: ${task.title}`
          )
        }
      } catch (error) {
        console.error('Error adding task:', error)
        toast({
          title: "Ошибка",
          description: "Не удалось создать задачу",
          variant: "destructive",
        })
      }
    },
    [getProject, user]
  )

  const updateTask = useCallback(
    async (
      projectId: string,
      taskId: string,
      updates: Partial<Task>
    ) => {
      const project = getProject(projectId)
      if (!project || !user?.telegramId) return

      const updatedTasks = project.tasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      )

      try {
        const { error } = await supabase
          .from('projects')
          .update({ tasks: updatedTasks })
          .eq('id', projectId)
          .eq('user_id', user.telegramId)

        if (error) throw error

        if (updates.completed !== undefined && user.telegramId) {
          const task = project.tasks.find(t => t.id === taskId)
          if (task) {
            sendNotification(
              user.telegramId.toString(),
              updates.completed
                ? `Задача выполнена: ${task.title}`
                : `Задача отмечена как невыполненная: ${task.title}`
            )
          }
        }
      } catch (error) {
        console.error('Error updating task:', error)
        toast({
          title: "Ошибка",
          description: "Не удалось обновить задачу",
          variant: "destructive",
        })
      }
    },
    [getProject, user]
  )

  const deleteTask = useCallback(
    async (projectId: string, taskId: string) => {
      const project = getProject(projectId)
      if (!project || !user?.telegramId) return

      const updatedTasks = project.tasks.filter((task) => task.id !== taskId)

      try {
        const { error } = await supabase
          .from('projects')
          .update({ tasks: updatedTasks })
          .eq('id', projectId)
          .eq('user_id', user.telegramId)

        if (error) throw error

        toast({
          title: "Задача удалена",
          description: "Задача успешно удалена",
        })
      } catch (error) {
        console.error('Error deleting task:', error)
        toast({
          title: "Ошибка",
          description: "Не удалось удалить задачу",
          variant: "destructive",
        })
      }
    },
    [getProject, user]
  )

  return {
    projects,
    isLoading,
    getProject,
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    deleteTask,
  }
}
