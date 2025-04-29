// Общий тип для элементов календаря (события и задачи)
interface CalendarItem {
  id: string
  title: string
  date: string // Дата в ISO формате
  type: "event" | "task"
  completed?: boolean // Только для задач
  priority?: "low" | "medium" | "high" // Только для задач
  location?: string
  description?: string
  repeatType: "none" | "daily" | "weekly" | "monthly"
  startTime?: string // Для событий
  endTime?: string // Для событий
  createdAt: string
}

// Тип для архивированных и удаленных элементов
interface StoredItem {
  id: string
  title: string
  type: "event" | "task"
  archivedAt?: string
  deletedAt?: string
  item: CalendarItem
}
