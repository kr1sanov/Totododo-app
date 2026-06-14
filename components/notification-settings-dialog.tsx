"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  getNotificationSettings,
  saveNotificationSettings,
  sendTelegramMessage,
  type NotificationSettings,
} from "@/lib/telegram-service"
import { toast } from "@/components/ui/use-toast"
import { isClient } from "@/lib/storage-utils"

interface NotificationSettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationSettingsDialog({ isOpen, onClose }: NotificationSettingsDialogProps) {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    chatId: undefined,
    eventReminders: true,
    taskReminders: true,
    reminderTime: 30,
  })
  const [chatId, setChatId] = useState("")
  const [testSending, setTestSending] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    if (isClient && isOpen) {
      const currentSettings = getNotificationSettings()
      setSettings(currentSettings)
      setChatId(currentSettings.chatId || "")
    }
  }, [isOpen])

  // Если компонент не смонтирован (серверный рендеринг), не показываем ничего
  if (!isMounted) {
    return null
  }

  const handleSave = () => {
    const newSettings = {
      ...settings,
      chatId: chatId.trim() || undefined,
    }

    saveNotificationSettings(newSettings)

    toast({
      title: "Настройки сохранены",
      description: "Настройки уведомлений успешно сохранены",
    })

    onClose()
  }

  const handleTestMessage = async () => {
    if (!chatId.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите ID чата для отправки тестового сообщения",
        variant: "destructive",
      })
      return
    }

    setTestSending(true)

    try {
      const success = await sendTelegramMessage(
        chatId.trim(),
        "<b>🔔 Тестовое уведомление</b>\n\nЭто тестовое уведомление от приложения Totododo. Если вы видите это сообщение, значит настройки уведомлений работают корректно.",
      )

      if (success) {
        toast({
          title: "Тестовое сообщение отправлено",
          description: "Проверьте ваш Telegram",
        })
      } else {
        toast({
          title: "Ошибка отправки",
          description: "Не удалось отправить тестовое сообщение. Проверьте ID чата.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка отправки",
        description: "Произошла ошибка при отправке тестового сообщения",
        variant: "destructive",
      })
    } finally {
      setTestSending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Настройки уведомлений</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications-enabled">Включить уведомления</Label>
            <Switch
              id="notifications-enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
            />
          </div>

          {settings.enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="chat-id">ID чата Telegram</Label>
                <Input
                  id="chat-id"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="Введите ID чата"
                />
                <p className="text-xs text-muted-foreground">
                  Чтобы получить ID чата, напишите боту @userinfobot в Telegram
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestMessage}
                  disabled={testSending || !chatId.trim()}
                  className="mt-2"
                >
                  {testSending ? "Отправка..." : "Отправить тестовое сообщение"}
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder-time">Время напоминания</Label>
                <Select
                  value={settings.reminderTime.toString()}
                  onValueChange={(value) => setSettings({ ...settings, reminderTime: Number.parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите время" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">За 5 минут</SelectItem>
                    <SelectItem value="10">За 10 минут</SelectItem>
                    <SelectItem value="15">За 15 минут</SelectItem>
                    <SelectItem value="30">За 30 минут</SelectItem>
                    <SelectItem value="60">За 1 час</SelectItem>
                    <SelectItem value="120">За 2 часа</SelectItem>
                    <SelectItem value="1440">За 1 день</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="event-reminders">Напоминания о событиях</Label>
                <Switch
                  id="event-reminders"
                  checked={settings.eventReminders}
                  onCheckedChange={(checked) => setSettings({ ...settings, eventReminders: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="task-reminders">Напоминания о задачах</Label>
                <Switch
                  id="task-reminders"
                  checked={settings.taskReminders}
                  onCheckedChange={(checked) => setSettings({ ...settings, taskReminders: checked })}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSave}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
