"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
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
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Часы..." />
            <CommandList className="max-h-[200px]">
              <CommandEmpty>Не найдено</CommandEmpty>
              <CommandGroup>
                {hoursOptions.map((hour) => (
                  <CommandItem key={hour} onSelect={() => handleHourChange(hour)} className="cursor-pointer">
                    {hour}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
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
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Минуты..." />
            <CommandList className="max-h-[200px]">
              <CommandEmpty>Не найдено</CommandEmpty>
              <CommandGroup>
                {minutesOptions.map((minute) => (
                  <CommandItem key={minute} onSelect={() => handleMinuteChange(minute)} className="cursor-pointer">
                    {minute}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
