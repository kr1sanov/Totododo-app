"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Plus, Trash, Copy } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"

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
  isAllDay?: boolean
  videoMeetingUrl?: string
  files?: { name: string; url: string }[]
  endDate?: string
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
  const [description, setDescription] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date>(date)
  const [endDate, setEndDate] = useState<Date>(new Date(date.getTime() + 60 * 60 * 1000))
  const [startHour, setStartHour] = useState("12")
  const [startMinute, setStartMinute] = useState("00")
  const [endHour, setEndHour] = useState("13")
  const [endMinute, setEndMinute] = useState("00")
  const [location, setLocation] = useState("")
  const [repeatType, setRepeatType] = useState<"none" | "daily" | "weekly" | "monthly">("none")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [isAllDay, setIsAllDay] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false)
  const [showVideoMeeting, setShowVideoMeeting] = useState(false)
  const [videoMeetingUrl, setVideoMeetingUrl] = useState("")
  const [files, setFiles] = useState<{ name: string; url: string }[]>([])
  const [newFileName, setNewFileName] = useState("")
  const [newFileUrl, setNewFileUrl] = useState("")

  const contentRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Генерируем варианты для часов и минут
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0"))

  // Сбрасываем форму при открытии диалога
  useEffect(() => {
    if (isOpen) {
      if (item) {
        setTitle(item.title)
        setDescription(item.description || "")
        setSelectedDate(new Date(item.date))
        setLocation(item.location || "")
        setRepeatType(item.repeatType)
        setIsAllDay(item.isAllDay || false)
        setVideoMeetingUrl(item.videoMeetingUrl || "")
        setShowVideoMeeting(!!item.videoMeetingUrl)
        setFiles(item.files || [])

        if (type === "task" && item.priority) {
          setPriority(item.priority)
        }

        if (type === "event") {
          if (item.startTime && item.endTime) {
            setStartHour(item.startTime.split(":")[0])
            setStartMinute(item.startTime.split(":")[1])
            setEndHour(item.endTime.split(":")[0])
            setEndMinute(item.endTime.split(":")[1])
          }

          if (item.endDate) {
            setEndDate(new Date(item.endDate))
          } else {
            setEndDate(new Date(new Date(item.date).getTime() + 60 * 60 * 1000))
          }
        }
      } else {
        setTitle("")
        setDescription("")
        setSelectedDate(date)
        setEndDate(new Date(date.getTime() + 60 * 60 * 1000))
        setStartHour("12")
        setStartMinute("00")
        setEndHour("13")
        setEndMinute("00")
        setLocation("")
        setRepeatType("none")
        setPriority("medium")
        setIsAllDay(false)
        setVideoMeetingUrl("")
        setShowVideoMeeting(false)
        setFiles([])
      }

      // Фокус на поле заголовка при открытии
      setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.focus()
        }
      }, 100)
    }

    setNewFileName("")
    setNewFileUrl("")
  }, [isOpen, item, date, type])

  // Прокрутка при фокусе на поле ввода (для мобильных устройств)
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      if (contentRef.current && e.target instanceof HTMLElement) {
        const targetRect = e.target.getBoundingClientRect()
        const contentRect = contentRef.current.getBoundingClientRect()

        // Если элемент находится в нижней части экрана
        if (targetRect.bottom > window.innerHeight - 200) {
          const scrollOffset = targetRect.top - contentRect.top - 100
          contentRef.current.scrollTo({
            top: scrollOffset,
            behavior: "smooth",
          })
        }
      }
    }

    const inputs = document.querySelectorAll("input, textarea")
    inputs.forEach((input) => {
      input.addEventListener("focus", handleFocus)
    })

    return () => {
      inputs.forEach((input) => {
        input.removeEventListener("focus", handleFocus)
      })
    }
  }, [isOpen])

  const handleAddFile = () => {
    if (newFileName.trim() && newFileUrl.trim()) {
      setFiles([...files, { name: newFileName.trim(), url: newFileUrl.trim() }])
      setNewFileName("")
      setNewFileUrl("")
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Скопировано",
      description: "Ссылка скопирована в буфер обмена",
    })
  }

  const handleSubmit = () => {
    if (!title.trim()) return

    const newItem: CalendarItem = {
      id: item?.id || Date.now().toString(),
      title,
      date: selectedDate.toISOString(),
      type,
      location,
      description,
      repeatType,
      createdAt: item?.createdAt || new Date().toISOString(),
      isAllDay,
      files: files.length > 0 ? files : undefined,
    }

    if (showVideoMeeting && videoMeetingUrl) {
      newItem.videoMeetingUrl = videoMeetingUrl
    }

    if (type === "task") {
      newItem.completed = item?.completed || false
      newItem.priority = priority

      // Для задач также сохраняем время начала и окончания
      if (!isAllDay) {
        newItem.startTime = `${startHour}:${startMinute}`
        newItem.endTime = `${endHour}:${endMinute}`
      }
    }

    if (type === "event") {
      if (!isAllDay) {
        newItem.startTime = `${startHour}:${startMinute}`
        newItem.endTime = `${endHour}:${endMinute}`
      }
      newItem.endDate = endDate.toISOString()
    }

    onSave(newItem)
    onClose()
  }

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

        <div className="grid gap-4 py-4 mt-4" ref={contentRef}>
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-base">
              Название
            </Label>
            <Input
              id="title"
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Название ${type === "event" ? "события" : "задачи"}`}
              autoComplete="off"
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

          <div className="grid gap-2">
            <Label className="text-base">Начало</Label>
            <div className="flex flex-col gap-2">
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
                  />
                </PopoverContent>
              </Popover>

              <div className="flex gap-2">
                <Select value={startHour} onValueChange={setStartHour}>
                  <SelectTrigger className="flex-1 h-12 text-base">
                    <SelectValue placeholder="Часы" />
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map((hour) => (
                      <SelectItem key={`start-hour-${hour}`} value={hour}>
                        {hour}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="flex items-center">:</span>
                <Select value={startMinute} onValueChange={setStartMinute}>
                  <SelectTrigger className="flex-1 h-12 text-base">
                    <SelectValue placeholder="Минуты" />
                  </SelectTrigger>
                  <SelectContent>
                    {minutes.map((minute) => (
                      <SelectItem key={`start-minute-${minute}`} value={minute}>
                        {minute}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-base">Окончание</Label>
            <div className="flex flex-col gap-2">
              <Popover open={isEndCalendarOpen} onOpenChange={setIsEndCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal h-12 text-base",
                      !endDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    {endDate ? format(endDate, "d MMMM yyyy", { locale: ru }) : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date || new Date())
                      setIsEndCalendarOpen(false)
                    }}
                    locale={ru}
                  />
                </PopoverContent>
              </Popover>

              <div className="flex gap-2">
                <Select value={endHour} onValueChange={setEndHour}>
                  <SelectTrigger className="flex-1 h-12 text-base">
                    <SelectValue placeholder="Часы" />
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map((hour) => (
                      <SelectItem key={`end-hour-${hour}`} value={hour}>
                        {hour}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="flex items-center">:</span>
                <Select value={endMinute} onValueChange={setEndMinute}>
                  <SelectTrigger className="flex-1 h-12 text-base">
                    <SelectValue placeholder="Минуты" />
                  </SelectTrigger>
                  <SelectContent>
                    {minutes.map((minute) => (
                      <SelectItem key={`end-minute-${minute}`} value={minute}>
                        {minute}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-base">Повторяемость</Label>
            <div className="flex items-center space-x-2 mb-2">
              <Label htmlFor="all-day" className="text-base">
                Весь день
              </Label>
              <Switch id="all-day" checked={isAllDay} onCheckedChange={setIsAllDay} />
            </div>
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

          {type === "event" && (
            <div className="grid gap-2">
              <Label htmlFor="video-meeting" className="text-base">
                Видеовстреча
              </Label>
              <div className="flex items-center space-x-2 mb-2">
                <Switch id="video-meeting" checked={showVideoMeeting} onCheckedChange={setShowVideoMeeting} />
                <Label htmlFor="video-meeting" className="text-base">
                  {showVideoMeeting ? "Включена" : "Выключена"}
                </Label>
              </div>

              {showVideoMeeting && (
                <>
                  <Label htmlFor="video-url" className="text-base">
                    Ссылка на встречу
                  </Label>
                  <Input
                    id="video-url"
                    value={videoMeetingUrl}
                    onChange={(e) => setVideoMeetingUrl(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="h-12 text-base"
                  />
                  {videoMeetingUrl && (
                    <Button variant="secondary" onClick={() => copyToClipboard(videoMeetingUrl)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Скопировать ссылку
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {type === "event" && (
            <div className="grid gap-2">
              <Label htmlFor="location" className="text-base">
                Адрес
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Введите адрес"
                className="h-12 text-base"
              />
            </div>
          )}

          {type === "task" && (
            <div className="grid gap-2">
              <Label className="text-base">Файлы</Label>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                    <span>{file.name}</span>
                    <div className="flex items-center space-x-2">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        Открыть
                      </a>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveFile(index)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Название файла"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="URL файла"
                      value={newFileUrl}
                      onChange={(e) => setNewFileUrl(e.target.value)}
                      className="h-12 text-base"
                    />
                    <Button type="button" size="icon" onClick={handleAddFile} className="h-12 w-12">
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
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
