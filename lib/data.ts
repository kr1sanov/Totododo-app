import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

/**
 * Создает новую задачу в проекте
 * @param projectId ID проекта
 * @param taskData Данные задачи
 * @returns Созданная задача
 */
export async function createTask(projectId: string, taskData: any) {
  const taskId = uuidv4()
  const userId = (await supabase.auth.getUser()).data.user?.id

  if (!userId) {
    throw new Error("Пользователь не авторизован")
  }

  const task = {
    id: taskId,
    project_id: projectId,
    user_id: userId,
    title: taskData.title,
    description: taskData.description || "",
    status: taskData.status || "todo",
    priority: taskData.priority || "medium",
    due_date: taskData.dueDate || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed: false,
    is_deleted: false,
  }

  const { data, error } = await supabase.from("tasks").insert(task).select().single()

  if (error) {
    console.error("Ошибка при создании задачи:", error)
    throw error
  }

  return data
}

/**
 * Обновляет существующую задачу
 * @param taskId ID задачи
 * @param taskData Данные для обновления
 * @returns Обновленная задача
 */
export async function updateTask(taskId: string, taskData: any) {
  const { data, error } = await supabase
    .from("tasks")
    .update({
      ...taskData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .select()
    .single()

  if (error) {
    console.error("Ошибка при обновлении задачи:", error)
    throw error
  }

  return data
}

/**
 * Удаляет задачу (мягкое удаление)
 * @param taskId ID задачи
 * @returns Результат операции
 */
export async function deleteTask(taskId: string) {
  const { data, error } = await supabase
    .from("tasks")
    .update({
      is_deleted: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)

  if (error) {
    console.error("Ошибка при удалении задачи:", error)
    throw error
  }

  return { success: true }
}
