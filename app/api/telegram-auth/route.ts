import { createHmac, timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
const MAX_INIT_DATA_AGE_SECONDS = 60 * 60

interface TelegramUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
}

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name}`)
  }
  return value
}

function getErrorStatus(error: unknown) {
  if (!(error instanceof Error)) {
    return 500
  }

  if (
    error.message === "Telegram initData hash is missing" ||
    error.message === "Telegram initData auth_date is missing" ||
    error.message === "Telegram initData auth_date is invalid" ||
    error.message === "Telegram initData is expired" ||
    error.message === "Telegram initData signature is invalid" ||
    error.message === "Telegram user payload is missing"
  ) {
    return 401
  }

  if (error.message.startsWith("Missing ")) {
    return 500
  }

  return 500
}

function verifyTelegramInitData(initData: string, botToken: string) {
  const params = new URLSearchParams(initData)
  const hash = params.get("hash")
  const authDate = params.get("auth_date")

  if (!hash) {
    throw new Error("Telegram initData hash is missing")
  }

  if (!authDate) {
    throw new Error("Telegram initData auth_date is missing")
  }

  const authDateTimestamp = Number.parseInt(authDate, 10)
  if (!Number.isFinite(authDateTimestamp)) {
    throw new Error("Telegram initData auth_date is invalid")
  }

  const now = Math.floor(Date.now() / 1000)
  if (now - authDateTimestamp > MAX_INIT_DATA_AGE_SECONDS) {
    throw new Error("Telegram initData is expired")
  }

  params.delete("hash")

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest()
  const calculatedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex")

  const hashBuffer = Buffer.from(hash, "hex")
  const calculatedBuffer = Buffer.from(calculatedHash, "hex")

  if (hashBuffer.length !== calculatedBuffer.length || !timingSafeEqual(hashBuffer, calculatedBuffer)) {
    throw new Error("Telegram initData signature is invalid")
  }

  const rawUser = params.get("user")
  if (!rawUser) {
    throw new Error("Telegram user payload is missing")
  }

  return JSON.parse(rawUser) as TelegramUser
}

function getTelegramEmail(telegramId: number) {
  return `telegram-${telegramId}@totododo.local`
}

function getTelegramPassword(telegramId: number) {
  const secret = process.env.SUPABASE_JWT_SECRET || getEnv("SUPABASE_SERVICE_ROLE_KEY")
  return createHmac("sha256", secret).update(`telegram:${telegramId}`).digest("hex")
}

export async function POST(request: Request) {
  try {
    const { initData } = await request.json()

    if (!initData || typeof initData !== "string") {
      return NextResponse.json({ error: "initData is required" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY")
    const botToken = getEnv("TELEGRAM_BOT_TOKEN")

    if (!supabaseUrl || !anonKey) {
      throw new Error("Missing Supabase URL or anon key")
    }

    const telegramUser = verifyTelegramInitData(initData, botToken)
    const email = getTelegramEmail(telegramUser.id)
    const password = getTelegramPassword(telegramUser.id)

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    let { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError || !signInData.session?.user) {
      const { error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          provider: "telegram",
          telegram_id: telegramUser.id,
          telegram_username: telegramUser.username,
          telegram_first_name: telegramUser.first_name,
          telegram_last_name: telegramUser.last_name,
          telegram_photo_url: telegramUser.photo_url,
        },
      })

      if (createError) {
        if (!createError.message.toLowerCase().includes("already")) {
          throw createError
        }

        const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers()
        if (listError) {
          throw listError
        }

        const existingUser = (usersData.users as Array<{ id: string; email?: string | null }>).find(
          (user) => user.email === email,
        )
        if (!existingUser) {
          throw createError
        }

        const { error: updateUserError } = await adminClient.auth.admin.updateUserById(existingUser.id, {
          password,
          email_confirm: true,
          user_metadata: {
            provider: "telegram",
            telegram_id: telegramUser.id,
            telegram_username: telegramUser.username,
            telegram_first_name: telegramUser.first_name,
            telegram_last_name: telegramUser.last_name,
            telegram_photo_url: telegramUser.photo_url,
          },
        })

        if (updateUserError) {
          throw updateUserError
        }
      }

      const retry = await authClient.auth.signInWithPassword({ email, password })
      signInData = retry.data
      signInError = retry.error
    }

    if (signInError || !signInData.session?.user) {
      throw signInError ?? new Error("Supabase session was not created")
    }

    const now = new Date().toISOString()
    const { error: upsertError } = await adminClient.from("users").upsert({
      id: signInData.session.user.id,
      telegram_id: telegramUser.id,
      telegram_username: telegramUser.username ?? null,
      telegram_first_name: telegramUser.first_name ?? null,
      telegram_last_name: telegramUser.last_name ?? null,
      telegram_photo_url: telegramUser.photo_url ?? null,
      updated_at: now,
    })

    if (upsertError) {
      throw upsertError
    }

    return NextResponse.json({
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
      user: signInData.session.user,
    })
  } catch (error) {
    console.error("Telegram auth route error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Telegram auth failed" },
      { status: getErrorStatus(error) },
    )
  }
}
