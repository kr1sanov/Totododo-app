"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

export interface ArchivedItem {
  id: string
  title: string
  type: string
  archivedAt: string
  item: any
}

function resolveArchiveType(item: ArchivedItem, explicitType?: string) {
  return explicitType ?? item.type
}

export function useArchive() {
  const { user } = useAuth()
  const [archivedItems, setArchivedItems] = useState<ArchivedItem[]>([])

  const loadArchivedItems = useCallback(async () => {
    if (!user?.id) {
      setArchivedItems([])
      return
    }

    const [projectsResult, tasksResult] = await Promise.all([
      supabase
        .from("projects")
        .select("id, title, updated_at, user_id, status")
        .eq("user_id", user.id)
        .eq("status", "archived"),
      supabase
        .from("tasks")
        .select("id, title, updated_at, user_id, is_archived, is_deleted, project_id")
        .eq("user_id", user.id)
        .eq("is_archived", true),
    ])

    if (projectsResult.error) {
      throw projectsResult.error
    }

    if (tasksResult.error) {
      throw tasksResult.error
    }

    const projectItems: ArchivedItem[] = (projectsResult.data ?? []).map((project) => ({
      id: project.id,
      title: project.title,
      type: "projects",
      archivedAt: project.updated_at,
      item: project,
    }))

    const taskItems: ArchivedItem[] = (tasksResult.data ?? []).map((task) => ({
      id: task.id,
      title: task.title,
      type: "tasks",
      archivedAt: task.updated_at,
      item: task,
    }))

    setArchivedItems([...projectItems, ...taskItems])
  }, [user?.id])

  useEffect(() => {
    loadArchivedItems().catch((error) => {
      console.error("Error loading archived items:", error)
      setArchivedItems([])
    })
  }, [loadArchivedItems])

  const archiveProject = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("projects")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      throw error
    }

    await loadArchivedItems()
  }, [loadArchivedItems])

  const archiveTask = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("tasks")
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      throw error
    }

    await loadArchivedItems()
  }, [loadArchivedItems])

  const restoreItem = useCallback(
    async (id: string, type?: string) => {
      const itemToRestore = archivedItems.find((item) => item.id === id)
      if (!itemToRestore) {
        return null
      }

      const resolvedType = resolveArchiveType(itemToRestore, type)

      if (resolvedType === "projects") {
        const { error } = await supabase
          .from("projects")
          .update({ status: "active", updated_at: new Date().toISOString() })
          .eq("id", id)

        if (error) {
          throw error
        }
      } else if (resolvedType === "tasks") {
        const { error } = await supabase
          .from("tasks")
          .update({ is_archived: false, updated_at: new Date().toISOString() })
          .eq("id", id)

        if (error) {
          throw error
        }
      }

      await loadArchivedItems()
      return itemToRestore
    },
    [archivedItems, loadArchivedItems],
  )

  const deleteItem = useCallback(
    async (id: string, type?: string) => {
      const itemToDelete = archivedItems.find((item) => item.id === id)
      if (!itemToDelete) {
        return null
      }

      const resolvedType = resolveArchiveType(itemToDelete, type)

      if (resolvedType === "projects") {
        const { error } = await supabase
          .from("projects")
          .update({ status: "deleted", updated_at: new Date().toISOString() })
          .eq("id", id)

        if (error) {
          throw error
        }
      } else if (resolvedType === "tasks") {
        const { error } = await supabase
          .from("tasks")
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq("id", id)

        if (error) {
          throw error
        }
      }

      await loadArchivedItems()
      return itemToDelete
    },
    [archivedItems, loadArchivedItems],
  )

  return {
    archivedItems,
    archiveProject,
    archiveTask,
    restoreItem,
    deleteItem,
  }
}
