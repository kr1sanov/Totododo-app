declare module "@/types" {
  export type TaskStatus = "todo" | "in-progress" | "done" | "blocked"
  export type TaskPriority = "low" | "medium" | "high"
  export type EventRepeatType = "none" | "daily" | "weekly" | "monthly"

  export interface Tag {
    id: string
    name: string
    color: string
  }

  export interface Subtask {
    id: string
    title: string
    completed: boolean
    description?: string
    dueDate?: string
    link?: string
    createdAt?: string
  }

  export interface Task {
    id: string
    title: string
    description?: string
    status: TaskStatus
    projectId: string
    createdAt: string
    updatedAt: string
    dueDate?: string
    priority: TaskPriority
    tags?: Tag[]
    completed: boolean
    subtasks: Subtask[]
    location?: string
    files?: { name: string; url: string }[]
    isArchived?: boolean
    isDeleted?: boolean
  }

  export interface Project {
    id: string
    name: string
    description?: string
    tasks: Task[]
    createdAt: string
    updatedAt?: string
    userId?: string
    isArchived?: boolean
    isDeleted?: boolean
  }

  export interface CalendarItem {
    id: string
    title: string
    date: string
    startTime?: string
    endTime?: string
    description?: string
    location?: string
    url?: string
    color?: string
    isAllDay?: boolean
    isRecurring?: boolean
    recurrencePattern?: "daily" | "weekly" | "monthly" | "yearly"
    recurrenceEndDate?: string
    isArchived?: boolean
    isDeleted?: boolean
    createdAt: string
    updatedAt: string
  }

  export interface Event {
    id: string
    title: string
    startDate: string
    endDate: string
    location?: string
    description?: string
    repeatType: EventRepeatType
    createdAt?: string
    updatedAt?: string
    isArchived?: boolean
    isDeleted?: boolean
  }

  export interface User {
    id: string
    email?: string
    name?: string
    telegramId?: string
    telegramUsername?: string
    syncCode?: string
    notificationSettings?: {
      email: boolean
      push: boolean
      telegram: boolean
      reminderTime: number
    }
  }

  export interface ArchivedItem {
    id: string
    type: "task" | "project" | "calendar" | "event"
    title: string
    description?: string
    archivedAt: string
    originalData: Task | Project | CalendarItem | Event
  }

  export interface DeletedItem {
    id: string
    type: "task" | "project" | "calendar" | "event"
    title: string
    description?: string
    deletedAt: string
    originalData: Task | Project | CalendarItem | Event
  }
}
