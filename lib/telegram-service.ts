import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"
import { supabase } from "./supabase"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? ""

// Интерфейс для настроек уведомлений
export interface NotificationSettings {
  enabled: boolean
  chatId?: string
  eventReminders: boolean
  taskReminders: boolean
  reminderTime: number // в минутах
}

function getDefaultNotificationSettings(): NotificationSettings {
  return {
    enabled: false,
    chatId: undefined,
    eventReminders: true,
    taskReminders: true,
    reminderTime: 30, // 30 минут до события
  }
}

function getTelegramBotToken() {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set")
  }

  return TELEGRAM_BOT_TOKEN
}

function getServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set")
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set")
  }

  return createServerClient<Database>(supabaseUrl, serviceRoleKey, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {},
    },
  })
}

async function getTelegramProfile(userId: string) {
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError) {
    throw authError
  }

  if (authData.user?.id !== userId) {
    throw new Error("AUTH_REQUIRED")
  }

  const metadataTelegramId = authData.user.user_metadata?.telegram_id
  if (metadataTelegramId) {
    return {
      telegram_id: String(metadataTelegramId),
      username:
        typeof authData.user.user_metadata?.telegram_username === "string"
          ? authData.user.user_metadata.telegram_username
          : null,
      first_name:
        typeof authData.user.user_metadata?.telegram_first_name === "string"
          ? authData.user.user_metadata.telegram_first_name
          : null,
      last_name:
        typeof authData.user.user_metadata?.telegram_last_name === "string"
          ? authData.user.user_metadata.telegram_last_name
          : null,
      photo_url:
        typeof authData.user.user_metadata?.telegram_photo_url === "string"
          ? authData.user.user_metadata.telegram_photo_url
          : null,
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("telegram_id, telegram_username, telegram_first_name, telegram_last_name, telegram_photo_url")
    .eq("id", userId)
    .single()

  if (profileError) {
    throw profileError
  }

  return {
    telegram_id: String(profile.telegram_id),
    username: profile.telegram_username ?? null,
    first_name: profile.telegram_first_name ?? null,
    last_name: profile.telegram_last_name ?? null,
    photo_url: profile.telegram_photo_url ?? null,
  }
}

// Получение настроек уведомлений из Supabase
export async function getNotificationSettings(userId: string): Promise<NotificationSettings> {
  const { data, error } = await supabase
    .from("telegram_users")
    .select("reminders_enabled, reminder_minutes, chat_id")
    .eq("user_id", userId)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return getDefaultNotificationSettings()
    }

    throw error
  }

  return {
    enabled: data.reminders_enabled,
    chatId: data.chat_id ?? undefined,
    eventReminders: true,
    taskReminders: true,
    reminderTime: data.reminder_minutes,
  }
}

// Сохранение настроек уведомлений в Supabase
export async function saveNotificationSettings(settings: NotificationSettings, userId: string): Promise<void> {
  const profile = await getTelegramProfile(userId)
  const { data: existingRow } = await supabase.from("telegram_users").select("id").eq("user_id", userId).single()

  const payload = {
    ...(existingRow?.id ? { id: existingRow.id } : {}),
    user_id: userId,
    telegram_id: profile.telegram_id,
    username: profile.username,
    first_name: profile.first_name,
    last_name: profile.last_name,
    photo_url: profile.photo_url,
    chat_id: settings.chatId ?? null,
    reminders_enabled: settings.enabled,
    reminder_minutes: settings.reminderTime,
  }

  const { error } = await supabase.from("telegram_users").upsert(payload)

  if (error) {
    throw error
  }
}

// Отправка сообщения через Telegram бота
export async function sendTelegramMessage(chatId: string, message: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${getTelegramBotToken()}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    })

    const data = await response.json()
    return data.ok
  } catch (error) {
    console.error("Ошибка при отправке сообщения в Telegram:", error)
    return false
  }
}

// Отправка уведомления о событии
export async function sendEventReminder(event: any, settings: NotificationSettings): Promise<boolean> {

  if (!settings.enabled || !settings.chatId || !settings.eventReminders) {
    return false
  }

  const startDate = new Date(event.startDate)
  const formattedDate = startDate.toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  })

  const message = `
<b>🔔 Напоминание о событии</b>

<b>${event.title}</b>
📅 ${formattedDate}
${event.location ? `📍 ${event.location}` : ""}
${event.description ? `\n${event.description}` : ""}
  `.trim()

  return await sendTelegramMessage(settings.chatId, message)
}

// Отправка уведомления о задаче
export async function sendTaskReminder(task: any, projectName: string, settings: NotificationSettings): Promise<boolean> {

  if (!settings.enabled || !settings.chatId || !settings.taskReminders) {
    return false
  }

  const dueDate = task.dueDate ? new Date(task.dueDate) : null
  const formattedDate = dueDate
    ? dueDate.toLocaleString("ru-RU", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Не указан"

  const priorityEmoji = {
    low: "🟢",
    medium: "🟡",
    high: "🔴",
  }

  const message = `
<b>🔔 Напоминание о задаче</b>

<b>${task.title}</b>
📋 Проект: ${projectName}
${priorityEmoji[task.priority]} Приоритет: ${task.priority === "low" ? "Низкий" : task.priority === "medium" ? "Средний" : "Высокий"}
⏰ Срок: ${formattedDate}
${task.location ? `📍 ${task.location}` : ""}
${task.description ? `\n${task.description}` : ""}
  `.trim()

  return await sendTelegramMessage(settings.chatId, message)
}

// Проверка и отправка уведомлений
export async function checkAndSendReminders(user: {
  user_id: string
  chat_id: string | null
  reminder_minutes: number
  reminders_enabled: boolean
}): Promise<void> {
  const settings: NotificationSettings = {
    enabled: user.reminders_enabled,
    chatId: user.chat_id ?? undefined,
    eventReminders: true,
    taskReminders: true,
    reminderTime: user.reminder_minutes,
  }

  if (!settings.enabled || !settings.chatId) {
    return
  }

  const serverSupabase = getServerSupabaseClient()
  const now = new Date()
  const reminderTimeMs = settings.reminderTime * 60 * 1000 // в миллисекундах

  // Проверяем события
  if (settings.eventReminders) {
    const { data: events, error: eventsError } = await serverSupabase
      .from("events")
      .select("id, title, start_date, description")
      .eq("user_id", user.user_id)
      .eq("is_deleted", false)

    if (eventsError) {
      throw eventsError
    }

    for (const event of events ?? []) {
      const eventTime = new Date(event.start_date)
      const timeDiff = eventTime.getTime() - now.getTime()

      // Если событие в пределах времени напоминания и еще не отправлено
      if (timeDiff > 0 && timeDiff <= reminderTimeMs) {
        const reminderKey = `event-${event.id}`
        const { data: sentReminder } = await serverSupabase
          .from("sent_reminders")
          .select("id")
          .eq("item_type", reminderKey)
          .eq("item_id", event.id)
          .maybeSingle()

        if (!sentReminder) {
          const sent = await sendEventReminder(
              {
                id: event.id,
                title: event.title,
                startDate: event.start_date,
                description: event.description,
              },
            settings,
          )

          if (sent) {
            const { error: reminderError } = await serverSupabase.from("sent_reminders").insert({
              item_id: event.id,
              item_type: reminderKey,
            })

            if (reminderError) {
              throw reminderError
            }
          }
        }
      }
    }
  }

  // Проверяем задачи
  if (settings.taskReminders) {
    const [{ data: tasks, error: tasksError }, { data: projects, error: projectsError }] = await Promise.all([
      serverSupabase
        .from("tasks")
        .select("id, title, due_date, location, description, priority, project_id")
        .eq("user_id", user.user_id)
        .eq("is_deleted", false)
        .eq("is_archived", false),
      serverSupabase.from("projects").select("id, title").eq("user_id", user.user_id).eq("status", "active"),
    ])

    if (tasksError) {
      throw tasksError
    }

    if (projectsError) {
      throw projectsError
    }

    const projectTitleById = new Map((projects ?? []).map((project) => [project.id, project.title]))

    for (const task of tasks ?? []) {
      if (task.due_date) {
        const taskTime = new Date(task.due_date)
        const timeDiff = taskTime.getTime() - now.getTime()

        // Если задача в пределах времени напоминания и еще не отправлена
        if (timeDiff > 0 && timeDiff <= reminderTimeMs) {
          const reminderKey = `task-${task.id}`
          const { data: sentReminder } = await serverSupabase
            .from("sent_reminders")
            .select("id")
            .eq("item_type", reminderKey)
            .eq("item_id", task.id)
            .maybeSingle()

          if (!sentReminder) {
            const sent = await sendTaskReminder(
              {
                id: task.id,
                title: task.title,
                dueDate: task.due_date,
                location: task.location,
                description: task.description,
                priority: task.priority,
              },
              projectTitleById.get(task.project_id ?? "") ?? "Без проекта",
              settings,
            )

            if (sent) {
              const { error: reminderError } = await serverSupabase.from("sent_reminders").insert({
                item_id: task.id,
                item_type: reminderKey,
              })

              if (reminderError) {
                throw reminderError
              }
            }
          }
        }
      }
    }
  }
}
