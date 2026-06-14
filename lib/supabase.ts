import { createClient } from "@supabase/supabase-js"
import "./runtime-storage"
import type { SupportedStorage } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"

const memoryStorage = new Map<string, string>()

const safeAuthStorage: SupportedStorage = {
  getItem: (key: string) => {
    try {
      const storage = typeof window !== "undefined" ? window.localStorage : null
      if (storage && typeof storage.getItem === "function") {
        return storage.getItem(key)
      }
    } catch {
      // ignore
    }

    return memoryStorage.get(key) ?? null
  },
  setItem: (key: string, value: string) => {
    try {
      const storage = typeof window !== "undefined" ? window.localStorage : null
      if (storage && typeof storage.setItem === "function") {
        storage.setItem(key, value)
        return
      }
    } catch {
      // ignore
    }

    memoryStorage.set(key, value)
  },
  removeItem: (key: string) => {
    try {
      const storage = typeof window !== "undefined" ? window.localStorage : null
      if (storage && typeof storage.removeItem === "function") {
        storage.removeItem(key)
        return
      }
    } catch {
      // ignore
    }

    memoryStorage.delete(key)
  },
}

export function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: safeAuthStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

export const supabase = getSupabaseClient()
