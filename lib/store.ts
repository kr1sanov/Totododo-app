import { create } from "zustand"
import { supabase } from "./supabase"

// Типы для задач и проектов
export interface Task {
  id: string
  temp_id?: string
  title: string
  description?: string
  dueDate?: string
  priority: "low" | "medium" | "high"
  completed: boolean
  location?: string
  subtasks: any[]
  createdAt: string
  tags?: string[]
  project_id: string
  isPending?: boolean
}

export interface Project {
  id: string
  name: string
  createdAt: string
}

// Типы для календарных элементов
export interface CalendarItem {
  id: string
  temp_id?: string
  type: "event" | "task"
  title: string
  date: string
  startTime?: string
  endTime?: string
  location?: string
  description?: string
  completed?: boolean
  priority?: "low" | "medium" | "high"
  repeatType: "none" | "daily" | "weekly" | "monthly"
  createdAt: string
  isPending?: boolean
}

// Интерфейс для хранилища задач
interface TaskState {
  tasks: Task[]
  isLoading: boolean
  error: string | null

  // Действия
  fetchTasks: (projectId: string) => Promise<void>
  addTask: (task: Task) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  removeTask: (taskId: string) => void
  createOptimisticTask: (task: Partial<Task>) => Task
  setupTasksSubscription: (projectId: string) => () => void
}

// Интерфейс для хранилища календарных элементов
interface CalendarState {
  items: CalendarItem[]
  isLoading: boolean
  error: string | null

  // Действия
  fetchItems: () => Promise<void>
  addItem: (item: CalendarItem) => void
  updateItem: (itemId: string, updates: Partial<CalendarItem>) => void
  removeItem: (itemId: string) => void
  createOptimisticCalendarItem: (item: Partial<CalendarItem>) => CalendarItem
  setupItemsSubscription: () => () => void
}

// Создаем хранилище задач
export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  fetchTasks: async (projectId: string) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })

      if (error) throw error

      set({ tasks: data || [], isLoading: false })
    } catch (error) {
      console.error("Error fetching tasks:", error)
      set({ error: "Failed to fetch tasks", isLoading: false })
    }
  },

  addTask: (task: Task) => {
    set((state) => ({
      tasks: [...state.tasks, task],
    }))
  },

  updateTask: (taskId: string, updates: Partial<Task>) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId || task.temp_id === taskId ? { ...task, ...updates } : task,
      ),
    }))
  },

  removeTask: (taskId: string) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId && task.temp_id !== taskId),
    }))
  },

  createOptimisticTask: (taskData: Partial<Task>) => {
    const optimisticTask: Task = {
      id: "",
      temp_id: `temp_${Date.now()}`,
      title: taskData.title || "",
      description: taskData.description || "",
      priority: taskData.priority || "medium",
      completed: taskData.completed || false,
      subtasks: [],
      createdAt: new Date().toISOString(),
      project_id: taskData.project_id || "",
      isPending: true,
    }

    get().addTask(optimisticTask)
    return optimisticTask
  },

  setupTasksSubscription: (projectId: string) => {
    // Подписываемся на изменения в таблице tasks
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
          // Добавляем новую задачу, если её ещё нет в хранилище
          const newTask = payload.new as Task
          const existingTask = get().tasks.find((t) => t.id === newTask.id)
          if (!existingTask) {
            get().addTask(newTask)
          }
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
          // Обновляем задачу
          const updatedTask = payload.new as Task
          get().updateTask(updatedTask.id, updatedTask)
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
          // Удаляем задачу
          const deletedTask = payload.old as Task
          get().removeTask(deletedTask.id)
        },
      )
      .subscribe()

    // Возвращаем функцию для отписки
    return () => {
      supabase.removeChannel(subscription)
    }
  },
}))

// Создаем хранилище календарных элементов
export const useCalendarStore = create<CalendarState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async () => {
    set({ isLoading: true, error: null })
    try {
      // Используем таблицу events вместо calendar_items
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Преобразуем данные из формата таблицы events в формат CalendarItem
      const formattedItems = data.map((event) => ({
        id: event.id,
        type: "event",
        title: event.title,
        date: event.start_date,
        startTime: new Date(event.start_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        endTime: new Date(event.end_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        location: event.location || undefined,
        description: event.description || undefined,
        repeatType: event.repeat_type || "none",
        createdAt: event.created_at,
      })) as CalendarItem[]

      set({ items: formattedItems || [], isLoading: false })
    } catch (error) {
      console.error("Error fetching calendar items:", error)
      set({ error: "Failed to fetch calendar items", isLoading: false })
    }
  },

  addItem: (item: CalendarItem) => {
    set((state) => ({
      items: [...state.items, item],
    }))
  },

  updateItem: (itemId: string, updates: Partial<CalendarItem>) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId || item.temp_id === itemId ? { ...item, ...updates } : item,
      ),
    }))
  },

  removeItem: (itemId: string) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemId && item.temp_id !== itemId),
    }))
  },

  createOptimisticCalendarItem: (itemData: Partial<CalendarItem>) => {
    const optimisticItem: CalendarItem = {
      id: "",
      temp_id: `temp_${Date.now()}`,
      type: itemData.type || "event",
      title: itemData.title || "",
      date: itemData.date || new Date().toISOString(),
      description: itemData.description || "",
      location: itemData.location || "",
      repeatType: itemData.repeatType || "none",
      createdAt: new Date().toISOString(),
      isPending: true,
    }

    get().addItem(optimisticItem)
    return optimisticItem
  },

  setupItemsSubscription: () => {
    // Подписываемся на изменения в таблице events вместо calendar_items
    const subscription = supabase
      .channel("events-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "events",
        },
        (payload) => {
          // Преобразуем новое событие в формат CalendarItem
          const newEvent = payload.new
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

          // Добавляем новый элемент, если его ещё нет в хранилище
          const existingItem = get().items.find((i) => i.id === newItem.id)
          if (!existingItem) {
            get().addItem(newItem)
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "events",
        },
        (payload) => {
          // Преобразуем обновленное событие в формат CalendarItem
          const updatedEvent = payload.new
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

          get().updateItem(updatedItem.id, updatedItem)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "events",
        },
        (payload) => {
          // Удаляем элемент
          const deletedEvent = payload.old
          get().removeItem(deletedEvent.id)
        },
      )
      .subscribe()

    // Возвращаем функцию для отписки
    return () => {
      supabase.removeChannel(subscription)
    }
  },
}))

// Для обратной совместимости
export const taskStore = useTaskStore
export const calendarItemStore = useCalendarStore
