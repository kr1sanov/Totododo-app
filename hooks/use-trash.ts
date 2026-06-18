"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

export interface TrashedItem {
  id: string
  title: string
  type: string
  deletedAt: string
  item: any
}

function resolveTrashType(item: TrashedItem, explicitType?: string) {
  return explicitType ?? item.type
}

export function useTrash() {
  const { user } = useAuth()
  const [trashedItems, setTrashedItems] = useState<TrashedItem[]>([])

  const loadTrashedItems = useCallback(async () => {
    if (!user?.id) {
      setTrashedItems([])
      return
    }

    const [projectsResult, tasksResult] = await Promise.all([
      supabase
        .from("projects")
        .select("id, title, updated_at, user_id, status")
        .eq("user_id", user.id)
        .eq("status", "deleted"),
      supabase
        .from("tasks")
        .select("id, title, updated_at, user_id, is_deleted, is_archived, project_id")
        .eq("user_id", user.id)
        .eq("is_deleted", true),
    ])

    if (projectsResult.error) {
      throw projectsResult.error
    }

    if (tasksResult.error) {
      throw tasksResult.error
    }

    const projectItems: TrashedItem[] = (projectsResult.data ?? []).map((project) => ({
      id: project.id,
      title: project.title,
      type: "projects",
      deletedAt: project.updated_at,
      item: project,
    }))

    const taskItems: TrashedItem[] = (tasksResult.data ?? []).map((task) => ({
      id: task.id,
      title: task.title,
      type: "tasks",
      deletedAt: task.updated_at,
      item: task,
    }))

    setTrashedItems([...projectItems, ...taskItems])
  }, [user?.id])

  useEffect(() => {
    loadTrashedItems().catch((error) => {
      console.error("Error loading trashed items:", error)
      setTrashedItems([])
    })
  }, [loadTrashedItems])

  const moveProjectToTrash = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("projects")
      .update({ status: "deleted", updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      throw error
    }

    await loadTrashedItems()
  }, [loadTrashedItems])

  const moveTaskToTrash = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("tasks")
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      throw error
    }

    await loadTrashedItems()
  }, [loadTrashedItems])

  const restoreItem = useCallback(
    async (id: string, type?: string) => {
      const itemToRestore = trashedItems.find((item) => item.id === id)
      if (!itemToRestore) {
        return null
      }

      const resolvedType = resolveTrashType(itemToRestore, type)

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
          .update({ is_deleted: false, updated_at: new Date().toISOString() })
          .eq("id", id)

        if (error) {
          throw error
        }
      }

      await loadTrashedItems()
      return itemToRestore
    },
    [loadTrashedItems, trashedItems],
  )

  const deleteItem = useCallback(
    async (id: string, type?: string) => {
      const itemToDelete = trashedItems.find((item) => item.id === id)
      if (!itemToDelete) {
        return null
      }

      const resolvedType = resolveTrashType(itemToDelete, type)

      if (resolvedType === "projects") {
        const { error } = await supabase.from("projects").delete().eq("id", id)
        if (error) {
          throw error
        }
      } else if (resolvedType === "tasks") {
        const { error } = await supabase.from("tasks").delete().eq("id", id)
        if (error) {
          throw error
        }
      }

      await loadTrashedItems()
      return itemToDelete
    },
    [loadTrashedItems, trashedItems],
  )

  const emptyTrash = useCallback(async () => {
    for (const item of trashedItems) {
      if (item.type === "projects") {
        const { error } = await supabase.from("projects").delete().eq("id", item.id)
        if (error) {
          throw error
        }
      } else if (item.type === "tasks") {
        const { error } = await supabase.from("tasks").delete().eq("id", item.id)
        if (error) {
          throw error
        }
      }
    }

    await loadTrashedItems()
  }, [loadTrashedItems, trashedItems])

  return {
    trashedItems,
    moveProjectToTrash,
    moveTaskToTrash,
    restoreItem,
    deleteItem,
    emptyTrash,
  }
}
