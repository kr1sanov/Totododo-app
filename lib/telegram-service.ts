import { getFromStorage, saveToStorage, isClient } from "./storage-utils"

// Токен Telegram бота
const TELEGRAM_BOT_TOKEN = "7979131458:AAFFnqMl_OgxalyGgH2ll9Smr1juYMzqTKg"

// Интерфейс для настроек уведомлений
export interface NotificationSettings {
  enabled: boolean
  chatId?: string
  eventReminders: boolean
  taskReminders: boolean
  reminderTime: number // в минутах
}

// Получение настроек уведомлений из localStorage
export function getNotificationSettings(): NotificationSettings {
  return getFromStorage("totododo-notification-settings", {
    enabled: false,
    chatId: undefined,
    eventReminders: true,
    taskReminders: true,
    reminderTime: 30, // 30 минут до события
  })
}

// Сохранение настроек уведомлений
export function saveNotificationSettings(settings: NotificationSettings): void {
  saveToStorage("totododo-notification-settings", settings)
}

// Отправка сообщения через Telegram бота
export async function sendTelegramMessage(chatId: string, message: string): Promise<boolean> {
  if (!isClient) return false

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
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
export async function sendEventReminder(event: any): Promise<boolean> {
  if (!isClient) return false

  const settings = getNotificationSettings()

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
export async function sendTaskReminder(task: any, projectName: string): Promise<boolean> {
  if (!isClient) return false

  const settings = getNotificationSettings()

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
export function checkAndSendReminders(): void {
  if (!isClient) return

  const settings = getNotificationSettings()

  if (!settings.enabled || !settings.chatId) {
    return
  }

  const now = new Date()
  const reminderTimeMs = settings.reminderTime * 60 * 1000 // в миллисекундах

  // Проверяем события
  if (settings.eventReminders) {
    const events = getFromStorage("totododo-events", [])

    events.forEach((event: any) => {
      const eventTime = new Date(event.startDate)
      const timeDiff = eventTime.getTime() - now.getTime()

      // Если событие в пределах времени напоминания и еще не отправлено
      if (timeDiff > 0 && timeDiff <= reminderTimeMs) {
        const sentReminders = getFromStorage("totododo-sent-reminders", [])
        const reminderKey = `event-${event.id}`

        if (!sentReminders.includes(reminderKey)) {
          sendEventReminder(event)
          sentReminders.push(reminderKey)
          saveToStorage("totododo-sent-reminders", sentReminders)
        }
      }
    })
  }

  // Проверяем задачи
  if (settings.taskReminders) {
    const projects = getFromStorage("totododo-projects", [])

    projects.forEach((project: any) => {
      project.tasks.forEach((task: any) => {
        if (task.dueDate) {
          const taskTime = new Date(task.dueDate)
          const timeDiff = taskTime.getTime() - now.getTime()

          // Если задача в пределах времени напоминания и еще не отправлена
          if (timeDiff > 0 && timeDiff <= reminderTimeMs) {
            const sentReminders = getFromStorage("totododo-sent-reminders", [])
            const reminderKey = `task-${task.id}`

            if (!sentReminders.includes(reminderKey)) {
              sendTaskReminder(task, project.name)
              sentReminders.push(reminderKey)
              saveToStorage("totododo-sent-reminders", sentReminders)
            }
          }
        }
      })
    })
  }
}
