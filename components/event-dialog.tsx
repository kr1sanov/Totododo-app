"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useEvents } from "@/hooks/use-events"

interface EventDialogProps {
  isOpen: boolean
  onClose: () => void
  date: Date
  event?: Event
}

export function EventDialog({ isOpen, onClose, date, event }: EventDialogProps) {
  const [title, setTitle] = useState(event?.title || "")
  const [startDate, setStartDate] = useState<Date>(event?.startDate ? new Date(event.startDate) : date)
  const [endDate, setEndDate] = useState<Date>(
    event?.endDate ? new Date(event.endDate) : new Date(date.getTime() + 60 * 60 * 1000),
  )
  const [location, setLocation] = useState(event?.location || "")
  const [description, setDescription] = useState(event?.description || "")
  const [repeatType, setRepeatType] = useState(event?.repeatType || "none")

  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)

  const { addEvent, updateEvent } = useEvents()

  // Сбрасываем форму при открытии диалога
  useEffect(() => {
    if (isOpen) {
      if (event) {
        setTitle(event.title)
        setStartDate(new Date(event.startDate))
        setEndDate(new Date(event.endDate))
        setLocation(event.location || "")
        setDescription(event.description || "")
        setRepeatType(event.repeatType)
      } else {
        setTitle("")
        setStartDate(date)
        setEndDate(new Date(date.getTime() + 60 * 60 * 1000))
        setLocation("")
        setDescription("")
        setRepeatType("none")
      }
    }
  }, [isOpen, event, date])

  const handleSubmit = () => {
    if (!title.trim()) return

    const eventData = {
      id: event?.id || Date.now().toString(),
      title,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      location,
      description,
      repeatType,
    }

    if (event) {
      updateEvent(eventData)
    } else {
      addEvent(eventData)
    }

    onClose()
  }

  const handleTimeChange = (type: "start" | "end") => {
    // Создаем временный input для выбора времени
    const input = document.createElement("input")
    input.type = "time"

    // Устанавливаем текущее значение
    const currentDate = type === "start" ? startDate : endDate
    input.value = format(currentDate, "HH:mm")

    // Добавляем обработчик изменения
    input.onchange = (e) => {
      const [hours, minutes] = (e.target as HTMLInputElement).value.split(":").map(Number)

      if (type === "start") {
        const newDate = new Date(startDate)
        newDate.setHours(hours, minutes)
        setStartDate(newDate)
      } else {
        const newDate = new Date(endDate)
        newDate.setHours(hours, minutes)
        setEndDate(newDate)
      }
    }

    // Стилизуем и добавляем в DOM
    input.style.position = "fixed"
    input.style.opacity = "0"
    document.body.appendChild(input)

    // Открываем диалог выбора времени
    input.showPicker()

    // Удаляем после закрытия
    input.addEventListener("blur", () => {
      document.body.removeChild(input)
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? "Редактировать событие" : "Новое событие"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Название события</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название события"
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label>Начало</Label>
            <div className="flex gap-2 flex-wrap">
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("justify-start text-left font-normal flex-1", !startDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "d MMM yyyy", { locale: ru }) : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date || new Date())
                      setStartDateOpen(false)
                    }}
                    locale={ru}
                  />
                </PopoverContent>
              </Popover>

              <Button variant="outline" onClick={() => handleTimeChange("start")} className="w-[120px]">
                {format(startDate, "HH:mm")}
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Конец</Label>
            <div className="flex gap-2 flex-wrap">
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("justify-start text-left font-normal flex-1", !endDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "d MMM yyyy", { locale: ru }) : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date || new Date())
                      setEndDateOpen(false)
                    }}
                    locale={ru}
                  />
                </PopoverContent>
              </Popover>

              <Button variant="outline" onClick={() => handleTimeChange("end")} className="w-[120px]">
                {format(endDate, "HH:mm")}
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Повторяемость</Label>
            <RadioGroup value={repeatType} onValueChange={setRepeatType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="none" />
                <Label htmlFor="none">Не повторять</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="daily" id="daily" />
                <Label htmlFor="daily">Каждый день</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly">Каждую неделю</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly">Каждый месяц</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location">Локация или ссылка на звонок</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Локация или ссылка на звонок"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отменить
          </Button>
          <Button onClick={handleSubmit}>{event ? "Сохранить" : "Добавить событие"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
const { addEvent } = useEvents()

const handleCreate = async () => {
  const newEvent = {
    id: uuidv4(),
    title,
    description,
    date: selectedDate,
  }

  await addEvent(newEvent)
  closeDialog() // закроем окно после создания
}
