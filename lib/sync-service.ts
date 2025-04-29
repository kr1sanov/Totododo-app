import { getFromStorage, saveToStorage, isClient } from "./storage-utils"
import { getSupabaseClient } from "./supabase-client"

export async function syncProjects(userId: string) {
  if (!isClient) return { success: false, error: "Not in browser environment" }

  const supabase = getSupabaseClient()
  const localProjects = getFromStorage("totododo-projects", [])

  // Получаем проекты из Supabase
  const { data: remoteProjects, error } = await supabase
    .from("projects")
    .select("*, tasks(*, subtasks(*))")
    .eq("user_id", userId)
    .eq("is_deleted", false)

  if (error) {
    console.error("Ошибка при получении проектов:", error)
    return { success: false, error }
  }

  // Преобразуем удаленные проекты в локальный формат
  const formattedRemoteProjects = remoteProjects.map((project: any) => {
    return {
      id: project.id,
      name: project.name,
      createdAt: project.created_at,
      tasks: project.tasks
        .filter((task: any) => !task.is_deleted)
        .map((task: any) => {
          return {
            id: task.id,
            title: task.title,
            description: task.description || "",
            dueDate: task.due_date,
            priority: task.priority,
            completed: task.completed,
            location: task.location || "",
            createdAt: task.created_at,
            subtasks: task.subtasks.map((subtask: any) => {
              return {
                id: subtask.id,
                title: subtask.title,
                completed: subtask.completed,
                createdAt: subtask.created_at,
              }
            }),
          }
        }),
    }
  })

  // Сохраняем объединенные проекты в localStorage
  saveToStorage("totododo-projects", formattedRemoteProjects)

  // Загружаем локальные проекты в Supabase
  for (const project of localProjects) {
    // Проверяем, существует ли проект в Supabase
    const { data: existingProject } = await supabase.from("projects").select("id").eq("id", project.id).single()

    if (!existingProject) {
      // Создаем новый проект
      const { data: newProject, error: projectError } = await supabase
        .from("projects")
        .insert({
          id: project.id,
          user_id: userId,
          name: project.name,
          created_at: project.createdAt,
        })
        .select("id")
        .single()

      if (projectError) {
        console.error("Ошибка при создании проекта:", projectError)
        continue
      }

      // Добавляем задачи проекта
      for (const task of project.tasks) {
        const { data: newTask, error: taskError } = await supabase
          .from("tasks")
          .insert({
            id: task.id,
            project_id: project.id,
            title: task.title,
            description: task.description,
            due_date: task.dueDate,
            priority: task.priority,
            completed: task.completed,
            location: task.location,
            created_at: task.createdAt,
          })
          .select("id")
          .single()

        if (taskError) {
          console.error("Ошибка при создании задачи:", taskError)
          continue
        }

        // Добавляем подзадачи
        for (const subtask of task.subtasks) {
          const { error: subtaskError } = await supabase.from("subtasks").insert({
            id: subtask.id,
            task_id: task.id,
            title: subtask.title,
            completed: subtask.completed,
            created_at: subtask.createdAt,
          })

          if (subtaskError) {
            console.error("Ошибка при создании подзадачи:", subtaskError)
          }
        }
      }
    }
  }

  return { success: true }
}

export async function syncEvents(userId: string) {
  if (!isClient) return { success: false, error: "Not in browser environment" }

  const supabase = getSupabaseClient()
  const localEvents = getFromStorage("totododo-events", [])

  // Получаем события из Supabase
  const { data: remoteEvents, error } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", userId)
    .eq("is_deleted", false)

  if (error) {
    console.error("Ошибка при получении событий:", error)
    return { success: false, error }
  }

  // Преобразуем удаленные события в локальный формат
  const formattedRemoteEvents = remoteEvents.map((event: any) => {
    return {
      id: event.id,
      title: event.title,
      startDate: event.start_date,
      endDate: event.end_date,
      location: event.location || "",
      description: event.description || "",
      repeatType: event.repeat_type,
    }
  })

  // Сохраняем объединенные события в localStorage
  saveToStorage("totododo-events", formattedRemoteEvents)

  // Загружаем локальные события в Supabase
  for (const event of localEvents) {
    // Проверяем, существует ли событие в Supabase
    const { data: existingEvent } = await supabase.from("events").select("id").eq("id", event.id).single()

    if (!existingEvent) {
      // Создаем новое событие
      const { error: eventError } = await supabase.from("events").insert({
        id: event.id,
        user_id: userId,
        title: event.title,
        start_date: event.startDate,
        end_date: event.endDate,
        location: event.location,
        description: event.description,
        repeat_type: event.repeatType,
      })

      if (eventError) {
        console.error("Ошибка при создании события:", eventError)
      }
    }
  }

  return { success: true }
}

export function exportData() {
  if (!isClient) return { success: false, error: "Not in browser environment" }

  // Получаем все данные из localStorage
  const calendarItems = getFromStorage("totododo-calendar-items", [])
  const archive = getFromStorage("totododo-archive", [])
  const trash = getFromStorage("totododo-trash", [])

  const data = {
    calendarItems,
    archive,
    trash,
    exportDate: new Date().toISOString(),
  }

  const dataStr = JSON.stringify(data, null, 2)
  const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

  const exportFileDefaultName = `totododo-export-${new Date().toISOString().slice(0, 10)}.json`

  const linkElement = document.createElement("a")
  linkElement.setAttribute("href", dataUri)
  linkElement.setAttribute("download", exportFileDefaultName)
  linkElement.click()

  return { success: true }
}

export function importData(jsonData: string) {
  if (!isClient) return { success: false, error: "Not in browser environment" }

  try {
    const data = JSON.parse(jsonData)

    if (data.calendarItems) {
      saveToStorage("totododo-calendar-items", data.calendarItems)
    }

    if (data.archive) {
      saveToStorage("totododo-archive", data.archive)
    }

    if (data.trash) {
      saveToStorage("totododo-trash", data.trash)
    }

    return { success: true }
  } catch (error) {
    console.error("Ошибка при импорте данных:", error)
    return { success: false, error }
  }
}
