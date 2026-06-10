const SUPABASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`
  : "https://iohyczenmqoyrjxdcykz.supabase.co/functions/v1"

type NotificationType = "task_created" | "task_completed" | "deadline_reminder" | "event_reminder"

interface NotifyPayload {
  title: string
  project?: string
  due_date?: string
  hours_left?: number
  start_date?: string
}

export async function sendNotification(
  userId: string,
  type: NotificationType,
  payload: NotifyPayload
) {
  try {
    await fetch(`${SUPABASE_FUNCTIONS_URL}/send-notification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, userId, payload }),
    })
  } catch (err) {
    // Уведомления не критичны — молча логируем
    console.warn("Notification failed:", err)
  }
}
