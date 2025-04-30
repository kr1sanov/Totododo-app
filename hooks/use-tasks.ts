"use client"

import { useEffect, useState } from "react"
import { useTaskStore } from "@/lib/store"

export function useTasks(projectId: string) {
  const { tasks, isLoading, error, fetchTasks, setupTasksSubscription } = useTaskStore()
  const [projectTasks, setProjectTasks] = useState([])

  useEffect(() => {
    // Загружаем задачи при монтировании
    fetchTasks(projectId)

    // Настраиваем подписку на изменения
    const unsubscribe = setupTasksSubscription(projectId)

    // Отписываемся при размонтировании
    return () => {
      unsubscribe()
    }
  }, [projectId, fetchTasks, setupTasksSubscription])

  // Фильтруем задачи по projectId
  useEffect(() => {
    setProjectTasks(tasks.filter((task) => task.project_id === projectId))
  }, [tasks, projectId])

  return {
    tasks: projectTasks,
    loading: isLoading,
    error,
  }
}
