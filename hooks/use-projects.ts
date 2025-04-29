"use client"

import { useState, useEffect } from "react"
import { getFromStorage, saveToStorage } from "@/lib/storage-utils"

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

  const getProject = (id: string) => {
    return projects.find((project) => project.id === id)
  }

  const addProject = (project: Project) => {
    setProjects((prevProjects) => [...prevProjects, project])
  }

  const updateProject = (updatedProject: Project) => {
    setProjects((prevProjects) =>
      prevProjects.map((project) => (project.id === updatedProject.id ? updatedProject : project)),
    )
  }

  const deleteProject = (id: string) => {
    const projectToDelete = projects.find((project) => project.id === id)
    if (projectToDelete) {
      // Add to trash
      const trashedItems = getFromStorage("totododo-trash", [])
      trashedItems.push({
        ...projectToDelete,
        type: "projects",
        deletedAt: new Date().toISOString(),
      })
      saveToStorage("totododo-trash", trashedItems)

      // Remove from projects
      setProjects((prevProjects) => prevProjects.filter((project) => project.id !== id))
    }
  }

  const archiveProject = (id: string) => {
    const projectToArchive = projects.find((project) => project.id === id)
    if (projectToArchive) {
      // Add to archive
      const archivedItems = getFromStorage("totododo-archive", [])
      archivedItems.push({
        ...projectToArchive,
        type: "projects",
        archivedAt: new Date().toISOString(),
      })
      saveToStorage("totododo-archive", archivedItems)

      // Remove from projects
      setProjects((prevProjects) => prevProjects.filter((project) => project.id !== id))
    }
  }

  const addTask = (projectId: string, task: Task) => {
    setProjects((prevProjects) =>
      prevProjects.map((project) => {
        if (project.id === projectId) {
          return {
            ...project,
            tasks: [...project.tasks, task],
          }
        }
        return project
      }),
    )
  }

  const updateTask = (projectId: string, updatedTask: Task) => {
    setProjects((prevProjects) =>
      prevProjects.map((project) => {
        if (project.id === projectId) {
          return {
            ...project,
            tasks: project.tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
          }
        }
        return project
      }),
    )
  }

  const deleteTask = (projectId: string, taskId: string) => {
    const project = projects.find((p) => p.id === projectId)
    const taskToDelete = project?.tasks.find((t) => t.id === taskId)

    if (project && taskToDelete) {
      // Add to trash
      const trashedItems = getFromStorage("totododo-trash", [])
      trashedItems.push({
        ...taskToDelete,
        projectId,
        type: "tasks",
        deletedAt: new Date().toISOString(),
      })
      saveToStorage("totododo-trash", trashedItems)

      // Remove from project
      setProjects((prevProjects) =>
        prevProjects.map((p) => {
          if (p.id === projectId) {
            return {
              ...p,
              tasks: p.tasks.filter((t) => t.id !== taskId),
            }
          }
          return p
        }),
      )
    }
  }

  const archiveTask = (projectId: string, taskId: string) => {
    const project = projects.find((p) => p.id === projectId)
    const taskToArchive = project?.tasks.find((t) => t.id === taskId)

    if (project && taskToArchive) {
      // Add to archive
      const archivedItems = getFromStorage("totododo-archive", [])
      archivedItems.push({
        ...taskToArchive,
        projectId,
        type: "tasks",
        archivedAt: new Date().toISOString(),
      })
      saveToStorage("totododo-archive", archivedItems)

      // Remove from project
      setProjects((prevProjects) =>
        prevProjects.map((p) => {
          if (p.id === projectId) {
            return {
              ...p,
              tasks: p.tasks.filter((t) => t.id !== taskId),
            }
          }
          return p
        }),
      )
    }
  }

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
