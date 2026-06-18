import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"
import { checkAndSendReminders } from "@/lib/telegram-service"

export const runtime = "nodejs"

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name}`)
  }

  return value
}

function getSupabaseClient() {
  return createServerClient<Database>(getEnv("NEXT_PUBLIC_SUPABASE_URL"), getEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    cookies: {
      getAll() {
        return []
      },
      setAll() {},
    },
  })
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const expectedAuthHeader = `Bearer ${getEnv("CRON_SECRET")}`

  if (authHeader !== expectedAuthHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getSupabaseClient()
  const { data: users, error } = await supabase
    .from("telegram_users")
    .select("user_id, chat_id, reminder_minutes, reminders_enabled")
    .eq("reminders_enabled", true)

  if (error) {
    throw error
  }

  await Promise.allSettled((users ?? []).map((user) => checkAndSendReminders(user)))

  return NextResponse.json({
    ok: true,
    processed: users?.length ?? 0,
  })
}
