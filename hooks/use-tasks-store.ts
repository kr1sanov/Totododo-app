"use client"

import { useStore } from "zustand"
import { useEffect } from "react"
import { taskStore } from "@/lib/store"
import { supabase } from "@/lib/supabase"

export function useTasksStore(projectId?: string) {
  const store = useStore(taskStore)

  useEffect(() => {
    if (!projectId) return

    // Загрузка задач при монтировании компонента
    const loadTasks = async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading tasks:", error)
        return
      }

      taskStore.getState().setTasks(data)
    }

    loadTasks()

    // Подписка на изменения в реальном времени
    const subscription = supabase
      .channel(`tasks-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tasks",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const newTask = payload.new
          taskStore.getState().addTask(newTask)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tasks",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const updatedTask = payload.new
          taskStore.getState().updateTask(updatedTask.id, updatedTask)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "tasks",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const deletedTaskId = payload.old.id
          taskStore.getState().removeTask(deletedTaskId)
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [projectId])

  return store
}
