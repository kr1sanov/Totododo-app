"use client"

import type React from "react"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Tag {
  id: string
  name: string
  color: string
}

interface TaskTagProps {
  tag: Tag
  onRemove?: (id: string) => void
  className?: string
  interactive?: boolean
}

export function TaskTag({ tag, onRemove, className, interactive = true }: TaskTagProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onRemove) {
      onRemove(tag.id)
    }
  }

  return (
    <Badge
      className={cn(
        "px-2 py-0.5 mr-1 mb-1 cursor-default",
        `bg-${tag.color}-100 text-${tag.color}-800 hover:bg-${tag.color}-200`,
        className,
      )}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
    >
      {tag.name}
      {interactive && onRemove && isHovered && <X className="ml-1 h-3 w-3 cursor-pointer" onClick={handleRemove} />}
    </Badge>
  )
}
