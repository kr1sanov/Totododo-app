"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, Filter } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { TaskStatus } from "@/types"

interface TaskFilterProps {
  onFilterChange: (status: TaskStatus | null) => void
  currentFilter: TaskStatus | null
  availableTags?: unknown[]
}

export function TaskFilter({ onFilterChange, currentFilter }: TaskFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (status: TaskStatus | null) => {
    onFilterChange(status)
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" aria-label="Filter tasks">
          <Filter className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleSelect(null)}>
          <div className="flex items-center justify-between w-full">
            <span>All</span>
            {currentFilter === null && <Check className="h-4 w-4" />}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSelect("todo")}>
          <div className="flex items-center justify-between w-full">
            <span>To Do</span>
            {currentFilter === "todo" && <Check className="h-4 w-4" />}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSelect("in-progress")}>
          <div className="flex items-center justify-between w-full">
            <span>In Progress</span>
            {currentFilter === "in-progress" && <Check className="h-4 w-4" />}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSelect("done")}>
          <div className="flex items-center justify-between w-full">
            <span>Done</span>
            {currentFilter === "done" && <Check className="h-4 w-4" />}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
