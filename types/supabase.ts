export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          telegram_id: number | null
          telegram_username: string | null
          telegram_first_name: string | null
          telegram_last_name: string | null
          telegram_photo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          telegram_id?: number | null
          telegram_username?: string | null
          telegram_first_name?: string | null
          telegram_last_name?: string | null
          telegram_photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          telegram_id?: number | null
          telegram_username?: string | null
          telegram_first_name?: string | null
          telegram_last_name?: string | null
          telegram_photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
          is_archived: boolean
          is_deleted: boolean
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
          updated_at?: string
          is_archived?: boolean
          is_deleted?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
          updated_at?: string
          is_archived?: boolean
          is_deleted?: boolean
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          due_date: string | null
          priority: "low" | "medium" | "high"
          completed: boolean
          location: string | null
          created_at: string
          updated_at: string
          is_archived: boolean
          is_deleted: boolean
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          due_date?: string | null
          priority?: "low" | "medium" | "high"
          completed?: boolean
          location?: string | null
          created_at?: string
          updated_at?: string
          is_archived?: boolean
          is_deleted?: boolean
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          priority?: "low" | "medium" | "high"
          completed?: boolean
          location?: string | null
          created_at?: string
          updated_at?: string
          is_archived?: boolean
          is_deleted?: boolean
        }
      }
      subtasks: {
        Row: {
          id: string
          task_id: string
          title: string
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          title: string
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          title?: string
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          user_id: string
          title: string
          start_date: string
          end_date: string
          location: string | null
          description: string | null
          repeat_type: "none" | "daily" | "weekly" | "monthly"
          created_at: string
          updated_at: string
          is_archived: boolean
          is_deleted: boolean
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          start_date: string
          end_date: string
          location?: string | null
          description?: string | null
          repeat_type?: "none" | "daily" | "weekly" | "monthly"
          created_at?: string
          updated_at?: string
          is_archived?: boolean
          is_deleted?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          start_date?: string
          end_date?: string
          location?: string | null
          description?: string | null
          repeat_type?: "none" | "daily" | "weekly" | "monthly"
          created_at?: string
          updated_at?: string
          is_archived?: boolean
          is_deleted?: boolean
        }
      }
    }
  }
}
