"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { ChevronDown } from "lucide-react"

interface TimeSelectProps {
  value: string
  onChange: (value: string) => void
}

export function TimeSelect({ value, onChange }: TimeSelectProps) {
  const [hours, minutes] = value ? value.split(":").map(Number) : [0, 0]
  const [isHoursOpen, setIsHoursOpen] = useState(false)
  const [isMinutesOpen, setIsMinutesOpen] = useState(false)

  const hoursOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))
  const minutesOptions = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0"))

  const handleHourChange = (hour: string) => {
    onChange(`${hour}:${minutes.toString().padStart(2, "0")}`)
    setIsHoursOpen(false)
  }

  const handleMinuteChange = (minute: string) => {
    onChange(`${hours.toString().padStart(2, "0")}:${minute}`)
    setIsMinutesOpen(false)
  }

  return (
    <div className="flex gap-1 items-center">
      <Popover open={isHoursOpen} onOpenChange={setIsHoursOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[70px] justify-between">
            {hours.toString().padStart(2, "0")}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[200px]">
          <div className="p-2">
            <Label className="text-xs mb-2 block">Часы</Label>
            <div className="h-[200px] overflow-y-auto space-y-1 pr-2">
              {hoursOptions.map((hour) => (
                <Button
                  key={`hour-${hour}`}
                  variant={hours.toString().padStart(2, "0") === hour ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleHourChange(hour)}
                >
                  {hour}
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <span>:</span>

      <Popover open={isMinutesOpen} onOpenChange={setIsMinutesOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[70px] justify-between">
            {minutes.toString().padStart(2, "0")}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[200px]">
          <div className="p-2">
            <Label className="text-xs mb-2 block">Минуты</Label>
            <div className="h-[200px] overflow-y-auto space-y-1 pr-2">
              {minutesOptions.map((minute) => (
                <Button
                  key={`minute-${minute}`}
                  variant={minutes.toString().padStart(2, "0") === minute ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleMinuteChange(minute)}
                >
                  {minute}
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
