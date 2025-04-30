import { supabase } from "./supabase"
import { useTaskStore, useCalendarStore } from "./store"
import { toast } from "@/components/ui/use-toast"

// Define the CalendarItem type
interface CalendarItem {
  id: string
  type: "event" | "task"
  title: string
  date: string
  startTime?: string
  endTime?: string
  location?: string
  description?: string
  repeatType: "none" | "daily" | "weekly" | "monthly"
  createdAt: string
  isPending?: boolean
  temp_id?: string
}

// Функция для создания задачи с оптимистичным обновлением
export async function createTask(
  projectId: string,
  data: {
    title: string
    description?: string
    completed?: boolean
  },
) {
  // Создаем оптимистичную задачу
  const taskStore = useTaskStore.getState()
  const optimisticTask = taskStore.createOptimisticTask({
    title: data.title,
    description: data.description || "",
    completed: data.completed || false,
    project_id: projectId,
  })

  try {
    // Отправляем запрос на создание задачи
    const { data: newTask, error } = await supabase
      .from("tasks")
      .insert([
        {
          title: data.title,
          description: data.description || "",
          completed: data.completed || false,
          project_id: projectId,
        },
      ])
      .select()
      .single()

    if (error) {
      throw error
    }

    // Обновляем оптимистичную задачу реальными данными
    taskStore.updateTask(optimisticTask.temp_id!, {
      ...newTask,
      isPending: false,
    })

    return newTask
  } catch (error) {
    console.error("Error creating task:", error)
    // Удаляем оптимистичную задачу в случае ошибки
    taskStore.removeTask(optimisticTask.temp_id!)
    toast({
      title: "Ошибка",
      description: "Не удалось создать задачу",
      variant: "destructive",
    })
    throw error
  }
}

// Функция для обновления задачи с оптимистичным обновлением
export async function updateTask(
  taskId: string,
  data: {
    title?: string
    description?: string
    completed?: boolean
  },
) {
  // Оптимистично обновляем задачу
  const taskStore = useTaskStore.getState()
  const originalTask = taskStore.tasks.find((task) => task.id === taskId)

  if (!originalTask) {
    throw new Error("Task not found")
  }

  taskStore.updateTask(taskId, { ...data, isPending: true })

  try {
    // Отправляем запрос на обновление задачи
    const { data: updatedTask, error } = await supabase.from("tasks").update(data).eq("id", taskId).select().single()

    if (error) {
      throw error
    }

    // Обновляем задачу реальными данными
    taskStore.updateTask(taskId, {
      ...updatedTask,
      isPending: false,
    })

    return updatedTask
  } catch (error) {
    console.error("Error updating task:", error)
    // Возвращаем оригинальную задачу в случае ошибки
    taskStore.updateTask(taskId, { ...originalTask, isPending: false })
    toast({
      title: "Ошибка",
      description: "Не удалось обновить задачу",
      variant: "destructive",
    })
    throw error
  }
}

// Функция для удаления задачи с оптимистичным обновлением
export async function deleteTask(taskId: string) {
  // Оптимистично удаляем задачу
  const taskStore = useTaskStore.getState()
  const originalTask = taskStore.tasks.find((task) => task.id === taskId)

  if (!originalTask) {
    throw new Error("Task not found")
  }

  taskStore.removeTask(taskId)

  try {
    // Отправляем запрос на удаление задачи
    const { error } = await supabase.from("tasks").delete().eq("id", taskId)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error("Error deleting task:", error)
    // Возвращаем удаленную задачу в случае ошибки
    taskStore.addTask(originalTask)
    toast({
      title: "Ошибка",
      description: "Не удалось удалить задачу",
      variant: "destructive",
    })
    throw error
  }
}

// Функция для создания календарного события с оптимистичным обновлением
export async function createCalendarItem(data: {
  title: string
  description?: string
  date: string
  type: "event" | "task"
  startTime?: string
  endTime?: string
  location?: string
  repeatType: "none" | "daily" | "weekly" | "monthly"
}) {
  // Создаем оптимистичное событие
  const calendarStore = useCalendarStore.getState()
  const optimisticItem = calendarStore.createOptimisticCalendarItem({
    ...data,
  })

  try {
    // Преобразуем данные для таблицы events
    const startDate = new Date(data.date)
    const endDate = new Date(data.date)

    // Если указано время начала и окончания, устанавливаем его
    if (data.startTime) {
      const [hours, minutes] = data.startTime.split(":").map(Number)
      startDate.setHours(hours, minutes)
    }

    if (data.endTime) {
      const [hours, minutes] = data.endTime.split(":").map(Number)
      endDate.setHours(hours, minutes)
    } else {
      // По умолчанию событие длится 1 час
      endDate.setHours(startDate.getHours() + 1)
    }

    // Отправляем запрос на создание события в таблицу events
    const { data: newEvent, error } = await supabase
      .from("events")
      .insert([
        {
          title: data.title,
          description: data.description,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          location: data.location,
          repeat_type: data.repeatType,
          user_id: "system", // Временное значение, в реальном приложении здесь должен быть ID пользователя
        },
      ])
      .select()
      .single()

    if (error) {
      throw error
    }

    // Преобразуем полученное событие в формат CalendarItem
    const newItem: CalendarItem = {
      id: newEvent.id,
      type: "event",
      title: newEvent.title,
      date: newEvent.start_date,
      startTime: new Date(newEvent.start_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      endTime: new Date(newEvent.end_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      location: newEvent.location || undefined,
      description: newEvent.description || undefined,
      repeatType: newEvent.repeat_type || "none",
      createdAt: newEvent.created_at,
    }

    // Обновляем оптимистичное событие реальными данными
    calendarStore.updateItem(optimisticItem.temp_id!, {
      ...newItem,
      isPending: false,
    })

    return newItem
  } catch (error) {
    console.error("Error creating calendar item:", error)
    // Удаляем оптимистичное событие в случае ошибки
    calendarStore.removeItem(optimisticItem.temp_id!)
    toast({
      title: "Ошибка",
      description: "Не удалось создать событие",
      variant: "destructive",
    })
    throw error
  }
}

// Функция для обновления календарного события с оптимистичным обновлением
export async function updateCalendarItem(
  itemId: string,
  data: {
    title?: string
    description?: string
    date?: string
    startTime?: string
    endTime?: string
    location?: string
    repeatType?: "none" | "daily" | "weekly" | "monthly"
  },
) {
  // Оптимистично обновляем событие
  const calendarStore = useCalendarStore.getState()
  const originalItem = calendarStore.items.find((item) => item.id === itemId)

  if (!originalItem) {
    throw new Error("Calendar item not found")
  }

  calendarStore.updateItem(itemId, { ...data, isPending: true })

  try {
    // Подготавливаем данные для обновления в таблице events
    const updateData: any = {}

    if (data.title) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.location !== undefined) updateData.location = data.location
    if (data.repeatType) updateData.repeat_type = data.repeatType

    // Обновляем даты начала и окончания, если они изменились
    if (data.date || data.startTime || data.endTime) {
      const currentDate = data.date ? new Date(data.date) : new Date(originalItem.date)

      // Обновляем время начала
      if (data.startTime) {
        const [hours, minutes] = data.startTime.split(":").map(Number)
        currentDate.setHours(hours, minutes)
        updateData.start_date = currentDate.toISOString()
      }

      // Обновляем время окончания
      const endDate = new Date(currentDate)
      if (data.endTime) {
        const [hours, minutes] = data.endTime.split(":").map(Number)
        endDate.setHours(hours, minutes)
      } else if (data.startTime && !data.endTime) {
        // Если изменилось только время начала, устанавливаем время окончания на 1 час позже
        endDate.setHours(endDate.getHours() + 1)
      }

      if (data.endTime || (data.startTime && !data.endTime)) {
        updateData.end_date = endDate.toISOString()
      }
    }

    // Отправляем запрос на обновление события
    const { data: updatedEvent, error } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", itemId)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Преобразуем обновленное событие в формат CalendarItem
    const updatedItem: CalendarItem = {
      id: updatedEvent.id,
      type: "event",
      title: updatedEvent.title,
      date: updatedEvent.start_date,
      startTime: new Date(updatedEvent.start_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      endTime: new Date(updatedEvent.end_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      location: updatedEvent.location || undefined,
      description: updatedEvent.description || undefined,
      repeatType: updatedEvent.repeat_type || "none",
      createdAt: updatedEvent.created_at,
    }

    // Обновляем событие реальными данными
    calendarStore.updateItem(itemId, {
      ...updatedItem,
      isPending: false,
    })

    return updatedItem
  } catch (error) {
    console.error("Error updating calendar item:", error)
    // Возвращаем оригинальное событие в случае ошибки
    calendarStore.updateItem(itemId, { ...originalItem, isPending: false })
    toast({
      title: "Ошибка",
      description: "Не удалось обновить событие",
      variant: "destructive",
    })
    throw error
  }
}

// Функция для удаления календарного события с оптимистичным обновлением
export async function deleteCalendarItem(itemId: string) {
  // Оптимистично удаляем событие
  const calendarStore = useCalendarStore.getState()
  const originalItem = calendarStore.items.find((item) => item.id === itemId)

  if (!originalItem) {
    throw new Error("Calendar item not found")
  }

  calendarStore.removeItem(itemId)

  try {
    // Отправляем запрос на удаление события
    // Вместо физического удаления, устанавливаем флаг is_deleted в true
    const { error } = await supabase.from("events").update({ is_deleted: true }).eq("id", itemId)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error("Error deleting calendar item:", error)
    // Возвращаем удаленное событие в случае ошибки
    calendarStore.addItem(originalItem)
    toast({
      title: "Ошибка",
      description: "Не удалось удалить событие",
      variant: "destructive",
    })
    throw error
  }
}
