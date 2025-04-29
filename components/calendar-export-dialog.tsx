"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useEvents } from "@/hooks/use-events"
import { useProjects } from "@/hooks/use-projects"
import { toast } from "@/components/ui/use-toast"
import { isClient } from "@/lib/storage-utils"

interface CalendarExportDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function CalendarExportDialog({ isOpen, onClose }: CalendarExportDialogProps) {
  const [includeEvents, setIncludeEvents] = useState(true)
  const [includeTasks, setIncludeTasks] = useState(true)
  const [includeCompletedTasks, setIncludeCompletedTasks] = useState(false)
  const { events } = useEvents()
  const { projects } = useProjects()

  const handleExport = () => {
    if (!isClient) return

    try {
      // Создаем содержимое файла iCalendar
      const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Totododo//Calendar//RU",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
      ]

      // Добавляем события
      if (includeEvents) {
        events.forEach((event) => {
          const startDate = new Date(event.startDate)
          const endDate = new Date(event.endDate)

          // Форматируем даты в формат iCalendar
          const formatDate = (date: Date) => {
            return date
              .toISOString()
              .replace(/[-:]/g, "")
              .replace(/\.\d{3}/, "")
          }

          icsContent.push(
            "BEGIN:VEVENT",
            `UID:event-${event.id}@totododo.app`,
            `DTSTAMP:${formatDate(new Date())}`,
            `DTSTART:${formatDate(startDate)}`,
            `DTEND:${formatDate(endDate)}`,
            `SUMMARY:${event.title}`,
          )

          if (event.description) {
            icsContent.push(`DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`)
          }

          if (event.location) {
            icsContent.push(`LOCATION:${event.location}`)
          }

          icsContent.push("END:VEVENT")
        })
      }

      // Добавляем задачи с дедлайнами
      if (includeTasks) {
        projects.forEach((project) => {
          project.tasks.forEach((task) => {
            // Пропускаем задачи без дедлайна
            if (!task.dueDate) return

            // Пропускаем выполненные задачи, если не выбрана соответствующая опция
            if (task.completed && !includeCompletedTasks) return

            const dueDate = new Date(task.dueDate)

            // Форматируем дату в формат iCalendar
            const formatDate = (date: Date) => {
              return date
                .toISOString()
                .replace(/[-:]/g, "")
                .replace(/\.\d{3}/, "")
            }

            // Создаем событие для задачи
            icsContent.push(
              "BEGIN:VEVENT",
              `UID:task-${task.id}@totododo.app`,
              `DTSTAMP:${formatDate(new Date())}`,
              `DTSTART:${formatDate(dueDate)}`,
              `DTEND:${formatDate(new Date(dueDate.getTime() + 30 * 60000))}`, // Добавляем 30 минут к дедлайну
              `SUMMARY:${task.completed ? "[Выполнено] " : ""}${task.title} (${project.name})`,
            )

            if (task.description) {
              icsContent.push(`DESCRIPTION:${task.description.replace(/\n/g, "\\n")}`)
            }

            if (task.location) {
              icsContent.push(`LOCATION:${task.location}`)
            }

            icsContent.push("END:VEVENT")
          })
        })
      }

      // Завершаем файл
      icsContent.push("END:VCALENDAR")

      // Создаем и скачиваем файл
      const blob = new Blob([icsContent.join("\r\n")], { type: "text/calendar" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "totododo-calendar.ics"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Календарь экспортирован",
        description: "Файл календаря успешно создан и скачан",
      })

      onClose()
    } catch (error) {
      console.error("Ошибка при экспорте календаря:", error)
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось экспортировать календарь",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Экспорт в календарь</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="text-sm text-muted-foreground">
            Выберите, что вы хотите экспортировать в файл календаря (.ics), который можно импортировать в Google
            Calendar, Apple Calendar и другие календарные приложения.
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-events"
                checked={includeEvents}
                onCheckedChange={(checked) => setIncludeEvents(checked as boolean)}
              />
              <Label htmlFor="include-events">Включить события</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-tasks"
                checked={includeTasks}
                onCheckedChange={(checked) => setIncludeTasks(checked as boolean)}
              />
              <Label htmlFor="include-tasks">Включить задачи с дедлайнами</Label>
            </div>

            {includeTasks && (
              <div className="flex items-center space-x-2 ml-6">
                <Checkbox
                  id="include-completed-tasks"
                  checked={includeCompletedTasks}
                  onCheckedChange={(checked) => setIncludeCompletedTasks(checked as boolean)}
                />
                <Label htmlFor="include-completed-tasks">Включить выполненные задачи</Label>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleExport}>Экспортировать</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
