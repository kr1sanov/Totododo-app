import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Создаем клиент для использования на стороне сервера
export const createServerSupabaseClient = () => {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// Создаем клиент для использования на стороне клиента
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Синглтон для клиентского клиента Supabase
let clientInstance: ReturnType<typeof createClientSupabaseClient> | null = null

function createClientSupabaseClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Экспортируем функцию для получения клиентского клиента
export function getSupabaseClient() {
  if (typeof window === "undefined") {
    // Для серверного рендеринга создаем новый экземпляр
    return createClientSupabaseClient()
  }

  if (!clientInstance) {
    clientInstance = createClientSupabaseClient()
  }
  return clientInstance
}

// Экспортируем прямой клиент для удобства использования
export const supabase = getSupabaseClient()
