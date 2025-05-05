"use client"

import { useState, useEffect, useCallback } from "react"
import { getFromStorage, saveToStorage } from "@/lib/storage-utils"
import { toast } from "@/components/ui/use-toast"

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

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Загружаем проекты из localStorage только один раз при монтировании
  useEffect(() => {
    const storedProjects = getFromStorage("totododo-projects", [])
    setProjects(storedProjects)
    setIsInitialized(true)
  }, [])

  // Сохраняем проекты в localStorage при каждом изменении
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
      // Create a new array with the new project for optimistic UI
      const updatedProjects = [...projects, project]
      // Update state immediately
      setProjects(updatedProjects)
      // Save to localStorage
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
      // Create a new array with the updated project for optimistic UI
      const updatedProjects = projects.map((project) => (project.id === updatedProject.id ? updatedProject : project))
      // Update state immediately
      setProjects(updatedProjects)
      // Save to localStorage
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
        // Create a new array without the deleted project for optimistic UI
        const updatedProjects = projects.filter((project) => project.id !== id)
        // Update state immediately
        setProjects(updatedProjects)

        // Add to trash
        const trashedItems = getFromStorage("totododo-trash", [])
        const updatedTrash = [
          ...trashedItems,
          {
            ...projectToDelete,
            type: "projects",
            deletedAt: new Date().toISOString(),
          },
        ]

        // Save to localStorage
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
        // Create a new array without the archived project for optimistic UI
        const updatedProjects = projects.filter((project) => project.id !== id)
        // Update state immediately
        setProjects(updatedProjects)

        // Add to archive
        const archivedItems = getFromStorage("totododo-archive", [])
        const updatedArchive = [
          ...archivedItems,
          {
            ...projectToArchive,
            type: "projects",
            archivedAt: new Date().toISOString(),
          },
        ]

        // Save to localStorage
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
      // Create a new array with the task added to the project for optimistic UI
      const updatedProjects = projects.map((project) => {
        if (project.id === projectId) {
          return {
            ...project,
            tasks: [...project.tasks, task],
          }
        }
        return project
      })

      // Update state immediately
      setProjects(updatedProjects)
      // Save to localStorage
      saveToStorage("totododo-projects", updatedProjects)

      toast({
        title: "Задача создана",
        description: `Задача "${task.title}" успешно создана`,
      })

      return task
    },
    [projects],
  )

  const updateTask = useCallback(
    (projectId: string, updatedTask: Task) => {
      // Create a new array with the updated task for optimistic UI
      const updatedProjects = projects.map((project) => {
        if (project.id === projectId) {
          return {
            ...project,
            tasks: project.tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
          }
        }
        return project
      })

      // Update state immediately
      setProjects(updatedProjects)
      // Save to localStorage
      saveToStorage("totododo-projects", updatedProjects)

      toast({
        title: "Задача обновлена",
        description: `Задача "${updatedTask.title}" успешно обновлена`,
      })

      return updatedTask
    },
    [projects],
  )

  const deleteTask = useCallback(
    (projectId: string, taskId: string) => {
      const project = projects.find((p) => p.id === projectId)
      const taskToDelete = project?.tasks.find((t) => t.id === taskId)

      if (project && taskToDelete) {
        // Create a new array without the deleted task for optimistic UI
        const updatedProjects = projects.map((p) => {
          if (p.id === projectId) {
            return {
              ...p,
              tasks: p.tasks.filter((t) => t.id !== taskId),
            }
          }
          return p
        })

        // Update state immediately
        setProjects(updatedProjects)

        // Add to trash
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

        // Save to localStorage
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
        // Create a new array without the archived task for optimistic UI
        const updatedProjects = projects.map((p) => {
          if (p.id === projectId) {
            return {
              ...p,
              tasks: p.tasks.filter((t) => t.id !== taskId),
            }
          }
          return p
        })

        // Update state immediately
        setProjects(updatedProjects)

        // Add to archive
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

        // Save to localStorage
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
