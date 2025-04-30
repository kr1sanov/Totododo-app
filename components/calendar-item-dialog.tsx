"use client"

import { useState, useEffect, useCallback } from "react"
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
import { useMobile } from "@/hooks/use-mobile"

interface CalendarItem {
  id: string
  title: string
  date: string
  type: "event" | "task"
  location?: string
  description?: string
  repeatType: "none" | "daily" | "weekly" | "monthly"
  createdAt: string
  completed?: boolean
  priority?: "low" | "medium" | "high"
  startTime?: string
  endTime?: string
}

interface CalendarItemDialogProps {
  isOpen: boolean
  onClose: () => void
  date: Date
  type: "event" | "task"
  item?: CalendarItem
  onSave: (item: CalendarItem) => void
}

export function CalendarItemDialog({ isOpen, onClose, date, type, item, onSave }: CalendarItemDialogProps) {
  const [title, setTitle] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date>(date)
  const [startHour, setStartHour] = useState("12")
  const [startMinute, setStartMinute] = useState("00")
  const [endHour, setEndHour] = useState("13")
  const [endMinute, setEndMinute] = useState("00")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [repeatType, setRepeatType] = useState<"none" | "daily" | "weekly" | "monthly">("none")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isStartTimeOpen, setIsStartTimeOpen] = useState(false)
  const [isEndTimeOpen, setIsEndTimeOpen] = useState(false)
  const [formErrors, setFormErrors] = useState<{ title?: string }>({})
  const isMobile = useMobile()

  // Generate options for hours and minutes
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0"))

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormErrors({})

      if (item) {
        setTitle(item.title)
        setSelectedDate(new Date(item.date))
        setLocation(item.location || "")
        setDescription(item.description || "")
        setRepeatType(item.repeatType)

        if (type === "task" && item.priority) {
          setPriority(item.priority)
        }

        if (type === "event" && item.startTime && item.endTime) {
          setStartHour(item.startTime.split(":")[0])
          setStartMinute(item.startTime.split(":")[1])
          setEndHour(item.endTime.split(":")[0])
          setEndMinute(item.endTime.split(":")[1])
        }
      } else {
        setTitle("")
        setSelectedDate(date)
        setStartHour("12")
        setStartMinute("00")
        setEndHour("13")
        setEndMinute("00")
        setLocation("")
        setDescription("")
        setRepeatType("none")
        setPriority("medium")
      }
    }
  }, [isOpen, item, date, type])

  const validateForm = useCallback(() => {
    const errors: { title?: string } = {}

    if (!title.trim()) {
      errors.title = "Название обязательно"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [title])

  const handleSubmit = useCallback(() => {
    if (!validateForm()) return

    try {
      const newItem: CalendarItem = {
        id: item?.id || Date.now().toString(),
        title,
        date: selectedDate.toISOString(),
        type,
        location,
        description,
        repeatType,
        createdAt: item?.createdAt || new Date().toISOString(),
      }

      if (type === "task") {
        newItem.completed = item?.completed || false
        newItem.priority = priority
      }

      if (type === "event") {
        newItem.startTime = `${startHour}:${startMinute}`
        newItem.endTime = `${endHour}:${endMinute}`
      }

      onSave(newItem)
      onClose()
    } catch (error) {
      console.error("Error saving item:", error)
      // Here we could add toast notification for error
    }
  }, [
    item,
    title,
    selectedDate,
    type,
    location,
    description,
    repeatType,
    priority,
    startHour,
    startMinute,
    endHour,
    endMinute,
    onSave,
    onClose,
    validateForm,
  ])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item
              ? `Редактировать ${type === "event" ? "событие" : "задачу"}`
              : `Новое ${type === "event" ? "событие" : "задача"}`}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4 mt-4">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-base">
              Название
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Название ${type === "event" ? "события" : "задачи"}`}
              autoComplete="off"
              className={cn("h-12 text-base", formErrors.title && "border-red-500")}
            />
            {formErrors.title && <p className="text-sm text-red-500">{formErrors.title}</p>}
          </div>

          <div className="grid gap-2">
            <Label className="text-base">Дата</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal h-12 text-base",
                    !selectedDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {selectedDate ? format(selectedDate, "d MMMM yyyy", { locale: ru }) : "Выберите дату"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date || new Date())
                    setIsCalendarOpen(false)
                  }}
                  locale={ru}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {type === "event" && (
            <>
              <div className="grid gap-2">
                <Label className="text-base">Время начала</Label>
                <div className="flex gap-2">
                  <Popover open={isStartTimeOpen} onOpenChange={setIsStartTimeOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1 h-12 text-base justify-between">
                        {startHour}:{startMinute}
                        <CalendarIcon className="h-5 w-5 ml-2 opacity-70" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[280px]">
                      <div className="grid grid-cols-2 p-3 gap-3">
                        <div>
                          <Label className="text-xs mb-2 block">Часы</Label>
                          <div className="h-[200px] overflow-y-auto space-y-1 pr-2">
                            {hours.map((hour) => (
                              <Button
                                key={`start-hour-${hour}`}
                                variant={startHour === hour ? "default" : "ghost"}
                                className="w-full justify-start"
                                onClick={() => {
                                  setStartHour(hour)
                                }}
                              >
                                {hour}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs mb-2 block">Минуты</Label>
                          <div className="h-[200px] overflow-y-auto space-y-1 pr-2">
                            {minutes.map((minute) => (
                              <Button
                                key={`start-minute-${minute}`}
                                variant={startMinute === minute ? "default" : "ghost"}
                                className="w-full justify-start"
                                onClick={() => {
                                  setStartMinute(minute)
                                  setIsStartTimeOpen(false)
                                }}
                              >
                                {minute}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-base">Время окончания</Label>
                <div className="flex gap-2">
                  <Popover open={isEndTimeOpen} onOpenChange={setIsEndTimeOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1 h-12 text-base justify-between">
                        {endHour}:{endMinute}
                        <CalendarIcon className="h-5 w-5 ml-2 opacity-70" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[280px]">
                      <div className="grid grid-cols-2 p-3 gap-3">
                        <div>
                          <Label className="text-xs mb-2 block">Часы</Label>
                          <div className="h-[200px] overflow-y-auto space-y-1 pr-2">
                            {hours.map((hour) => (
                              <Button
                                key={`end-hour-${hour}`}
                                variant={endHour === hour ? "default" : "ghost"}
                                className="w-full justify-start"
                                onClick={() => {
                                  setEndHour(hour)
                                }}
                              >
                                {hour}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs mb-2 block">Минуты</Label>
                          <div className="h-[200px] overflow-y-auto space-y-1 pr-2">
                            {minutes.map((minute) => (
                              <Button
                                key={`end-minute-${minute}`}
                                variant={endMinute === minute ? "default" : "ghost"}
                                className="w-full justify-start"
                                onClick={() => {
                                  setEndMinute(minute)
                                  setIsEndTimeOpen(false)
                                }}
                              >
                                {minute}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </>
          )}

          {type === "task" && (
            <div className="grid gap-2">
              <Label className="text-base">Приоритет</Label>
              <RadioGroup value={priority} onValueChange={(value) => setPriority(value as any)} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="low" className="h-5 w-5" />
                  <Label htmlFor="low" className="text-base">
                    Низкий
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" className="h-5 w-5" />
                  <Label htmlFor="medium" className="text-base">
                    Средний
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="high" className="h-5 w-5" />
                  <Label htmlFor="high" className="text-base">
                    Высокий
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          <div className="grid gap-2">
            <Label className="text-base">Повторяемость</Label>
            <RadioGroup value={repeatType} onValueChange={(value) => setRepeatType(value as any)} className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="none" className="h-5 w-5" />
                <Label htmlFor="none" className="text-base">
                  Не повторять
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="daily" id="daily" className="h-5 w-5" />
                <Label htmlFor="daily" className="text-base">
                  Каждый день
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="weekly" className="h-5 w-5" />
                <Label htmlFor="weekly" className="text-base">
                  Каждую неделю
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" className="h-5 w-5" />
                <Label htmlFor="monthly" className="text-base">
                  Каждый месяц
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location" className="text-base">
              Локация или ссылка
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Локация или ссылка"
              className="h-12 text-base"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description" className="text-base">
              Описание
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание"
              rows={3}
              className="text-base"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-4">
          <Button variant="outline" onClick={onClose} className="h-12 text-base">
            Отменить
          </Button>
          <Button onClick={handleSubmit} className="h-12 text-base">
            {item ? "Сохранить" : "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
