export type TaskStatus = "todo" | "in-progress" | "done" | "blocked"

export interface Tag {
  id: string
  name: string
  color: string
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
  priority: "low" | "medium" | "high"
  tags?: Tag[]
  completed: boolean
  subtasks: Subtask[]
  location?: string
  files?: { name: string; url: string }[]
}

interface Subtask {
  id: string
  title: string
  completed: boolean
}
