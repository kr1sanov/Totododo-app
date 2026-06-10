"use client"

import { useState, useEffect, useCallback } from "react"
import { getFromStorage, saveToStorage } from "@/lib/storage-utils"
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

  useEffect(() => {
    const storedProjects = getFromStorage("totododo-projects", [])
    setProjects(storedProjects)
    setIsInitialized(true)
  }, [])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage("totododo-projects", projects)
    }
  }, [projects, isInitialized])

  const getProject = useCallback(
    (id: string) => {
      return projects.find((project) => project.id === id)
    },
    [projects],
  )

  const addProject = useCallback(
    (project: Project) => {
      const updatedProjects = [...projects, project]
      setProjects(updatedProjects)
      saveToStorage("totododo-projects", updatedProjects)
      toast({
        title: "Проект создан",
        description: `Проект "${project.name}" успешно создан`,
      })
      return project
    },
    [projects],
  )

  const updateProject = useCallback(
    (updatedProject: Project) => {
      const updatedProjects = projects.map((project) =>
        project.id === updatedProject.id ? updatedProject : project
      )
      setProjects(updatedProjects)
      saveToStorage("totododo-projects", updatedProjects)
      toast({
        title: "Проект обновлен",
        description: `Проект "${updatedProject.name}" успешно обновлен`,
      })
      return updatedProject
    },
    [projects],
  )

  const deleteProject = useCallback(
    (id: string) => {
      const projectToDelete = projects.find((project) => project.id === id)
      if (projectToDelete) {
        const updatedProjects = projects.filter((project) => project.id !== id)
        setProjects(updatedProjects)
        const trashedItems = getFromStorage("totododo-trash", [])
        const updatedTrash = [
          ...trashedItems,
          {
            ...projectToDelete,
            type: "projects",
            deletedAt: new Date().toISOString(),
          },
        ]
        saveToStorage("totododo-projects", updatedProjects)
        saveToStorage("totododo-trash", updatedTrash)
        toast({
          title: "Проект удален",
          description: `Проект "${projectToDelete.name}" перемещен в корзину`,
        })
        return projectToDelete
      }
      return null
    },
    [projects],
  )

  const archiveProject = useCallback(
    (id: string) => {
      const projectToArchive = projects.find((project) => project.id === id)
      if (projectToArchive) {
        const updatedProjects = projects.filter((project) => project.id !== id)
        setProjects(updatedProjects)
        const archivedItems = getFromStorage("totododo-archive", [])
        const updatedArchive = [
          ...archivedItems,
          {
            ...projectToArchive,
            type: "projects",
            archivedAt: new Date().toISOString(),
          },
        ]
        saveToStorage("totododo-projects", updatedProjects)
        saveToStorage("totododo-archive", updatedArchive)
        toast({
          title: "Проект архивирован",
          description: `Проект "${projectToArchive.name}" перемещен в архив`,
        })
        return projectToArchive
      }
      return null
    },
    [projects],
  )

  const addTask = useCallback(
    (projectId: string, task: Task) => {
      const project = projects.find((p) => p.id === projectId)
      const updatedProjects = projects.map((p) => {
        if (p.id === projectId) {
          return { ...p, tasks: [...p.tasks, task] }
        }
        return p
      })
      setProjects(updatedProjects)
      saveToStorage("totododo-projects", updatedProjects)
      toast({
        title: "Задача создана",
        description: `Задача "${task.title}" успешно создана`,
      })
      // 🔔 Уведомление
      if (userId) {
        sendNotification(userId, "task_created", {
          title: task.title,
          project: project?.name,
          due_date: task.dueDate,
        })
      }
      return task
    },
    [projects, userId],
  )

  const updateTask = useCallback(
    (projectId: string, updatedTask: Task) => {
      const project = projects.find((p) => p.id === projectId)
      const prevTask = project?.tasks.find((t) => t.id === updatedTask.id)
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
      saveToStorage("totododo-projects", updatedProjects)
      toast({
        title: "Задача обновлена",
        description: `Задача "${updatedTask.title}" успешно обновлена`,
      })
      // 🔔 Уведомление при завершении
      if (userId && !prevTask?.completed && updatedTask.completed) {
        sendNotification(userId, "task_completed", {
          title: updatedTask.title,
          project: project?.name,
        })
      }
      return updatedTask
    },
    [projects, userId],
  )

  const deleteTask = useCallback(
    (projectId: string, taskId: string) => {
      const project = projects.find((p) => p.id === projectId)
      const taskToDelete = project?.tasks.find((t) => t.id === taskId)
      if (project && taskToDelete) {
        const updatedProjects = projects.map((p) => {
          if (p.id === projectId) {
            return { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }
          }
          return p
        })
        setProjects(updatedProjects)
        const trashedItems = getFromStorage("totododo-trash", [])
        const updatedTrash = [
          ...trashedItems,
          {
            ...taskToDelete,
            projectId,
            type: "tasks",
            deletedAt: new Date().toISOString(),
          },
        ]
        saveToStorage("totododo-projects", updatedProjects)
        saveToStorage("totododo-trash", updatedTrash)
        toast({
          title: "Задача удалена",
          description: `Задача "${taskToDelete.title}" перемещена в корзину`,
        })
        return taskToDelete
      }
      return null
    },
    [projects],
  )

  const archiveTask = useCallback(
    (projectId: string, taskId: string) => {
      const project = projects.find((p) => p.id === projectId)
      const taskToArchive = project?.tasks.find((t) => t.id === taskId)
      if (project && taskToArchive) {
        const updatedProjects = projects.map((p) => {
          if (p.id === projectId) {
            return { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }
          }
          return p
        })
        setProjects(updatedProjects)
        const archivedItems = getFromStorage("totododo-archive", [])
        const updatedArchive = [
          ...archivedItems,
          {
            ...taskToArchive,
            projectId,
            type: "tasks",
            archivedAt: new Date().toISOString(),
          },
        ]
        saveToStorage("totododo-projects", updatedProjects)
        saveToStorage("totododo-archive", updatedArchive)
        toast({
          title: "Задача архивирована",
          description: `Задача "${taskToArchive.title}" перемещена в архив`,
        })
        return taskToArchive
      }
      return null
    },
    [projects],
  )

  return {
    projects,
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
